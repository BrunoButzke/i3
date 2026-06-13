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

export const AVALIACAO_PLANO_KEYS = [
  "sem_avaliacao",
  "inadequado",
  "adequado_com_fraqueza",
  "aprimoravel",
  "adequado",
] as const;

export type AvaliacaoPlano = (typeof AVALIACAO_PLANO_KEYS)[number];

export const COMENTARIO_AVALIACAO_MAX_LENGTH = 500;

export const AVALIACAO_PLANO: Record<
  AvaliacaoPlano,
  { label: string; className: string; iconClass: string }
> = {
  sem_avaliacao: {
    label: "Sem avaliação",
    className: "i3-avaliacao-sem",
    iconClass: "i3-avaliacao-icon-sem",
  },
  inadequado: {
    label: "Inadequado",
    className: "i3-avaliacao-inadequado",
    iconClass: "i3-avaliacao-icon-inadequado",
  },
  adequado_com_fraqueza: {
    label: "Adequado com Fraqueza",
    className: "i3-avaliacao-alerta",
    iconClass: "i3-avaliacao-icon-alerta",
  },
  aprimoravel: {
    label: "Aprimorável",
    className: "i3-avaliacao-alerta",
    iconClass: "i3-avaliacao-icon-alerta",
  },
  adequado: {
    label: "Adequado",
    className: "i3-avaliacao-adequado",
    iconClass: "i3-avaliacao-icon-adequado",
  },
};

export function normalizarAvaliacaoPlano(value: string | null | undefined): AvaliacaoPlano {
  const key = value?.trim() as AvaliacaoPlano;
  return AVALIACAO_PLANO_KEYS.includes(key) ? key : "sem_avaliacao";
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
