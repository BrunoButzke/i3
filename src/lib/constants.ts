export const RESPOSTA_TIPOS = [
  "Informatização",
  "Conectividade",
  "Visibilidade",
  "Transparência",
  "Previsibilidade",
  "Adaptabilidade",
  "Irrelevante",
] as const;

export const PROCESSOS_PADRAO = [
  "Processo Produtivo",
  "Venda Planejamento Compras",
  "Gestão da Qualidade",
  "Logística",
  "Manutenção",
  "Processo da Engenharia",
  "Estratégia e Governança Digital",
  "Processos e Operações Inteligentes",
  "Tecnologia e Infraestrutura Digital",
  "Pessoas e Competências Digitais",
] as const;

export const SESSION_COOKIE = "i3_session";

export const LOGO_URL = "/logo/logo.png";

/** Limite de caracteres para o texto da ação (Priorização / Plano / Acompanhamento). */
export const ACAO_MAX_LENGTH = 80;

export function limitAcaoText(text: string): string {
  return text.slice(0, ACAO_MAX_LENGTH);
}

export type TabId =
  | "diagnostico"
  | "swot"
  | "okr"
  | "metas"
  | "priorizacao"
  | "plano"
  | "acompanhamento"
  | "memoria"
  | "relatorio";

export const TABS: { id: TabId; label: string }[] = [
  { id: "diagnostico", label: "Diagnóstico" },
  { id: "swot", label: "Matriz SWOT" },
  { id: "okr", label: "Definir OKR" },
  { id: "metas", label: "Definir Metas" },
  { id: "priorizacao", label: "Priorização de Ações" },
  { id: "plano", label: "Plano de Ação" },
  { id: "acompanhamento", label: "Acompanhamento" },
  { id: "memoria", label: "Análise TEOR" },
  { id: "relatorio", label: "Relatório i3" },
];
