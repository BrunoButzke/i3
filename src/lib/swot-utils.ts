export const SWOT_KEYS = [
  "forca",
  "fraqueza",
  "oportunidade",
  "ameaca",
] as const;

export type SwotKey = (typeof SWOT_KEYS)[number];

export type SwotItem = {
  id: string;
  texto: string;
};

export type SwotItems = Record<SwotKey, SwotItem[]>;

export const SWOT_ITEM_MAX_LENGTH = 200;

export const SWOT_LABELS: Record<SwotKey, string> = {
  forca: "Força",
  fraqueza: "Fraqueza",
  oportunidade: "Oportunidade",
  ameaca: "Ameaça",
};

export function createSwotItem(texto: string, id?: string): SwotItem {
  return {
    id: id?.trim() || crypto.randomUUID(),
    texto: texto.trim().slice(0, SWOT_ITEM_MAX_LENGTH),
  };
}

function normalizeSwotItem(raw: unknown): SwotItem | null {
  if (typeof raw === "string") {
    const texto = raw.trim();
    return texto ? createSwotItem(texto) : null;
  }

  if (!raw || typeof raw !== "object") return null;

  const item = raw as Record<string, unknown>;
  const texto = String(item.texto ?? item.text ?? "").trim();
  if (!texto) return null;

  const id = typeof item.id === "string" ? item.id : undefined;
  return createSwotItem(texto, id);
}

/** Converte texto legado (livre), JSON de strings ou JSON de objetos em lista de itens. */
export function parseSwotItems(raw: string | null | undefined): SwotItem[] {
  if (!raw?.trim()) return [];

  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .map(normalizeSwotItem)
          .filter((item): item is SwotItem => item !== null);
      }
    } catch {
      /* texto legado abaixo */
    }
  }

  if (trimmed.includes("\n")) {
    return trimmed
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((texto) => createSwotItem(texto));
  }

  return [createSwotItem(trimmed)];
}

export function serializeSwotItems(items: SwotItem[]): string {
  const clean = items
    .map((item) => ({
      id: item.id,
      texto: item.texto.trim().slice(0, SWOT_ITEM_MAX_LENGTH),
    }))
    .filter((item) => item.texto);
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
  return items.map((item) => `• ${item.texto}`).join("\n");
}

export function hasAnySwotItem(items: SwotItems): boolean {
  return SWOT_KEYS.some((key) => items[key].length > 0);
}

export function findSwotItem(
  items: SwotItems,
  categoria: SwotKey,
  swotItemId: string,
): SwotItem | undefined {
  return items[categoria]?.find((item) => item.id === swotItemId);
}

export function listAllSwotItems(
  items: SwotItems,
): { categoria: SwotKey; item: SwotItem }[] {
  return SWOT_KEYS.flatMap((categoria) =>
    items[categoria].map((item) => ({ categoria, item })),
  );
}

export function normalizeSwotItemsBody(body: unknown): SwotItems | null {
  if (!body || typeof body !== "object") return null;

  const record = body as Record<string, unknown>;
  const normalized = {} as SwotItems;

  for (const key of SWOT_KEYS) {
    const value = record[key];
    if (Array.isArray(value)) {
      normalized[key] = value
        .map(normalizeSwotItem)
        .filter((item): item is SwotItem => item !== null);
    } else if (typeof value === "string" && value.trim()) {
      normalized[key] = [createSwotItem(value)];
    } else {
      normalized[key] = [];
    }
  }

  return normalized;
}
