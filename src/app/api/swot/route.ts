import { isSession, jsonError, jsonOk, requireSession } from "@/lib/api-utils";
import { getSWOT, saveSWOT } from "@/lib/services/i3-service";
import { hasAnySwotItem, normalizeSwotItemsBody } from "@/lib/swot-utils";

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
  const items = normalizeSwotItemsBody(body);

  if (!items || !hasAnySwotItem(items)) {
    return jsonError("Adicione ao menos um item antes de salvar.");
  }

  await saveSWOT(session.empresaId, items);
  return jsonOk({ message: "Matriz SWOT salva com sucesso." });
}
