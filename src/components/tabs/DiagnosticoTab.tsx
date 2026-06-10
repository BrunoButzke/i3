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
    <div className="mt-3">
      {processos.map((processo) => {
        const slug = slugProcesso(processo);
        const pct = progress(processo);
        const isOpen = openProcess === processo;
        const questions = questionsByProcess[processo] ?? [];

        return (
          <div key={processo} className="mb-2">
            <button
              type="button"
              className={`btn ${isOpen ? "btn-primary" : "btn-outline-primary"} text-start my-1 w-100`}
              onClick={() => setOpenProcess(isOpen ? null : processo)}
            >
              <div className="row">
                <div className="col-6">{processo}</div>
                <div className="col my-1">
                  <div className={`progress bg-primary ${isOpen ? "active" : ""}`}>
                    <div
                      className="progress-bar bg-light text-primary"
                      style={{ width: `${pct}%` }}
                    >
                      {pct}%
                    </div>
                  </div>
                </div>
              </div>
            </button>

            {isOpen && (
              <div className="container collapse show">
                <div className="row px-4 justify-content-center">
                  {questions.length === 0 && (
                    <p className="text-muted">
                      Nenhuma questão cadastrada para este processo.
                    </p>
                  )}
                  {questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="row text-start shadow-sm px-2 py-3 my-2 bg-body rounded w-100"
                    >
                      <div>
                        <strong>QUESTÃO {idx + 1}</strong> - {q.enunciado}
                      </div>
                      <div className="py-3">
                        {respostaTipos.map((tipo) => {
                          const texto = q.alternativas[tipo];
                          if (!texto?.trim()) return null;
                          const checked =
                            selections[processo]?.[q.id] === tipo;
                          return (
                            <div key={tipo} className="form-check">
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
                                {texto}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="row text-end px-3 pt-4 pb-3">
        <div className="col">
          <button
            type="button"
            className="btn btn-primary btn-fixed-size me-2"
            disabled={disabled || saving}
            title="Salva as respostas, mas ainda permitirá ajustes."
            onClick={() => save("save")}
          >
            <i className="bi bi-save" /> Salvar
          </button>
          <button
            type="button"
            className="btn btn-success btn-fixed-size"
            disabled={disabled || saving}
            title="Envia as respostas, NÃO permitirá mais ajustes."
            onClick={() =>
              showConfirm(
                "Você tem certeza que deseja enviar as respostas?",
                () => save("send"),
              )
            }
          >
            <i className="bi bi-send me-1" /> Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
