import { prisma } from "@/lib/prisma";
import { formatKrLabel } from "@/lib/okr-utils";
import type { OkrData } from "@/lib/okr-utils";
import type {
  AnexoCapacidade,
  AnexoOkrLinha,
  AnexoPlanoGrupo,
  AnexoSwot,
  RelatorioAnexo,
} from "@/lib/relatorio/relatorio-types";
import {
  formatSwotRefLabels,
  parseSwotRecord,
  type SwotItems,
} from "@/lib/swot-utils";
import { getRespostasEfetivas } from "@/lib/services/i3-service";

const TIPOS_MATURIDADE = [
  "Informatização",
  "Conectividade",
  "Visibilidade",
  "Transparência",
  "Previsibilidade",
  "Adaptabilidade",
] as const;

function textoProximoNivel(
  alternativas: Record<string, string>,
  resultado: number,
): string {
  const nivelAtual = Math.round(resultado);
  if (nivelAtual >= TIPOS_MATURIDADE.length) return "";

  const startIdx = Math.min(
    TIPOS_MATURIDADE.length - 1,
    Math.max(0, nivelAtual),
  );

  for (let idx = startIdx; idx < TIPOS_MATURIDADE.length; idx++) {
    const texto = alternativas[TIPOS_MATURIDADE[idx]]?.trim();
    if (texto) return texto;
  }

  return "";
}

export async function getAnexoAcoesCapacidade(
  empresaId: number,
): Promise<AnexoCapacidade[]> {
  const respostasRaw = await getRespostasEfetivas(empresaId);
  const questaoIds = [...new Set(respostasRaw.map((r) => r.questaoId))];
  const questoes = await prisma.questao.findMany({
    where: { id: { in: questaoIds } },
  });
  const questaoById = new Map(questoes.map((q) => [q.id, q]));

  const registros: AnexoCapacidade[] = [];

  for (const r of respostasRaw) {
    if (!r.processo || !r.capacidade) continue;
    const resultado = r.resultado ?? 0;
    const questao = questaoById.get(r.questaoId);
    let proximoNivel = "";
    if (questao) {
      proximoNivel = textoProximoNivel(
        questao.alternativas as Record<string, string>,
        resultado,
      );
    }
    registros.push({
      capacidade: r.capacidade,
      processo: r.processo,
      resultadoAtual: resultado,
      proximoNivel,
    });
  }

  const agrupado = new Map<string, AnexoCapacidade>();
  for (const item of registros) {
    const chave = `${item.processo}::${item.capacidade}`;
    const existente = agrupado.get(chave);
    if (!existente || item.resultadoAtual < existente.resultadoAtual) {
      agrupado.set(chave, item);
    }
  }

  return [...agrupado.values()]
    .filter((item) => item.proximoNivel.trim() !== "")
    .sort((a, b) => {
      const proc = a.processo.localeCompare(b.processo);
      return proc !== 0 ? proc : a.capacidade.localeCompare(b.capacidade);
    });
}

export function montarAnexoSwot(
  swotRow: {
    forca: string | null;
    fraqueza: string | null;
    oportunidade: string | null;
    ameaca: string | null;
  } | null,
): AnexoSwot | null {
  if (!swotRow) return null;
  const items = parseSwotRecord(swotRow);
  const temConteudo = Object.values(items).some((arr) => arr.length > 0);
  if (!temConteudo) return null;

  return {
    interno: {
      forcas: items.forca.map((i) => i.texto),
      fraquezas: items.fraqueza.map((i) => i.texto),
    },
    externo: {
      oportunidades: items.oportunidade.map((i) => i.texto),
      ameacas: items.ameaca.map((i) => i.texto),
    },
  };
}

function formatarAlinhamentoSwot(
  swotItems: SwotItems | null,
  swotRefs: OkrData["keyResults"][0]["swotRefs"],
): string[] {
  return formatSwotRefLabels(swotItems, swotRefs);
}

export function montarAnexoOkrMetas(
  okrs: OkrData[],
  metas: {
    objetivo: string;
    keyResultId?: string | null;
    especifica: string | null;
    mensuravel: string | null;
    alcancavel: string | null;
    relevante: string | null;
    temporal: string | null;
  }[],
  swotItems: SwotItems | null,
): AnexoOkrLinha[] {
  const linhas: AnexoOkrLinha[] = [];

  okrs.forEach((okr, okrIndex) => {
    if (!okr.objetivo.trim() && okr.keyResults.length === 0) return;

    okr.keyResults.forEach((kr, krIndex) => {
      if (!kr.texto.trim() && kr.swotRefs.length === 0) return;

      const meta = metas.find((m) => m.keyResultId === kr.id);
      linhas.push({
        objetivo: okr.objetivo || `Objetivo ${okrIndex + 1}`,
        kr: kr.texto || formatKrLabel(kr, krIndex),
        alinhamentoSwot: formatarAlinhamentoSwot(swotItems, kr.swotRefs),
        meta: meta
          ? {
              especifica: meta.especifica ?? "",
              mensuravel: meta.mensuravel ?? "",
              alcancavel: meta.alcancavel ?? "",
              relevante: meta.relevante ?? "",
              temporal: meta.temporal ?? "",
            }
          : undefined,
      });
    });
  });

  metas
    .filter((m) => !m.keyResultId && m.objetivo.trim())
    .forEach((meta) => {
      linhas.push({
        objetivo: meta.objetivo,
        kr: "—",
        alinhamentoSwot: [],
        meta: {
          especifica: meta.especifica ?? "",
          mensuravel: meta.mensuravel ?? "",
          alcancavel: meta.alcancavel ?? "",
          relevante: meta.relevante ?? "",
          temporal: meta.temporal ?? "",
        },
      });
    });

  return linhas;
}

export async function getAnexoPlanoGrupos(
  empresaId: number,
  okrs: OkrData[],
): Promise<AnexoPlanoGrupo[]> {
  const [planos, acoes] = await Promise.all([
    prisma.planoAcao.findMany({
      where: { empresaId },
      orderBy: { id: "asc" },
    }),
    prisma.acao.findMany({ where: { empresaId } }),
  ]);

  const acaoById = new Map(acoes.map((a) => [a.id, a]));

  function krLabel(keyResultId: string | null | undefined): string {
    if (!keyResultId) return "";
    for (let oi = 0; oi < okrs.length; oi++) {
      const krIndex = okrs[oi].keyResults.findIndex(
        (kr) => kr.id === keyResultId,
      );
      if (krIndex >= 0) {
        const kr = okrs[oi].keyResults[krIndex];
        const obj = okrs[oi].objetivo.trim();
        const krText = formatKrLabel(kr, krIndex, 50);
        return obj ? `OKR: ${obj} — ${krText}` : krText;
      }
    }
    return "";
  }

  const grupos = new Map<string, AnexoPlanoGrupo["itens"]>();

  for (const p of planos) {
    if (!p.oque?.trim()) continue;
    const acao = acaoById.get(p.id);
    const krRelacionado = krLabel(acao?.keyResultId);
    const foco = krRelacionado || "Ações sem KR vinculado";

    const descricaoParts = [p.como, p.porque].filter(Boolean);
    const item = {
      acao: p.oque,
      descricao: descricaoParts.join(" — ") || "—",
      responsavel: p.quem ?? "—",
      prazo: p.quando ? p.quando.toLocaleDateString("pt-BR") : "—",
      krRelacionado: krRelacionado || "—",
    };

    if (!grupos.has(foco)) grupos.set(foco, []);
    grupos.get(foco)!.push(item);
  }

  return [...grupos.entries()].map(([foco, itens]) => ({ foco, itens }));
}

export async function getRelatorioAnexo(
  empresaId: number,
  okrs: OkrData[],
  swotRow: {
    forca: string | null;
    fraqueza: string | null;
    oportunidade: string | null;
    ameaca: string | null;
  } | null,
  metas: {
    objetivo: string;
    keyResultId?: string | null;
    especifica: string | null;
    mensuravel: string | null;
    alcancavel: string | null;
    relevante: string | null;
    temporal: string | null;
  }[],
): Promise<RelatorioAnexo> {
  const swotItems = swotRow ? parseSwotRecord(swotRow) : null;

  const [acoesCapacidade, planoGrupos] = await Promise.all([
    getAnexoAcoesCapacidade(empresaId),
    getAnexoPlanoGrupos(empresaId, okrs),
  ]);

  return {
    acoesCapacidade,
    swot: montarAnexoSwot(swotRow),
    okrMetas: montarAnexoOkrMetas(okrs, metas, swotItems),
    planoGrupos,
  };
}
