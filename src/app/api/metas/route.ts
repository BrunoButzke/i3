import { isSession, jsonOk, requireSession } from "@/lib/api-utils";
import { getMetas, removeMeta, saveMeta } from "@/lib/services/i3-service";

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const metas = await getMetas(session.empresaId);
  return jsonOk(metas);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const body = await request.json();
  if (body.action === "delete") {
    await removeMeta(session.empresaId, body.objetivo);
    return jsonOk({ ok: true });
  }

  await saveMeta(session.empresaId, body);
  return jsonOk({ ok: true });
}
