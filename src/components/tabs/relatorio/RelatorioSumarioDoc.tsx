"use client";

import { RELATORIO_SUMARIO } from "@/lib/relatorio/relatorio-sumario";

type Props = {
  teorDisponivel: boolean;
};

export function RelatorioSumarioDoc({ teorDisponivel }: Props) {
  const itens = RELATORIO_SUMARIO.filter(
    (item) => item.id !== "cap-4" || teorDisponivel,
  );

  return (
    <nav
      className="i3-relatorio-doc-sumario i3-relatorio-doc-sumario-print"
      aria-label="Sumário do relatório"
    >
      <h2 className="i3-relatorio-doc-subsecao mb-3">Sumário</h2>
      <ol className="i3-relatorio-doc-sumario-lista">
        {itens.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`}>{item.titulo}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
