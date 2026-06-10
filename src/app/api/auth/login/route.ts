import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const usuario = String(body.usuario ?? "").trim();
  const senha = String(body.senha ?? "");

  if (!usuario || !senha) {
    return jsonError("Informe usuário e senha.");
  }

  const empresa = await prisma.empresa.findFirst({ where: { usuario } });
  if (!empresa) {
    return jsonError("Verifique os dados de acesso e tente novamente...");
  }

  const valid = await verifyPassword(senha, empresa.senhaHash);
  if (!valid) {
    return jsonError("Verifique os dados de acesso e tente novamente...");
  }

  if (!empresa.enviado?.trim()) {
    await prisma.empresa.update({
      where: { id: empresa.id },
      data: { enviado: "NÃO" },
    });
  }

  const token = await createSessionToken({
    empresaId: empresa.id,
    usuario: empresa.usuario,
    nome: empresa.nome,
  });
  await setSessionCookie(token);

  return jsonOk({
    id: empresa.id,
    empresa: empresa.nome,
    cnpj: empresa.cnpj,
    representante: empresa.representante,
    usuario: empresa.usuario,
    enviado: empresa.enviado ?? "NÃO",
  });
}
