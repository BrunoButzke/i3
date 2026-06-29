import {
  TEOR_BANDAS_DEFAULTS,
  TEOR_BANDAS_IDS,
  TEOR_BENCHMARKS,
  TEOR_HEADERS,
  TEOR_KPIS,
  benchmarksMatrix,
  custosMatrix,
  kpisMatrix,
} from "@/lib/teor-data";

export type TeorInput = {
  percentuaisCustos: number[];
  kpisSelecionados: string[];
  benchmarkIndex: number | null;
  horizonte: string | null;
  bandas: number[];
};

export type TeorRankingItem = {
  grupo: string;
  chave: string;
  valor: number;
};

const PESOS_POR_HORIZONTE: Record<string, [number, number, number]> = {
  Operacional: [0.6, 0.2, 0.2],
  Tático: [0.45, 0.3, 0.25],
  Estratégico: [0.3, 0.4, 0.3],
};

function criarMatrizDeValores(
  headers: readonly string[],
  labels: readonly string[],
  matrix: number[][],
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  headers.forEach((header, colIndex) => {
    result[header] = {};
    labels.forEach((label, rowIndex) => {
      result[header][label] = Number(matrix[rowIndex]?.[colIndex]) || 0;
    });
  });
  return result;
}

const matrizDeKpis = criarMatrizDeValores(TEOR_HEADERS, TEOR_KPIS, kpisMatrix);

/** Normaliza vetor de 16 dimensões para soma = 1.0 (SIRI 6.7.4). */
function normalizarVetor16(
  valores: number[],
  headers: readonly string[] = TEOR_HEADERS,
): Record<string, number> {
  const soma = valores.reduce((acc, val) => acc + val, 0);
  const denominador = soma > 0 ? soma : 1;
  const resultado: Record<string, number> = {};
  for (let i = 0; i < headers.length; i++) {
    resultado[headers[i]] = (valores[i] ?? 0) / denominador;
  }
  return resultado;
}

/** Passo 1 — Custos: raw ponderado pela matriz DOR, normalizado (soma = 1). */
function calcularCustosNormalizados(
  matrix: number[][],
  percentuais: number[],
  headers: readonly string[],
): Record<string, number> {
  const colunas = matrix[0]?.length ?? 0;
  const linhas = matrix.length;
  const rawCustos = new Array(colunas).fill(0);

  for (let col = 0; col < colunas; col++) {
    for (let row = 0; row < linhas; row++) {
      rawCustos[col] += matrix[row][col] * percentuais[row];
    }
  }

  return normalizarVetor16(rawCustos, headers);
}

/** Passo 2 — KPIs: soma dos coeficientes DOR dos KPIs ativos (peso 1), normalizado (soma = 1). */
function calcularKpisNormalizados(selecionados: string[]): Record<string, number> {
  const somas = new Array(TEOR_HEADERS.length).fill(0);

  TEOR_HEADERS.forEach((header, colIndex) => {
    const kpiMap = matrizDeKpis[header];
    let soma = 0;
    for (const kpiName of selecionados) {
      const peso = kpiMap[kpiName];
      if (typeof peso === "number") soma += peso;
    }
    somas[colIndex] = soma;
  });

  return normalizarVetor16(somas);
}

/** Passo 3 — Proximity: max(0, referência − banda), normalizado (soma = 1). */
function calcularProximidadeNormalizada(
  valoresSetor: number[],
  bandas: number[],
): Record<string, number> {
  const raws = valoresSetor.map((v, i) =>
    Math.max(0, v - (bandas[i] ?? 0)),
  );
  const soma = raws.reduce((acc, x) => acc + x, 0);
  if (soma === 0) {
    throw new Error(
      "Proximidade zero: a empresa já atinge ou supera o benchmark em todas as dimensões.",
    );
  }
  return normalizarVetor16(raws);
}

function agregarResumo(
  custos: Record<string, number>,
  kpis: Record<string, number>,
  proximidade: Record<string, number>,
  horizonte: string | null,
): Record<string, number> {
  const pesos = PESOS_POR_HORIZONTE[horizonte ?? ""] ?? [1, 1, 1];
  const [wCost, wKpi, wProximity] = pesos;

  const resumo: Record<string, number> = {};
  for (const chave of TEOR_HEADERS) {
    const custo = custos[chave] ?? 0;
    const kpi = kpis[chave] ?? 0;
    const prox = proximidade[chave] ?? 0;
    resumo[chave] = custo * wCost + kpi * wKpi + prox * wProximity;
  }
  return resumo;
}

function encontrarMaximosComRestante(
  valores: Record<string, number>,
): TeorRankingItem[] {
  const headers = [...TEOR_HEADERS];

  function maxInRange(start: number, end: number) {
    let maxKey: string | null = null;
    let maxVal = -Infinity;
    for (let i = start; i <= end; i++) {
      const chave = headers[i];
      const val = valores[chave];
      if (val !== undefined && val > maxVal) {
        maxVal = val;
        maxKey = chave;
      }
    }
    return { chave: maxKey ?? "", valor: maxVal };
  }

  const processo = maxInRange(0, 2);
  const tecnologia = maxInRange(3, 11);
  const operacao = maxInRange(12, 15);
  const chavesUsadas = new Set([
    processo.chave,
    tecnologia.chave,
    operacao.chave,
  ]);

  let maxRestanteChave: string | null = null;
  let maxRestanteValor = -Infinity;
  for (let i = 0; i < headers.length; i++) {
    const chave = headers[i];
    if (!chavesUsadas.has(chave)) {
      const val = valores[chave];
      if (val !== undefined && val > maxRestanteValor) {
        maxRestanteValor = val;
        maxRestanteChave = chave;
      }
    }
  }

  const items: TeorRankingItem[] = [
    { grupo: "processo", chave: processo.chave, valor: processo.valor },
    { grupo: "tecnologia", chave: tecnologia.chave, valor: tecnologia.valor },
    { grupo: "operacao", chave: operacao.chave, valor: operacao.valor },
  ];
  if (maxRestanteChave) {
    items.push({
      grupo: "maiorRestante",
      chave: maxRestanteChave,
      valor: maxRestanteValor,
    });
  }
  return items;
}

/** Retorna Impact Values (resumo[j]) por dimensão SIRI — SIRI Learner's Guide 6.7.4. */
export function calcularTeorResumo(input: TeorInput): Record<string, number> {
  if (input.benchmarkIndex == null) {
    throw new Error("Selecione um benchmark.");
  }
  if (input.kpisSelecionados.length === 0) {
    throw new Error("Selecione ao menos um KPI.");
  }
  if (!input.horizonte) {
    throw new Error("Selecione o horizonte de planejamento.");
  }

  const custosNormalizados = calcularCustosNormalizados(
    custosMatrix,
    input.percentuaisCustos,
    TEOR_HEADERS,
  );
  const kpisNormalizados = calcularKpisNormalizados(input.kpisSelecionados);
  const valoresSetor = benchmarksMatrix[input.benchmarkIndex];
  const proximidadeNormalizada = calcularProximidadeNormalizada(
    valoresSetor,
    input.bandas,
  );

  return agregarResumo(
    custosNormalizados,
    kpisNormalizados,
    proximidadeNormalizada,
    input.horizonte,
  );
}

export function calcularTeor(input: TeorInput): TeorRankingItem[] {
  const resumo = calcularTeorResumo(input);
  return encontrarMaximosComRestante(resumo);
}

export function parseTeorFromDados(dados: Record<string, unknown>): TeorInput {
  const percentuaisCustos = [
    "materiaPrima",
    "utilidades",
    "maoObra",
    "manutencao",
    "locacao",
    "depreciacao",
    "pesquisa",
    "posVenda",
    "despesasGerais",
    "transporte",
  ].map((k) => {
    const v = parseFloat(String(dados[k] ?? 0));
    return Number.isNaN(v) ? 0 : v / 100;
  });

  const kpisStr = String(dados.kpisString ?? "");
  const kpisSelecionados = kpisStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const benchmarkStr = String(
    dados.benchmarkString ?? dados.benchmark ?? "",
  ).trim();
  const benchmarkIndex = benchmarkStr
    ? TEOR_BENCHMARKS.findIndex(
        (b) => b.toLowerCase() === benchmarkStr.toLowerCase(),
      )
    : -1;
  const benchmarkIdx = benchmarkIndex >= 0 ? benchmarkIndex : null;

  const bandas = TEOR_BANDAS_IDS.map((id) => {
    const raw = dados[id];
    if (raw === undefined || raw === null || String(raw).trim() === "") {
      return TEOR_BANDAS_DEFAULTS[id] ?? 0;
    }
    const v = parseFloat(String(raw));
    return Number.isNaN(v) ? (TEOR_BANDAS_DEFAULTS[id] ?? 0) : v;
  });

  return {
    percentuaisCustos,
    kpisSelecionados,
    benchmarkIndex: benchmarkIdx,
    horizonte:
      String(dados.horizonteString ?? dados.horizonte ?? "").trim() || null,
    bandas,
  };
}
