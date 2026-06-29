import { aplicarTemplate } from "@/lib/relatorio/relatorio-templates";
import { CONCLUSAO_TEMPLATE } from "@/lib/relatorio/relatorio-textos";
import type {
  DirecionamentoEstrategico,
  RelatorioConclusao,
  RelatorioTeor,
} from "@/lib/relatorio/relatorio-types";
import type { PercentualMaturidade } from "@/lib/relatorio/relatorio-types";

type ConclusaoInput = {
  empresa: string;
  representante: string | null;
  percentuaisMaturidade: PercentualMaturidade[];
  direcionamento: DirecionamentoEstrategico;
  teor: RelatorioTeor | null;
};

function dimensaoPredominante(
  percentuais: PercentualMaturidade[],
): { nome: string; percentual: string } {
  if (percentuais.length === 0) {
    return { nome: "—", percentual: "0" };
  }
  const top = [...percentuais].sort(
    (a, b) => parseFloat(b.percentual) - parseFloat(a.percentual),
  )[0];
  return { nome: top.resposta, percentual: top.percentual };
}

function formatarMacros(resumo: { processo: string; media: number }[]): string {
  if (resumo.length === 0) return "—";
  return resumo.map((m) => `${m.processo} (média ${m.media.toFixed(1)})`).join("; ");
}

export function montarConclusao(input: ConclusaoInput): RelatorioConclusao {
  const pred = dimensaoPredominante(input.percentuaisMaturidade);
  const ordenadas = [...input.direcionamento.resumo].sort(
    (a, b) => b.media - a.media,
  );
  const macrosFortes = formatarMacros(ordenadas.slice(0, 2));
  const macrosFracas = formatarMacros(
    [...ordenadas].reverse().slice(0, 2).reverse(),
  );

  const paragrafoKpis =
    input.teor && input.teor.kpis.length > 0
      ? `Na análise TEOR, os KPIs prioritários selecionados foram: ${input.teor.kpis.map((k) => k.nome).join(", ")}${input.teor.benchmark ? `, com benchmark setorial em "${input.teor.benchmark}"` : ""}${input.teor.horizonte ? ` e horizonte de planejamento ${input.teor.horizonte.toLowerCase()}` : ""}.`
      : "";

  const paragrafoTeor =
    input.teor && input.teor.priorizacoes.length > 0
      ? `As priorizações TEOR indicam foco em: ${input.teor.priorizacoes.map((p) => `${p.dimensao} (${p.grupoLabel})`).join("; ")}.`
      : "";

  let texto = CONCLUSAO_TEMPLATE.replace("{paragrafoKpis}", paragrafoKpis)
    .replace("{paragrafoTeor}", paragrafoTeor)
    .replace(/\n\n\n+/g, "\n\n");

  if (!paragrafoKpis && !paragrafoTeor) {
    texto = texto.replace(/\n\nCom base nesses resultados/, "\n\nCom base nesses resultados");
  }

  const paragrafos = aplicarTemplate(texto, {
    empresa: input.empresa,
    representante: input.representante,
    dimensaoPredominante: pred.nome,
    percentualPredominante: pred.percentual,
    macrosFortes,
    macrosFracas,
  })
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);

  return { paragrafos };
}
