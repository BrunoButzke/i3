import {
  apiErrorMessage,
  isSession,
  jsonError,
  jsonOk,
  requireSession,
} from "@/lib/api-utils";
import { getMetas, removeMeta, saveMeta } from "@/lib/services/i3-service";

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  try {
    const metas = await getMetas(session.empresaId);
    return jsonOk(metas);
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
      await removeMeta(session.empresaId, body.objetivo);
      return jsonOk({ ok: true });
    }

    await saveMeta(session.empresaId, body);
    return jsonOk({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonError(apiErrorMessage(err), 500);
  }
}
