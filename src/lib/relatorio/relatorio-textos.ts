/** Textos fixos do relatório (AppScript legado + PDF Condor). */

export const RELATORIO_TITULO = "Relatório de Análise de Maturidade";

export const INTRODUCAO_GERAL = `Este relatório apresenta o resultado do diagnóstico de maturidade digital realizado na empresa {empresa}, com foco na avaliação dos pilares fundamentais que sustentam a transformação tecnológica no ambiente industrial. O objetivo é compreender como cultura, recursos, sistemas de informação e estrutura organizacional se posicionam frente às exigências de um cenário produtivo cada vez mais conectado e automatizado.

A transformação industrial contemporânea tem se consolidado como uma poderosa tendência, integrando tecnologias digitais aos processos produtivos e possibilitando ganhos expressivos em eficiência, produtividade e inovação. Nesse contexto, conhecer o estágio atual da {empresa} é essencial para orientar decisões estratégicas que impulsionam sua evolução digital e promovam crescimento sustentável.

O diagnóstico utiliza a estrutura de avaliação do modelo i3, que organiza a maturidade digital em quatro pilares principais:
• Estratégia e Governança Digital
• Processos e Operações Inteligentes
• Tecnologia e Infraestrutura Digital
• Pessoas e Competências Digitais

Cada pilar contempla elementos específicos que serão analisados detalhadamente ao longo deste documento.`;

export const ESCALA_MATURIDADE_INTRO =
  "A escala é dividida em seis dimensões fundamentais, cada uma com suas características específicas:";

export const DIMENSOES_MATURIDADE: { titulo: string; texto: string }[] = [
  {
    titulo: "Informatização",
    texto:
      "Nesse estágio inicial, as empresas começam a utilizar tecnologias de informação para automatizar processos específicos. Os sistemas são usados para coletar e armazenar dados, mas a integração e o compartilhamento dessas informações ainda são limitados.",
  },
  {
    titulo: "Conectividade",
    texto:
      "Nesse estágio, a empresa expande a informatização e inicia a conexão entre diferentes sistemas e dispositivos. A integração de dados e a troca de informações entre diferentes partes da cadeia de produção começam a ser estabelecidas.",
  },
  {
    titulo: "Visibilidade",
    texto:
      "A visibilidade implica em ter uma visão mais abrangente e detalhada das operações industriais. Os dados coletados são analisados para obter insights sobre o desempenho dos processos e tomar decisões baseadas em informações mais precisas.",
  },
  {
    titulo: "Transparência",
    texto:
      "Nesse estágio, a empresa alcança maior transparência em suas operações, compartilhando informações com fornecedores, clientes e outras partes interessadas. A transparência possibilita uma maior colaboração e uma melhor coordenação na cadeia de valor.",
  },
  {
    titulo: "Previsibilidade",
    texto:
      "A previsibilidade envolve a capacidade de antecipar eventos futuros com base em análises de dados e modelos preditivos. A empresa pode tomar decisões proativas com base em cenários previstos, reduzindo riscos e otimizando suas operações.",
  },
  {
    titulo: "Adaptabilidade",
    texto:
      "No nível mais avançado de maturidade, a empresa demonstra uma capacidade de adaptação rápida e flexível a mudanças no ambiente interno e externo. A empresa pode reconfigurar suas operações de acordo com demandas específicas, aproveitando as oportunidades de mercado de forma ágil.",
  },
];

export const ESCALA_MATURIDADE_FECHAMENTO = `Essas dimensões representam uma jornada evolutiva rumo à plena adoção da Indústria 4.0. À medida que a empresa progride ao longo da escala, ela incorpora tecnologias e práticas mais avançadas, tornando-se mais eficiente, inovadora e competitiva no mercado atual.

A Escala de Maturidade oferece uma referência valiosa para as empresas avaliarem sua posição atual em relação à Indústria 4.0 e identificarem oportunidades de melhoria e avanço em direção à transformação digital.`;

export const METODOLOGIA_INTRO = `A metodologia i3 (Índice da Indústria Inteligente) foi desenvolvida para orientar empresas na jornada da transformação digital, promovendo mudanças estruturadas com base em diagnóstico, priorização e execução estratégica. Sua aplicação contempla tanto a avaliação da maturidade digital quanto o desenvolvimento de um roadmap de transformação, alinhado à realidade, cultura e objetivos de cada organização. A metodologia utilizada para avaliar a maturidade da Indústria 4.0 é fundamentada em um conjunto abrangente de estruturas e princípios essenciais para compreender e impulsionar a transformação digital.`;

export const APLICACAO_PRATICA = `Combinando as estruturas e princípios acima, a metodologia i3 oferece uma análise aprofundada da maturidade digital da empresa, identificando pontos fortes, fragilidades e caminhos de evolução. Os resultados permitem a formulação de recomendações práticas para guiar a jornada da transformação digital com foco em competitividade, inovação e preparação para o futuro.`;

export const DIRECIONAMENTO_INTRO = `A análise do direcionamento estratégico é baseada em quatro macro dimensões e cada uma delas representa uma vertente do RAMI 4.0. Seguem os resultados das macro dimensões:`;

/** Ordem de exibição dos princípios no relatório (PDF Condor). */
export const ORDEM_PRINCIPIOS = [
  "Colaboração Social",
  "Comunicação Estruturada",
  "Processamento de Informações",
  "Colaboração Dinâmica em Redes de Valor",
  "Organização Interna Orgânica",
  "Vontade de Mudar",
  "Capacidade Digital",
  "Integração de Sistemas de TI",
] as const;

export const DESCRICOES_PRINCIPIO: Record<string, string> = {
  "Colaboração Social":
    "Esse princípio destaca a importância de uma cultura colaborativa, onde os colaboradores trabalhem em equipe, compartilhando conhecimentos e experiências para promover a inovação e a cocriação.",
  "Comunicação Estruturada":
    "A comunicação clara e estruturada é um elemento crucial para garantir que informações e ideias fluam de forma eficiente em todos os níveis da empresa, permitindo uma tomada de decisões informada.",
  "Processamento de Informações":
    "O processamento ágil de informações é essencial para transformar dados em conhecimento e insights relevantes, capacitando a empresa para ações rápidas e embasadas.",
  "Colaboração Dinâmica em Redes de Valor":
    "Esse princípio destaca a importância de estabelecer parcerias e colaborações externas, visando criar redes de valor que impulsionam a inovação e a competitividade.",
  "Organização Interna Orgânica":
    "A organização interna da empresa deve ser flexível e adaptável para acompanhar as mudanças do mercado e das tecnologias emergentes.",
  "Vontade de Mudar":
    "A disposição para mudar e a abertura para a inovação são aspectos fundamentais para o sucesso da transformação digital e a adoção da Indústria 4.0.",
  "Capacidade Digital":
    "Esse princípio destaca a importância de desenvolver competências digitais, capacitando a empresa a utilizar efetivamente as tecnologias da Indústria 4.0.",
  "Integração de Sistemas de TI":
    "Garante o fluxo contínuo e confiável de dados entre diferentes plataformas da empresa, permitindo automação, redução de silos e decisões mais ágeis e baseadas em informações em tempo real.",
};

export const INTRO_MACRO: Record<number, string> = {
  1: "Esta dimensão avalia como a liderança da empresa direciona e gerencia a transformação digital, incluindo a visão estratégica, o planejamento, a cultura organizacional e a governança de dados e segurança.",
  2: "Esta dimensão foca na digitalização, integração e inteligência aplicadas aos processos de negócio e operações industriais, desde a cadeia de suprimentos até a produção e o ciclo de vida do produto.",
  3: "Esta dimensão avalia a base tecnológica da empresa, incluindo a infraestrutura de TI, conectividade, plataformas de software, e a adoção de tecnologias emergentes como Inteligência Artificial e Big Data, além da cibersegurança industrial.",
  4: "Esta dimensão aborda o capital humano da organização, focando no desenvolvimento de competências digitais, na promoção de um ambiente colaborativo e na experiência do colaborador na era digital.",
};

export const DESCRICOES_ESTRUTURA: Record<string, string> = {
  Cultura:
    "A cultura organizacional é um dos alicerces mais importantes na jornada rumo à Indústria 4.0. Nessa etapa, avalia-se os valores, crenças e comportamentos existentes na empresa, buscando compreender a disposição dos colaboradores para a inovação, colaboração e aprendizado contínuo.",
  Recursos:
    "Analisamos os recursos disponíveis na empresa, incluindo tanto os recursos humanos, como habilidades e competências, quanto os recursos tecnológicos, como infraestrutura e tecnologias de informação. Buscamos identificar o potencial da empresa para adotar tecnologias avançadas e utilizar esses recursos para impulsionar a transformação digital.",
  "Sistemas de Informação":
    "Essa estrutura foca na infraestrutura tecnológica da empresa. Avalia-se a capacidade de integração e interconexão dos sistemas de informação, bem como a qualidade e a segurança dos dados coletados e processados. A análise do sistema de informação é fundamental para a obtenção de insights valiosos e tomadas de decisões baseadas em informações confiáveis.",
  "Estrutura Organizacional":
    "Nesta etapa, examinamos a organização interna da empresa, observando a estrutura hierárquica, a governança e a flexibilidade para adaptação. A estrutura organizacional precisa estar alinhada com as demandas da Indústria 4.0, permitindo uma tomada de decisões ágil e uma colaboração dinâmica.",
  Gestão:
    "Avaliamos como a empresa gerencia seus processos, pessoas e tecnologias para alcançar os objetivos de transformação digital.",
  "Valor sustentável":
    "Analisamos práticas de sustentabilidade, governança e capital humano e social no contexto da transformação digital industrial.",
};

export const CAPACIDADES_INTRO = `Na jornada rumo à Indústria 4.0, diversas capacidades organizacionais, tecnológicas e culturais são essenciais para garantir uma transformação digital bem-sucedida, resiliente e integrada. Essas capacidades não atuam isoladamente, mas se complementam de forma sistêmica, promovendo eficiência, inteligência e agilidade industrial.

Abaixo estão os resultados de cada uma dessas capacidades, expressos como percentual de maturidade em cada dimensão da escala i3:`;

export const MACROS_DIGITAIS = [
  {
    indice: 1,
    processo: "Estratégia e Governança Digital",
    titulo: "Macro-Dimensão 1: Estratégia e Governança Digital",
  },
  {
    indice: 2,
    processo: "Processos e Operações Inteligentes",
    titulo: "Macro-Dimensão 2: Processos e Operações Inteligentes",
  },
  {
    indice: 3,
    processo: "Tecnologia e Infraestrutura Digital",
    titulo: "Macro-Dimensão 3: Tecnologia e Infraestrutura Digital",
  },
  {
    indice: 4,
    processo: "Pessoas e Competências Digitais",
    titulo: "Macro-Dimensão 4: Pessoas e Competências Digitais",
  },
] as const;

export const TEOR_INTRO = `A Análise TEOR (Transformation, Operational, Enterprise Readiness) complementa o diagnóstico i3 ao cruzar a estrutura de custos da empresa, indicadores-chave de desempenho (KPIs), benchmark setorial e autoavaliação nas 16 dimensões do framework SIRI (Smart Industry Readiness Index). O objetivo é identificar, de forma objetiva, quais dimensões de transformação digital devem ser priorizadas com base no perfil econômico, operacional e competitivo da organização.`;

export const TEOR_ETAPAS: { titulo: string; texto: string }[] = [
  {
    titulo: "4.1. Estrutura de custos",
    texto:
      "Levantamento da participação percentual dos principais grupos de custo na operação industrial, permitindo correlacionar investimentos em transformação digital com os drivers econômicos mais relevantes para a empresa.",
  },
  {
    titulo: "4.2. Indicadores de desempenho (KPIs)",
    texto:
      "Seleção de até cinco KPIs prioritários que representam os objetivos estratégicos e operacionais da organização, servindo como referência para orientar a priorização das dimensões SIRI.",
  },
  {
    titulo: "4.3. Benchmark setorial e horizonte de planejamento",
    texto:
      "Comparação com referências do setor industrial escolhido e definição do horizonte de planejamento (estratégico, tático ou operacional), que ajusta os pesos relativos entre custos, KPIs e benchmark na consolidação final.",
  },
  {
    titulo: "4.4. Resultado das bandas",
    texto:
      "Registro do resultado das bandas de autoavaliação nas 16 dimensões e cálculo das prioridades de transformação, identificando as dimensões de maior potencial de impacto em processo, tecnologia e operação.",
  },
];

export const TEOR_KPI_DESCRICOES: Record<string, string> = {
  "Eficiência de ativos e equipamentos":
    "Mede a utilização efetiva de máquinas, equipamentos e instalações produtivas, refletindo o aproveitamento do capital investido em ativos industriais.",
  "Eficiência da força de trabalho":
    "Avalia a produtividade do capital humano, considerando o output gerado em relação às horas ou recursos empregados.",
  "Eficiência de utilidades":
    "Indica o consumo de energia, água, vapor e demais utilidades em relação à produção, apontando oportunidades de redução de desperdícios.",
  "Eficiência de estoque":
    "Monitora a gestão de estoques de matérias-primas, produtos em processo e acabados, equilibrando disponibilidade e custo de capital imobilizado.",
  "Eficiência de materiais":
    "Quantifica perdas, refugos e retrabalho no uso de materiais, evidenciando oportunidades de melhoria na qualidade e no aproveitamento de insumos.",
  "Qualidade do processo":
    "Acompanha a estabilidade e conformidade dos processos produtivos, reduzindo variabilidade e não conformidades ao longo da cadeia operacional.",
  "Qualidade do produto":
    "Mede a conformidade e confiabilidade dos produtos entregues ao cliente, incluindo defeitos, devoluções e reclamações.",
  "Segurança (Integridade)":
    "Avalia a proteção de pessoas, instalações e meio ambiente, incluindo acidentes, incidentes e conformidade com normas de segurança industrial.",
  "Segurança (Ciber Segurança)":
    "Verifica a proteção de sistemas, redes e dados industriais contra ameaças digitais e acessos não autorizados.",
  "Eficácia do planejamento e programação":
    "Mede a aderência entre o plano de produção e a execução real, incluindo cumprimento de prazos e sequenciamento.",
  "Flexibilidade de produção":
    "Capacidade de adaptar volumes, mix de produtos e rotas produtivas com agilidade, atendendo variações de demanda.",
  "Flexibilidade da força de trabalho":
    "Habilidade de realocar e capacitar colaboradores conforme necessidades operacionais e projetos de melhoria.",
  "Tempo de colocação no mercado":
    "Intervalo entre concepção e lançamento de novos produtos ou variantes, refletindo agilidade em P&D e engenharia.",
  "Tempo de entrega":
    "Prazo entre o pedido do cliente e a entrega do produto, indicador central de competitividade logística e de serviço.",
};

export const TEOR_GRUPO_PRIORIZACAO: Record<string, string> = {
  processo: "Processo",
  tecnologia: "Tecnologia",
  operacao: "Operação",
  maiorRestante: "Maior dos restantes",
};

export const CONCLUSAO_TEMPLATE = `Este relatório consolida o diagnóstico de maturidade digital realizado na {empresa}, conduzido por {representante}, aplicando a metodologia i3 (Índice da Indústria Inteligente).

O resultado global indica maior concentração na dimensão de maturidade "{dimensaoPredominante}" ({percentualPredominante}% do perfil consolidado), evidenciando o estágio predominante da organização na escala evolutiva rumo à Indústria 4.0.

No direcionamento estratégico, as macro-dimensões digitais com desempenho mais consolidado são: {macrosFortes}. As áreas que demandam maior atenção e investimento prioritário são: {macrosFracas}.

{paragrafoKpis}

{paragrafoTeor}

Com base nesses resultados, recomenda-se utilizar o Anexo A deste documento — com a matriz SWOT, OKRs, metas SMART e plano de ação — como guia prático para a execução da jornada de transformação digital, alinhando iniciativas à realidade operacional, econômica e competitiva da {empresa}.`;

export const ANEXO_INTRO =
  "O Anexo A reúne instrumentos de execução estratégica derivados do diagnóstico: ações por capacidade, análise SWOT, OKRs, metas SMART e plano de ação para os próximos 12 meses.";
