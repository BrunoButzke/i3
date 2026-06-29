import { ORDEM_RESPOSTAS, RESPOSTA_PESOS } from "@/lib/scoring";
import { prisma } from "@/lib/prisma";
import { calcularMatrizCapacidades } from "@/lib/relatorio/relatorio-capacidade";
import { getDirecionamentoEstrategico } from "@/lib/relatorio/relatorio-direcionamento";
import { getRelatorioAnexo } from "@/lib/relatorio/relatorio-anexo";
import { montarConclusao } from "@/lib/relatorio/relatorio-conclusao";
import { getRelatorioTeor } from "@/lib/relatorio/relatorio-teor";
import {
  MACROS_DIGITAIS,
  ORDEM_PRINCIPIOS,
} from "@/lib/relatorio/relatorio-textos";
import { formatSwotItemsForDisplay, formatSwotRefLabels, parseSwotRecord } from "@/lib/swot-utils";
import { findKeyResultInOkrs } from "@/lib/okr-utils";
import { getOKRs } from "@/lib/services/i3-service";
import { getRespostasEfetivas } from "@/lib/services/i3-service";

const PROCESSOS_IGNORAR = [
  "Estratégia e Governança Digital",
  "Processos e Operações Inteligentes",
  "Tecnologia e Infraestrutura Digital",
  "Pessoas e Competências Digitais",
];

const INDICADORES = [...ORDEM_RESPOSTAS];

export async function calcularTotalPorRespostaEmpresa(empresaId: number) {
  const respostas = await getRespostasEfetivas(empresaId);
  const totais: Record<string, number> = {};
  for (const r of respostas) {
    if (!r.resposta) continue;
    totais[r.resposta] = (totais[r.resposta] ?? 0) + 1;
  }
  return Object.entries(totais).map(([resposta, total]) => ({
    resposta,
    total,
  }));
}

export function calcularPercentuaisMaturidade(
  totais: { resposta: string; total: number }[],
) {
  const mediasValidas = totais.filter(
    (t) => t.resposta && t.resposta !== "Irrelevante",
  );
  const totaisPorResposta: Record<string, number> = {};
  mediasValidas.forEach((item) => {
    totaisPorResposta[item.resposta] = item.total;
  });
  const somaQuantidades = Object.values(totaisPorResposta).reduce(
    (a, b) => a + b,
    0,
  );
  return ORDEM_RESPOSTAS.map((resposta) => {
    const total = totaisPorResposta[resposta] ?? 0;
    const peso = RESPOSTA_PESOS[resposta] ?? 0;
    const percentual =
      somaQuantidades > 0
        ? ((total * peso) / (somaQuantidades * 6)) * 100
        : 0;
    return { resposta, percentual: percentual.toFixed(2) };
  });
}

export async function calcularMediasPorEstrutura(empresaId: number) {
  const respostas = await getRespostasEfetivas(empresaId);
  const agrupado: Record<string, Record<string, number>> = {};

  for (const r of respostas) {
    if (!r.resposta || r.resposta === "Irrelevante") continue;
    if (!agrupado[r.estrutura]) agrupado[r.estrutura] = {};
    agrupado[r.estrutura][r.resposta] =
      (agrupado[r.estrutura][r.resposta] ?? 0) + (r.resultado ?? 0);
  }

  const mediasPorEstrutura: Record<
    string,
    { resposta: string; percentual: string }[]
  > = {};

  Object.entries(agrupado).forEach(([estrutura, respostasMap]) => {
    const somaTotal = Object.values(respostasMap).reduce((a, b) => a + b, 0);
    mediasPorEstrutura[estrutura] = ORDEM_RESPOSTAS.map((resposta) => {
      const total = respostasMap[resposta] ?? 0;
      const peso = RESPOSTA_PESOS[resposta] ?? 0;
      const percentual =
        somaTotal > 0
          ? ((total * peso) / (somaTotal * 6) * 100).toFixed(2)
          : "0.00";
      return { resposta, percentual };
    });
  });

  return mediasPorEstrutura;
}

export async function calcularMediasPorPrincipio(empresaId: number) {
  const respostas = await getRespostasEfetivas(empresaId);
  const agrupado: Record<string, Record<string, number>> = {};

  for (const r of respostas) {
    if (!r.resposta || r.resposta === "Irrelevante") continue;
    if (!agrupado[r.principio]) agrupado[r.principio] = {};
    agrupado[r.principio][r.resposta] =
      (agrupado[r.principio][r.resposta] ?? 0) + (r.resultado ?? 0);
  }

  const mediasPorPrincipio: Record<
    string,
    { resposta: string; percentual: string }[]
  > = {};

  for (const principio of ORDEM_PRINCIPIOS) {
    const respostasMap = agrupado[principio] ?? {};
    const somaTotal = Object.values(respostasMap).reduce((a, b) => a + b, 0);
    mediasPorPrincipio[principio] = ORDEM_RESPOSTAS.map((resposta) => {
      const total = respostasMap[resposta] ?? 0;
      const peso = RESPOSTA_PESOS[resposta] ?? 0;
      const percentual =
        somaTotal > 0
          ? ((total * peso) / (somaTotal * 6) * 100).toFixed(2)
          : "0.00";
      return { resposta, percentual };
    });
  }

  for (const [principio, respostasMap] of Object.entries(agrupado)) {
    if (mediasPorPrincipio[principio]) continue;
    const somaTotal = Object.values(respostasMap).reduce((a, b) => a + b, 0);
    mediasPorPrincipio[principio] = ORDEM_RESPOSTAS.map((resposta) => {
      const total = respostasMap[resposta] ?? 0;
      const peso = RESPOSTA_PESOS[resposta] ?? 0;
      const percentual =
        somaTotal > 0
          ? ((total * peso) / (somaTotal * 6) * 100).toFixed(2)
          : "0.00";
      return { resposta, percentual };
    });
  }

  return mediasPorPrincipio;
}

export async function getResultadoPorDimensao(empresaId: number) {
  const respostas = await getRespostasEfetivas(empresaId);
  const agrupado: Record<string, { soma: number; qtd: number }> = {};
  for (const r of respostas) {
    if (!r.processo) continue;
    if (!agrupado[r.processo]) agrupado[r.processo] = { soma: 0, qtd: 0 };
    agrupado[r.processo].soma += r.resultado ?? 0;
    agrupado[r.processo].qtd += 1;
  }
  return Object.entries(agrupado).map(([processo, { soma, qtd }]) => ({
    processo,
    media: qtd > 0 ? soma / qtd : 0,
  }));
}

export async function getResumoCapacidade(empresaId: number) {
  const respostasRaw = await getRespostasEfetivas(empresaId);
  const questaoIds = [...new Set(respostasRaw.map((r) => r.questaoId))];
  const questoes = await prisma.questao.findMany({
    where: { id: { in: questaoIds } },
  });
  const questaoById = new Map(questoes.map((q) => [q.id, q]));
  const respostas = respostasRaw.map((r) => ({
    ...r,
    questao: questaoById.get(r.questaoId) ?? null,
  }));

  const registros: {
    estrutura: string;
    principio: string;
    processo: string;
    capacidade: string;
    soma: number;
    textoResultado: string;
  }[] = [];

  for (const r of respostas) {
    if (!r.processo || PROCESSOS_IGNORAR.includes(r.processo)) continue;
    const resultado = r.resultado ?? 0;
    let textoResultado = "";
    if (r.questao) {
      const alt = r.questao.alternativas as Record<string, string>;
      const tipos = [
        "Informatização",
        "Conectividade",
        "Visibilidade",
        "Transparência",
        "Previsibilidade",
        "Adaptabilidade",
      ];
      const idx = Math.round(resultado) - 1;
      if (idx >= 0 && idx < tipos.length) {
        textoResultado = alt[tipos[idx]] ?? "";
      }
    }
    registros.push({
      estrutura: r.estrutura,
      principio: r.principio,
      processo: r.processo,
      capacidade: r.capacidade,
      soma: resultado,
      textoResultado,
    });
  }

  const agrupado: Record<string, (typeof registros)[0]> = {};
  registros.forEach((item) => {
    const chave = `${item.estrutura} | ${item.principio} | ${item.processo}`;
    if (!agrupado[chave] || item.soma < agrupado[chave].soma) {
      agrupado[chave] = item;
    }
  });

  return Object.values(agrupado);
}

export async function compararEmpresaPorIndicador(empresaId: number) {
  const segmentos = await prisma.segmento.findMany({ orderBy: { id: "asc" } });
  if (segmentos.length === 0) return null;

  const empresas = segmentos.map((s) => {
    const ind = (s.indicadores ?? {}) as Record<string, number>;
    const metricas = INDICADORES.map((col) => Number(ind[col]) || 0);
    const total = metricas.reduce((a, b) => a + b, 0);
    return { id: String(s.id), empresa: s.empresa, metricas, total };
  });

  const empresaAlvo = empresas.find((e) => e.id === String(empresaId));
  if (!empresaAlvo) return null;

  const outras = empresas.filter((e) => e.id !== String(empresaId));
  const ordenadas = [...outras].sort((a, b) => a.total - b.total);
  const n = ordenadas.length;
  const p10 = Math.max(1, Math.floor(n * 0.1));
  const p80 = n - 2 * p10;

  const grupoMenores = ordenadas.slice(0, p10);
  const grupoMeio = ordenadas.slice(p10, p10 + p80);
  const grupoMaiores = ordenadas.slice(p10 + p80);

  function mediasDoGrupo(grupo: typeof empresas) {
    if (!grupo.length) return INDICADORES.map(() => 0);
    const soma = Array(INDICADORES.length).fill(0);
    grupo.forEach((emp) =>
      emp.metricas.forEach((v, i) => {
        soma[i] += v;
      }),
    );
    return soma.map((s) => s / grupo.length);
  }

  const mediasMenores = mediasDoGrupo(grupoMenores);
  const mediasMeio = mediasDoGrupo(grupoMeio);
  const mediasMaiores = mediasDoGrupo(grupoMaiores);

  return {
    id: empresaAlvo.id,
    empresa: empresaAlvo.empresa,
    comparacoes: INDICADORES.map((indicador, i) => ({
      indicador,
      valorEmpresa: empresaAlvo.metricas[i],
      media10Menores: mediasMenores[i],
      media80Meio: mediasMeio[i],
      media10Maiores: mediasMaiores[i],
    })),
  };
}

const PROCESSOS_DIGITAIS: string[] = MACROS_DIGITAIS.map((m) => m.processo);

export async function getRelatorioCompleto(empresaId: number) {
  const [
    totais,
    mediasPorEstrutura,
    mediasPorPrincipio,
    dimensoes,
    resumoCapacidade,
    matrizCapacidades,
    direcionamento,
    teor,
    analise3B,
    swot,
    okrs,
    metas,
    planos,
    empresa,
  ] = await Promise.all([
    calcularTotalPorRespostaEmpresa(empresaId),
    calcularMediasPorEstrutura(empresaId),
    calcularMediasPorPrincipio(empresaId),
    getResultadoPorDimensao(empresaId),
    getResumoCapacidade(empresaId),
    calcularMatrizCapacidades(empresaId),
    getDirecionamentoEstrategico(empresaId),
    getRelatorioTeor(empresaId),
    compararEmpresaPorIndicador(empresaId),
    prisma.sWOT.findFirst({ where: { empresaId } }),
    getOKRs(empresaId),
    prisma.metaSMART.findMany({ where: { empresaId } }),
    prisma.planoAcao.findMany({ where: { empresaId }, orderBy: { id: "asc" } }),
    prisma.empresa.findUnique({ where: { id: empresaId } }),
  ]);

  const percentuaisMaturidade = calcularPercentuaisMaturidade(totais);
  const dimensoesOperacionais = dimensoes
    .filter((d) => !PROCESSOS_DIGITAIS.includes(d.processo))
    .sort((a, b) => a.processo.localeCompare(b.processo));

  const anexo = await getRelatorioAnexo(empresaId, okrs, swot, metas);
  const conclusao = montarConclusao({
    empresa: empresa?.nome ?? "",
    representante: empresa?.representante ?? null,
    percentuaisMaturidade,
    direcionamento,
    teor,
  });

  const swotItems = swot ? parseSwotRecord(swot) : null;
  const okrsFormatados = okrs
    .filter((item) => item.objetivo.trim() || item.keyResults.length > 0)
    .map((item) => ({
      objetivo: item.objetivo,
      keyResults: item.keyResults.map((kr) => ({
        texto: kr.texto,
        swotItens: formatSwotRefLabels(swotItems, kr.swotRefs),
      })),
    }));

  return {
    empresa: empresa?.nome ?? "",
    representante: empresa?.representante ?? null,
    email: empresa?.email ?? "",
    dataAvaliacao: new Date().toLocaleDateString("pt-BR"),
    percentuaisMaturidade,
    mediasPorEstrutura,
    mediasPorPrincipio,
    dimensoesOperacionais,
    matrizCapacidades,
    direcionamento,
    teor,
    conclusao,
    anexo,
    resumoCapacidade,
    analise3B,
    swot: swot
      ? {
          forca: formatSwotItemsForDisplay(swot.forca),
          fraqueza: formatSwotItemsForDisplay(swot.fraqueza),
          oportunidade: formatSwotItemsForDisplay(swot.oportunidade),
          ameaca: formatSwotItemsForDisplay(swot.ameaca),
        }
      : null,
    okrs: okrsFormatados,
    metas: metas.map((meta) => {
      const kr = meta.keyResultId
        ? findKeyResultInOkrs(okrs, meta.keyResultId)
        : undefined;
      return {
        ...meta,
        krTexto: kr?.texto ?? null,
      };
    }),
    planos: planos.filter((p) => p.oque),
  };
}
