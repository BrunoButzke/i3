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

const SWOT_KEY_ALIASES: Record<string, SwotKey> = {
  forca: "forca",
  força: "forca",
  fraqueza: "fraqueza",
  oportunidade: "oportunidade",
  ameaca: "ameaca",
  ameaça: "ameaca",
};

export function normalizeSwotKey(raw: string): SwotKey | null {
  const trimmed = raw.trim();
  const key =
    SWOT_KEY_ALIASES[trimmed] ??
    SWOT_KEY_ALIASES[trimmed.toLowerCase()] ??
    trimmed.toLowerCase();
  return SWOT_KEYS.includes(key as SwotKey) ? (key as SwotKey) : null;
}

export type SwotRefLike = {
  categoria: string;
  swotItemId: string;
  texto?: string;
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

function legacySwotItemId(categoria: SwotKey, index: number): string {
  return `${categoria}:${index}`;
}

/** Converte texto legado (livre), JSON de strings ou JSON de objetos em lista de itens. */
export function parseSwotItems(
  raw: string | null | undefined,
  categoria?: SwotKey,
): SwotItem[] {
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
      .map((texto, index) =>
        createSwotItem(
          texto,
          categoria ? legacySwotItemId(categoria, index) : undefined,
        ),
      );
  }

  return [
    createSwotItem(
      trimmed,
      categoria ? legacySwotItemId(categoria, 0) : undefined,
    ),
  ];
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
    forca: parseSwotItems(row.forca, "forca"),
    fraqueza: parseSwotItems(row.fraqueza, "fraqueza"),
    oportunidade: parseSwotItems(row.oportunidade, "oportunidade"),
    ameaca: parseSwotItems(row.ameaca, "ameaca"),
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
  return resolveSwotRef(items, { categoria, swotItemId }) ?? undefined;
}

/** Resolve referência SWOT por id, categoria normalizada ou texto persistido. */
export function resolveSwotRef(
  items: SwotItems | null,
  ref: SwotRefLike,
): SwotItem | null {
  const categoria = normalizeSwotKey(ref.categoria);
  const swotItemId = ref.swotItemId.trim();

  if (items && categoria) {
    const naCategoria = items[categoria]?.find((item) => item.id === swotItemId);
    if (naCategoria) return naCategoria;
  }

  if (items) {
    for (const key of SWOT_KEYS) {
      const encontrado = items[key]?.find((item) => item.id === swotItemId);
      if (encontrado) return encontrado;
    }
  }

  const textoPersistido = ref.texto?.trim();
  if (textoPersistido) {
    return { id: swotItemId, texto: textoPersistido };
  }

  return null;
}

function findSwotItemCategory(
  items: SwotItems,
  swotItemId: string,
): SwotKey | null {
  for (const key of SWOT_KEYS) {
    if (items[key]?.some((item) => item.id === swotItemId)) return key;
  }
  return null;
}

export function formatSwotRefLabels(
  items: SwotItems | null,
  refs: SwotRefLike[],
): string[] {
  return refs
    .map((ref) => {
      const item = resolveSwotRef(items, ref);
      if (!item) return null;
      const categoria =
        (items ? findSwotItemCategory(items, ref.swotItemId) : null) ??
        normalizeSwotKey(ref.categoria);
      const label = categoria ? SWOT_LABELS[categoria] : ref.categoria;
      return `${label}: ${item.texto}`;
    })
    .filter((label): label is string => Boolean(label));
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
