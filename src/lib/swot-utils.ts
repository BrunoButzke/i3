export const SWOT_KEYS = [
  "forca",
  "fraqueza",
  "oportunidade",
  "ameaca",
] as const;

export type SwotKey = (typeof SWOT_KEYS)[number];

export type SwotItems = Record<SwotKey, string[]>;

export const SWOT_ITEM_MAX_LENGTH = 200;

/** Converte texto legado (livre) ou JSON em lista de itens. */
export function parseSwotItems(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];

  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean);
      }
    } catch {
      /* texto legado abaixo */
    }
  }

  if (trimmed.includes("\n")) {
    return trimmed
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [trimmed];
}

export function serializeSwotItems(items: string[]): string {
  const clean = items
    .map((item) => item.trim().slice(0, SWOT_ITEM_MAX_LENGTH))
    .filter(Boolean);
  return JSON.stringify(clean);
}

export function parseSwotRecord(row: {
  forca: string | null;
  fraqueza: string | null;
  oportunidade: string | null;
  ameaca: string | null;
}): SwotItems {
  return {
    forca: parseSwotItems(row.forca),
    fraqueza: parseSwotItems(row.fraqueza),
    oportunidade: parseSwotItems(row.oportunidade),
    ameaca: parseSwotItems(row.ameaca),
  };
}

export function serializeSwotRecord(items: SwotItems): {
  forca: string;
  fraqueza: string;
  oportunidade: string;
  ameaca: string;
} {
  return {
    forca: serializeSwotItems(items.forca),
    fraqueza: serializeSwotItems(items.fraqueza),
    oportunidade: serializeSwotItems(items.oportunidade),
    ameaca: serializeSwotItems(items.ameaca),
  };
}

export function formatSwotItemsForDisplay(raw: string | null | undefined): string {
  const items = parseSwotItems(raw);
  if (items.length === 0) return "";
  return items.map((item) => `• ${item}`).join("\n");
}

export function hasAnySwotItem(items: SwotItems): boolean {
  return SWOT_KEYS.some((key) => items[key].length > 0);
}
