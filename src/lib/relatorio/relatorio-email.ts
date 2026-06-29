import nodemailer from "nodemailer";

export function smtpConfigurado(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_FROM?.trim());
}

export async function enviarRelatorioPorEmail(params: {
  to: string;
  empresa: string;
  representante?: string | null;
  dataAvaliacao: string;
}): Promise<{ ok: boolean; message: string }> {
  if (!smtpConfigurado()) {
    return {
      ok: false,
      message:
        "Envio por e-mail indisponível: configure SMTP_HOST, SMTP_FROM e credenciais (SMTP_USER/SMTP_PASS) no ambiente do servidor. Use Imprimir para exportar o relatório em PDF.",
    };
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });

  const representante = params.representante?.trim();
  const texto = [
    "Prezado(a),",
    "",
    `O relatório de Análise de Maturidade Digital da empresa ${params.empresa} está disponível no portal i3.`,
    "",
    `Data da avaliação: ${params.dataAvaliacao}`,
    representante ? `Representante: ${representante}` : "",
    "",
    "Acesse o portal para visualizar, imprimir ou salvar o documento completo (Imprimir → Salvar como PDF).",
    "",
    "Instituto SENAI de Tecnologia em Excelência Operacional — FIESC",
  ]
    .filter(Boolean)
    .join("\n");

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: params.to,
    subject: `Relatório de Maturidade — ${params.empresa}`,
    text: texto,
  });

  return {
    ok: true,
    message: `Notificação enviada para ${params.to}. Acesse o portal para visualizar o relatório completo.`,
  };
}
