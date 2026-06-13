import { isSession, jsonError, jsonOk, requireSession } from "@/lib/api-utils";
import { emptyOkr, sanitizeKeyResults } from "@/lib/okr-utils";
import { getOKRs, removeOKR, saveOKR } from "@/lib/services/i3-service";

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const okrs = await getOKRs(session.empresaId);
  return jsonOk(okrs.length > 0 ? okrs : [emptyOkr()]);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const body = await request.json();

  if (body.action === "delete") {
    const id = Number(body.id);
    if (!id) return jsonError("ID do OKR é obrigatório para excluir.");
    await removeOKR(session.empresaId, id);
    return jsonOk({ message: "OKR removido com sucesso." });
  }

  const objetivo = String(body.objetivo ?? "").trim();
  const keyResults = sanitizeKeyResults(body.keyResults);
  const id = body.id ? Number(body.id) : undefined;

  if (!objetivo && keyResults.length === 0) {
    return jsonError("Informe o objetivo ou adicione ao menos um KR.");
  }

  for (const kr of keyResults) {
    if (!kr.texto.trim()) {
      return jsonError("Todos os KRs precisam ter uma descrição.");
    }
    if (kr.swotRefs.length > 3) {
      return jsonError("Cada KR pode ter no máximo 3 itens da SWOT.");
    }
  }

  await saveOKR(session.empresaId, { id, objetivo, keyResults });
  return jsonOk({ message: "OKR salvo com sucesso." });
}
