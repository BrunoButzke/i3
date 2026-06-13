"use client";

import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
} from "chart.js";
import { useEffect, useMemo, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { apiFetch, useApi } from "@/components/layout/AppShell";
import {
  AVALIACAO_PLANO,
  AVALIACAO_PLANO_KEYS,
  COMENTARIO_AVALIACAO_MAX_LENGTH,
  type AvaliacaoPlano,
  normalizarAvaliacaoPlano,
} from "@/lib/constants";
import {
  STATUS_ACOMPANHAMENTO,
  StatusAcompanhamento,
  normalizarStatus,
} from "@/components/tabs/shared";

ChartJS.register(ArcElement, Tooltip, Legend);

type Plano = {
  id: number;
  acao: string;
  responsavel: string;
  prazo: string;
  status: string;
  avaliacao: AvaliacaoPlano;
  comentarioAvaliacao: string;
};

function parsePrazoBR(prazo: string): Date | null {
  if (!prazo) return null;
  const parts = prazo.split("/");
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number);
    if (d && m && y) return new Date(y, m - 1, d);
  }
  const iso = new Date(prazo);
  return Number.isNaN(iso.getTime()) ? null : iso;
}

export function AcompanhamentoTab() {
  const { showModal } = useApi();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [filtroResp, setFiltroResp] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [saving, setSaving] = useState(false);
  const [avaliacaoModalId, setAvaliacaoModalId] = useState<number | null>(null);
  const [modalAvaliacao, setModalAvaliacao] =
    useState<AvaliacaoPlano>("sem_avaliacao");
  const [modalComentario, setModalComentario] = useState("");

  useEffect(() => {
    apiFetch<
      (Omit<Plano, "avaliacao" | "comentarioAvaliacao"> & {
        avaliacao?: string;
        comentarioAvaliacao?: string | null;
      })[]
    >("/api/acompanhamento").then((rows) =>
      setPlanos(
        rows.map((p) => ({
          ...p,
          status: normalizarStatus(p.status),
          avaliacao: normalizarAvaliacaoPlano(p.avaliacao),
          comentarioAvaliacao: p.comentarioAvaliacao ?? "",
        })),
      ),
    );
  }, []);

  const planoModal =
    avaliacaoModalId !== null
      ? planos.find((p) => p.id === avaliacaoModalId) ?? null
      : null;

  function openAvaliacaoModal(plano: Plano) {
    setAvaliacaoModalId(plano.id);
    setModalAvaliacao(plano.avaliacao);
    setModalComentario(plano.comentarioAvaliacao);
  }

  function closeAvaliacaoModal() {
    setAvaliacaoModalId(null);
    setModalComentario("");
  }

  function confirmAvaliacaoModal() {
    if (avaliacaoModalId === null) return;
    setPlanos((prev) =>
      prev.map((p) =>
        p.id === avaliacaoModalId
          ? {
              ...p,
              avaliacao: modalAvaliacao,
              comentarioAvaliacao: modalComentario
                .trim()
                .slice(0, COMENTARIO_AVALIACAO_MAX_LENGTH),
            }
          : p,
      ),
    );
    closeAvaliacaoModal();
  }

  function avaliacaoTooltip(plano: Plano) {
    const label = AVALIACAO_PLANO[plano.avaliacao].label;
    if (!plano.comentarioAvaliacao.trim()) return label;
    const preview =
      plano.comentarioAvaliacao.length > 80
        ? `${plano.comentarioAvaliacao.slice(0, 80)}…`
        : plano.comentarioAvaliacao;
    return `${label}\n${preview}`;
  }

  const responsaveis = [
    ...new Set(planos.map((p) => p.responsavel).filter(Boolean)),
  ];

  const filtrados = useMemo(() => {
    return planos.filter((p) => {
      if (filtroResp && p.responsavel !== filtroResp) return false;
      if (filtroStatus && p.status !== filtroStatus) return false;
      const prazo = parsePrazoBR(p.prazo);
      if (dataInicio && prazo && prazo < new Date(dataInicio)) return false;
      if (dataFim && prazo && prazo > new Date(dataFim + "T23:59:59"))
        return false;
      return true;
    });
  }, [planos, filtroResp, filtroStatus, dataInicio, dataFim]);

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtrados.forEach((p) => {
      counts[p.status] = (counts[p.status] ?? 0) + 1;
    });
    const labels = Object.keys(STATUS_ACOMPANHAMENTO).map(
      (k) => STATUS_ACOMPANHAMENTO[k as StatusAcompanhamento].label,
    );
    const keys = Object.keys(STATUS_ACOMPANHAMENTO) as StatusAcompanhamento[];
    return {
      labels,
      datasets: [
        {
          data: keys.map((k) => counts[k] ?? 0),
          backgroundColor: keys.map((k) => STATUS_ACOMPANHAMENTO[k].color),
        },
      ],
    };
  }, [filtrados]);

  async function salvar() {
    setSaving(true);
    try {
      const updates = planos.map((p) => ({
        linha: p.id,
        status: p.status,
        avaliacao: p.avaliacao,
        comentarioAvaliacao: p.comentarioAvaliacao,
      }));
      const result = await apiFetch<{ mensagem: string }>("/api/acompanhamento", {
        method: "POST",
        body: JSON.stringify({ updates }),
      });
      showModal(result.mensagem);
    } catch (err) {
      showModal(err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card shadow-sm border-0 mt-3">
      <div className="card-body">
        <div className="i3-acomp-filtros mb-3">
          <div className="row g-2 align-items-end">
            <div className="col-6 col-md-3">
              <label className="form-label i3-acomp-filtro-label">
                Responsável
              </label>
              <select
                className="form-select form-select-sm"
                value={filtroResp}
                onChange={(e) => setFiltroResp(e.target.value)}
              >
                <option value="">Todos</option>
                {responsaveis.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label i3-acomp-filtro-label">Status</label>
              <select
                className="form-select form-select-sm"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="">Todos</option>
                {(
                  Object.entries(STATUS_ACOMPANHAMENTO) as [
                    StatusAcompanhamento,
                    (typeof STATUS_ACOMPANHAMENTO)[StatusAcompanhamento],
                  ][]
                ).map(([valor, { label }]) => (
                  <option key={valor} value={valor}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label i3-acomp-filtro-label">
                Data início
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label i3-acomp-filtro-label">Data fim</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-lg-3">
            <div className="i3-acomp-chart-card">
              <h6 className="i3-acomp-chart-title">Status do Acompanhamento</h6>
              <Doughnut
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } } },
                }}
              />
            </div>
          </div>

          <div className="col-lg-9">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-secondary fw-semibold">
                      O que fazer (Ação)
                    </th>
                    <th className="text-secondary fw-semibold">Responsável</th>
                    <th className="text-secondary fw-semibold">Prazo</th>
                    <th
                      className="text-secondary fw-semibold text-center"
                      style={{ width: 200 }}
                    >
                      Status
                    </th>
                    <th
                      className="text-secondary fw-semibold text-center"
                      style={{ width: 56 }}
                    >
                      Aval.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-muted text-center">
                        Nenhum acompanhamento encontrado
                      </td>
                    </tr>
                  ) : (
                    filtrados.map((p) => {
                      const st =
                        STATUS_ACOMPANHAMENTO[
                          p.status as StatusAcompanhamento
                        ] ?? STATUS_ACOMPANHAMENTO.pendente;
                      return (
                        <tr key={p.id}>
                          <td>{p.acao}</td>
                          <td>{p.responsavel}</td>
                          <td>{p.prazo}</td>
                          <td className="text-center">
                            <span
                              style={{
                                display: "inline-block",
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                backgroundColor: st.color,
                                marginRight: 6,
                                verticalAlign: "middle",
                              }}
                            />
                            <select
                              className="form-select d-inline-block"
                              style={{ width: "auto", minWidth: 140 }}
                              value={p.status}
                              onChange={(e) =>
                                setPlanos((prev) =>
                                  prev.map((x) =>
                                    x.id === p.id
                                      ? {
                                          ...x,
                                          status: e.target.value,
                                        }
                                      : x,
                                  ),
                                )
                              }
                            >
                              {(
                                Object.entries(STATUS_ACOMPANHAMENTO) as [
                                  StatusAcompanhamento,
                                  (typeof STATUS_ACOMPANHAMENTO)[StatusAcompanhamento],
                                ][]
                              ).map(([valor, { label }]) => (
                                <option key={valor} value={valor}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className={`i3-avaliacao-icon-btn ${AVALIACAO_PLANO[p.avaliacao].iconClass}`}
                              title={avaliacaoTooltip(p)}
                              aria-label={`Avaliar: ${AVALIACAO_PLANO[p.avaliacao].label}`}
                              onClick={() => openAvaliacaoModal(p)}
                            >
                              <i className="bi bi-check-lg" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="row text-end pt-3">
              <div className="col">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={saving}
                  onClick={salvar}
                >
                  {saving ? (
                    <span className="spinner-border spinner-border-sm" />
                  ) : (
                    <>
                      <i className="bi bi-save" /> Salvar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {planoModal && (
        <div className="i3-modal-backdrop" onClick={closeAvaliacaoModal}>
          <div
            className="i3-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="i3-modal-header">
              <h5 className="i3-modal-title">Avaliar ação</h5>
            </div>
            <div className="i3-modal-body">
              <p className="text-muted fs-8 mb-3">{planoModal.acao}</p>

              <label htmlFor="avaliacao-comentario" className="form-label">
                Comentário
              </label>
              <textarea
                id="avaliacao-comentario"
                className="form-control mb-3"
                rows={4}
                maxLength={COMENTARIO_AVALIACAO_MAX_LENGTH}
                value={modalComentario}
                autoFocus
                placeholder="Descreva observações sobre a ação..."
                onChange={(e) => setModalComentario(e.target.value)}
              />
              <div className="text-muted fs-8 mb-3 text-end">
                {modalComentario.length}/{COMENTARIO_AVALIACAO_MAX_LENGTH}
              </div>

              <label htmlFor="avaliacao-estado" className="form-label">
                Avaliação
              </label>
              <select
                id="avaliacao-estado"
                className={`form-select i3-avaliacao-select ${AVALIACAO_PLANO[modalAvaliacao].className}`}
                value={modalAvaliacao}
                onChange={(e) =>
                  setModalAvaliacao(normalizarAvaliacaoPlano(e.target.value))
                }
              >
                {AVALIACAO_PLANO_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {AVALIACAO_PLANO[key].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="i3-modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={closeAvaliacaoModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmAvaliacaoModal}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
