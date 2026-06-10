export const RESPOSTA_PESOS: Record<string, number> = {
  Informatização: 1,
  Conectividade: 2,
  Visibilidade: 3,
  Transparência: 4,
  Previsibilidade: 5,
  Adaptabilidade: 6,
};

export const ORDEM_RESPOSTAS = [
  "Informatização",
  "Conectividade",
  "Visibilidade",
  "Transparência",
  "Previsibilidade",
  "Adaptabilidade",
] as const;

export function calcularResultado(resposta: string): number | null {
  if (!resposta?.trim() || resposta === "Irrelevante") return null;
  return RESPOSTA_PESOS[resposta] ?? null;
}
