"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, useApi } from "@/components/layout/AppShell";

const SWOT_CLASSES: Record<string, string> = {
  forca: "i3-swot-forca",
  fraqueza: "i3-swot-fraqueza",
  oportunidade: "i3-swot-oportunidade",
  ameaca: "i3-swot-ameaca",
};

export function SWOTTab() {
  const { showModal } = useApi();
  const [form, setForm] = useState({
    forca: "",
    fraqueza: "",
    oportunidade: "",
    ameaca: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<typeof form | null>("/api/swot").then((data) => {
      if (data) setForm(data);
    });
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await apiFetch<{ message: string }>("/api/swot", {
        method: "POST",
        body: JSON.stringify(form),
      });
      showModal(result.message);
    } catch (err) {
      showModal(err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  const field = (
    key: keyof typeof form,
    label: string,
    icon: string,
  ) => (
    <div className="col text-start">
      <label htmlFor={key} className={`i3-swot-label ${SWOT_CLASSES[key]}`}>
        <i className={`bi ${icon}`} /> {label}
      </label>
      <textarea
        id={key}
        className="form-control"
        rows={4}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <form onSubmit={handleSave}>
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
        {field("forca", "Força", "bi-arrow-up-right-circle")}
        {field("fraqueza", "Fraqueza", "bi-exclamation-triangle")}
      </div>
      <div className="row g-3">
        <div className="col-2 d-flex align-items-center fw-semibold fs-7">
          Externos
        </div>
        {field("oportunidade", "Oportunidade", "bi-lightbulb")}
        {field("ameaca", "Ameaça", "bi-shield-exclamation")}
      </div>
      <div className="i3-action-bar">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? (
            <span className="spinner-border spinner-border-sm me-1" />
          ) : (
            <i className="bi bi-save me-1" />
          )}
          Salvar
        </button>
      </div>
    </form>
  );
}
