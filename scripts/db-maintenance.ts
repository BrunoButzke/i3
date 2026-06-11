import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import path from "node:path";
import fs from "node:fs";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  buildSegmentosFromRespostasFinais,
  importSegmentosFromXlsx,
  removeJunkRows,
} from "../src/lib/segmentos-import";
import { syncRespostasFromFinais } from "../src/lib/services/i3-service";

const dataRoot =
  process.env.APPSCRIPT_DATA_PATH ??
  path.resolve(__dirname, "..", "..", "appScript");

const SEGMENTOS_XLSX =
  process.env.SEGMENTOS_XLSX_PATH ??
  path.join(dataRoot, "Dados", "Segmentos.xlsx");

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    console.log(">> Manutenção do banco\n");

    const junk = await removeJunkRows(prisma);
    console.log(
      `  ✓ Linhas-lixo removidas: Questao=${junk.questoes}, Filtro=${junk.filtros}`,
    );

    const empresasComFinais = await prisma.respostaFinal.findMany({
      select: { empresaId: true },
      distinct: ["empresaId"],
    });
    for (const { empresaId } of empresasComFinais) {
      await prisma.resposta.deleteMany({ where: { empresaId } });
    }
    console.log(
      `  ✓ Resposta limpa para ${empresasComFinais.length} empresas (re-sync a partir de Finais)`,
    );

    const sync = await syncRespostasFromFinais();
    console.log(`  ✓ Respostas sincronizadas (RespostaFinal → Resposta): ${sync.synced}`);

    let segmentos = 0;
    if (fs.existsSync(SEGMENTOS_XLSX)) {
      const imp = await importSegmentosFromXlsx(prisma, SEGMENTOS_XLSX);
      segmentos = imp.imported;
      console.log(`  ✓ Segmentos importados de ${SEGMENTOS_XLSX}: ${segmentos}`);
    } else {
      const built = await buildSegmentosFromRespostasFinais(prisma);
      segmentos = built.built;
      console.log(
        `  ✓ Segmentos gerados a partir de RespostaFinal: ${segmentos}`,
      );
      console.log(
        `    (Para usar planilha externa, coloque Segmentos.xlsx em appScript/Dados/ ou defina SEGMENTOS_XLSX_PATH)`,
      );
    }

    const [resposta, respostaFinal, segmentoCount] = await Promise.all([
      prisma.resposta.count(),
      prisma.respostaFinal.count(),
      prisma.segmento.count(),
    ]);

    console.log("\n>> Resumo");
    console.log(`   Resposta: ${resposta}`);
    console.log(`   RespostaFinal: ${respostaFinal}`);
    console.log(`   Segmento: ${segmentoCount}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("ERRO:", err);
  process.exit(1);
});
