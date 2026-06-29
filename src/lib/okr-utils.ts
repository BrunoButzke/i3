import {
  normalizeSwotKey,
  resolveSwotRef,
  type SwotItems,
  type SwotKey,
} from "@/lib/swot-utils";

export const KR_MAX_SWOT_REFS = 3;
export const KR_TEXT_MAX_LENGTH = 500;

export type SwotRef = {
  categoria: SwotKey;
  swotItemId: string;
  /** Texto persistido para exibição no relatório quando ids mudam. */
  texto?: string;
};

export type KeyResult = {
  id: string;
  texto: string;
  swotRefs: SwotRef[];
};

export type OkrData = {
  id?: number;
  objetivo: string;
  keyResults: KeyResult[];
};

export function createKeyResult(texto = ""): KeyResult {
  return {
    id: crypto.randomUUID(),
    texto,
    swotRefs: [],
  };
}

function normalizeSwotRef(raw: unknown): SwotRef | null {
  if (!raw || typeof raw !== "object") return null;
  const ref = raw as Record<string, unknown>;
  const categoriaRaw = ref.categoria;
  const swotItemId = ref.swotItemId ?? ref.swot_item_id;
  if (typeof categoriaRaw !== "string" || typeof swotItemId !== "string") {
    return null;
  }
  const categoria = normalizeSwotKey(categoriaRaw);
  if (!categoria || !swotItemId.trim()) return null;

  const texto =
    typeof ref.texto === "string" && ref.texto.trim()
      ? ref.texto.trim().slice(0, 500)
      : undefined;

  return {
    categoria,
    swotItemId: swotItemId.trim(),
    ...(texto ? { texto } : {}),
  };
}

function normalizeKeyResult(raw: unknown): KeyResult | null {
  if (!raw || typeof raw !== "object") return null;
  const kr = raw as Record<string, unknown>;
  const texto = String(kr.texto ?? "").trim().slice(0, KR_TEXT_MAX_LENGTH);
  const id =
    typeof kr.id === "string" && kr.id.trim()
      ? kr.id.trim()
      : crypto.randomUUID();
  const swotRefsRaw = kr.swotRefs ?? kr.swot_refs;
  const swotRefs = Array.isArray(swotRefsRaw)
    ? swotRefsRaw
        .map(normalizeSwotRef)
        .filter((ref): ref is SwotRef => ref !== null)
        .slice(0, KR_MAX_SWOT_REFS)
    : [];

  if (!texto && swotRefs.length === 0) return null;
  return { id, texto, swotRefs };
}

type LegacyOkrRow = {
  okr1?: string | null;
  okr2?: string | null;
  okr3?: string | null;
};

export function parseKeyResults(
  raw: unknown,
  legacy?: LegacyOkrRow,
): KeyResult[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .map(normalizeKeyResult)
      .filter((kr): kr is KeyResult => kr !== null);
  }

  if (!legacy) return [];

  return [legacy.okr1, legacy.okr2, legacy.okr3]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .map((texto) => createKeyResult(texto));
}

export function sanitizeKeyResults(raw: unknown): KeyResult[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeKeyResult)
    .filter((kr): kr is KeyResult => kr !== null);
}

export function emptyOkr(): OkrData {
  return { objetivo: "", keyResults: [] };
}

export function formatKrLabel(
  kr: KeyResult,
  index: number,
  maxLen = 60,
): string {
  const preview =
    kr.texto.length > maxLen ? `${kr.texto.slice(0, maxLen)}…` : kr.texto;
  return `KR ${index + 1}: ${preview || "(sem descrição)"}`;
}

export function collectKeyResultsFromOkrs(
  okrs: OkrData[],
): { okrIndex: number; krIndex: number; kr: KeyResult; label: string }[] {
  return okrs.flatMap((okr, okrIndex) =>
    okr.keyResults.map((kr, krIndex) => {
      const objetivoPreview =
        okr.objetivo.length > 35
          ? `${okr.objetivo.slice(0, 35)}…`
          : okr.objetivo;
      const krPreview = formatKrLabel(kr, krIndex, 45);
      const label = objetivoPreview
        ? `OKR ${okrIndex + 1} (${objetivoPreview}) — ${krPreview}`
        : `OKR ${okrIndex + 1} — ${krPreview}`;
      return { okrIndex, krIndex, kr, label };
    }),
  );
}

export function findKeyResultInOkrs(
  okrs: OkrData[],
  keyResultId: string,
): KeyResult | undefined {
  for (const okr of okrs) {
    const kr = okr.keyResults.find((item) => item.id === keyResultId);
    if (kr) return kr;
  }
  return undefined;
}

/** Garante texto persistido nas refs SWOT para exibição estável no relatório. */
export function enrichSwotRefs(
  refs: SwotRef[],
  swot: SwotItems | null,
): SwotRef[] {
  return refs.map((ref) => {
    const item = resolveSwotRef(swot, ref);
    if (!item) return ref;
    return {
      categoria: ref.categoria,
      swotItemId: ref.swotItemId,
      texto: item.texto,
    };
  });
}
