/**
 * Parser compartilhado da aba "Macro Dimensões" do Excel.
 */
export type MacroDimensaoRow = {
  macroIndice: number;
  nivel: number;
  titulo: string | null;
  texto: string;
};

type Row = (string | number | boolean | Date | null | undefined)[];

function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

export function parseMacroDimensoesRows(rows: Row[]): MacroDimensaoRow[] {
  const data: MacroDimensaoRow[] = [];
  let macroIndice = 0;

  for (const row of rows) {
    const col0 = str(row[0]);
    if (!col0) continue;

    const macroMatch = col0.match(/^Macro-Dimensão\s+(\d+)/i);
    if (macroMatch) {
      macroIndice = Number(macroMatch[1]);
      continue;
    }

    if (col0.toLowerCase() === "nível" || col0.toLowerCase() === "nivel") {
      continue;
    }

    const nivel = num(row[0]);
    const titulo = str(row[1]) || null;
    const texto = str(row[2]);
    if (nivel == null || !texto || macroIndice < 1) continue;

    data.push({
      macroIndice,
      nivel: Math.trunc(nivel),
      titulo,
      texto,
    });
  }

  return data;
}
