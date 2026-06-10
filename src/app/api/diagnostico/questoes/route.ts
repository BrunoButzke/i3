import { isSession, jsonError, jsonOk, requireSession } from "@/lib/api-utils";
import { getQuestions } from "@/lib/services/i3-service";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const { searchParams } = new URL(request.url);
  const processo = searchParams.get("processo");
  if (!processo) return jsonError("Parâmetro processo é obrigatório");

  const data = await getQuestions(processo);
  return jsonOk(data);
}
