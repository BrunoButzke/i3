/**
 * Reimporta apenas a tabela MacroDimensao a partir do Excel.
 * Uso: npm run reimport:macro  (ou via docker exec)
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as XLSX from "xlsx";
import { PrismaClient } from "../src/generated/prisma/client";
import { parseMacroDimensoesRows } from "../src/lib/relatorio/parse-macro-dimensoes";

const dataRoot =
  process.env.APPSCRIPT_DATA_PATH ??
  path.resolve(__dirname, "..", "..", "appScript");

const XLSX_PATH = path.join(
  dataRoot,
  "Dados",
  "App i3 - Projeto Condor.xlsx",
);

type Row = (string | number | boolean | Date | null | undefined)[];

async function main() {
  if (!fs.existsSync(XLSX_PATH)) {
    throw new Error(`Arquivo não encontrado: ${XLSX_PATH}`);
  }

  const workbook = XLSX.readFile(XLSX_PATH, { cellDates: true });
  const sheet = workbook.Sheets["Macro Dimensões"];
  if (!sheet) throw new Error('Aba "Macro Dimensões" não encontrada');

  const rows = XLSX.utils.sheet_to_json<Row>(sheet, {
    header: 1,
    defval: null,
    raw: false,
  });

  const data = parseMacroDimensoesRows(rows);
  if (data.length === 0) throw new Error("Nenhuma linha válida encontrada");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    await prisma.macroDimensao.deleteMany();
    await prisma.macroDimensao.createMany({ data });
    console.log(`MacroDimensao: ${data.length} registros importados.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
