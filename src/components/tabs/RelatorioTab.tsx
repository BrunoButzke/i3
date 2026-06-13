"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { apiFetch, useApi } from "@/components/layout/AppShell";
import { Logo } from "@/components/layout/Logo";
import {
  AVALIACAO_PLANO,
  normalizarAvaliacaoPlano,
} from "@/lib/constants";

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
    keyResults: { texto: string; swotItens: string[] }[];
  }[];
  metas: {
    objetivo: string;
    keyResultId?: string | null;
    krTexto?: string | null;
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
    avaliacao?: string | null;
  }[];
};

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="i3-relatorio-doc-secao">
      <h3>{titulo}</h3>
      {children}
    </section>
  );
}

function RelatorioDocumento({ dados }: { dados: Relatorio }) {
  const temMaturidade = dados.percentuaisMaturidade.some(
    (p) => parseFloat(p.percentual) > 0,
  );

  const gruposCapacidade: Record<string, typeof dados.resumoCapacidade> = {};
  dados.resumoCapacidade.forEach((item) => {
    const chave = `${item.estrutura} | ${item.principio} | ${item.processo}`;
    if (!gruposCapacidade[chave]) gruposCapacidade[chave] = [];
    gruposCapacidade[chave].push(item);
  });

  const dataEmissao = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="i3-relatorio-documento">
      <header className="i3-relatorio-doc-capa">
        <Logo className="i3-relatorio-doc-logo" />
        <h1>Índice da Indústria Inteligente</h1>
        <p className="i3-relatorio-doc-subtitulo">Relatório de Diagnóstico</p>
        <div className="i3-relatorio-doc-meta">
          <p>
            <strong>Empresa:</strong> {dados.empresa}
          </p>
          <p>
            <strong>Data de emissão:</strong> {dataEmissao}
          </p>
        </div>
      </header>

      <Secao titulo="Resultado da Análise de Maturidade">
        {!temMaturidade ? (
          <p className="i3-relatorio-doc-vazio">
            Nenhum dado encontrado. Responda o diagnóstico primeiro.
          </p>
        ) : (
          <table className="i3-relatorio-doc-tabela">
            <thead>
              <tr>
                {dados.percentuaisMaturidade.map((p) => (
                  <th key={p.resposta}>{p.resposta}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {dados.percentuaisMaturidade.map((p) => (
                  <td key={p.resposta}>{p.percentual}%</td>
                ))}
              </tr>
            </tbody>
          </table>
        )}
      </Secao>

      {dados.analise3B && (
        <Secao titulo="Análise 3B (comparativo por indicador)">
          <table className="i3-relatorio-doc-tabela">
            <thead>
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
                  <th scope="row">{c.indicador}</th>
                  <td>{c.valorEmpresa.toFixed(2)}</td>
                  <td>{c.media10Menores.toFixed(2)}</td>
                  <td>{c.media80Meio.toFixed(2)}</td>
                  <td>{c.media10Maiores.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Secao>
      )}

      <Secao titulo="Resultado por Estrutura">
        {Object.keys(dados.mediasPorEstrutura).length === 0 ? (
          <p className="i3-relatorio-doc-vazio">Nenhum dado encontrado.</p>
        ) : (
          Object.entries(dados.mediasPorEstrutura).map(([estrutura, items]) => (
            <div key={estrutura} className="i3-relatorio-doc-bloco">
              <h4>{estrutura}</h4>
              {DESCRICOES_ESTRUTURA[estrutura] && (
                <p className="i3-relatorio-doc-texto">
                  {DESCRICOES_ESTRUTURA[estrutura]}
                </p>
              )}
              <table className="i3-relatorio-doc-tabela">
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
      </Secao>

      <Secao titulo="Resultado por Dimensão">
        {dados.dimensoes.length === 0 ? (
          <p className="i3-relatorio-doc-vazio">Nenhum dado encontrado.</p>
        ) : (
          <table className="i3-relatorio-doc-tabela i3-relatorio-doc-tabela-lista">
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
      </Secao>

      <Secao titulo="Resultado por Capacidade">
        {Object.keys(gruposCapacidade).length === 0 ? (
          <p className="i3-relatorio-doc-vazio">Nenhum dado encontrado.</p>
        ) : (
          <div className="i3-relatorio-capacidade-grupo">
            {Object.entries(gruposCapacidade).map(([chave, items]) => (
              <div key={chave} className="i3-relatorio-doc-bloco">
                <h4>{chave}</h4>
                <table className="i3-relatorio-doc-tabela i3-relatorio-doc-tabela-lista i3-relatorio-doc-tabela-capacidade">
                  <colgroup>
                    <col />
                    <col />
                    <col />
                  </colgroup>
                <thead>
                  <tr>
                    <th>Capacidade</th>
                    <th>Resultado</th>
                    <th>Próximo Nível</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.capacidade}</td>
                      <td className="i3-relatorio-doc-destaque">{item.soma}</td>
                      <td>{item.textoResultado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            ))}
          </div>
        )}
      </Secao>

      {dados.roadmap.some((r) => r.texto) && (
        <Secao titulo="Roadmap de Gestão">
          {dados.roadmap.map(
            (r, i) =>
              r.texto && (
                <div key={i} className="i3-relatorio-doc-item">
                  <strong>{r.titulo}</strong>
                  <p>{r.texto}</p>
                </div>
              ),
          )}
        </Secao>
      )}

      {dados.swot && (
        <Secao titulo="Análise SWOT">
          <div className="i3-relatorio-doc-swot">
            {(
              [
                ["Forças", dados.swot.forca, "forca"],
                ["Fraquezas", dados.swot.fraqueza, "fraqueza"],
                ["Oportunidades", dados.swot.oportunidade, "oportunidade"],
                ["Ameaças", dados.swot.ameaca, "ameaca"],
              ] as const
            ).map(([titulo, texto, tipo]) => (
              <div key={titulo} className={`i3-relatorio-doc-swot-item ${tipo}`}>
                <h4>{titulo}</h4>
                <p>{texto || "Não informado"}</p>
              </div>
            ))}
          </div>
        </Secao>
      )}

      {dados.okrs.length > 0 && (
        <Secao titulo="Análise OKR">
          {dados.okrs.map((okr, okrIndex) => (
            <div key={okrIndex} className="i3-relatorio-doc-item">
              <p className="i3-relatorio-doc-okr-titulo">
                OKR {okrIndex + 1}: {okr.objetivo || "Não informado"}
              </p>
              {okr.keyResults.length === 0 ? (
                <p className="i3-relatorio-doc-vazio mb-0">
                  Nenhum KR cadastrado.
                </p>
              ) : (
                <ul className="i3-relatorio-doc-lista">
                  {okr.keyResults.map((kr, i) => (
                    <li key={i}>
                      <strong>KR {i + 1}:</strong> {kr.texto || "—"}
                      {kr.swotItens.length > 0 && (
                        <ul>
                          {kr.swotItens.map((item, j) => (
                            <li key={j}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Secao>
      )}

      {dados.metas.length > 0 && (
        <Secao titulo="Análise de Metas SMART">
          {dados.metas.map((m, i) => (
            <div key={i} className="i3-relatorio-doc-item">
              <p className="i3-relatorio-doc-meta-titulo">{m.objetivo}</p>
              {m.krTexto && (
                <p className="i3-relatorio-doc-kr">
                  <strong>KR:</strong> {m.krTexto}
                </p>
              )}
              <p className="i3-relatorio-doc-smart">
                <span>
                  <strong>S:</strong> {m.especifica}
                </span>
                <span>
                  <strong>M:</strong> {m.mensuravel}
                </span>
                <span>
                  <strong>A:</strong> {m.alcancavel}
                </span>
                <span>
                  <strong>R:</strong> {m.relevante}
                </span>
                <span>
                  <strong>T:</strong> {m.temporal}
                </span>
              </p>
            </div>
          ))}
        </Secao>
      )}

      {dados.planos.length > 0 && (
        <Secao titulo="Plano de Ação">
          <table className="i3-relatorio-doc-tabela i3-relatorio-doc-tabela-lista">
            <thead>
              <tr>
                <th>Ação</th>
                <th>Responsável</th>
                <th>Prazo</th>
                <th>Status</th>
                <th>Avaliação</th>
              </tr>
            </thead>
            <tbody>
              {dados.planos.map((p, i) => {
                const avaliacao = normalizarAvaliacaoPlano(p.avaliacao);
                return (
                  <tr key={i}>
                    <td>{p.oque}</td>
                    <td>{p.quem ?? "—"}</td>
                    <td>
                      {p.quando
                        ? new Date(p.quando).toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                    <td>{p.status ?? "pendente"}</td>
                    <td>{AVALIACAO_PLANO[avaliacao].label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Secao>
      )}

      <footer className="i3-relatorio-doc-rodape">
        <p>
          Instituto SENAI de Tecnologia em Excelência Operacional ·
          institutostecnologia.senai.br · (47) 3341-2929
        </p>
      </footer>
    </article>
  );
}

export function RelatorioTab() {
  const { showModal } = useApi();
  const [dados, setDados] = useState<Relatorio | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewAberto, setPreviewAberto] = useState(false);

  useEffect(() => {
    apiFetch<Relatorio>("/api/relatorio")
      .then(setDados)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!previewAberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewAberto(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", onKey);
    };
  }, [previewAberto]);

  function imprimir(fromOverlay = false) {
    document.body.classList.add("i3-print-relatorio");
    if (fromOverlay) {
      document.body.classList.add("i3-print-from-overlay");
    }
    window.print();
    window.addEventListener(
      "afterprint",
      () => {
        document.body.classList.remove("i3-print-relatorio", "i3-print-from-overlay");
      },
      { once: true },
    );
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
    return (
      <p className="text-muted mt-3">Não foi possível carregar o relatório.</p>
    );
  }

  return (
    <div className="mt-3">
      <div className="i3-action-bar mt-0 mb-3 border-0 pt-0">
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={() => setPreviewAberto(true)}
        >
          <i className="bi bi-file-earmark-text me-1" /> Visualizar relatório
        </button>
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={() => imprimir(false)}
        >
          <i className="bi bi-printer me-1" /> Imprimir
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

      <p className="text-muted mb-3">
        O relatório completo pode ser visualizado em formato de documento ou
        impresso em papel A4.
      </p>

      <div className="i3-relatorio-viewport">
        <RelatorioDocumento dados={dados} />
      </div>

      {previewAberto &&
        createPortal(
          <div
            className="i3-relatorio-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Visualização do relatório"
          >
            <div className="i3-relatorio-overlay-toolbar">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => imprimir(true)}
              >
                <i className="bi bi-printer me-1" /> Imprimir
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setPreviewAberto(false)}
              >
                <i className="bi bi-x-lg me-1" /> Fechar
              </button>
            </div>
            <div className="i3-relatorio-overlay-body">
              <RelatorioDocumento dados={dados} />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
