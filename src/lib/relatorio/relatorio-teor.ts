import { prisma } from "@/lib/prisma";
import {
  TEOR_GRUPO_PRIORIZACAO,
  TEOR_KPI_DESCRICOES,
} from "@/lib/relatorio/relatorio-textos";
import type { RelatorioTeor } from "@/lib/relatorio/relatorio-types";
import { calcularTeor, parseTeorFromDados } from "@/lib/teor-calculo";
import {
  TEOR_BANDAS_IDS,
  TEOR_BENCHMARKS,
  TEOR_CUSTOS_KEYS,
  TEOR_CUSTOS_LABELS,
  TEOR_HEADERS,
  benchmarksMatrix,
} from "@/lib/teor-data";

const DIMENSAO_GRUPOS: { titulo: string; inicio: number; fim: number }[] = [
  { titulo: "Processo", inicio: 0, fim: 2 },
  { titulo: "Tecnologia — Automação", inicio: 3, fim: 5 },
  { titulo: "Tecnologia — Conectividade", inicio: 6, fim: 8 },
  { titulo: "Tecnologia — Inteligência", inicio: 9, fim: 11 },
  { titulo: "Organização", inicio: 12, fim: 15 },
];

function memoriaTemConteudo(dados: Record<string, unknown>): boolean {
  const temCusto = TEOR_CUSTOS_KEYS.some(
    (k) => parseFloat(String(dados[k] ?? 0)) > 0,
  );
  const temKpis = String(dados.kpisString ?? "").trim().length > 0;
  const temBenchmark = String(
    dados.benchmarkString ?? dados.benchmark ?? "",
  ).trim().length > 0;
  const temHorizonte = String(
    dados.horizonteString ?? dados.horizonte ?? "",
  ).trim().length > 0;
  const temBanda = TEOR_BANDAS_IDS.some(
    (id) => String(dados[id] ?? "").trim() !== "",
  );
  return temCusto || temKpis || temBenchmark || temHorizonte || temBanda;
}

export async function getRelatorioTeor(
  empresaId: number,
): Promise<RelatorioTeor | null> {
  const row = await prisma.memoriaSIRI.findUnique({ where: { empresaId } });
  if (!row) return null;

  const dados = row.dados as Record<string, unknown>;
  if (!memoriaTemConteudo(dados)) return null;

  const input = parseTeorFromDados(dados);

  const custos = TEOR_CUSTOS_KEYS.map((key, i) => ({
    label: TEOR_CUSTOS_LABELS[i],
    percentual: parseFloat(String(dados[key] ?? 0)) || 0,
  })).filter((c) => c.percentual > 0);

  const kpis = input.kpisSelecionados.map((nome) => ({
    nome,
    descricao: TEOR_KPI_DESCRICOES[nome] ?? "",
  }));

  const benchmarkNome =
    input.benchmarkIndex != null && input.benchmarkIndex >= 0
      ? TEOR_BENCHMARKS[input.benchmarkIndex]
      : String(dados.benchmarkString ?? dados.benchmark ?? "").trim();

  const dimensoes = TEOR_HEADERS.map((nome, i) => ({
    nome,
    nivel: input.bandas[i] ?? 0,
    grupo:
      DIMENSAO_GRUPOS.find((g) => i >= g.inicio && i <= g.fim)?.titulo ?? "",
  }));

  const benchmarkComparativo =
    input.benchmarkIndex != null && input.benchmarkIndex >= 0
      ? TEOR_HEADERS.map((nome, i) => ({
          dimensao: nome,
          nivelEmpresa: input.bandas[i] ?? 0,
          referenciaSetor: benchmarksMatrix[input.benchmarkIndex!][i] ?? 0,
        }))
      : [];

  let priorizacoes: RelatorioTeor["priorizacoes"] = [];
  let avisoCalculo: string | undefined;

  try {
    const ranking = calcularTeor(input);
    priorizacoes = ranking.map((r) => ({
      grupo: r.grupo,
      grupoLabel: TEOR_GRUPO_PRIORIZACAO[r.grupo] ?? r.grupo,
      dimensao: r.chave,
      valor: r.valor,
    }));
  } catch (err) {
    avisoCalculo =
      err instanceof Error
        ? err.message
        : "Complete benchmark, KPIs e horizonte na aba Análise TEOR para calcular as priorizações.";
  }

  return {
    custos,
    kpis,
    benchmark: benchmarkNome,
    horizonte: input.horizonte ?? "",
    dimensoes,
    benchmarkComparativo,
    priorizacoes,
    avisoCalculo,
  };
}
