export type QuestaoRef = {
  id: string;
  codigo: string;
  estrutura: string;
  principio: string;
  capacidade: string;
  processo: string;
};

export type QuestaoLookup = {
  byCodigoProcesso: Map<string, string>;
  byConteudo: Map<string, string>;
};

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function keyCodigoProcesso(codigo: string, processo: string): string {
  return `${norm(codigo)}|||${norm(processo)}`;
}

function keyConteudo(q: {
  estrutura: string;
  principio: string;
  capacidade: string;
  processo: string;
}): string {
  return [
    norm(q.estrutura),
    norm(q.principio),
    norm(q.capacidade),
    norm(q.processo),
  ].join("|||");
}

export function buildQuestaoLookup(questoes: QuestaoRef[]): QuestaoLookup {
  const byCodigoProcesso = new Map<string, string>();
  const byConteudo = new Map<string, string>();

  for (const q of questoes) {
    byCodigoProcesso.set(keyCodigoProcesso(q.codigo, q.processo), q.id);
    byConteudo.set(keyConteudo(q), q.id);
  }

  return { byCodigoProcesso, byConteudo };
}

export function resolveQuestaoUuid(
  lookup: QuestaoLookup,
  row: {
    codigo?: string;
    estrutura: string;
    principio: string;
    capacidade: string;
    processo: string;
    questaoId?: string | null;
  },
): string | null {
  if (row.questaoId) return row.questaoId;

  const byCodigo = row.codigo
    ? lookup.byCodigoProcesso.get(
        keyCodigoProcesso(row.codigo, row.processo),
      )
    : null;
  if (byCodigo) return byCodigo;

  return lookup.byConteudo.get(keyConteudo(row)) ?? null;
}
