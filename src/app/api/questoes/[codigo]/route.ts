import { isSession, jsonError, jsonOk, requireSession } from "@/lib/api-utils";
import { getQuestionsByCodigo } from "@/lib/services/i3-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const { codigo } = await params;
  if (!codigo?.trim()) return jsonError("Código é obrigatório");

  const questoes = await getQuestionsByCodigo(decodeURIComponent(codigo));
  return jsonOk(questoes);
}
