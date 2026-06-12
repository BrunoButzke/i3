"use client";

import { useEffect, useState } from "react";
import { apiFetch, useApi } from "@/components/layout/AppShell";
import {
  SWOT_ITEM_MAX_LENGTH,
  type SwotItems,
  type SwotKey,
} from "@/lib/swot-utils";

const SWOT_CLASSES: Record<SwotKey, string> = {
  forca: "i3-swot-forca",
  fraqueza: "i3-swot-fraqueza",
  oportunidade: "i3-swot-oportunidade",
  ameaca: "i3-swot-ameaca",
};

const SWOT_LABELS: Record<SwotKey, string> = {
  forca: "Força",
  fraqueza: "Fraqueza",
  oportunidade: "Oportunidade",
  ameaca: "Ameaça",
};

const SWOT_ICONS: Record<SwotKey, string> = {
  forca: "bi-arrow-up-right-circle",
  fraqueza: "bi-exclamation-triangle",
  oportunidade: "bi-lightbulb",
  ameaca: "bi-shield-exclamation",
};

const EMPTY_SWOT: SwotItems = {
  forca: [],
  fraqueza: [],
  oportunidade: [],
  ameaca: [],
};

export function SWOTTab() {
  const { showModal, showConfirm } = useApi();
  const [items, setItems] = useState<SwotItems>(EMPTY_SWOT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addKey, setAddKey] = useState<SwotKey | null>(null);
  const [newText, setNewText] = useState("");

  useEffect(() => {
    apiFetch<SwotItems | null>("/api/swot")
      .then((data) => setItems(data ?? EMPTY_SWOT))
      .finally(() => setLoading(false));
  }, []);

  async function persist(next: SwotItems) {
    setSaving(true);
    try {
      await apiFetch("/api/swot", {
        method: "POST",
        body: JSON.stringify(next),
      });
      setItems(next);
    } catch (err) {
      showModal(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  function openAdd(key: SwotKey) {
    setAddKey(key);
    setNewText("");
  }

  async function confirmAdd() {
    if (!addKey) return;
    const text = newText.trim().slice(0, SWOT_ITEM_MAX_LENGTH);
    if (!text) {
      showModal("Informe a característica...");
      return;
    }

    const next: SwotItems = {
      ...items,
      [addKey]: [...items[addKey], text],
    };
    setAddKey(null);
    setNewText("");
    await persist(next);
  }

  function requestRemoveItem(key: SwotKey, index: number) {
    const texto = items[key][index];
    const preview =
      texto.length > 80 ? `${texto.slice(0, 80)}…` : texto;

    showConfirm(
      `Deseja excluir este item de ${SWOT_LABELS[key].toLowerCase()}?\n\n"${preview}"`,
      () => removeItem(key, index),
      {
        title: "Excluir item",
        confirmLabel: "Sim, excluir",
        confirmVariant: "danger",
        confirmIcon: "bi-trash",
        warning: "O item será removido permanentemente da matriz SWOT.",
      },
    );
  }

  async function removeItem(key: SwotKey, index: number) {
    const next: SwotItems = {
      ...items,
      [key]: items[key].filter((_, i) => i !== index),
    };
    if (
      !next.forca.length &&
      !next.fraqueza.length &&
      !next.oportunidade.length &&
      !next.ameaca.length
    ) {
      showModal("A matriz SWOT precisa ter ao menos um item.");
      return;
    }
    await persist(next);
  }

  function quadrant(key: SwotKey) {
    return (
      <div className="col text-start">
        <div className="d-flex align-items-center gap-2 mb-2">
          <span className={`i3-swot-label ${SWOT_CLASSES[key]} mb-0`}>
            <i className={`bi ${SWOT_ICONS[key]}`} /> {SWOT_LABELS[key]}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary i3-swot-add-btn"
            title={`Adicionar ${SWOT_LABELS[key].toLowerCase()}`}
            aria-label={`Adicionar ${SWOT_LABELS[key].toLowerCase()}`}
            disabled={saving}
            onClick={() => openAdd(key)}
          >
            <i className="bi bi-plus-lg" />
          </button>
        </div>
        <div className="i3-swot-list">
          {items[key].length === 0 ? (
            <p className="i3-swot-empty text-muted mb-0">
              Nenhum item adicionado. Clique em + para incluir.
            </p>
          ) : (
            <ul className="i3-swot-items mb-0">
              {items[key].map((texto, index) => (
                <li key={`${key}-${index}`} className="i3-swot-item">
                  <span>{texto}</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-danger p-0 ms-2"
                    title="Remover"
                    aria-label="Remover item"
                    disabled={saving}
                    onClick={() => requestRemoveItem(key, index)}
                  >
                    <i className="bi bi-x-lg" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="i3-loading-spinner mx-auto" role="status" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-2">
        <div className="row mb-2">
          <div className="col-2" />
          <div className="col text-center fw-semibold text-muted fs-7">
            Fatores Positivos
          </div>
          <div className="col text-center fw-semibold text-muted fs-7">
            Fatores Negativos
          </div>
        </div>
        <div className="row mb-3 g-3">
          <div className="col-2 d-flex align-items-center fw-semibold fs-7">
            Internos
          </div>
          {quadrant("forca")}
          {quadrant("fraqueza")}
        </div>
        <div className="row g-3">
          <div className="col-2 d-flex align-items-center fw-semibold fs-7">
            Externos
          </div>
          {quadrant("oportunidade")}
          {quadrant("ameaca")}
        </div>
      </div>

      {addKey !== null && (
        <div className="i3-modal-backdrop" onClick={() => setAddKey(null)}>
          <div
            className="i3-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="i3-modal-header">
              <h5 className="i3-modal-title">
                Adicionar {SWOT_LABELS[addKey].toLowerCase()}
              </h5>
            </div>
            <div className="i3-modal-body">
              <label htmlFor="swot-new-item" className="form-label">
                Característica
              </label>
              <textarea
                id="swot-new-item"
                className="form-control"
                rows={3}
                maxLength={SWOT_ITEM_MAX_LENGTH}
                value={newText}
                autoFocus
                placeholder="Descreva a característica..."
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    confirmAdd();
                  }
                }}
              />
              <div className="text-muted fs-8 mt-1 text-end">
                {newText.length}/{SWOT_ITEM_MAX_LENGTH}
              </div>
            </div>
            <div className="i3-modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setAddKey(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={confirmAdd}
              >
                {saving ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  "Salvar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
