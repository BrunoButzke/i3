import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const senhaHash = await bcrypt.hash("admin", 10);

  if ((await prisma.empresa.count()) === 0) {
    await prisma.empresa.create({
      data: {
        id: 1,
        nome: "Empresa Admin (Teste)",
        cnpj: "00.000.000/0001-00",
        representante: "Administrador",
        usuario: "admin",
        senhaHash,
        email: "admin@teste.local",
        enviado: "NÃO",
      },
    });
    console.log("Seed OK — login: admin / admin");
  } else {
    console.log("Seed OK — empresas já existem, mantendo dados importados.");
  }

  const PROCESSOS = [
    "Processo Produtivo",
    "Venda Planejamento Compras",
    "Gestão da Qualidade",
    "Logística",
    "Manutenção",
    "Processo da Engenharia",
    "Estratégia e Governança Digital",
    "Processos e Operações Inteligentes",
    "Tecnologia e Infraestrutura Digital",
    "Pessoas e Competências Digitais",
  ];

  if ((await prisma.filtro.count()) === 0) {
    await prisma.filtro.createMany({
      data: PROCESSOS.map((processo) => ({ processo })),
    });
  }

  if ((await prisma.questao.count()) === 0) {
    const alternativas = {
      Informatização: "Nível inicial de informatização (demo).",
      Conectividade: "Nível inicial de conectividade (demo).",
      Visibilidade: "Nível inicial de visibilidade (demo).",
      Transparência: "Nível inicial de transparência (demo).",
      Previsibilidade: "Nível inicial de previsibilidade (demo).",
      Adaptabilidade: "Nível inicial de adaptabilidade (demo).",
      Irrelevante: "Esta questão é irrelevante",
    };

    await prisma.questao.createMany({
      data: [
        {
          codigo: "Q-DEMO-001",
          estrutura: "Recursos",
          principio: "Capacidade Digital",
          capacidade: "Dados Ajustáveis",
          processo: "Processo Produtivo",
          enunciado:
            "Como os dados de configuração podem ser transferidos para a máquina? (questão demo)",
          alternativas,
        },
        {
          codigo: "Q-DEMO-002",
          estrutura: "Cultura",
          principio: "Colaboração Social",
          capacidade: "Utilização de Sistemas Informáticos",
          processo: "Processo Produtivo",
          enunciado:
            "Em que medida existe vontade de utilizar sistematicamente os sistemas informáticos? (questão demo)",
          alternativas,
        },
      ],
    });
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
