import { isSession, jsonOk, requireSession } from "@/lib/api-utils";
import {
  getPlanosDeAcao,
  salvarStatusPlanos,
} from "@/lib/services/i3-service";

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const planos = await getPlanosDeAcao(session.empresaId);
  return jsonOk(planos);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const body = await request.json();
  const result = await salvarStatusPlanos(body.updates ?? []);
  return jsonOk(result);
}
