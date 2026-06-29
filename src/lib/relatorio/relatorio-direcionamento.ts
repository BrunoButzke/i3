import { prisma } from "@/lib/prisma";
import {
  INTRO_MACRO,
  MACROS_DIGITAIS,
} from "@/lib/relatorio/relatorio-textos";
import type { DirecionamentoEstrategico } from "@/lib/relatorio/relatorio-types";
import { getRespostasEfetivas } from "@/lib/services/i3-service";

const TIPOS_MATURIDADE = [
  "Informatização",
  "Conectividade",
  "Visibilidade",
  "Transparência",
  "Previsibilidade",
  "Adaptabilidade",
] as const;

export function parseMacroParagrafos(texto: string): { label: string; corpo: string }[] {
  if (!texto.trim()) return [];
  return texto
    .split(/\n\n+/)
    .map((bloco) => bloco.trim())
    .filter(Boolean)
    .map((bloco) => {
      const idx = bloco.indexOf(":");
      if (idx <= 0) return { label: "", corpo: bloco };
      return {
        label: bloco.slice(0, idx).trim(),
        corpo: bloco.slice(idx + 1).trim(),
      };
    });
}

function matchParagrafoCapacidade(
  capacidade: string,
  paragrafos: { label: string; corpo: string }[],
): string {
  const capNorm = capacidade.toLowerCase();
  for (const p of paragrafos) {
    const labelNorm = p.label.toLowerCase();
    if (!labelNorm) continue;
    if (capNorm.startsWith(labelNorm) || labelNorm.startsWith(capNorm.split(" ")[0])) {
      return p.corpo;
    }
    const labelWords = labelNorm.split(/\s+/).filter((w) => w.length > 3);
    if (labelWords.length > 0 && labelWords.every((w) => capNorm.includes(w))) {
      return p.corpo;
    }
  }
  return paragrafos[0]?.corpo ?? "";
}

function calcularMediaPorProcesso(
  respostas: Awaited<ReturnType<typeof getRespostasEfetivas>>,
): Record<string, number> {
  const agrupado: Record<string, { soma: number; qtd: number }> = {};
  for (const r of respostas) {
    if (!r.processo) continue;
    if (!agrupado[r.processo]) agrupado[r.processo] = { soma: 0, qtd: 0 };
    agrupado[r.processo].soma += r.resultado ?? 0;
    agrupado[r.processo].qtd += 1;
  }
  return Object.fromEntries(
    Object.entries(agrupado).map(([processo, { soma, qtd }]) => [
      processo,
      qtd > 0 ? soma / qtd : 0,
    ]),
  );
}

async function textoAlternativaPorMedia(
  questaoIds: string[],
  media: number,
): Promise<string> {
  if (questaoIds.length === 0) return "";
  const questao = await prisma.questao.findFirst({
    where: { id: { in: questaoIds } },
  });
  if (!questao) return "";
  const alt = questao.alternativas as Record<string, string>;
  const idx = Math.round(media) - 1;
  if (idx >= 0 && idx < TIPOS_MATURIDADE.length) {
    return alt[TIPOS_MATURIDADE[idx]] ?? "";
  }
  return "";
}

export async function getDirecionamentoEstrategico(
  empresaId: number,
): Promise<DirecionamentoEstrategico> {
  const [macroRows, respostasRaw, capacidadesPorProcesso] = await Promise.all([
    prisma.macroDimensao.findMany(),
    getRespostasEfetivas(empresaId),
    prisma.questao.findMany({
      where: {
        processo: { in: MACROS_DIGITAIS.map((m) => m.processo) },
      },
      select: { processo: true, capacidade: true },
      distinct: ["processo", "capacidade"],
      orderBy: [{ processo: "asc" }, { capacidade: "asc" }],
    }),
  ]);

  const mediaPorProcesso = calcularMediaPorProcesso(respostasRaw);

  const capsByProcesso: Record<string, string[]> = {};
  for (const row of capacidadesPorProcesso) {
    if (!capsByProcesso[row.processo]) capsByProcesso[row.processo] = [];
    if (!capsByProcesso[row.processo].includes(row.capacidade)) {
      capsByProcesso[row.processo].push(row.capacidade);
    }
  }

  const macros = MACROS_DIGITAIS.map((macro) => {
    const media = mediaPorProcesso[macro.processo] ?? 0;
    const nivel = Math.min(5, Math.max(1, Math.floor(media) || 1));
    const macroRow = macroRows.find(
      (r) => r.macroIndice === macro.indice && r.nivel === nivel,
    );
    const paragrafos = parseMacroParagrafos(macroRow?.texto ?? "");
    const capacidades = capsByProcesso[macro.processo] ?? [];

    const subDimensoes = capacidades.map((capacidade) => {
      const resps = respostasRaw.filter(
        (r) => r.processo === macro.processo && r.capacidade === capacidade,
      );
      const mediaCap =
        resps.length > 0
          ? resps.reduce((s, r) => s + (r.resultado ?? 0), 0) / resps.length
          : 0;

      const paragrafo = matchParagrafoCapacidade(capacidade, paragrafos);

      return {
        capacidade,
        media: mediaCap,
        resultadoAnalise: paragrafo,
        questaoIds: resps.map((r) => r.questaoId).filter(Boolean),
      };
    });

    return {
      indice: macro.indice,
      secao: `3.${macro.indice}`,
      titulo: macro.titulo,
      processo: macro.processo,
      media,
      nivel,
      tituloNivel: macroRow?.titulo ?? "",
      intro: INTRO_MACRO[macro.indice] ?? "",
      subDimensoes,
    };
  });

  for (const macro of macros) {
    for (const sub of macro.subDimensoes) {
      if (!sub.resultadoAnalise) {
        sub.resultadoAnalise = await textoAlternativaPorMedia(
          sub.questaoIds,
          sub.media,
        );
      }
      delete (sub as { questaoIds?: string[] }).questaoIds;
    }
  }

  return {
    resumo: macros.map((m) => ({
      processo: m.processo,
      media: m.media,
    })),
    macros,
  };
}
