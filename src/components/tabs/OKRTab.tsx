"use client";

import { useEffect, useState } from "react";
import { apiFetch, useApi } from "@/components/layout/AppShell";
import { SaveRemoveButtons, TabBloco } from "@/components/tabs/shared";
import {
  enrichSwotRefs,
  createKeyResult,
  emptyOkr,
  KR_MAX_SWOT_REFS,
  KR_TEXT_MAX_LENGTH,
  type KeyResult,
  type OkrData,
  type SwotRef,
} from "@/lib/okr-utils";
import {
  formatSwotRefLabels,
  listAllSwotItems,
  SWOT_LABELS,
  type SwotItems,
  type SwotKey,
} from "@/lib/swot-utils";

const EMPTY_SWOT: SwotItems = {
  forca: [],
  fraqueza: [],
  oportunidade: [],
  ameaca: [],
};

const SWOT_BADGE_CLASS: Record<SwotKey, string> = {
  forca: "i3-swot-forca",
  fraqueza: "i3-swot-fraqueza",
  oportunidade: "i3-swot-oportunidade",
  ameaca: "i3-swot-ameaca",
};

function swotRefKey(ref: SwotRef) {
  return `${ref.categoria}:${ref.swotItemId}`;
}

type PickerContext = { okrIndex: number; krId: string };

export function OKRTab() {
  const { showModal, showConfirm } = useApi();
  const [okrs, setOkrs] = useState<OkrData[]>([emptyOkr()]);
  const [swot, setSwot] = useState<SwotItems>(EMPTY_SWOT);
  const [loading, setLoading] = useState(true);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [pickerContext, setPickerContext] = useState<PickerContext | null>(null);
  const [pickerSelection, setPickerSelection] = useState<SwotRef[]>([]);

  useEffect(() => {
    Promise.all([
      apiFetch<OkrData[]>("/api/okr"),
      apiFetch<SwotItems | null>("/api/swot"),
    ])
      .then(([okrData, swotData]) => {
        const swotItems = swotData ?? EMPTY_SWOT;
        setSwot(swotItems);
        setOkrs(
          okrData.length > 0
            ? okrData.map((okr) => ({
                ...okr,
                keyResults: okr.keyResults.map((kr) => ({
                  ...kr,
                  swotRefs: enrichSwotRefs(kr.swotRefs, swotItems),
                })),
              }))
            : [emptyOkr()],
        );
      })
      .finally(() => setLoading(false));
  }, []);

  function updateObjetivo(okrIndex: number, value: string) {
    setOkrs((prev) =>
      prev.map((okr, i) => (i === okrIndex ? { ...okr, objetivo: value } : okr)),
    );
  }

  function updateKr(okrIndex: number, krId: string, texto: string) {
    setOkrs((prev) =>
      prev.map((okr, i) =>
        i === okrIndex
          ? {
              ...okr,
              keyResults: okr.keyResults.map((kr) =>
                kr.id === krId
                  ? { ...kr, texto: texto.slice(0, KR_TEXT_MAX_LENGTH) }
                  : kr,
              ),
            }
          : okr,
      ),
    );
  }

  function addKr(okrIndex: number) {
    setOkrs((prev) =>
      prev.map((okr, i) =>
        i === okrIndex
          ? { ...okr, keyResults: [...okr.keyResults, createKeyResult()] }
          : okr,
      ),
    );
  }

  function removeKr(okrIndex: number, krId: string) {
    setOkrs((prev) =>
      prev.map((okr, i) =>
        i === okrIndex
          ? {
              ...okr,
              keyResults: okr.keyResults.filter((kr) => kr.id !== krId),
            }
          : okr,
      ),
    );
  }

  function addOkr() {
    setOkrs((prev) => [...prev, emptyOkr()]);
  }

  function openSwotPicker(okrIndex: number, kr: KeyResult) {
    setPickerContext({ okrIndex, krId: kr.id });
    setPickerSelection([...kr.swotRefs]);
  }

  function togglePickerRef(categoria: SwotKey, swotItemId: string) {
    const exists = pickerSelection.some(
      (ref) =>
        ref.categoria === categoria && ref.swotItemId === swotItemId,
    );

    if (!exists && pickerSelection.length >= KR_MAX_SWOT_REFS) {
      showModal(`Selecione no máximo ${KR_MAX_SWOT_REFS} itens da SWOT.`);
      return;
    }

    setPickerSelection((prev) => {
      const selected = prev.some(
        (ref) =>
          ref.categoria === categoria && ref.swotItemId === swotItemId,
      );
      if (selected) {
        return prev.filter(
          (ref) =>
            !(ref.categoria === categoria && ref.swotItemId === swotItemId),
        );
      }
      const texto = swot[categoria]?.find((i) => i.id === swotItemId)?.texto;
      return [
        ...prev,
        { categoria, swotItemId, ...(texto ? { texto } : {}) },
      ];
    });
  }

  function confirmSwotPicker() {
    if (!pickerContext) return;
    const { okrIndex, krId } = pickerContext;
    const refs = enrichSwotRefs(pickerSelection, swot);
    setOkrs((prev) =>
      prev.map((okr, i) =>
        i === okrIndex
          ? {
              ...okr,
              keyResults: okr.keyResults.map((kr) =>
                kr.id === krId ? { ...kr, swotRefs: refs } : kr,
              ),
            }
          : okr,
      ),
    );
    setPickerContext(null);
    setPickerSelection([]);
  }

  function removeSwotRef(okrIndex: number, krId: string, ref: SwotRef) {
    setOkrs((prev) =>
      prev.map((okr, i) =>
        i === okrIndex
          ? {
              ...okr,
              keyResults: okr.keyResults.map((kr) =>
                kr.id === krId
                  ? {
                      ...kr,
                      swotRefs: kr.swotRefs.filter(
                        (item) => swotRefKey(item) !== swotRefKey(ref),
                      ),
                    }
                  : kr,
              ),
            }
          : okr,
      ),
    );
  }

  function resolveSwotLabel(ref: SwotRef) {
    const [label] = formatSwotRefLabels(swot, [ref]);
    if (label) return label;
    const preview =
      ref.texto && ref.texto.length > 60
        ? `${ref.texto.slice(0, 60)}…`
        : ref.texto;
    if (preview) return `${SWOT_LABELS[ref.categoria]}: ${preview}`;
    return `${SWOT_LABELS[ref.categoria]} (removido)`;
  }

  function validateOkr(okr: OkrData) {
    const hasContent =
      okr.objetivo.trim() || okr.keyResults.some((kr) => kr.texto.trim());
    if (!hasContent) {
      showModal("Informe o objetivo ou adicione ao menos um KR.");
      return false;
    }
    for (const kr of okr.keyResults) {
      if (!kr.texto.trim()) {
        showModal("Todos os KRs precisam ter uma descrição.");
        return false;
      }
    }
    return true;
  }

  async function save(okrIndex: number) {
    const okr = okrs[okrIndex];
    if (!validateOkr(okr)) return;

    setSavingIndex(okrIndex);
    try {
      const result = await apiFetch<{ message: string }>("/api/okr", {
        method: "POST",
        body: JSON.stringify(okr),
      });
      showModal(result.message);
      const refreshed = await apiFetch<OkrData[]>("/api/okr");
      setOkrs(refreshed.length > 0 ? refreshed : [emptyOkr()]);
    } catch (err) {
      showModal(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSavingIndex(null);
    }
  }

  async function removeOkr(okrIndex: number) {
    const okr = okrs[okrIndex];
    if (okr.id) {
      await apiFetch("/api/okr", {
        method: "POST",
        body: JSON.stringify({ action: "delete", id: okr.id }),
      });
    }
    setOkrs((prev) => {
      const next = prev.filter((_, i) => i !== okrIndex);
      return next.length > 0 ? next : [emptyOkr()];
    });
  }

  const allSwotItems = listAllSwotItems(swot);
  const pickerOkrIndex = pickerContext?.okrIndex ?? null;
  const pickerKr =
    pickerOkrIndex !== null && pickerContext
      ? okrs[pickerOkrIndex]?.keyResults.find(
          (kr) => kr.id === pickerContext.krId,
        ) ?? null
      : null;

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="i3-loading-spinner mx-auto" role="status" />
      </div>
    );
  }

  return (
    <>
      <form className="mb-5" onSubmit={(e) => e.preventDefault()}>
        {okrs.map((okr, okrIndex) => (
          <TabBloco key={okr.id ?? `new-${okrIndex}`} title={`OKR ${okrIndex + 1}`}>
            <div className="mb-4">
              <label className="form-label text-start w-100">Objetivo:</label>
              <input
                type="text"
                className="form-control"
                value={okr.objetivo}
                onChange={(e) => updateObjetivo(okrIndex, e.target.value)}
              />
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 fw-semibold">Key Results (KRs)</h6>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => addKr(okrIndex)}
              >
                <i className="bi bi-plus-lg me-1" />
                Adicionar KR
              </button>
            </div>

            {okr.keyResults.length === 0 && (
              <p className="text-muted mb-0">
                Nenhum KR adicionado. Clique em &quot;Adicionar KR&quot; para
                começar.
              </p>
            )}

            {okr.keyResults.map((kr, krIndex) => (
              <div key={kr.id} className="i3-kr-card">
                <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                  <label
                    className="form-label text-start mb-0 fw-semibold"
                    htmlFor={`kr-${okrIndex}-${kr.id}`}
                  >
                    KR {krIndex + 1}
                  </label>
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-danger p-0"
                    title="Remover KR"
                    aria-label="Remover KR"
                    onClick={() => removeKr(okrIndex, kr.id)}
                  >
                    <i className="bi bi-trash" />
                  </button>
                </div>

                <input
                  id={`kr-${okrIndex}-${kr.id}`}
                  type="text"
                  className="form-control mb-3"
                  maxLength={KR_TEXT_MAX_LENGTH}
                  placeholder="Descreva o resultado-chave..."
                  value={kr.texto}
                  onChange={(e) => updateKr(okrIndex, kr.id, e.target.value)}
                />

                <div className="i3-kr-swot-section">
                  <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
                    <span className="form-label mb-0">
                      Itens da SWOT ({kr.swotRefs.length}/{KR_MAX_SWOT_REFS})
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      disabled={allSwotItems.length === 0}
                      onClick={() => openSwotPicker(okrIndex, kr)}
                    >
                      <i className="bi bi-diagram-3 me-1" />
                      Selecionar
                    </button>
                  </div>

                  {allSwotItems.length === 0 && (
                    <p className="text-muted fs-8 mb-0">
                      Preencha a matriz SWOT antes de correlacionar itens.
                    </p>
                  )}

                  {kr.swotRefs.length > 0 && (
                    <div className="d-flex flex-wrap gap-2">
                      {kr.swotRefs.map((ref) => (
                        <span
                          key={swotRefKey(ref)}
                          className={`i3-kr-swot-chip ${SWOT_BADGE_CLASS[ref.categoria]}`}
                        >
                          {resolveSwotLabel(ref)}
                          <button
                            type="button"
                            className="btn btn-sm btn-link p-0 ms-1"
                            aria-label="Remover item da SWOT"
                            onClick={() => removeSwotRef(okrIndex, kr.id, ref)}
                          >
                            <i className="bi bi-x-lg" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <SaveRemoveButtons
              onSave={() => save(okrIndex)}
              onRemove={() =>
                showConfirm(
                  "Deseja remover este OKR e todos os KRs associados?",
                  () => removeOkr(okrIndex),
                  {
                    title: "Remover OKR",
                    confirmLabel: "Sim, remover",
                    confirmVariant: "danger",
                    confirmIcon: "bi-trash",
                  },
                )
              }
              saving={savingIndex === okrIndex}
            />
          </TabBloco>
        ))}

        <div className="text-end">
          <button
            type="button"
            className="btn btn-secondary my-3"
            onClick={addOkr}
          >
            + Adicionar OKR
          </button>
        </div>
      </form>

      {pickerKr && pickerContext && (
        <div
          className="i3-modal-backdrop"
          onClick={() => {
            setPickerContext(null);
            setPickerSelection([]);
          }}
        >
          <div
            className="i3-modal i3-modal-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="i3-modal-header">
              <h5 className="i3-modal-title">
                Correlacionar SWOT — OKR {pickerContext.okrIndex + 1}, KR{" "}
                {okrs[pickerContext.okrIndex].keyResults.indexOf(pickerKr) + 1}
              </h5>
            </div>
            <div className="i3-modal-body">
              <p className="text-muted fs-8">
                Escolha de 1 a {KR_MAX_SWOT_REFS} itens de qualquer categoria
                da SWOT.
              </p>

              {allSwotItems.length === 0 ? (
                <p className="text-muted mb-0">
                  Não há itens na matriz SWOT para selecionar.
                </p>
              ) : (
                <div className="i3-kr-swot-picker">
                  {allSwotItems.map(({ categoria, item }) => {
                    const checked = pickerSelection.some(
                      (ref) =>
                        ref.categoria === categoria &&
                        ref.swotItemId === item.id,
                    );
                    return (
                      <label
                        key={`${categoria}-${item.id}`}
                        className={`i3-kr-swot-picker-item ${checked ? "selected" : ""}`}
                      >
                        <input
                          type="checkbox"
                          className="form-check-input mt-1"
                          checked={checked}
                          onChange={() =>
                            togglePickerRef(categoria, item.id)
                          }
                        />
                        <span>
                          <strong
                            className={`d-block fs-8 ${SWOT_BADGE_CLASS[categoria]}`}
                            style={{ width: "fit-content" }}
                          >
                            {SWOT_LABELS[categoria]}
                          </strong>
                          {item.texto}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="text-muted fs-8 mt-2 text-end">
                {pickerSelection.length}/{KR_MAX_SWOT_REFS} selecionados
              </div>
            </div>
            <div className="i3-modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setPickerContext(null);
                  setPickerSelection([]);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmSwotPicker}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
