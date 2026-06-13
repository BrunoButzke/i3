import { Prisma } from "@/generated/prisma/client";
import { limitAcaoText, normalizarAvaliacaoPlano } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  parseKeyResults,
  sanitizeKeyResults,
  type KeyResult,
  type OkrData,
} from "@/lib/okr-utils";
import {
  buildQuestaoLookup,
  resolveQuestaoUuid,
} from "@/lib/questao-lookup";
import {
  parseSwotRecord,
  serializeSwotRecord,
  type SwotItems,
} from "@/lib/swot-utils";
import { calcularResultado } from "@/lib/scoring";

export type RespostaRow = [
  number,
  string,
  string,
  string,
  string,
  string,
  string,
];

export async function getProcessTypes(): Promise<string[]> {
  const rows = await prisma.filtro.findMany({
    where: { processo: { not: null } },
    select: { processo: true },
    orderBy: { id: "asc" },
  });
  return rows
    .map((r) => r.processo?.trim())
    .filter((p): p is string => Boolean(p));
}

export async function getAnswersTypes(): Promise<string[]> {
  const rows = await prisma.filtro.findMany({
    where: { respostaEscolhida: { not: null } },
    select: { respostaEscolhida: true },
    orderBy: { id: "asc" },
  });
  const fromDb = rows
    .map((r) => r.respostaEscolhida?.trim())
    .filter((p): p is string => Boolean(p));

  if (fromDb.length > 0) return fromDb;

  const { RESPOSTA_TIPOS } = await import("@/lib/constants");
  return [...RESPOSTA_TIPOS];
}

export async function getQuestions(process: string) {
  const questions = await prisma.questao.findMany({
    where: { processo: process.trim() },
    orderBy: [{ codigo: "asc" }, { id: "asc" }],
  });

  return {
    process,
    questions: questions.map((q) => {
      const alt = q.alternativas as Record<string, string>;
      return {
        id: q.id,
        codigo: q.codigo,
        estrutura: q.estrutura,
        principio: q.principio,
        capacidade: q.capacidade,
        processo: q.processo,
        enunciado: q.enunciado,
        alternativas: alt,
      };
    }),
  };
}

/** Retorna todas as questões com o mesmo código (processos diferentes). */
export async function getQuestionsByCodigo(codigo: string) {
  return prisma.questao.findMany({
    where: { codigo: codigo.trim() },
    orderBy: { processo: "asc" },
  });
}

export type RespostaEfetiva = {
  empresaId: number;
  estrutura: string;
  principio: string;
  capacidade: string;
  processo: string;
  questaoId: string;
  resposta: string;
  resultado: number | null;
};

/** Mescla RespostaFinal (histórico) com Resposta (rascunho atual). */
export async function getRespostasEfetivas(
  empresaId: number,
  processo?: string,
): Promise<RespostaEfetiva[]> {
  const processTrim = processo?.trim();
  const processFilter = processTrim ? { processo: processTrim } : {};

  const [respostas, finais, questoes] = await Promise.all([
    prisma.resposta.findMany({
      where: { empresaId, ...processFilter },
    }),
    prisma.respostaFinal.findMany({
      where: { empresaId, ...processFilter },
    }),
    prisma.questao.findMany({
      where: processTrim ? { processo: processTrim } : undefined,
      select: {
        id: true,
        codigo: true,
        estrutura: true,
        principio: true,
        capacidade: true,
        processo: true,
      },
    }),
  ]);

  const lookup = buildQuestaoLookup(questoes);
  const byQuestaoId = new Map<string, RespostaEfetiva>();

  for (const rf of finais) {
    const questaoId = resolveQuestaoUuid(lookup, {
      codigo: rf.codigo,
      estrutura: rf.estrutura,
      principio: rf.principio,
      capacidade: rf.capacidade,
      processo: rf.processo,
      questaoId: rf.questaoId,
    });
    if (!questaoId) continue;
    byQuestaoId.set(questaoId, {
      empresaId: rf.empresaId,
      estrutura: rf.estrutura,
      principio: rf.principio,
      capacidade: rf.capacidade,
      processo: rf.processo,
      questaoId,
      resposta: rf.resposta,
      resultado: rf.resultado,
    });
  }

  for (const r of respostas) {
    byQuestaoId.set(r.questaoId, {
      empresaId: r.empresaId,
      estrutura: r.estrutura,
      principio: r.principio,
      capacidade: r.capacidade,
      processo: r.processo,
      questaoId: r.questaoId,
      resposta: r.resposta,
      resultado: r.resultado,
    });
  }

  return [...byQuestaoId.values()];
}

export async function getAnswers(companyId: number, process: string) {
  const answers = (await getRespostasEfetivas(companyId, process)).map((a) => [
    a.empresaId,
    a.estrutura,
    a.principio,
    a.capacidade,
    a.processo,
    a.questaoId,
    a.resposta,
    a.resultado,
  ]);

  return {
    company: companyId,
    process,
    answers,
  };
}

/** Popula Resposta a partir de RespostaFinal quando a empresa não tem rascunho salvo. */
export async function syncRespostasFromFinais(empresaId?: number) {
  const whereEmpresa = empresaId ? { empresaId } : {};
  const finais = await prisma.respostaFinal.findMany({ where: whereEmpresa });
  if (finais.length === 0) return { synced: 0 };

  const questoes = await prisma.questao.findMany({
    select: {
      id: true,
      codigo: true,
      estrutura: true,
      principio: true,
      capacidade: true,
      processo: true,
    },
  });
  const lookup = buildQuestaoLookup(questoes);
  const questaoById = new Map(questoes.map((q) => [q.id, q]));

  const empresas = [
    ...new Set(finais.map((f) => f.empresaId)),
  ];
  let synced = 0;

  for (const empId of empresas) {
    const existingIds = new Set(
      (
        await prisma.resposta.findMany({
          where: { empresaId: empId },
          select: { questaoId: true },
        })
      ).map((r) => r.questaoId),
    );

    const rows = finais
      .filter((f) => f.empresaId === empId)
      .map((rf) => {
        const questaoId = resolveQuestaoUuid(lookup, {
          codigo: rf.codigo,
          estrutura: rf.estrutura,
          principio: rf.principio,
          capacidade: rf.capacidade,
          processo: rf.processo,
          questaoId: rf.questaoId,
        });
        if (!questaoId || existingIds.has(questaoId)) return null;
        const q = questaoById.get(questaoId);
        return {
          empresaId: empId,
          questaoId,
          estrutura: q?.estrutura ?? rf.estrutura,
          principio: q?.principio ?? rf.principio,
          capacidade: q?.capacidade ?? rf.capacidade,
          processo: q?.processo ?? rf.processo,
          resposta: rf.resposta,
          resultado:
            rf.resultado ?? calcularResultado(rf.resposta),
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length > 0) {
      await prisma.resposta.createMany({ data: rows });
      synced += rows.length;
    }
  }

  return { synced };
}

export async function saveAnswers(rows: RespostaRow[]) {
  if (rows.length === 0) return;

  const companyId = rows[0][0];

  await prisma.resposta.deleteMany({ where: { empresaId: companyId } });

  await prisma.resposta.createMany({
    data: rows.map((row) => ({
      empresaId: row[0],
      estrutura: row[1],
      principio: row[2],
      capacidade: row[3],
      processo: row[4],
      questaoId: row[5],
      resposta: row[6],
      resultado: calcularResultado(row[6]),
    })),
  });
}

export async function sendAnswers(rows: RespostaRow[]) {
  await saveAnswers(rows);
  await prisma.empresa.update({
    where: { id: rows[0][0] },
    data: { enviado: "SIM" },
  });
}

export async function getSWOT(empresaId: number): Promise<SwotItems | null> {
  const row = await prisma.sWOT.findFirst({ where: { empresaId } });
  if (!row) return null;
  return parseSwotRecord(row);
}

export async function saveSWOT(empresaId: number, data: SwotItems) {
  const serialized = serializeSwotRecord(data);
  const existing = await prisma.sWOT.findFirst({ where: { empresaId } });
  if (existing) {
    return prisma.sWOT.update({
      where: { id: existing.id },
      data: serialized,
    });
  }
  return prisma.sWOT.create({ data: { empresaId, ...serialized } });
}

function rowToOkrData(row: {
  id: number;
  objetivo: string;
  keyResults: unknown;
  okr1: string | null;
  okr2: string | null;
  okr3: string | null;
}): OkrData {
  return {
    id: row.id,
    objetivo: row.objetivo,
    keyResults: parseKeyResults(row.keyResults, row),
  };
}

export async function getOKRs(empresaId: number): Promise<OkrData[]> {
  const rows = await prisma.oKR.findMany({
    where: { empresaId },
    orderBy: { id: "asc" },
  });
  return rows.map(rowToOkrData);
}

/** @deprecated Use getOKRs */
export async function getOKR(empresaId: number): Promise<OkrData | null> {
  const okrs = await getOKRs(empresaId);
  return okrs[0] ?? null;
}

export async function saveOKR(empresaId: number, data: OkrData) {
  const objetivo = data.objetivo.trim();
  const keyResults = sanitizeKeyResults(data.keyResults);
  const payload = {
    objetivo,
    keyResults: keyResults as unknown as Prisma.InputJsonValue,
    okr1: null,
    okr2: null,
    okr3: null,
  };

  if (data.id) {
    const existing = await prisma.oKR.findFirst({
      where: { id: data.id, empresaId },
    });
    if (existing) {
      return prisma.oKR.update({
        where: { id: data.id },
        data: payload as Prisma.OKRUpdateInput,
      });
    }
  }

  return prisma.oKR.create({
    data: { empresaId, ...payload } as Prisma.OKRUncheckedCreateInput,
  });
}

export async function removeOKR(empresaId: number, id: number) {
  await prisma.oKR.deleteMany({ where: { id, empresaId } });
}

export async function getMetas(empresaId: number) {
  return prisma.metaSMART.findMany({ where: { empresaId } });
}

export async function saveMeta(
  empresaId: number,
  data: {
    objetivo: string;
    keyResultId?: string | null;
    especifica: string;
    mensuravel: string;
    alcancavel: string;
    relevante: string;
    temporal: string;
  },
) {
  const keyResultId = data.keyResultId?.trim() || null;
  const existing = await prisma.metaSMART.findFirst({
    where: { empresaId, objetivo: data.objetivo },
  });
  if (existing) {
    return prisma.metaSMART.update({
      where: { id: existing.id },
      data: {
        keyResultId,
        especifica: data.especifica,
        mensuravel: data.mensuravel,
        alcancavel: data.alcancavel,
        relevante: data.relevante,
        temporal: data.temporal,
      },
    });
  }
  return prisma.metaSMART.create({
    data: { empresaId, ...data, keyResultId },
  });
}

export async function removeMeta(empresaId: number, objetivo: string) {
  const existing = await prisma.metaSMART.findFirst({
    where: { empresaId, objetivo },
  });
  if (existing) await prisma.metaSMART.delete({ where: { id: existing.id } });
}

export async function getAcoes(empresaId: number) {
  return prisma.acao.findMany({
    where: { empresaId },
    orderBy: { id: "asc" },
  });
}

export async function salvarAcoes(
  acoes: {
    id?: number;
    empresa: number;
    acao: string;
    keyResultId?: string | null;
    gravidade: string;
    urgencia: string;
    tendencia: string;
    pontuacao: string;
    prioridade: string;
  }[],
) {
  let maxId =
    (
      await prisma.acao.aggregate({
        _max: { id: true },
      })
    )._max.id ?? 0;

  for (const a of acoes) {
    const acaoText = limitAcaoText(a.acao);
    const keyResultId = a.keyResultId?.trim() || null;
    const acaoData = {
      acao: acaoText,
      keyResultId,
      gravidade: a.gravidade,
      urgencia: a.urgencia,
      tendencia: a.tendencia,
      pontuacao: a.pontuacao,
      prioridade: a.prioridade,
    };
    let id = a.id;
    if (id) {
      const exists = await prisma.acao.findUnique({ where: { id } });
      if (exists) {
        await prisma.acao.update({
          where: { id },
          data: acaoData,
        });
      } else {
        await prisma.acao.create({
          data: {
            id,
            empresaId: a.empresa,
            ...acaoData,
          },
        });
      }
    } else {
      maxId += 1;
      id = maxId;
      await prisma.acao.create({
        data: {
          id,
          empresaId: a.empresa,
          ...acaoData,
        },
      });
    }

    const planoExists = await prisma.planoAcao.findUnique({ where: { id } });
    if (planoExists) {
      await prisma.planoAcao.update({
        where: { id },
        data: { oque: acaoText },
      });
    } else {
      await prisma.planoAcao.create({
        data: { id, empresaId: a.empresa, oque: acaoText, status: "pendente" },
      });
    }
  }

  return { sucesso: true, mensagem: "Ações salvas com sucesso!" };
}

export async function removerAcaoPorId(empresaId: number, id: number) {
  await prisma.acao.deleteMany({ where: { id, empresaId } });
  await prisma.planoAcao.deleteMany({ where: { id, empresaId } });
}

export async function getPlanoDeAcao(empresaId: number) {
  const planos = await prisma.planoAcao.findMany({
    where: { empresaId },
    orderBy: { id: "asc" },
  });
  const acoes = await prisma.acao.findMany({ where: { empresaId } });
  const prioridades = Object.fromEntries(
    acoes.map((a) => [a.id, a.prioridade ?? ""]),
  );

  return planos.map((p) => ({
    id: p.id,
    oque: p.oque,
    quem: p.quem ?? "",
    quando: p.quando ? p.quando.toISOString().slice(0, 10) : "",
    onde: p.onde ?? "",
    porque: p.porque ?? "",
    como: p.como ?? "",
    quanto: p.quanto ?? "",
    status: p.status ?? "pendente",
    prioridade: prioridades[p.id] ?? "",
  }));
}

export async function salvarPlanoIndividual(
  empresaId: number,
  data: {
    id?: number;
    oque: string;
    quem: string;
    quando: string;
    onde: string;
    porque: string;
    como: string;
    quanto: string;
  },
) {
  let id = data.id;
  if (id) {
    const exists = await prisma.planoAcao.findUnique({ where: { id } });
    if (exists) {
      return prisma.planoAcao.update({
        where: { id },
        data: {
          oque: data.oque,
          quem: data.quem,
          quando: data.quando ? new Date(data.quando) : null,
          onde: data.onde,
          porque: data.porque,
          como: data.como,
          quanto: data.quanto,
        },
      });
    }
  }

  const maxId =
    (
      await prisma.planoAcao.aggregate({ _max: { id: true } })
    )._max.id ?? 0;
  id = maxId + 1;

  return prisma.planoAcao.create({
    data: {
      id,
      empresaId,
      oque: data.oque,
      quem: data.quem,
      quando: data.quando ? new Date(data.quando) : null,
      onde: data.onde,
      porque: data.porque,
      como: data.como,
      quanto: data.quanto,
      status: "pendente",
      avaliacao: "sem_avaliacao",
    },
  });
}

export async function getPlanosDeAcao(empresaId: number) {
  const planos = await prisma.planoAcao.findMany({
    where: { empresaId },
    orderBy: { id: "asc" },
  });
  return planos
    .filter((p) => p.oque)
    .map((p) => ({
      id: p.id,
      acao: p.oque,
      responsavel: p.quem ?? "",
      prazo: p.quando
        ? p.quando.toLocaleDateString("pt-BR")
        : "",
      status: (p.status ?? "pendente").toLowerCase(),
      avaliacao: normalizarAvaliacaoPlano(p.avaliacao),
      comentarioAvaliacao: p.comentarioAvaliacao ?? "",
    }));
}

export async function salvarStatusPlanos(
  updates: {
    linha: number;
    status: string;
    avaliacao?: string;
    comentarioAvaliacao?: string;
  }[],
) {
  for (const u of updates) {
    await prisma.planoAcao.update({
      where: { id: u.linha },
      data: {
        status: u.status,
        avaliacao: normalizarAvaliacaoPlano(u.avaliacao),
        comentarioAvaliacao: u.comentarioAvaliacao?.trim().slice(0, 500) || null,
      },
    });
  }
  return { sucesso: true, mensagem: "Status atualizados com sucesso!" };
}

export async function getMemorias(empresaId: number) {
  const row = await prisma.memoriaSIRI.findUnique({ where: { empresaId } });
  if (!row) return [];
  return [row.dados as Record<string, unknown>];
}

export async function salvarMemoria(
  empresaId: number,
  dados: Record<string, unknown>,
) {
  const json = dados as Prisma.InputJsonValue;
  return prisma.memoriaSIRI.upsert({
    where: { empresaId },
    update: { dados: json },
    create: { empresaId, dados: json },
  });
}

export async function getRespostasFinais(empresaId: number) {
  const respostas = await prisma.resposta.findMany({
    where: { empresaId },
  });
  return {
    dados: respostas.map((r) => ({
      processo: r.processo,
      valor: r.resultado ?? 0,
    })),
  };
}

export async function buscarEmailEmpresa(empresaId: number) {
  const emp = await prisma.empresa.findUnique({ where: { id: empresaId } });
  return emp?.email ?? "";
}
