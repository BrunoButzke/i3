import {
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

function calcularCustosNormalizados(
  matrix: number[][],
  percentuais: number[],
  headers: readonly string[],
  target = 0.6,
): Record<string, number> {
  const colunas = matrix[0]?.length ?? 0;
  const linhas = matrix.length;
  const rawCustos = new Array(colunas).fill(0);

  for (let col = 0; col < colunas; col++) {
    for (let row = 0; row < linhas; row++) {
      rawCustos[col] += matrix[row][col] * percentuais[row];
    }
  }

  const totalRaw = rawCustos.reduce((acc, val) => acc + val, 0) || 1;
  const resultado: Record<string, number> = {};
  for (let i = 0; i < colunas; i++) {
    resultado[headers[i]] = (rawCustos[i] / totalRaw) * target;
  }
  return resultado;
}

function normalizarCustos(
  somasPorHeader: Record<string, number>,
  quantidadeSelecionados: number,
): Record<string, number> {
  const total =
    Object.values(somasPorHeader).reduce((a, b) => a + b, 0) || 1;
  const fator = quantidadeSelecionados > 0 ? 1 / quantidadeSelecionados : 0;
  const normalizado: Record<string, number> = {};
  Object.entries(somasPorHeader).forEach(([header, val]) => {
    normalizado[header] = (val / total) * fator;
  });
  return normalizado;
}

function calcularSomaKpis(selecionados: string[]): Record<string, number> {
  const resultado: Record<string, number> = {};
  Object.entries(matrizDeKpis).forEach(([header, kpiMap]) => {
    let soma = 0;
    selecionados.forEach((kpiName) => {
      const peso = kpiMap[kpiName];
      if (typeof peso === "number") soma += peso;
    });
    resultado[header] = soma;
  });
  return resultado;
}

function calcularBenchmarksNormalizados(
  valoresSetor: number[],
  bandas: number[],
  maxValorSetor = 5,
): Record<string, number> {
  const raws = valoresSetor.map((v, i) => v - (bandas[i] ?? 0));
  const somaRaw = raws.reduce((acc, x) => acc + x, 0);
  const denominador = somaRaw * maxValorSetor;
  if (denominador === 0) {
    throw new Error("Denominador zero, verifique os dados.");
  }
  const resultado: Record<string, number> = {};
  raws.forEach((raw, i) => {
    resultado[TEOR_HEADERS[i]] = raw / denominador;
  });
  return resultado;
}

function agregarResumo(
  custos: Record<string, number>,
  kpis: Record<string, number>,
  benchmark: Record<string, number>,
  horizonte: string | null,
): Record<string, number> {
  const pesosPorHorizonte: Record<string, number[]> = {
    Operacional: [0.6, 0.2, 0.2],
    Tático: [0.45, 0.3, 0.25],
    Estratégico: [0.3, 0.4, 0.3],
  };
  const pesos = pesosPorHorizonte[horizonte ?? ""] ?? [1, 1, 1];
  const todasChaves = new Set([
    ...Object.keys(custos),
    ...Object.keys(kpis),
    ...Object.keys(benchmark),
  ]);
  const resumo: Record<string, number> = {};
  todasChaves.forEach((chave) => {
    const custo = custos[chave] ?? 0;
    const kpi = kpis[chave] ?? 0;
    const bench = benchmark[chave] ?? 0;
    resumo[chave] = custo * pesos[0] + kpi * pesos[1] + bench * pesos[2];
  });
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

export function calcularTeor(input: TeorInput): TeorRankingItem[] {
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
    0.6,
  );
  const somas = calcularSomaKpis(input.kpisSelecionados);
  const normalizados = normalizarCustos(
    somas,
    input.kpisSelecionados.length,
  );
  const valoresSetor = benchmarksMatrix[input.benchmarkIndex];
  const resultadosBench = calcularBenchmarksNormalizados(
    valoresSetor,
    input.bandas,
  );
  const resumo = agregarResumo(
    custosNormalizados,
    normalizados,
    resultadosBench,
    input.horizonte,
  );
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

  const benchmarkStr = String(dados.benchmarkString ?? "").trim();
  const benchmarkIndex = benchmarkStr
    ? TEOR_BENCHMARKS.findIndex(
        (b) => b.toLowerCase() === benchmarkStr.toLowerCase(),
      )
    : -1;
  const benchmarkIdx = benchmarkIndex >= 0 ? benchmarkIndex : null;

  const bandas = TEOR_BANDAS_IDS.map((id) => {
    const v = parseFloat(String(dados[id] ?? 0));
    return Number.isNaN(v) ? 0 : v;
  });

  return {
    percentuaisCustos,
    kpisSelecionados,
    benchmarkIndex: benchmarkIdx,
    horizonte: String(dados.horizonteString ?? "").trim() || null,
    bandas,
  };
}
