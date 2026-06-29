"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { apiFetch, useApi } from "@/components/layout/AppShell";
import { Logo } from "@/components/layout/Logo";
import {
  GraficoPercentuaisMaturidade,
  GraficoTeorBenchmark,
} from "@/components/tabs/relatorio/RelatorioGraficos";
import { RelatorioSumarioNav } from "@/components/tabs/relatorio/RelatorioSumarioNav";
import { RelatorioSumarioDoc } from "@/components/tabs/relatorio/RelatorioSumarioDoc";
import { aplicarTemplate } from "@/lib/relatorio/relatorio-templates";
import {
  APLICACAO_PRATICA,
  CAPACIDADES_INTRO,
  DESCRICOES_ESTRUTURA,
  DESCRICOES_PRINCIPIO,
  DIMENSOES_MATURIDADE,
  DIRECIONAMENTO_INTRO,
  ESCALA_MATURIDADE_FECHAMENTO,
  ESCALA_MATURIDADE_INTRO,
  INTRODUCAO_GERAL,
  METODOLOGIA_INTRO,
  ORDEM_PRINCIPIOS,
  RELATORIO_TITULO,
  TEOR_ETAPAS,
  TEOR_INTRO,
  ANEXO_INTRO,
} from "@/lib/relatorio/relatorio-textos";
import type { RelatorioCompleto } from "@/lib/relatorio/relatorio-types";

function Secao({
  titulo,
  id,
  capitulo = false,
  children,
}: {
  titulo: string;
  id?: string;
  capitulo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`i3-relatorio-doc-secao${capitulo ? " i3-relatorio-doc-capitulo" : ""}`}
    >
      <h3>{titulo}</h3>
      {children}
    </section>
  );
}

function Paragrafo({ children }: { children: string }) {
  return <p className="i3-relatorio-doc-paragrafo">{children}</p>;
}

function LegendaTabela({ numero, titulo }: { numero: number; titulo: string }) {
  return (
    <p className="i3-relatorio-doc-legenda">
      Tabela {numero} — {titulo}
    </p>
  );
}

function RelatorioDocumento({ dados }: { dados: RelatorioCompleto }) {
  const figNum = useRef(1);
  const nextFigura = (descricao: string) => {
    const n = figNum.current;
    figNum.current += 1;
    return `Figura ${n} — ${descricao}`;
  };

  const temMaturidade = dados.percentuaisMaturidade.some(
    (p) => parseFloat(p.percentual) > 0,
  );

  const vars = {
    empresa: dados.empresa,
    representante: dados.representante,
  };

  return (
    <article className="i3-relatorio-documento">
      <header className="i3-relatorio-doc-capa i3-relatorio-doc-capa-print">
        <Logo className="i3-relatorio-doc-logo" />
        <h1>{RELATORIO_TITULO}</h1>
        <div className="i3-relatorio-doc-meta">
          <p>
            <strong>Empresa:</strong> {dados.empresa}
          </p>
          {dados.representante && (
            <p>
              <strong>Representante:</strong> {dados.representante}
            </p>
          )}
          <p>
            <strong>Data da avaliação:</strong> {dados.dataAvaliacao}
          </p>
        </div>
      </header>

      <RelatorioSumarioDoc teorDisponivel={Boolean(dados.teor)} />

      <Secao titulo="1. Introdução" id="cap-1">
        <h4 className="i3-relatorio-doc-subsecao">1.1. Informações gerais</h4>
        {aplicarTemplate(INTRODUCAO_GERAL, vars)
          .split("\n\n")
          .map((paragrafo, i) => (
            <Paragrafo key={i}>{paragrafo}</Paragrafo>
          ))}

        <h4 className="i3-relatorio-doc-subsecao">1.2. Escala de maturidade</h4>
        <Paragrafo>{ESCALA_MATURIDADE_INTRO}</Paragrafo>
        <div className="i3-relatorio-doc-dimensoes">
          {DIMENSOES_MATURIDADE.map((d) => (
            <div key={d.titulo} className="i3-relatorio-doc-dimensao-item">
              <strong>{d.titulo}:</strong> {d.texto}
            </div>
          ))}
        </div>
        {ESCALA_MATURIDADE_FECHAMENTO.split("\n\n").map((p, i) => (
          <Paragrafo key={i}>{p}</Paragrafo>
        ))}
      </Secao>

      <Secao titulo="2. Metodologia e resultados" id="cap-2" capitulo>
        <Paragrafo>{METODOLOGIA_INTRO}</Paragrafo>

        {!temMaturidade ? (
          <p className="i3-relatorio-doc-vazio">
            Nenhum dado encontrado. Responda o diagnóstico primeiro.
          </p>
        ) : (
          <>
            <h4 className="i3-relatorio-doc-subsecao">
              {nextFigura("Resultado global")}
            </h4>
            <GraficoPercentuaisMaturidade
              titulo="Resultado global"
              items={dados.percentuaisMaturidade}
            />
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
          </>
        )}

        <h4 className="i3-relatorio-doc-subsecao">2.1. Estruturas avaliadas</h4>
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
              <h4 className="i3-relatorio-doc-subsecao fs-6">
                {nextFigura(estrutura)}
              </h4>
              <GraficoPercentuaisMaturidade
                titulo={estrutura}
                items={items}
                corBase="#2563eb"
              />
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

        {dados.analise3B && (
          <>
            <h4 className="i3-relatorio-doc-subsecao">
              Análise 3B (comparativo por indicador)
            </h4>
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
          </>
        )}

        <h4 className="i3-relatorio-doc-subsecao">2.2. Princípios avaliados</h4>
        {Object.keys(dados.mediasPorPrincipio).length === 0 ? (
          <p className="i3-relatorio-doc-vazio">Nenhum dado encontrado.</p>
        ) : (
          ORDEM_PRINCIPIOS.filter((p) => dados.mediasPorPrincipio[p]).map(
            (principio) => {
              const items = dados.mediasPorPrincipio[principio];
              return (
                <div key={principio} className="i3-relatorio-doc-bloco">
                  <h4>{principio}</h4>
                  {DESCRICOES_PRINCIPIO[principio] && (
                    <p className="i3-relatorio-doc-texto">
                      {DESCRICOES_PRINCIPIO[principio]}
                    </p>
                  )}
                  <h4 className="i3-relatorio-doc-subsecao fs-6">
                    {nextFigura(principio)}
                  </h4>
                  <GraficoPercentuaisMaturidade
                    titulo={principio}
                    items={items}
                    corBase="#1d4ed8"
                  />
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
              );
            },
          )
        )}

        <h4 className="i3-relatorio-doc-subsecao">2.3. Capacidades</h4>
        <Paragrafo>{CAPACIDADES_INTRO}</Paragrafo>
        {dados.matrizCapacidades.length === 0 ? (
          <p className="i3-relatorio-doc-vazio">Nenhum dado encontrado.</p>
        ) : (
          <div className="i3-relatorio-doc-tabela-scroll">
            <table className="i3-relatorio-doc-tabela i3-relatorio-doc-tabela-matriz">
              <thead>
                <tr>
                  <th>Capacidade</th>
                  {dados.percentuaisMaturidade.map((p) => (
                    <th key={p.resposta}>{p.resposta}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dados.matrizCapacidades.map((linha) => (
                  <tr key={linha.capacidade}>
                    <th scope="row">{linha.capacidade}</th>
                    {linha.percentuais.map((p) => (
                      <td key={p.resposta}>{p.percentual}%</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="i3-relatorio-doc-legenda">Tabela 1 — Capacidades</p>
          </div>
        )}

        <h4 className="i3-relatorio-doc-subsecao">2.4. Aplicação prática</h4>
        <Paragrafo>{APLICACAO_PRATICA}</Paragrafo>

        {dados.dimensoesOperacionais.length > 0 && (
          <>
            <h4 className="i3-relatorio-doc-subsecao">
              2.5. Resultado por processo operacional
            </h4>
            <table className="i3-relatorio-doc-tabela i3-relatorio-doc-tabela-lista">
              <thead>
                <tr>
                  <th>Processo</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {dados.dimensoesOperacionais.map((d) => (
                  <tr key={d.processo}>
                    <td>{d.processo}</td>
                    <td>{d.media.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Secao>

      <Secao titulo="3. Direcionamento estratégico" id="cap-3" capitulo>
        <Paragrafo>{DIRECIONAMENTO_INTRO}</Paragrafo>

        {dados.direcionamento.resumo.length > 0 && (
          <table className="i3-relatorio-doc-tabela i3-relatorio-doc-tabela-lista">
            <thead>
              <tr>
                <th>Macro dimensão</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {dados.direcionamento.resumo.map((item) => (
                <tr key={item.processo}>
                  <td>{item.processo}</td>
                  <td>{item.media.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {dados.direcionamento.macros.map((macro) => (
          <div key={macro.indice} className="i3-relatorio-doc-bloco">
            <h4 className="i3-relatorio-doc-subsecao">
              {macro.secao}. {macro.titulo}
            </h4>
            <Paragrafo>{macro.intro}</Paragrafo>
            {macro.tituloNivel && (
              <p className="i3-relatorio-doc-nivel">
                <em>
                  Nível {macro.nivel} — {macro.tituloNivel} (Resultado{" "}
                  {macro.media.toFixed(1)})
                </em>
              </p>
            )}
            {macro.subDimensoes.map((sub) => (
              <div key={sub.capacidade} className="i3-relatorio-doc-item">
                <strong>{sub.capacidade}</strong>
                <p className="i3-relatorio-doc-meta mb-1">
                  Resultado: {sub.media.toFixed(1)}
                </p>
                {sub.resultadoAnalise && (
                  <>
                    <p className="i3-relatorio-doc-subtitulo">
                      Resultado da análise
                    </p>
                    <p>{sub.resultadoAnalise}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </Secao>

      {dados.teor ? (
        <Secao titulo="4. Análise TEOR" id="cap-4" capitulo>
          <Paragrafo>{TEOR_INTRO}</Paragrafo>

          {TEOR_ETAPAS.map((etapa) => (
            <div key={etapa.titulo} className="i3-relatorio-doc-bloco">
              <h4 className="i3-relatorio-doc-subsecao">{etapa.titulo}</h4>
              <Paragrafo>{etapa.texto}</Paragrafo>

              {etapa.titulo.startsWith("4.1") && dados.teor!.custos.length > 0 && (
                <div className="i3-relatorio-doc-tabela-scroll">
                  <table className="i3-relatorio-doc-tabela i3-relatorio-doc-tabela-lista">
                    <thead>
                      <tr>
                        <th>Grupo de custo</th>
                        <th>Participação (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dados.teor!.custos.map((c) => (
                        <tr key={c.label}>
                          <td>{c.label}</td>
                          <td>{c.percentual}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="i3-relatorio-doc-legenda">
                    Tabela 2 — Grupos de custo
                  </p>
                </div>
              )}

              {etapa.titulo.startsWith("4.2") &&
                dados.teor!.kpis.length > 0 && (
                  <div className="i3-relatorio-doc-bloco">
                    {dados.teor!.kpis.map((kpi) => (
                      <div key={kpi.nome} className="i3-relatorio-doc-item">
                        <strong>{kpi.nome}</strong>
                        {kpi.descricao && <p>{kpi.descricao}</p>}
                      </div>
                    ))}
                  </div>
                )}

              {etapa.titulo.startsWith("4.3") && (
                <div className="i3-relatorio-doc-meta">
                  {dados.teor!.benchmark && (
                    <p>
                      <strong>Benchmark setorial:</strong>{" "}
                      {dados.teor!.benchmark}
                    </p>
                  )}
                  {dados.teor!.horizonte && (
                    <p>
                      <strong>Horizonte de planejamento:</strong>{" "}
                      {dados.teor!.horizonte}
                    </p>
                  )}
                  {dados.teor!.benchmarkComparativo.length > 0 && (
                    <>
                      <h4 className="i3-relatorio-doc-subsecao">
                        {nextFigura("Benchmark SIRI — empresa vs. setor")}
                      </h4>
                      <GraficoTeorBenchmark teor={dados.teor!} />
                      <div className="i3-relatorio-doc-tabela-scroll mt-3">
                        <table className="i3-relatorio-doc-tabela i3-relatorio-doc-tabela-lista">
                        <thead>
                          <tr>
                            <th>Dimensão SIRI</th>
                            <th>Nível empresa</th>
                            <th>Referência setor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dados.teor!.benchmarkComparativo.map((row) => (
                            <tr key={row.dimensao}>
                              <td>{row.dimensao}</td>
                              <td>{row.nivelEmpresa}</td>
                              <td>{row.referenciaSetor}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    </>
                  )}
                </div>
              )}

              {etapa.titulo.startsWith("4.4") &&
                dados.teor!.dimensoes.length > 0 && (
                  <div className="i3-relatorio-doc-tabela-scroll">
                    <table className="i3-relatorio-doc-tabela i3-relatorio-doc-tabela-lista">
                      <thead>
                        <tr>
                          <th>Grupo</th>
                          <th>Dimensão</th>
                          <th>Resultado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dados.teor!.dimensoes.map((d) => (
                          <tr key={d.nome}>
                            <td>{d.grupo}</td>
                            <td>{d.nome}</td>
                            <td>{d.nivel}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="i3-relatorio-doc-legenda">
                      Tabela 3 — Resultado das bandas
                    </p>
                  </div>
                )}
            </div>
          ))}

          {dados.teor!.priorizacoes.length > 0 ? (
            <div className="i3-relatorio-doc-bloco">
              <h4 className="i3-relatorio-doc-subsecao">
                Priorizações de transformação
              </h4>
              <table className="i3-relatorio-doc-tabela i3-relatorio-doc-tabela-lista">
                <thead>
                  <tr>
                    <th>Grupo</th>
                    <th>Dimensão prioritária</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.teor!.priorizacoes.map((p) => (
                    <tr key={p.grupo}>
                      <td>{p.grupoLabel}</td>
                      <td>{p.dimensao}</td>
                      <td>{p.valor.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="i3-relatorio-doc-legenda">
                Tabela 4 — Priorizações TEOR
              </p>
            </div>
          ) : (
            dados.teor!.avisoCalculo && (
              <p className="i3-relatorio-doc-vazio">{dados.teor!.avisoCalculo}</p>
            )
          )}
        </Secao>
      ) : null}

      <Secao titulo="5. Conclusão" id="cap-5" capitulo>
        {dados.conclusao.paragrafos.map((p, i) => (
          <Paragrafo key={i}>{p}</Paragrafo>
        ))}
      </Secao>

      <Secao titulo="6. Anexo A — Plano de execução" id="cap-6" capitulo>
        <Paragrafo>{ANEXO_INTRO}</Paragrafo>

        <h4 className="i3-relatorio-doc-subsecao">
          6.1. Ações por capacidade
        </h4>
        {dados.anexo.acoesCapacidade.length === 0 ? (
          <p className="i3-relatorio-doc-vazio">Nenhum dado encontrado.</p>
        ) : (
          <div className="i3-relatorio-doc-tabela-scroll">
            <table className="i3-relatorio-doc-tabela i3-relatorio-doc-tabela-lista i3-relatorio-doc-tabela-acoes-capacidade">
              <colgroup>
                <col />
                <col />
                <col />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th>Capacidade</th>
                  <th>Processo</th>
                  <th className="i3-relatorio-th-compact">
                    Resultado
                    <br />
                    atual
                  </th>
                  <th>Próximo nível</th>
                </tr>
              </thead>
              <tbody>
                {dados.anexo.acoesCapacidade.map((item) => (
                  <tr key={`${item.processo}-${item.capacidade}`}>
                    <td>{item.capacidade}</td>
                    <td>{item.processo}</td>
                    <td className="i3-relatorio-doc-destaque">
                      {item.resultadoAtual}
                    </td>
                    <td>{item.proximoNivel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <LegendaTabela numero={5} titulo="Ações por capacidade" />
          </div>
        )}

        <h4 className="i3-relatorio-doc-subsecao">6.2. Análise SWOT</h4>
        {!dados.anexo.swot ? (
          <p className="i3-relatorio-doc-vazio">
            Nenhuma análise SWOT cadastrada.
          </p>
        ) : (
          <table className="i3-relatorio-doc-tabela i3-relatorio-doc-tabela-swot">
            <thead>
              <tr>
                <th>Ambiente</th>
                <th>Positivo</th>
                <th>Negativo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Interno</th>
                <td>
                  <strong>Forças</strong>
                  <ul className="i3-relatorio-doc-lista mb-0">
                    {dados.anexo.swot.interno.forcas.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                    {dados.anexo.swot.interno.forcas.length === 0 && (
                      <li className="text-muted">Não informado</li>
                    )}
                  </ul>
                </td>
                <td>
                  <strong>Fraquezas</strong>
                  <ul className="i3-relatorio-doc-lista mb-0">
                    {dados.anexo.swot.interno.fraquezas.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                    {dados.anexo.swot.interno.fraquezas.length === 0 && (
                      <li className="text-muted">Não informado</li>
                    )}
                  </ul>
                </td>
              </tr>
              <tr>
                <th scope="row">Externo</th>
                <td>
                  <strong>Oportunidades</strong>
                  <ul className="i3-relatorio-doc-lista mb-0">
                    {dados.anexo.swot.externo.oportunidades.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                    {dados.anexo.swot.externo.oportunidades.length === 0 && (
                      <li className="text-muted">Não informado</li>
                    )}
                  </ul>
                </td>
                <td>
                  <strong>Ameaças</strong>
                  <ul className="i3-relatorio-doc-lista mb-0">
                    {dados.anexo.swot.externo.ameacas.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                    {dados.anexo.swot.externo.ameacas.length === 0 && (
                      <li className="text-muted">Não informado</li>
                    )}
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        )}
        {dados.anexo.swot && (
          <LegendaTabela numero={6} titulo="Análise SWOT" />
        )}

        <h4 className="i3-relatorio-doc-subsecao">6.3. OKR e Metas SMART</h4>
        {dados.anexo.okrMetas.length === 0 ? (
          <p className="i3-relatorio-doc-vazio">
            Nenhum OKR ou meta cadastrada.
          </p>
        ) : (
          <div className="i3-relatorio-doc-tabela-scroll">
            <table className="i3-relatorio-doc-tabela i3-relatorio-doc-tabela-lista">
              <thead>
                <tr>
                  <th>Objetivo (OKR)</th>
                  <th>Key Result</th>
                  <th>Alinhamento SWOT</th>
                  <th>Meta SMART</th>
                </tr>
              </thead>
              <tbody>
                {dados.anexo.okrMetas.map((linha, i) => (
                  <tr key={i}>
                    <td>{linha.objetivo}</td>
                    <td>{linha.kr}</td>
                    <td>
                      {linha.alinhamentoSwot.length > 0
                        ? linha.alinhamentoSwot.map((s, j) => (
                            <div key={j}>{s}</div>
                          ))
                        : "—"}
                    </td>
                    <td>
                      {linha.meta ? (
                        <>
                          <div>
                            <strong>S:</strong> {linha.meta.especifica || "—"}
                          </div>
                          <div>
                            <strong>M:</strong> {linha.meta.mensuravel || "—"}
                          </div>
                          <div>
                            <strong>A:</strong> {linha.meta.alcancavel || "—"}
                          </div>
                          <div>
                            <strong>R:</strong> {linha.meta.relevante || "—"}
                          </div>
                          <div>
                            <strong>T:</strong> {linha.meta.temporal || "—"}
                          </div>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <LegendaTabela numero={7} titulo="OKR e Metas SMART" />
          </div>
        )}

        <h4 className="i3-relatorio-doc-subsecao">
          6.4. Plano de ação (12 meses)
        </h4>
        {dados.anexo.planoGrupos.length === 0 ? (
          <p className="i3-relatorio-doc-vazio">
            Nenhuma ação no plano cadastrada.
          </p>
        ) : (
          dados.anexo.planoGrupos.map((grupo) => (
            <div key={grupo.foco} className="i3-relatorio-doc-bloco">
              <h4 className="i3-relatorio-doc-subtitulo">{grupo.foco}</h4>
              <table className="i3-relatorio-doc-tabela i3-relatorio-doc-tabela-lista">
                <thead>
                  <tr>
                    <th>Ação</th>
                    <th>Descrição</th>
                    <th>Responsável</th>
                    <th>Prazo</th>
                    <th>KR relacionado</th>
                  </tr>
                </thead>
                <tbody>
                  {grupo.itens.map((item, i) => (
                    <tr key={i}>
                      <td>{item.acao}</td>
                      <td>{item.descricao}</td>
                      <td>{item.responsavel}</td>
                      <td>{item.prazo}</td>
                      <td>{item.krRelacionado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
        {dados.anexo.planoGrupos.length > 0 && (
          <LegendaTabela numero={8} titulo="Plano de ação" />
        )}
      </Secao>

      <footer className="i3-relatorio-doc-rodape">
        <Logo className="i3-relatorio-doc-rodape-logo" />
        <p>
          Instituto SENAI de Tecnologia em Excelência Operacional · FIESC ·
          institutostecnologia.senai.br · (47) 3341-2929
        </p>
      </footer>
    </article>
  );
}

export function RelatorioTab() {
  const { showModal } = useApi();
  const [dados, setDados] = useState<RelatorioCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewAberto, setPreviewAberto] = useState(false);

  useEffect(() => {
    apiFetch<RelatorioCompleto>("/api/relatorio")
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
    const overflowAnterior = document.body.style.overflow;
    if (fromOverlay) {
      document.body.style.overflow = "visible";
    }
    document.body.classList.add("i3-print-relatorio");
    if (fromOverlay) {
      document.body.classList.add("i3-print-from-overlay");
    }
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("beforeprint"));
      window.print();
    });
    window.addEventListener(
      "afterprint",
      () => {
        document.body.classList.remove("i3-print-relatorio", "i3-print-from-overlay");
        if (fromOverlay) {
          document.body.style.overflow = overflowAnterior;
        }
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
        {!dados.teor && (
          <>
            {" "}
            A seção <strong>4. Análise TEOR</strong> aparecerá após preencher a
            aba Análise TEOR.
          </>
        )}
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
            <div className="i3-relatorio-overlay-layout">
              <RelatorioSumarioNav teorDisponivel={Boolean(dados.teor)} />
              <div className="i3-relatorio-overlay-body">
                <RelatorioDocumento dados={dados} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
