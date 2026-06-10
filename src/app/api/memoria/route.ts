import { isSession, jsonOk, requireSession } from "@/lib/api-utils";
import { getMemorias, salvarMemoria } from "@/lib/services/i3-service";

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const memorias = await getMemorias(session.empresaId);
  return jsonOk(memorias);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const body = await request.json();
  await salvarMemoria(session.empresaId, body);
  return jsonOk({ ok: true });
}
