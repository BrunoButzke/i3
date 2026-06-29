import type { LinhaMatrizCapacidade } from "@/lib/relatorio/relatorio-types";
import { ORDEM_RESPOSTAS, RESPOSTA_PESOS } from "@/lib/scoring";
import { getRespostasEfetivas } from "@/lib/services/i3-service";

const PROCESSOS_IGNORAR = [
  "Estratégia e Governança Digital",
  "Processos e Operações Inteligentes",
  "Tecnologia e Infraestrutura Digital",
  "Pessoas e Competências Digitais",
];

export async function calcularMatrizCapacidades(
  empresaId: number,
): Promise<LinhaMatrizCapacidade[]> {
  const respostas = await getRespostasEfetivas(empresaId);
  const agrupado: Record<string, Record<string, number>> = {};

  for (const r of respostas) {
    if (!r.capacidade?.trim()) continue;
    if (!r.processo || PROCESSOS_IGNORAR.includes(r.processo)) continue;
    if (!r.resposta || r.resposta === "Irrelevante") continue;

    const cap = r.capacidade.trim();
    if (!agrupado[cap]) agrupado[cap] = {};
    agrupado[cap][r.resposta] =
      (agrupado[cap][r.resposta] ?? 0) + (r.resultado ?? 0);
  }

  return Object.entries(agrupado)
    .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
    .map(([capacidade, respostasMap]) => {
      const somaTotal = Object.values(respostasMap).reduce((a, b) => a + b, 0);
      const percentuais = ORDEM_RESPOSTAS.map((resposta) => {
        const total = respostasMap[resposta] ?? 0;
        const peso = RESPOSTA_PESOS[resposta] ?? 0;
        const percentual =
          somaTotal > 0
            ? ((total * peso) / (somaTotal * 6) * 100).toFixed(2)
            : "0.00";
        return { resposta, percentual };
      });
      return { capacidade, percentuais };
    });
}
