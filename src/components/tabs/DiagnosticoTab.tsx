"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, useApi } from "@/components/layout/AppShell";

type Question = {
  id: string;
  codigo: string;
  estrutura: string;
  principio: string;
  capacidade: string;
  processo: string;
  enunciado: string;
  alternativas: Record<string, string>;
};

type Props = {
  empresaId: number;
  processos: string[];
  respostaTipos: string[];
  enviado: boolean;
  readonly: boolean;
};

function slugProcesso(p: string) {
  return p.replace(/\s/g, "");
}

export function DiagnosticoTab({
  empresaId,
  processos,
  respostaTipos,
  enviado,
  readonly,
}: Props) {
  const { showModal, showConfirm } = useApi();
  const [openProcess, setOpenProcess] = useState<string | null>(null);
  const [questionsByProcess, setQuestionsByProcess] = useState<
    Record<string, Question[]>
  >({});
  const [selections, setSelections] = useState<
    Record<string, Record<string, string>>
  >({});
  const [saving, setSaving] = useState(false);
  const disabled = readonly || enviado;

  const loadProcess = useCallback(
    async (processo: string) => {
      const qData = await apiFetch<{ questions: Question[] }>(
        `/api/diagnostico/questoes?processo=${encodeURIComponent(processo)}`,
      );
      setQuestionsByProcess((prev) => ({
        ...prev,
        [processo]: qData.questions,
      }));

      const aData = await apiFetch<{ answers: unknown[][] }>(
        `/api/diagnostico/respostas?processo=${encodeURIComponent(processo)}`,
      );
      const sel: Record<string, string> = {};
      aData.answers.forEach((row) => {
        const questaoId = String(row[5]);
        const resposta = String(row[6]);
        sel[questaoId] = resposta;
      });
      setSelections((prev) => ({ ...prev, [processo]: sel }));
    },
    [],
  );

  useEffect(() => {
    processos.forEach((p) => {
      loadProcess(p);
    });
  }, [processos, loadProcess]);

  function progress(processo: string) {
    const qs = questionsByProcess[processo] ?? [];
    if (qs.length === 0) return 0;
    const sel = selections[processo] ?? {};
    const answered = qs.filter((q) => sel[q.id]).length;
    return Math.round((answered / qs.length) * 100);
  }

  function collectRows() {
    const rows: [
      number,
      string,
      string,
      string,
      string,
      string,
      string,
    ][] = [];

    for (const processo of processos) {
      const qs = questionsByProcess[processo] ?? [];
      const sel = selections[processo] ?? {};
      for (const q of qs) {
        const resposta = sel[q.id];
        if (resposta) {
          rows.push([
            empresaId,
            q.estrutura,
            q.principio,
            q.capacidade,
            q.processo,
            q.id,
            resposta,
          ]);
        }
      }
    }
    return rows;
  }

  async function save(action: "save" | "send") {
    const rows = collectRows();
    if (rows.length === 0) {
      showModal(
        action === "send"
          ? "Não há dados a serem enviados..."
          : "Não há dados a serem salvos...",
      );
      return;
    }
    setSaving(true);
    try {
      const result = await apiFetch<{ message: string }>(
        "/api/diagnostico/respostas",
        {
          method: "POST",
          body: JSON.stringify({ action, data: rows }),
        },
      );
      showModal(result.message);
      if (action === "send") window.location.reload();
    } catch (err) {
      showModal(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {processos.map((processo) => {
        const slug = slugProcesso(processo);
        const pct = progress(processo);
        const isOpen = openProcess === processo;
        const questions = questionsByProcess[processo] ?? [];

        return (
          <div key={processo} className="i3-process-item">
            <button
              type="button"
              className={`i3-process-btn ${isOpen ? "open" : ""}`}
              onClick={() => setOpenProcess(isOpen ? null : processo)}
            >
              <div className="d-flex justify-content-between align-items-center gap-3">
                <span className="i3-process-name">{processo}</span>
                <span className="i3-progress-label">{pct}%</span>
              </div>
              <div className="progress mt-2">
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${pct}%` }}
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </button>

            {isOpen && (
              <div className="i3-process-panel">
                {questions.length === 0 && (
                  <p className="text-muted mb-0">
                    Nenhuma questão cadastrada para este processo.
                  </p>
                )}
                {questions.map((q, idx) => (
                  <div key={q.id} className="i3-question-card">
                    <div className="i3-question-label">Questão {idx + 1}</div>
                    <div className="i3-question-text">{q.enunciado}</div>
                    <div>
                      {respostaTipos.map((tipo) => {
                        const texto = q.alternativas[tipo];
                        if (!texto?.trim()) return null;
                        const checked =
                          selections[processo]?.[q.id] === tipo;
                        return (
                          <div key={tipo} className="i3-radio-option">
                            <div className="form-check mb-0">
                              <input
                                type="radio"
                                className="form-check-input"
                                name={`${slug}-${q.id}`}
                                id={`${slug}-${q.id}-${tipo}`}
                                checked={checked}
                                disabled={disabled}
                                onChange={() =>
                                  setSelections((prev) => ({
                                    ...prev,
                                    [processo]: {
                                      ...(prev[processo] ?? {}),
                                      [q.id]: tipo,
                                    },
                                  }))
                                }
                              />
                              <label
                                className="form-check-label"
                                htmlFor={`${slug}-${q.id}-${tipo}`}
                              >
                                <strong className="d-block fs-7 text-primary">
                                  {tipo}
                                </strong>
                                {texto}
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="i3-action-bar">
        <button
          type="button"
          className="btn btn-outline-primary btn-fixed-size"
          disabled={disabled || saving}
          title="Salva as respostas, mas ainda permitirá ajustes."
          onClick={() => save("save")}
        >
          <i className="bi bi-save me-1" /> Salvar
        </button>
        <button
          type="button"
          className="btn btn-primary btn-fixed-size"
          disabled={disabled || saving}
          title="Envia as respostas, NÃO permitirá mais ajustes."
          onClick={() =>
            showConfirm(
              "Você tem certeza que deseja enviar as respostas?",
              () => save("send"),
            )
          }
        >
          {saving ? (
            <span className="spinner-border spinner-border-sm me-1" />
          ) : (
            <i className="bi bi-send me-1" />
          )}
          Enviar
        </button>
      </div>
    </div>
  );
}
