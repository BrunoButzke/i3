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

  useEffect(() => {
    apiFetch<Plano[]>("/api/acompanhamento").then((rows) =>
      setPlanos(
        rows.map((p) => ({
          ...p,
          status: normalizarStatus(p.status),
        })),
      ),
    );
  }, []);

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
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="p-3 bg-light rounded shadow-sm mb-4">
              <h6 className="fw-semibold text-secondary mb-3">
                <i className="bi bi-funnel me-2" />
                Filtros
              </h6>
              <div className="mb-3">
                <label className="form-label fw-semibold text-secondary">
                  <i className="bi bi-person-lines-fill me-1" /> Responsável
                </label>
                <select
                  className="form-select shadow-sm"
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
              <div className="mb-3">
                <label className="form-label fw-semibold text-secondary">
                  <i className="bi bi-clipboard-check me-1" /> Status
                </label>
                <select
                  className="form-select shadow-sm"
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
              <div className="mb-3">
                <label className="form-label fw-semibold text-secondary">
                  <i className="bi bi-calendar-event me-1" /> Data início
                </label>
                <input
                  type="date"
                  className="form-control shadow-sm"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div className="mb-2">
                <label className="form-label fw-semibold text-secondary">
                  <i className="bi bi-calendar-event me-1" /> Data fim
                </label>
                <input
                  type="date"
                  className="form-control shadow-sm"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </div>

            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent border-0 pb-0">
                <h6 className="fw-semibold text-secondary mb-0">
                  <i className="bi bi-pie-chart me-1" /> Status do Acompanhamento
                </h6>
              </div>
              <div className="card-body p-3">
                <Doughnut
                  data={chartData}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: "bottom" } },
                  }}
                />
              </div>
            </div>
          </div>

          <div className="col-lg-8">
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
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-muted text-center">
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
    </div>
  );
}
