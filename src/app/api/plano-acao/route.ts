import { isSession, jsonOk, requireSession } from "@/lib/api-utils";
import {
  getPlanoDeAcao,
  salvarPlanoIndividual,
} from "@/lib/services/i3-service";

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const plano = await getPlanoDeAcao(session.empresaId);
  return jsonOk(plano);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const body = await request.json();
  await salvarPlanoIndividual(session.empresaId, body);
  return jsonOk({ ok: true });
}
