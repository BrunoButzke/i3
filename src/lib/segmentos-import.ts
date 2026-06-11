import { Prisma, PrismaClient } from "@/generated/prisma/client";
import { ORDEM_RESPOSTAS, RESPOSTA_PESOS } from "@/lib/scoring";
import * as XLSX from "xlsx";

type Row = (string | number | boolean | Date | null | undefined)[];

function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function num(v: unknown): number {
  if (v == null || v === "") return 0;
  const n = Number(String(v).replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
}

function intId(v: unknown): number | null {
  const n = num(v);
  const i = Math.trunc(n);
  return i > 0 ? i : null;
}

/** Linhas de cabeçalho numérico (0,1,2…) que vazam do Excel. */
export function isJunkQuestaoRow(row: Row): boolean {
  const codigo = str(row[0]);
  const processo = str(row[4]);
  const enunciado = str(row[5]);
  if (!codigo || codigo.toLowerCase() === "id") return true;
  if (/^\d+$/.test(codigo) && /^\d+$/.test(processo) && /^\d+$/.test(enunciado)) {
    return true;
  }
  return false;
}

export function isJunkFiltroRow(row: Row): boolean {
  const processo = str(row[5]);
  const estrutura = str(row[0]);
  if (processo && /^\d+$/.test(processo) && !str(row[4])) return true;
  if (estrutura === "0" && processo === "5") return true;
  return false;
}

export async function removeJunkRows(prisma: PrismaClient) {
  const junkQuestoes = await prisma.questao.findMany({
    where: { processo: "4", codigo: "0" },
    select: { id: true },
  });
  const junkFiltros = await prisma.filtro.findMany({
    where: { processo: "5", estrutura: "0" },
    select: { id: true },
  });

  if (junkQuestoes.length) {
    await prisma.questao.deleteMany({
      where: { id: { in: junkQuestoes.map((q) => q.id) } },
    });
  }
  if (junkFiltros.length) {
    await prisma.filtro.deleteMany({
      where: { id: { in: junkFiltros.map((f) => f.id) } },
    });
  }

  return {
    questoes: junkQuestoes.length,
    filtros: junkFiltros.length,
  };
}

/** Importa aba Segmentos (planilha externa exportada como xlsx). */
export async function importSegmentosFromRows(
  prisma: PrismaClient,
  rows: Row[],
  replace = true,
) {
  if (rows.length < 2) return { imported: 0 };

  const headerIdx = rows.findIndex((r) =>
    r.some((c) => str(c).toLowerCase() === "empresa"),
  );
  if (headerIdx === -1) return { imported: 0 };

  const cabecalho = rows[headerIdx].map((c) => str(c));
  const idxId = cabecalho.findIndex((c) => c.toLowerCase() === "id");
  const idxEmpresa = cabecalho.findIndex((c) => c.toLowerCase() === "empresa");
  const idxSegmento = cabecalho.findIndex((c) => c.toLowerCase() === "segmento");
  const idxOrigem = cabecalho.findIndex((c) => c.toLowerCase() === "origem");

  if (idxId === -1 || idxEmpresa === -1) return { imported: 0 };

  const indicadoresNomes = cabecalho.slice(4).filter(Boolean);
  const idxIndicadores = indicadoresNomes.map((nome) =>
    cabecalho.indexOf(nome),
  );

  const data: Prisma.SegmentoCreateManyInput[] = [];

  for (const row of rows.slice(headerIdx + 1)) {
    const id = intId(row[idxId]);
    const empresa = str(row[idxEmpresa]);
    if (!id || !empresa) continue;

    const segmentoNome = idxSegmento >= 0 ? str(row[idxSegmento]) : "";
    const origemCol = idxOrigem >= 0 ? str(row[idxOrigem]) : "";
    const origem = [origemCol, segmentoNome].filter(Boolean).join(" | ") || null;

    const indicadores: Record<string, number> = {};
    indicadoresNomes.forEach((nome, i) => {
      if (nome.toLowerCase() === "segmento") return;
      indicadores[nome] = num(row[idxIndicadores[i]]);
    });

    data.push({
      id,
      empresa,
      origem,
      indicadores,
    });
  }

  if (replace) await prisma.segmento.deleteMany();
  if (data.length) await prisma.segmento.createMany({ data });

  return { imported: data.length };
}

export async function importSegmentosFromXlsx(
  prisma: PrismaClient,
  filePath: string,
  replace = true,
) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheet =
    workbook.Sheets.Segmentos ??
    workbook.Sheets[workbook.SheetNames[0] ?? ""];
  if (!sheet) return { imported: 0 };

  const rows = XLSX.utils.sheet_to_json<Row>(sheet, {
    header: 1,
    defval: null,
    raw: false,
  });

  return importSegmentosFromRows(prisma, rows, replace);
}

/**
 * Gera Segmento a partir de RespostaFinal (fallback quando não há planilha externa).
 * Soma `resultado` por tipo de resposta — compatível com Análise 3B.
 */
export async function buildSegmentosFromRespostasFinais(
  prisma: PrismaClient,
  replace = true,
) {
  const empresas = await prisma.empresa.findMany({
    select: { id: true, nome: true },
    orderBy: { id: "asc" },
  });

  const data: Prisma.SegmentoCreateManyInput[] = [];

  for (const emp of empresas) {
    const finais = await prisma.respostaFinal.findMany({
      where: { empresaId: emp.id },
      select: { resposta: true, resultado: true },
    });
    if (finais.length === 0) continue;

    const indicadores: Record<string, number> = {};
    for (const ind of ORDEM_RESPOSTAS) {
      indicadores[ind] = 0;
    }

    for (const rf of finais) {
      if (!rf.resposta || !(rf.resposta in indicadores)) continue;
      indicadores[rf.resposta] +=
        rf.resultado ?? RESPOSTA_PESOS[rf.resposta] ?? 0;
    }

    data.push({
      id: emp.id,
      empresa: emp.nome,
      origem: "RespostaFinal",
      indicadores,
    });
  }

  if (replace) await prisma.segmento.deleteMany();
  if (data.length) await prisma.segmento.createMany({ data });

  return { built: data.length };
}
