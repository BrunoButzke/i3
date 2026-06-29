"use client";

import { RELATORIO_SUMARIO } from "@/lib/relatorio/relatorio-sumario";

type Props = {
  teorDisponivel: boolean;
  onNavigate?: () => void;
};

export function RelatorioSumarioNav({ teorDisponivel, onNavigate }: Props) {
  const itens = RELATORIO_SUMARIO.filter(
    (item) => item.id !== "cap-4" || teorDisponivel,
  );

  function irPara(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      onNavigate?.();
    }
  }

  return (
    <nav className="i3-relatorio-sumario-nav" aria-label="Sumário do relatório">
      <h2 className="i3-relatorio-sumario-titulo">Sumário</h2>
      <ol className="i3-relatorio-sumario-lista">
        {itens.map((item) => (
          <li key={item.id}>
            <button type="button" onClick={() => irPara(item.id)}>
              {item.titulo}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
