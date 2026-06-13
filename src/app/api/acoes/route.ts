import {
  apiErrorMessage,
  isSession,
  jsonError,
  jsonOk,
  requireSession,
} from "@/lib/api-utils";
import {
  getAcoes,
  removerAcaoPorId,
  salvarAcoes,
} from "@/lib/services/i3-service";

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  try {
    const acoes = await getAcoes(session.empresaId);
    return jsonOk(acoes);
  } catch (err) {
    console.error(err);
    return jsonError(apiErrorMessage(err), 500);
  }
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  try {
    const body = await request.json();
    if (body.action === "delete") {
      await removerAcaoPorId(session.empresaId, Number(body.id));
      return jsonOk({ ok: true });
    }

    const result = await salvarAcoes(body.acoes ?? []);
    return jsonOk(result);
  } catch (err) {
    console.error(err);
    return jsonError(apiErrorMessage(err), 500);
  }
}
