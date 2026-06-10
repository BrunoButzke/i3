import { isSession, jsonOk, requireSession } from "@/lib/api-utils";
import { getOKRs, removeOKR, saveOKR } from "@/lib/services/i3-service";

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const okrs = await getOKRs(session.empresaId);
  return jsonOk(okrs);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const body = await request.json();
  if (body.action === "delete") {
    await removeOKR(
      session.empresaId,
      body.objetivo,
      body.okr1 ?? "",
      body.okr2 ?? "",
      body.okr3 ?? "",
    );
    return jsonOk({ ok: true });
  }

  await saveOKR(
    session.empresaId,
    body.objetivo,
    body.okr1 ?? "",
    body.okr2 ?? "",
    body.okr3 ?? "",
  );
  return jsonOk({ ok: true });
}
