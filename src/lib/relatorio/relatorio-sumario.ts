export type SumarioItem = {
  id: string;
  titulo: string;
  nivel?: number;
};

export const RELATORIO_SUMARIO: SumarioItem[] = [
  { id: "cap-1", titulo: "1. Introdução", nivel: 1 },
  { id: "cap-2", titulo: "2. Metodologia e resultados", nivel: 1 },
  { id: "cap-3", titulo: "3. Direcionamento estratégico", nivel: 1 },
  { id: "cap-4", titulo: "4. Análise TEOR", nivel: 1 },
  { id: "cap-5", titulo: "5. Conclusão", nivel: 1 },
  { id: "cap-6", titulo: "6. Anexo A — Plano de execução", nivel: 1 },
];
