import { isSession, jsonError, jsonOk, requireSession } from "@/lib/api-utils";
import { enviarRelatorioPorEmail } from "@/lib/relatorio/relatorio-email";
import { getRelatorioCompleto } from "@/lib/relatorio-service";

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const relatorio = await getRelatorioCompleto(session.empresaId);
  return jsonOk(relatorio);
}

export async function POST() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const relatorio = await getRelatorioCompleto(session.empresaId);

  if (!relatorio.email?.trim()) {
    return jsonError(
      "E-mail da empresa não cadastrado. Atualize o cadastro ou use Imprimir para exportar o relatório.",
    );
  }

  const resultado = await enviarRelatorioPorEmail({
    to: relatorio.email.trim(),
    empresa: relatorio.empresa,
    representante: relatorio.representante,
    dataAvaliacao: relatorio.dataAvaliacao,
  });

  return jsonOk({ message: resultado.message, enviado: resultado.ok });
}
