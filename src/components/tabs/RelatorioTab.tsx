"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch, useApi } from "@/components/layout/AppShell";

const DESCRICOES_ESTRUTURA: Record<string, string> = {
  Recursos:
    "Analisamos os recursos disponíveis na empresa, incluindo tanto os recursos humanos, como habilidades e competências, quanto os recursos tecnológicos, como infraestrutura e tecnologias de informação. Buscamos identificar o potencial da empresa para adotar tecnologias avançadas e utilizar esses recursos para impulsionar a transformação digital.",
  Gestão:
    "Avaliamos como a empresa gerencia seus processos, pessoas e tecnologias para alcançar os objetivos de transformação digital.",
  Estratégia:
    "Analisamos o alinhamento estratégico e a governança digital da organização.",
};

type Relatorio = {
  empresa: string;
  email: string;
  percentuaisMaturidade: { resposta: string; percentual: string }[];
  mediasPorEstrutura: Record<string, { resposta: string; percentual: string }[]>;
  dimensoes: { processo: string; media: number }[];
  resumoCapacidade: {
    estrutura: string;
    principio: string;
    processo: string;
    capacidade: string;
    soma: number;
    textoResultado: string;
  }[];
  analise3B: {
    comparacoes: {
      indicador: string;
      valorEmpresa: number;
      media10Menores: number;
      media80Meio: number;
      media10Maiores: number;
    }[];
  } | null;
  roadmap: { titulo: string; texto: string }[];
  swot: {
    forca: string;
    fraqueza: string;
    oportunidade: string;
    ameaca: string;
  } | null;
  okrs: {
    objetivo: string;
    okr1: string;
    okr2: string;
    okr3: string;
  }[];
  metas: {
    objetivo: string;
    especifica: string;
    mensuravel: string;
    alcancavel: string;
    relevante: string;
    temporal: string;
  }[];
  planos: {
    oque: string;
    quem: string | null;
    quando: Date | null;
    onde: string | null;
    porque: string | null;
    como: string | null;
    quanto: string | null;
    status: string | null;
  }[];
};

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="i3-card">
      <h5 className="i3-section-header">{title}</h5>
      {children}
    </div>
  );
}

export function RelatorioTab() {
  const { showModal } = useApi();
  const [dados, setDados] = useState<Relatorio | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<Relatorio>("/api/relatorio")
      .then(setDados)
      .finally(() => setLoading(false));
  }, []);

  function imprimir() {
    if (!printRef.current || !dados) return;
    const janela = window.open("", "_blank");
    if (!janela) return;
    janela.document.write(`
      <html><head><title>Relatório - ${dados.empresa}</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>body{font-size:11px;padding:20px;} .card{margin-bottom:20px;}</style>
      </head><body>
      <h1 class="text-center">Índice da Indústria Inteligente</h1>
      <h2 class="text-center">${dados.empresa}</h2>
      ${printRef.current.innerHTML}
      </body></html>
    `);
    janela.document.close();
    janela.focus();
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="i3-loading-spinner mx-auto mb-3" role="status" />
        <p className="text-muted mb-0">Carregando relatório...</p>
      </div>
    );
  }

  if (!dados) {
    return <p className="text-muted mt-3">Não foi possível carregar o relatório.</p>;
  }

  const temMaturidade = dados.percentuaisMaturidade.some(
    (p) => parseFloat(p.percentual) > 0,
  );

  const gruposCapacidade: Record<string, typeof dados.resumoCapacidade> = {};
  dados.resumoCapacidade.forEach((item) => {
    const chave = `${item.estrutura} | ${item.principio} | ${item.processo}`;
    if (!gruposCapacidade[chave]) gruposCapacidade[chave] = [];
    gruposCapacidade[chave].push(item);
  });

  return (
    <div className="mt-3">
      <div className="i3-action-bar mt-0 mb-3 border-0 pt-0">
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={imprimir}
        >
          <i className="bi bi-printer me-1" /> Visualizar / Imprimir
        </button>
        {dados.email && (
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={async () => {
              const r = await apiFetch<{ message: string }>("/api/relatorio", {
                method: "POST",
              });
              showModal(r.message);
            }}
          >
            <i className="bi bi-envelope me-1" /> Enviar por E-mail
          </button>
        )}
      </div>

      <div ref={printRef}>
        <Card title="Resultado da Análise de Maturidade">
          {!temMaturidade ? (
            <p className="text-muted">
              Nenhum dado encontrado. Responda o diagnóstico primeiro.
            </p>
          ) : (
            <table className="table table-bordered text-center align-middle i3-table">
              <thead>
                <tr>
                  {dados.percentuaisMaturidade.map((p) => (
                    <th key={p.resposta} className="px-2">
                      {p.resposta}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {dados.percentuaisMaturidade.map((p) => (
                    <td key={p.resposta} className="px-2">
                      {p.percentual}%
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </Card>

        {dados.analise3B && (
          <Card title="Análise 3B (comparativo por indicador)">
            <table className="table table-bordered text-center align-middle i3-table">
              <thead className="i3-table-head-alt">
                <tr>
                  <th>Indicador</th>
                  <th>Sua empresa</th>
                  <th>10% menores</th>
                  <th>80% do meio</th>
                  <th>10% maiores</th>
                </tr>
              </thead>
              <tbody>
                {dados.analise3B.comparacoes.map((c) => (
                  <tr key={c.indicador}>
                    <th>{c.indicador}</th>
                    <td>{c.valorEmpresa.toFixed(2)}</td>
                    <td>{c.media10Menores.toFixed(2)}</td>
                    <td>{c.media80Meio.toFixed(2)}</td>
                    <td>{c.media10Maiores.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <Card title="Resultado por Estrutura">
          {Object.keys(dados.mediasPorEstrutura).length === 0 ? (
            <p className="text-muted">Nenhum dado encontrado.</p>
          ) : (
            Object.entries(dados.mediasPorEstrutura).map(([estrutura, items]) => (
              <div key={estrutura} className="mb-4 mt-4">
                <h6 className="text-start mt-4 mb-2 fw-bold">{estrutura}</h6>
                {DESCRICOES_ESTRUTURA[estrutura] && (
                  <p className="text-start mb-3">
                    {DESCRICOES_ESTRUTURA[estrutura]}
                  </p>
                )}
                <table className="table table-bordered text-center i3-table">
                  <thead>
                    <tr>
                      {items.map((i) => (
                        <th key={i.resposta}>{i.resposta}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {items.map((i) => (
                        <td key={i.resposta}>{i.percentual}%</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            ))
          )}
        </Card>

        <Card title="Resultado por Dimensão">
          {dados.dimensoes.length === 0 ? (
            <p className="text-muted">Nenhum dado encontrado.</p>
          ) : (
            <table className="table table-striped i3-table">
              <thead>
                <tr>
                  <th>Dimensão</th>
                  <th>Resultado (Média)</th>
                </tr>
              </thead>
              <tbody>
                {dados.dimensoes.map((d) => (
                  <tr key={d.processo}>
                    <td>{d.processo}</td>
                    <td>{d.media.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Resultado por Capacidade">
          {Object.keys(gruposCapacidade).length === 0 ? (
            <p className="text-muted">Nenhum dado encontrado.</p>
          ) : (
            Object.entries(gruposCapacidade).map(([chave, items]) => (
              <div key={chave} className="i3-card mb-3 p-0 overflow-hidden">
                <div className="i3-section-header mb-0 rounded-0 border-0">
                  {chave}
                </div>
                <div className="card-body p-0">
                  <table className="table table-sm table-bordered mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Capacidade</th>
                        <th className="text-center">Resultado</th>
                        <th>Próximo Nível</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <tr key={i}>
                          <td>{item.capacidade}</td>
                          <td className="text-center fw-bold">{item.soma}</td>
                          <td>{item.textoResultado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </Card>

        {dados.roadmap.some((r) => r.texto) && (
          <Card title="Roadmap de Gestão">
            {dados.roadmap.map(
              (r, i) =>
                r.texto && (
                  <div key={i} className="mb-3 p-3 border rounded">
                    <strong>{r.titulo}</strong>
                    <p className="mb-0 mt-2 text-justify">{r.texto}</p>
                  </div>
                ),
            )}
          </Card>
        )}

        {dados.swot && (
          <Card title="Análise SWOT">
            <div className="row g-3">
              {(
                [
                  ["Forças", dados.swot.forca, "text-success"],
                  ["Fraquezas", dados.swot.fraqueza, "text-danger"],
                  ["Oportunidades", dados.swot.oportunidade, "text-primary"],
                  ["Ameaças", dados.swot.ameaca, "text-warning"],
                ] as const
              ).map(([titulo, texto, cor]) => (
                <div key={titulo} className="col-md-6">
                  <div className="border rounded p-3 h-100 bg-light">
                    <h6 className={`fw-bold ${cor}`}>{titulo}</h6>
                    <p>{texto || "Não informado"}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {dados.okrs.length > 0 && (
          <Card title="Análise OKR">
            {dados.okrs.map((okr, i) => (
              <div key={i} className="border rounded p-3 mb-3 bg-light">
                <p className="fw-bold text-primary">
                  Objetivo {i + 1}: {okr.objetivo || "Não informado"}
                </p>
                <ul className="mb-0">
                  <li>OKR1: {okr.okr1 || "—"}</li>
                  <li>OKR2: {okr.okr2 || "—"}</li>
                  <li>OKR3: {okr.okr3 || "—"}</li>
                </ul>
              </div>
            ))}
          </Card>
        )}

        {dados.metas.length > 0 && (
          <Card title="Análise de Metas SMART">
            {dados.metas.map((m, i) => (
              <div key={i} className="border rounded p-3 mb-3 bg-light">
                <p className="fw-bold">{m.objetivo}</p>
                <small>
                  S: {m.especifica} | M: {m.mensuravel} | A: {m.alcancavel} |
                  R: {m.relevante} | T: {m.temporal}
                </small>
              </div>
            ))}
          </Card>
        )}

        {dados.planos.length > 0 && (
          <Card title="Plano de Ação">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Ação</th>
                  <th>Responsável</th>
                  <th>Prazo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dados.planos.map((p, i) => (
                  <tr key={i}>
                    <td>{p.oque}</td>
                    <td>{p.quem ?? "—"}</td>
                    <td>
                      {p.quando
                        ? new Date(p.quando).toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                    <td>{p.status ?? "pendente"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
