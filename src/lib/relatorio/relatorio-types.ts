export type PercentualMaturidade = {
  resposta: string;
  percentual: string;
};

export type LinhaMatrizCapacidade = {
  capacidade: string;
  percentuais: PercentualMaturidade[];
};

export type RoadmapItem = {
  titulo: string;
  nivel: number;
  tituloNivel: string;
  texto: string;
};

export type SubDimensaoDigital = {
  capacidade: string;
  media: number;
  resultadoAnalise: string;
};

export type MacroDirecionamento = {
  indice: number;
  secao: string;
  titulo: string;
  processo: string;
  media: number;
  nivel: number;
  tituloNivel: string;
  intro: string;
  subDimensoes: SubDimensaoDigital[];
};

export type DirecionamentoEstrategico = {
  resumo: { processo: string; media: number }[];
  macros: MacroDirecionamento[];
};

export type RelatorioTeor = {
  custos: { label: string; percentual: number }[];
  kpis: { nome: string; descricao: string }[];
  benchmark: string;
  horizonte: string;
  dimensoes: { nome: string; nivel: number; grupo: string }[];
  benchmarkComparativo: {
    dimensao: string;
    nivelEmpresa: number;
    referenciaSetor: number;
  }[];
  priorizacoes: {
    grupo: string;
    grupoLabel: string;
    dimensao: string;
    valor: number;
  }[];
  avisoCalculo?: string;
};

export type RelatorioConclusao = {
  paragrafos: string[];
};

export type AnexoCapacidade = {
  capacidade: string;
  processo: string;
  resultadoAtual: number;
  proximoNivel: string;
};

export type AnexoSwot = {
  interno: { forcas: string[]; fraquezas: string[] };
  externo: { oportunidades: string[]; ameacas: string[] };
};

export type AnexoOkrLinha = {
  objetivo: string;
  kr: string;
  alinhamentoSwot: string[];
  meta?: {
    especifica: string;
    mensuravel: string;
    alcancavel: string;
    relevante: string;
    temporal: string;
  };
};

export type AnexoPlanoGrupo = {
  foco: string;
  itens: {
    acao: string;
    descricao: string;
    responsavel: string;
    prazo: string;
    krRelacionado: string;
  }[];
};

export type RelatorioAnexo = {
  acoesCapacidade: AnexoCapacidade[];
  swot: AnexoSwot | null;
  okrMetas: AnexoOkrLinha[];
  planoGrupos: AnexoPlanoGrupo[];
};

export type RelatorioCompleto = {
  empresa: string;
  representante: string | null;
  email: string;
  dataAvaliacao: string;
  percentuaisMaturidade: PercentualMaturidade[];
  mediasPorEstrutura: Record<string, PercentualMaturidade[]>;
  mediasPorPrincipio: Record<string, PercentualMaturidade[]>;
  dimensoesOperacionais: { processo: string; media: number }[];
  matrizCapacidades: LinhaMatrizCapacidade[];
  direcionamento: DirecionamentoEstrategico;
  teor: RelatorioTeor | null;
  conclusao: RelatorioConclusao;
  anexo: RelatorioAnexo;
  resumoCapacidade: {
    estrutura: string;
    principio: string;
    processo: string;
    capacidade: string;
    soma: number;
    textoResultado: string;
  }[];
  analise3B: {
    comparacoes: {
      indicador: string;
      valorEmpresa: number;
      media10Menores: number;
      media80Meio: number;
      media10Maiores: number;
    }[];
  } | null;
  swot: {
    forca: string;
    fraqueza: string;
    oportunidade: string;
    ameaca: string;
  } | null;
  okrs: {
    objetivo: string;
    keyResults: { texto: string; swotItens: string[] }[];
  }[];
  metas: {
    objetivo: string;
    keyResultId?: string | null;
    krTexto?: string | null;
    especifica: string;
    mensuravel: string;
    alcancavel: string;
    relevante: string;
    temporal: string;
  }[];
  planos: {
    oque: string;
    quem: string | null;
    quando: Date | null;
    onde: string | null;
    porque: string | null;
    como: string | null;
    quanto: string | null;
    status: string | null;
    avaliacao?: string | null;
  }[];
};
