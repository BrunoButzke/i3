import { isSession, jsonError, jsonOk, requireSession } from "@/lib/api-utils";
import { getSWOT, saveSWOT } from "@/lib/services/i3-service";

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const data = await getSWOT(session.empresaId);
  return jsonOk(data);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const body = await request.json();
  const { forca, fraqueza, oportunidade, ameaca } = body;

  if (!forca && !fraqueza && !oportunidade && !ameaca) {
    return jsonError("Preencha ao menos um campo antes de salvar.");
  }

  await saveSWOT(session.empresaId, {
    forca: forca ?? "",
    fraqueza: fraqueza ?? "",
    oportunidade: oportunidade ?? "",
    ameaca: ameaca ?? "",
  });

  return jsonOk({ message: "Matriz SWOT salva com sucesso." });
}
