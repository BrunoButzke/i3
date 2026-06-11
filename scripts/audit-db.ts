import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  buildQuestaoLookup,
  resolveQuestaoUuid,
} from "../src/lib/questao-lookup";
import { RESPOSTA_TIPOS } from "../src/lib/constants";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const VALID_RESPOSTAS = new Set<string>(RESPOSTA_TIPOS);

async function main() {
  console.log("=== CONTAGENS POR TABELA ===\n");
  const counts = {
    Empresa: await prisma.empresa.count(),
    Filtro: await prisma.filtro.count(),
    Questao: await prisma.questao.count(),
    Resposta: await prisma.resposta.count(),
    RespostaFinal: await prisma.respostaFinal.count(),
    SWOT: await prisma.sWOT.count(),
    OKR: await prisma.oKR.count(),
    MetaSMART: await prisma.metaSMART.count(),
    Acao: await prisma.acao.count(),
    PlanoAcao: await prisma.planoAcao.count(),
    MemoriaSIRI: await prisma.memoriaSIRI.count(),
    MacroDimensao: await prisma.macroDimensao.count(),
    Segmento: await prisma.segmento.count(),
  };
  for (const [t, c] of Object.entries(counts)) {
    console.log(`  ${t.padEnd(16)} ${c}`);
  }

  console.log("\n=== EMPRESAS COM DADOS ===\n");
  const empresas = await prisma.empresa.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      nome: true,
      usuario: true,
      enviado: true,
      _count: {
        select: {
          respostas: true,
          respostasFinais: true,
          swots: true,
          okrs: true,
          metas: true,
          acoes: true,
          planosDeAcao: true,
          memoriasSiri: true,
        },
      },
    },
  });
  for (const e of empresas) {
    const c = e._count;
    console.log(
      `  id=${e.id} ${e.usuario} (${e.nome}) enviado=${e.enviado ?? "?"}`,
    );
    console.log(
      `    Resposta=${c.respostas} RF=${c.respostasFinais} SWOT=${c.swots} OKR=${c.okrs} Meta=${c.metas} Acao=${c.acoes} Plano=${c.planosDeAcao} SIRI=${c.memoriasSiri}`,
    );
  }

  console.log("\n=== INTEGRIDADE FK / ÓRFÃOS ===\n");

  const respostaOrfaEmpresa = await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*)::bigint c FROM "Resposta" r
    LEFT JOIN "Empresa" e ON e.id = r."empresaId"
    WHERE e.id IS NULL
  `;
  console.log(
    `  Resposta sem Empresa: ${respostaOrfaEmpresa[0]?.c ?? 0}`,
  );

  const respostaOrfaQuestao = await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*)::bigint c FROM "Resposta" r
    LEFT JOIN "Questao" q ON q.id = r."questaoId"
    WHERE q.id IS NULL
  `;
  console.log(
    `  Resposta sem Questao (FK): ${respostaOrfaQuestao[0]?.c ?? 0}`,
  );

  const rfOrfaEmpresa = await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*)::bigint c FROM "RespostaFinal" rf
    LEFT JOIN "Empresa" e ON e.id = rf."empresaId"
    WHERE e.id IS NULL
  `;
  console.log(
    `  RespostaFinal sem Empresa: ${rfOrfaEmpresa[0]?.c ?? 0}`,
  );

  console.log("\n=== RESPOSTA: CAMPOS vs QUESTÃO VINCULADA ===\n");

  const respostasComQuestao = await prisma.resposta.findMany({
    include: {
      questao: {
        select: {
          codigo: true,
          estrutura: true,
          principio: true,
          capacidade: true,
          processo: true,
        },
      },
    },
  });

  let mismatchProcesso = 0;
  let mismatchConteudo = 0;
  for (const r of respostasComQuestao) {
    if (!r.questao) continue;
    if (r.processo.trim() !== r.questao.processo.trim()) mismatchProcesso++;
    const same =
      r.estrutura.trim() === r.questao.estrutura.trim() &&
      r.principio.trim() === r.questao.principio.trim() &&
      r.capacidade.trim() === r.questao.capacidade.trim();
    if (!same) mismatchConteudo++;
  }
  console.log(`  Total Resposta: ${respostasComQuestao.length}`);
  console.log(`  processo ≠ questao.processo: ${mismatchProcesso}`);
  console.log(
    `  estrutura/principio/capacidade ≠ questão: ${mismatchConteudo}`,
  );

  const invalidResposta = respostasComQuestao.filter(
    (r) => !VALID_RESPOSTAS.has(r.resposta),
  );
  console.log(`  resposta fora dos tipos válidos: ${invalidResposta.length}`);
  if (invalidResposta.length > 0) {
    const tipos = [...new Set(invalidResposta.map((r) => r.resposta))];
    console.log(`    valores: ${tipos.join(", ")}`);
  }

  console.log("\n=== RESPOSTA FINAL: VÍNCULO COM QUESTÃO ===\n");

  const finais = await prisma.respostaFinal.findMany();
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

  let rfComUuid = 0;
  let rfResolvivel = 0;
  let rfIrresolvivel = 0;
  const rfFails: string[] = [];

  for (const rf of finais) {
    if (rf.questaoId) rfComUuid++;
    const resolved = resolveQuestaoUuid(lookup, {
      codigo: rf.codigo,
      estrutura: rf.estrutura,
      principio: rf.principio,
      capacidade: rf.capacidade,
      processo: rf.processo,
      questaoId: rf.questaoId,
    });
    if (resolved) rfResolvivel++;
    else {
      rfIrresolvivel++;
      rfFails.push(`${rf.empresaId}|${rf.processo}|${rf.codigo}`);
    }
  }

  console.log(`  Total RespostaFinal: ${finais.length}`);
  console.log(`  com questaoId preenchido: ${rfComUuid}`);
  console.log(`  resolvível (lookup): ${rfResolvivel}`);
  console.log(`  irresolvível: ${rfIrresolvivel}`);
  if (rfFails.length) {
    console.log("  exemplos irresolvíveis:");
    rfFails.slice(0, 8).forEach((f) => console.log(`    - ${f}`));
  }

  console.log("\n=== RESPOSTA vs RESPOSTA FINAL (por empresa) ===\n");

  const empresasComRf = [...new Set(finais.map((f) => f.empresaId))];
  for (const empId of empresasComRf.sort((a, b) => a - b)) {
    const rCount = await prisma.resposta.count({ where: { empresaId: empId } });
    const rfCount = finais.filter((f) => f.empresaId === empId).length;
    const emp = empresas.find((e) => e.id === empId);
    const flag =
      rCount === 0
        ? "⚠ sem Resposta"
        : rCount < rfResolvivel && empId === 1
          ? "~ parcial"
          : "ok";
    console.log(
      `  empresa ${empId} (${emp?.usuario ?? "?"}): Resposta=${rCount} RF=${rfCount} ${flag}`,
    );
  }

  console.log("\n=== QUESTÕES: DUPLICATAS / CÓDIGOS ===\n");

  const codigosDup = await prisma.$queryRaw<
    { codigo: string; processo: string; c: bigint }[]
  >`
    SELECT codigo, processo, COUNT(*)::bigint c
    FROM "Questao"
    GROUP BY codigo, processo
    HAVING COUNT(*) > 1
  `;
  console.log(`  pares codigo+processo duplicados: ${codigosDup.length}`);

  const codigosDistintos = await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(DISTINCT codigo)::bigint c FROM "Questao"
  `;
  console.log(
    `  questões totais: ${counts.Questao}, códigos distintos: ${codigosDistintos[0]?.c ?? 0}`,
  );

  const processosQuestao = await prisma.$queryRaw<
    { processo: string; c: bigint }[]
  >`
    SELECT processo, COUNT(*)::bigint c FROM "Questao" GROUP BY processo ORDER BY c DESC
  `;
  console.log("  questões por processo:");
  processosQuestao.forEach((p) =>
    console.log(`    ${p.processo}: ${p.c}`),
  );

  console.log("\n=== OUTRAS TABELAS ===\n");

  const empresasSemSwot = empresas.filter((e) => e._count.swots === 0);
  console.log(
    `  Empresas sem SWOT: ${empresasSemSwot.length}/${empresas.length}`,
  );

  const empresasEnviadasSemRf = empresas.filter(
    (e) => e.enviado === "SIM" && e._count.respostasFinais === 0,
  );
  console.log(
    `  Enviado=SIM mas sem RespostaFinal: ${empresasEnviadasSemRf.length}`,
  );
  empresasEnviadasSemRf.forEach((e) =>
    console.log(`    id=${e.id} ${e.usuario}`),
  );

  const enviadoSimComResposta = empresas.filter(
    (e) => e.enviado === "SIM" && e._count.respostas === 0,
  );
  console.log(
    `  Enviado=SIM mas sem Resposta (rascunho): ${enviadoSimComResposta.length}`,
  );

  console.log(`  Segmento (Análise 3B): ${counts.Segmento} — ${counts.Segmento === 0 ? "⚠ VAZIA (não importada)" : "ok"}`);

  const filtrosProcesso = await prisma.filtro.findMany({
    where: { processo: { not: null } },
    select: { processo: true },
    distinct: ["processo"],
  });
  const processosFiltro = new Set(
    filtrosProcesso.map((f) => f.processo?.trim()).filter(Boolean),
  );
  const processosDb = new Set(processosQuestao.map((p) => p.processo.trim()));
  const noFiltro = [...processosDb].filter((p) => !processosFiltro.has(p));
  const noQuestao = [...processosFiltro].filter((p) => !processosDb.has(p!));
  console.log(`  Processos em Questao não em Filtro: ${noFiltro.length}`);
  if (noFiltro.length) console.log(`    ${noFiltro.join(", ")}`);
  console.log(`  Processos em Filtro não em Questao: ${noQuestao.length}`);
  if (noQuestao.length) console.log(`    ${noQuestao.join(", ")}`);

  console.log("\n=== RESUMO ===\n");
  const issues: string[] = [];
  if (Number(respostaOrfaQuestao[0]?.c) > 0)
    issues.push("Respostas com questaoId inválido");
  if (rfIrresolvivel > 0)
    issues.push(`${rfIrresolvivel} RespostaFinal sem match em Questao`);
  if (mismatchProcesso > 0)
    issues.push(`${mismatchProcesso} Resposta com processo divergente da questão`);
  if (counts.Segmento === 0)
    issues.push("Tabela Segmento vazia (Análise 3B indisponível)");
  if (invalidResposta.length > 0)
    issues.push("Respostas com tipo inválido");

  if (issues.length === 0) {
    console.log("  Nenhum problema crítico detectado.");
  } else {
    issues.forEach((i) => console.log(`  ⚠ ${i}`));
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
