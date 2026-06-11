"use client";

import { useEffect, useState } from "react";
import { apiFetch, useApi } from "@/components/layout/AppShell";
import { ACAO_MAX_LENGTH, limitAcaoText } from "@/lib/constants";
import { calcularPrioridadeGUT } from "@/components/tabs/shared";

type Acao = {
  id?: number;
  acao: string;
  gravidade: string;
  urgencia: string;
  tendencia: string;
  pontuacao: string;
  prioridade: string;
};

function emptyAcao(): Acao {
  const { pontuacao, prioridade } = calcularPrioridadeGUT(1, 1, 1);
  return {
    acao: "",
    gravidade: "1",
    urgencia: "1",
    tendencia: "1",
    pontuacao: String(pontuacao),
    prioridade,
  };
}

function recalc(a: Acao): Acao {
  const g = Number(a.gravidade) || 0;
  const u = Number(a.urgencia) || 0;
  const t = Number(a.tendencia) || 0;
  const { pontuacao, prioridade } = calcularPrioridadeGUT(g, u, t);
  return {
    ...a,
    pontuacao: pontuacao ? String(pontuacao) : "",
    prioridade,
  };
}

export function PriorizacaoTab({ empresaId }: { empresaId: number }) {
  const { showModal, showConfirm } = useApi();
  const [acoes, setAcoes] = useState<Acao[]>([]);
  const [savingId, setSavingId] = useState<number | "new" | null>(null);

  useEffect(() => {
    apiFetch<Acao[]>("/api/acoes").then((data) => {
      setAcoes(
        data.length > 0
          ? data.map((a) => recalc({ ...a, acao: limitAcaoText(a.acao) }))
          : [emptyAcao()],
      );
    });
  }, []);

  function update(index: number, field: keyof Acao, value: string) {
    const next =
      field === "acao" ? limitAcaoText(value) : value;
    setAcoes((prev) =>
      prev.map((a, i) => {
        if (i !== index) return a;
        return recalc({ ...a, [field]: next });
      }),
    );
  }

  async function salvarLinha(index: number) {
    const a = acoes[index];
    setSavingId(a.id ?? "new");
    try {
      const result = await apiFetch<{ mensagem: string }>("/api/acoes", {
        method: "POST",
        body: JSON.stringify({
          acoes: [{ ...a, empresa: empresaId }],
        }),
      });
      showModal(result.mensagem);
      const refreshed = await apiFetch<Acao[]>("/api/acoes");
      if (refreshed.length > 0) setAcoes(refreshed.map(recalc));
    } catch (err) {
      showModal(err instanceof Error ? err.message : "Erro");
    } finally {
      setSavingId(null);
    }
  }

  async function removerLinha(index: number) {
    const a = acoes[index];
    if (a.id) {
      await apiFetch("/api/acoes", {
        method: "POST",
        body: JSON.stringify({ action: "delete", id: a.id }),
      });
    }
    setAcoes((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [emptyAcao()];
    });
  }

  return (
    <form className="mb-5" onSubmit={(e) => e.preventDefault()}>
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table i3-table-zebra align-middle text-center mb-0">
              <thead>
                <tr>
                  <th>Ação</th>
                  <th>Gravidade (G)</th>
                  <th>Urgência (U)</th>
                  <th>Tendência (T)</th>
                  <th>
                    Pontuação
                    <br />
                    (G × U × T)
                  </th>
                  <th>Prioridade</th>
                  <th style={{ minWidth: "7.5rem" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {acoes.map((a, i) => (
                  <tr key={a.id ?? `new-${i}`}>
                    <td>
                      <input
                        type="text"
                        className="form-control i3-table-input"
                        placeholder="Descreva a ação"
                        value={a.acao}
                        maxLength={ACAO_MAX_LENGTH}
                        onChange={(e) => update(i, "acao", e.target.value)}
                      />
                    </td>
                    {(["gravidade", "urgencia", "tendencia"] as const).map(
                      (f) => (
                        <td key={f}>
                          <input
                            type="number"
                            className="form-control i3-table-input"
                            min={1}
                            max={5}
                            value={a[f]}
                            onChange={(e) => update(i, f, e.target.value)}
                            onBlur={() =>
                              setAcoes((prev) =>
                                prev.map((x, j) => (j === i ? recalc(x) : x)),
                              )
                            }
                          />
                        </td>
                      ),
                    )}
                    <td>
                      <span className="i3-cell-value">{a.pontuacao}</span>
                    </td>
                    <td>
                      <span className="i3-cell-value">{a.prioridade}</span>
                    </td>
                    <td className="text-center" style={{ whiteSpace: "nowrap" }}>
                      <div className="d-inline-flex align-items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          title="Salvar"
                          disabled={savingId === (a.id ?? "new")}
                          onClick={() => salvarLinha(i)}
                        >
                          {savingId === (a.id ?? "new") ? (
                            <span className="spinner-border spinner-border-sm" />
                          ) : (
                            "Salvar"
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          title="Remover"
                          aria-label="Remover"
                          onClick={() =>
                            showConfirm(
                              a.acao.trim()
                                ? `Deseja excluir a ação "${a.acao}"?`
                                : "Deseja excluir esta ação?",
                              () => removerLinha(i),
                              {
                                title: "Excluir ação",
                                confirmLabel: "Sim, excluir",
                                confirmVariant: "danger",
                                confirmIcon: "bi-trash",
                                warning:
                                  "A ação será removida permanentemente.",
                              },
                            )
                          }
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="text-end">
        <button
          type="button"
          className="btn btn-secondary mb-3"
          onClick={() => setAcoes((p) => [...p, emptyAcao()])}
        >
          + Adicionar Ação
        </button>
      </div>
    </form>
  );
}
