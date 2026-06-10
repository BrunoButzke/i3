"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, useApi } from "@/components/layout/AppShell";

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
    bg: string,
    icon: string,
  ) => (
    <div className="col text-start">
      <label
        htmlFor={key}
        className="form-label px-3 py-2 rounded fw-bold d-inline-block mb-1"
        style={{ backgroundColor: bg, color: "#000" }}
      >
        <i className={`bi ${icon} me-1`} /> {label}
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
    <form className="mb-5 mt-3" onSubmit={handleSave}>
      <div className="row mb-2">
        <div className="col-2" />
        <div className="col text-center fw-bold">Fatores Positivos</div>
        <div className="col text-center fw-bold">Fatores Negativos</div>
      </div>
      <div className="row mb-3">
        <div className="col-2 d-flex align-items-center fw-bold">
          Fatores Internos
        </div>
        {field("forca", "Força", "#d4edda", "bi-arrow-up-right-circle")}
        {field("fraqueza", "Fraqueza", "#f8d7da", "bi-exclamation-triangle")}
      </div>
      <div className="row">
        <div className="col-2 d-flex align-items-center fw-bold">
          Fatores Externos
        </div>
        {field("oportunidade", "Oportunidade", "#d1ecf1", "bi-lightbulb")}
        {field("ameaca", "Ameaça", "#fff3cd", "bi-bug")}
      </div>
      <div className="row text-end px-3 pt-4 pb-3">
        <div className="col">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <i className="bi bi-save" /> Salvar
          </button>
        </div>
      </div>
    </form>
  );
}
