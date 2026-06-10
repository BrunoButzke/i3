import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getAnswersTypes, getProcessTypes } from "@/lib/services/i3-service";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError("Não autenticado", 401);

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.empresaId },
  });
  if (!empresa) return jsonError("Empresa não encontrada", 404);

  const [processos, respostas] = await Promise.all([
    getProcessTypes(),
    getAnswersTypes(),
  ]);

  return jsonOk({
    id: empresa.id,
    empresa: empresa.nome,
    cnpj: empresa.cnpj,
    representante: empresa.representante,
    usuario: empresa.usuario,
    enviado: empresa.enviado ?? "NÃO",
    processos,
    respostas,
  });
}
