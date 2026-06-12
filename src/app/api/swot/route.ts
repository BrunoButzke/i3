import { isSession, jsonError, jsonOk, requireSession } from "@/lib/api-utils";
import { getSWOT, saveSWOT } from "@/lib/services/i3-service";
import {
  hasAnySwotItem,
  SWOT_KEYS,
  type SwotItems,
} from "@/lib/swot-utils";

function normalizeBody(body: unknown): SwotItems | null {
  if (!body || typeof body !== "object") return null;

  const items = {} as SwotItems;
  for (const key of SWOT_KEYS) {
    const value = (body as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      items[key] = value.map((item) => String(item).trim()).filter(Boolean);
    } else if (typeof value === "string" && value.trim()) {
      items[key] = [value.trim()];
    } else {
      items[key] = [];
    }
  }
  return items;
}

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const data = await getSWOT(session.empresaId);
  return jsonOk(data);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const body = await request.json();
  const items = normalizeBody(body);

  if (!items || !hasAnySwotItem(items)) {
    return jsonError("Adicione ao menos um item antes de salvar.");
  }

  await saveSWOT(session.empresaId, items);
  return jsonOk({ message: "Matriz SWOT salva com sucesso." });
}
