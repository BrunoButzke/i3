import { isSession, jsonError, jsonOk, requireSession } from "@/lib/api-utils";
import { getAnswers, saveAnswers, sendAnswers } from "@/lib/services/i3-service";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const { searchParams } = new URL(request.url);
  const processo = searchParams.get("processo");
  if (!processo) return jsonError("Parâmetro processo é obrigatório");

  const data = await getAnswers(session.empresaId, processo);
  return jsonOk(data);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const body = await request.json();
  const action = body.action as string;
  const rows = body.data as [
    number,
    string,
    string,
    string,
    string,
    string,
    string,
  ][];

  if (!Array.isArray(rows) || rows.length === 0) {
    return jsonError("Não há dados a serem salvos...");
  }

  if (action === "send") {
    await sendAnswers(rows);
    return jsonOk({ message: "Respostas enviadas com sucesso..." });
  }

  await saveAnswers(rows);
  return jsonOk({ message: "Respostas salvas com sucesso..." });
}
