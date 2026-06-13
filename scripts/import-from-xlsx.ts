import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as XLSX from "xlsx";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import {
  buildQuestaoLookup,
  resolveQuestaoUuid,
} from "@/lib/questao-lookup";
import { calcularResultado } from "@/lib/scoring";
import {
  buildSegmentosFromRespostasFinais,
  importSegmentosFromXlsx,
  isJunkFiltroRow,
  isJunkQuestaoRow,
} from "../src/lib/segmentos-import";
import { syncRespostasFromFinais } from "../src/lib/services/i3-service";

const RESPOSTA_TIPOS = [
  "Informatização",
  "Conectividade",
  "Visibilidade",
  "Transparência",
  "Previsibilidade",
  "Adaptabilidade",
  "Irrelevante",
] as const;

const dataRoot =
  process.env.APPSCRIPT_DATA_PATH ??
  path.resolve(__dirname, "..", "..", "appScript");

const XLSX_PATH = path.join(
  dataRoot,
  "Dados",
  "App i3 - Projeto Condor.xlsx",
);

const SEGMENTOS_XLSX =
  process.env.SEGMENTOS_XLSX_PATH ??
  path.join(dataRoot, "Dados", "Segmentos.xlsx");

type Row = (string | number | boolean | Date | null | undefined)[];

function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

function intId(v: unknown): number | null {
  const n = num(v);
  if (n == null) return null;
  const i = Math.trunc(n);
  return i > 0 ? i : null;
}

function parseDate(v: unknown): Date | null {
  if (v == null || v === "") return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  const s = str(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isHeaderRow(row: Row, ...labels: string[]): boolean {
  const first = str(row[0]).toLowerCase();
  return labels.some((l) => first === l.toLowerCase());
}

function getRows(workbook: XLSX.WorkBook, sheetName: string): Row[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    console.warn(`  ⚠ Aba "${sheetName}" não encontrada — pulando.`);
    return [];
  }
  return XLSX.utils.sheet_to_json<Row>(sheet, {
    header: 1,
    defval: null,
    raw: false,
  });
}

async function clearTables(prisma: PrismaClient) {
  console.log(">> Limpando tabelas...");
  await prisma.resposta.deleteMany();
  await prisma.respostaFinal.deleteMany();
  await prisma.memoriaSIRI.deleteMany();
  await prisma.planoAcao.deleteMany();
  await prisma.acao.deleteMany();
  await prisma.metaSMART.deleteMany();
  await prisma.oKR.deleteMany();
  await prisma.sWOT.deleteMany();
  await prisma.questao.deleteMany();
  await prisma.filtro.deleteMany();
  await prisma.macroDimensao.deleteMany();
  await prisma.segmento.deleteMany();
  await prisma.empresa.deleteMany();
}

async function importEmpresas(prisma: PrismaClient, rows: Row[]) {
  let count = 0;
  for (const row of rows) {
    if (isHeaderRow(row, "ID", "Id")) continue;
    const id = intId(row[0]);
    if (!id) continue;

    const usuario = str(row[4]);
    if (!usuario) continue;

    const senha = str(row[5]);
    const senhaHash = senha
      ? await bcrypt.hash(senha, 10)
      : await bcrypt.hash("changeme", 10);

    await prisma.empresa.upsert({
      where: { id },
      update: {
        nome: str(row[1]) || `Empresa ${id}`,
        cnpj: str(row[2]) || null,
        representante: str(row[3]) || null,
        usuario,
        senhaHash,
        email: str(row[6]) || null,
        enviado: str(row[7]) || null,
        imi: num(row[8]) != null ? Math.trunc(num(row[8])!) : null,
      },
      create: {
        id,
        nome: str(row[1]) || `Empresa ${id}`,
        cnpj: str(row[2]) || null,
        representante: str(row[3]) || null,
        usuario,
        senhaHash,
        email: str(row[6]) || null,
        enviado: str(row[7]) || null,
        imi: num(row[8]) != null ? Math.trunc(num(row[8])!) : null,
      },
    });
    count++;
  }
  console.log(`  ✓ Empresas (Acesso): ${count}`);
}

async function importFiltros(prisma: PrismaClient, rows: Row[]) {
  const data: Prisma.FiltroCreateManyInput[] = [];
  for (const row of rows) {
    if (isHeaderRow(row, "Estrutura")) continue;
    if (isJunkFiltroRow(row)) continue;
    const processo = str(row[5]);
    const respostaEscolhida = str(row[4]);
    if (!processo && !respostaEscolhida && !str(row[0])) continue;
    data.push({
      estrutura: str(row[0]) || null,
      principio: str(row[1]) || null,
      respondidaPor: str(row[2]) || null,
      comObservacao: str(row[3]) || null,
      respostaEscolhida: respostaEscolhida || null,
      processo: processo || null,
    });
  }
  if (data.length) await prisma.filtro.createMany({ data });
  console.log(`  ✓ Filtros: ${data.length}`);
}

async function importQuestoes(prisma: PrismaClient, rows: Row[]) {
  let count = 0;
  for (const row of rows) {
    if (isHeaderRow(row, "ID")) continue;
    if (isJunkQuestaoRow(row)) continue;
    const codigo = str(row[0]);
    if (!codigo) continue;

    const alternativas: Record<string, string> = {};
    RESPOSTA_TIPOS.forEach((tipo, i) => {
      const texto = str(row[6 + i]);
      if (texto) alternativas[tipo] = texto;
    });

    await prisma.questao.create({
      data: {
        codigo,
        estrutura: str(row[1]),
        principio: str(row[2]),
        capacidade: str(row[3]),
        processo: str(row[4]),
        enunciado: str(row[5]),
        alternativas,
      },
    });
    count++;
  }
  console.log(`  ✓ Questões: ${count}`);
}

function buildLookupFromDb(
  questoes: { id: string; codigo: string; processo: string; estrutura: string; principio: string; capacidade: string }[],
) {
  return buildQuestaoLookup(questoes);
}

async function importRespostas(
  prisma: PrismaClient,
  rows: Row[],
  lookup: ReturnType<typeof buildQuestaoLookup>,
) {
  const data: Prisma.RespostaCreateManyInput[] = [];
  let skipped = 0;

  for (const row of rows) {
    if (isHeaderRow(row, "Empresa")) continue;
    const empresaId = intId(row[0]);
    const codigo = str(row[5]);
    const processo = str(row[4]);
    if (!empresaId || !codigo) continue;

    const questaoUuid = resolveQuestaoUuid(lookup, {
      codigo,
      processo,
      estrutura: str(row[1]),
      principio: str(row[2]),
      capacidade: str(row[3]),
    });
    if (!questaoUuid) {
      skipped++;
      continue;
    }

    data.push({
      empresaId,
      questaoId: questaoUuid,
      estrutura: str(row[1]),
      principio: str(row[2]),
      capacidade: str(row[3]),
      processo,
      resposta: str(row[6]),
      resultado: num(row[7]),
    });
  }

  if (data.length) await prisma.resposta.createMany({ data });
  console.log(
    `  ✓ Respostas: ${data.length}${skipped ? ` (${skipped} sem questão correspondente)` : ""}`,
  );
}

async function importRespostasFinais(
  prisma: PrismaClient,
  rows: Row[],
  lookup: ReturnType<typeof buildQuestaoLookup>,
) {
  const data: Prisma.RespostaFinalCreateManyInput[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (i < 2 || isHeaderRow(row, "Empresa")) continue;

    const empresaId = intId(row[0]);
    const codigo = str(row[5]);
    const processo = str(row[4]);
    if (!empresaId || !codigo) continue;

    const questaoUuid = resolveQuestaoUuid(lookup, {
      codigo,
      processo,
      estrutura: str(row[1]),
      principio: str(row[2]),
      capacidade: str(row[3]),
    });

    data.push({
      empresaId,
      estrutura: str(row[1]),
      principio: str(row[2]),
      capacidade: str(row[3]),
      processo,
      codigo,
      questaoId: questaoUuid,
      resposta: str(row[6]),
      resultado: num(row[7]),
    });
  }

  const chunk = 500;
  for (let i = 0; i < data.length; i += chunk) {
    await prisma.respostaFinal.createMany({ data: data.slice(i, i + chunk) });
  }
  const semVinculo = data.filter((d) => !d.questaoId).length;
  console.log(
    `  ✓ Respostas Finais: ${data.length}${semVinculo ? ` (${semVinculo} sem UUID vinculado)` : ""}`,
  );
}

async function importSWOT(prisma: PrismaClient, rows: Row[]) {
  const data: Prisma.SWOTCreateManyInput[] = [];
  for (const row of rows) {
    if (isHeaderRow(row, "Empresa")) continue;
    const empresaId = intId(row[0]);
    if (!empresaId) continue;
    if (!str(row[1]) && !str(row[2]) && !str(row[3]) && !str(row[4])) continue;
    data.push({
      empresaId,
      forca: str(row[1]) || null,
      fraqueza: str(row[2]) || null,
      oportunidade: str(row[3]) || null,
      ameaca: str(row[4]) || null,
    });
  }
  if (data.length) await prisma.sWOT.createMany({ data });
  console.log(`  ✓ SWOT: ${data.length}`);
}

async function importOKR(prisma: PrismaClient, rows: Row[]) {
  const data: Prisma.OKRCreateManyInput[] = [];

  for (const row of rows) {
    if (isHeaderRow(row, "Empresa")) continue;
    const empresaId = intId(row[0]);
    const objetivo = str(row[1]);
    if (!empresaId) continue;

    const textos = [str(row[2]), str(row[3]), str(row[4])].filter(Boolean);
    if (!objetivo && textos.length === 0) continue;

    data.push({
      empresaId,
      objetivo,
      keyResults: textos.map((texto) => ({
        id: crypto.randomUUID(),
        texto,
        swotRefs: [],
      })),
      okr1: null,
      okr2: null,
      okr3: null,
    });
  }

  if (data.length) await prisma.oKR.createMany({ data });
  console.log(`  ✓ OKR: ${data.length}`);
}

async function importSMART(prisma: PrismaClient, rows: Row[]) {
  const data: Prisma.MetaSMARTCreateManyInput[] = [];
  for (const row of rows) {
    if (isHeaderRow(row, "Empresa")) continue;
    const empresaId = intId(row[0]);
    const objetivo = str(row[1]);
    if (!empresaId || !objetivo) continue;
    data.push({
      empresaId,
      objetivo,
      especifica: str(row[2]) || null,
      mensuravel: str(row[3]) || null,
      alcancavel: str(row[4]) || null,
      relevante: str(row[5]) || null,
      temporal: str(row[6]) || null,
    });
  }
  if (data.length) await prisma.metaSMART.createMany({ data });
  console.log(`  ✓ SMART: ${data.length}`);
}

async function importAcoes(prisma: PrismaClient, rows: Row[]) {
  const data: Prisma.AcaoCreateManyInput[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (i < 2 || isHeaderRow(row, "ID")) continue;
    const id = intId(row[0]);
    const empresaId = intId(row[1]);
    const acao = str(row[2]);
    if (!id || !empresaId || !acao) continue;
    data.push({
      id,
      empresaId,
      acao,
      gravidade: str(row[3]) || null,
      urgencia: str(row[4]) || null,
      tendencia: str(row[5]) || null,
      pontuacao: str(row[6]) || null,
      prioridade: str(row[7]) || null,
    });
  }
  if (data.length) await prisma.acao.createMany({ data, skipDuplicates: true });
  console.log(`  ✓ Ações: ${data.length}`);
}

async function importPlanoAcao(prisma: PrismaClient, rows: Row[]) {
  let count = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (i < 2 || isHeaderRow(row, "ID")) continue;
    const id = intId(row[0]);
    const empresaId = intId(row[1]);
    const oque = str(row[2]);
    if (!id || !empresaId || !oque) continue;

    await prisma.planoAcao.create({
      data: {
        id,
        empresaId,
        oque,
        quem: str(row[3]) || null,
        quando: parseDate(row[4]),
        onde: str(row[5]) || null,
        porque: str(row[6]) || null,
        como: str(row[7]) || null,
        quanto: str(row[8]) || null,
        status: str(row[9]) || "pendente",
      },
    });
    count++;
  }
  console.log(`  ✓ Plano de Ação: ${count}`);
}

async function importMemoriaSIRI(prisma: PrismaClient, rows: Row[]) {
  let count = 0;
  for (const row of rows) {
    if (isHeaderRow(row, "Empresa")) continue;
    const empresaId = intId(row[0]);
    if (!empresaId) continue;

    const dados = {
      materiaPrima: num(row[1]) ?? 0,
      utilidades: num(row[2]) ?? 0,
      maoObra: num(row[3]) ?? 0,
      manutencao: num(row[4]) ?? 0,
      locacao: num(row[5]) ?? 0,
      depreciacao: num(row[6]) ?? 0,
      pesquisa: num(row[7]) ?? 0,
      posVenda: num(row[8]) ?? 0,
      despesasGerais: num(row[9]) ?? 0,
      transporte: num(row[10]) ?? 0,
      kpisString: str(row[11]),
      benchmark: str(row[12]),
      horizonte: str(row[13]),
    };

    await prisma.memoriaSIRI.upsert({
      where: { empresaId },
      update: { dados },
      create: { empresaId, dados },
    });
    count++;
  }
  console.log(`  ✓ Memória SIRI: ${count}`);
}

async function importMacroDimensoes(prisma: PrismaClient, rows: Row[]) {
  const data: Prisma.MacroDimensaoCreateManyInput[] = [];
  for (const row of rows) {
    const nivel = num(row[0]);
    const texto = str(row[2]);
    if (nivel == null || !texto) continue;
    data.push({
      nome: `Macro-Dimensão nível ${nivel}`,
      nivel: Math.trunc(nivel),
      texto,
    });
  }
  if (data.length) await prisma.macroDimensao.createMany({ data });
  console.log(`  ✓ Macro Dimensões: ${data.length}`);
}

async function main() {
  console.log(`>> Importando de: ${XLSX_PATH}`);

  if (!fs.existsSync(XLSX_PATH)) {
    throw new Error(`Arquivo XLSX não encontrado: ${XLSX_PATH}`);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const workbook = XLSX.readFile(XLSX_PATH, { cellDates: true });

    await clearTables(prisma);

    await importEmpresas(prisma, getRows(workbook, "Acesso"));
    await importFiltros(prisma, getRows(workbook, "Filtros"));
    await importQuestoes(prisma, getRows(workbook, "Questões"));

    const questoes = await prisma.questao.findMany({
      select: {
        id: true,
        codigo: true,
        processo: true,
        estrutura: true,
        principio: true,
        capacidade: true,
      },
    });
    const lookup = buildLookupFromDb(questoes);

    const codigosUnicos = new Set(questoes.map((q) => q.codigo)).size;
    console.log(
      `  ℹ Questões: ${questoes.length} linhas, ${codigosUnicos} códigos distintos`,
    );

    await importRespostas(prisma, getRows(workbook, "Respostas"), lookup);
    await importRespostasFinais(
      prisma,
      getRows(workbook, "Respostas Finais"),
      lookup,
    );
    await importSWOT(prisma, getRows(workbook, "SWOT"));
    await importOKR(prisma, getRows(workbook, "OKR"));
    await importSMART(prisma, getRows(workbook, "SMART"));
    await importAcoes(prisma, getRows(workbook, "Ações"));
    await importPlanoAcao(prisma, getRows(workbook, "Plano de Ação"));
    await importMemoriaSIRI(prisma, getRows(workbook, "Memória SIRI"));
    await importMacroDimensoes(prisma, getRows(workbook, "Macro Dimensões"));

    const sync = await syncRespostasFromFinais();
    console.log(`  ✓ Respostas sincronizadas de Finais: ${sync.synced}`);

    if (fs.existsSync(SEGMENTOS_XLSX)) {
      const seg = await importSegmentosFromXlsx(prisma, SEGMENTOS_XLSX);
      console.log(`  ✓ Segmentos (xlsx externo): ${seg.imported}`);
    } else {
      const seg = await buildSegmentosFromRespostasFinais(prisma);
      console.log(`  ✓ Segmentos (gerados de RespostaFinal): ${seg.built}`);
    }

    const counts = await Promise.all([
      prisma.empresa.count(),
      prisma.questao.count(),
      prisma.resposta.count(),
      prisma.respostaFinal.count(),
      prisma.segmento.count(),
    ]);

    console.log("\n>> Importação concluída!");
    console.log(`   Empresas: ${counts[0]}`);
    console.log(`   Questões: ${counts[1]}`);
    console.log(`   Respostas: ${counts[2]}`);
    console.log(`   Respostas Finais: ${counts[3]}`);
    console.log(`   Segmentos: ${counts[4]}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("ERRO na importação:", err);
  process.exit(1);
});
