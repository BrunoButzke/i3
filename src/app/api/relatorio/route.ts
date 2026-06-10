import { isSession, jsonOk, requireSession } from "@/lib/api-utils";
import { getRelatorioCompleto } from "@/lib/relatorio-service";

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const relatorio = await getRelatorioCompleto(session.empresaId);
  return jsonOk(relatorio);
}

export async function POST() {
  return jsonOk({
    message:
      "Envio de e-mail será configurado na próxima etapa (SMTP). Use Imprimir para exportar o relatório.",
  });
}
