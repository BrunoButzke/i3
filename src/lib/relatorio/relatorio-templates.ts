export type RelatorioTemplateVars = {
  empresa: string;
  representante?: string | null;
  dimensaoPredominante?: string;
  percentualPredominante?: string;
  macrosFortes?: string;
  macrosFracas?: string;
  kpisSelecionados?: string;
  priorizacaoTeor?: string;
};

export function aplicarTemplate(
  texto: string,
  vars: RelatorioTemplateVars,
): string {
  const representante = vars.representante?.trim() || "o representante da empresa";
  let out = texto
    .replaceAll("{empresa}", vars.empresa)
    .replaceAll("{representante}", representante);

  const extras: [string, string | undefined][] = [
    ["{dimensaoPredominante}", vars.dimensaoPredominante],
    ["{percentualPredominante}", vars.percentualPredominante],
    ["{macrosFortes}", vars.macrosFortes],
    ["{macrosFracas}", vars.macrosFracas],
    ["{kpisSelecionados}", vars.kpisSelecionados],
    ["{priorizacaoTeor}", vars.priorizacaoTeor],
  ];
  for (const [key, val] of extras) {
    out = out.replaceAll(key, val?.trim() || "—");
  }
  return out;
}
