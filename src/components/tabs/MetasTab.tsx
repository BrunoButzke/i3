"use client";

import { useEffect, useState } from "react";
import { apiFetch, useApi } from "@/components/layout/AppShell";
import { SaveRemoveButtons, TabBloco } from "@/components/tabs/shared";

type Meta = {
  objetivo: string;
  especifica: string;
  mensuravel: string;
  alcancavel: string;
  relevante: string;
  temporal: string;
};

const emptyMeta = (): Meta => ({
  objetivo: "",
  especifica: "",
  mensuravel: "",
  alcancavel: "",
  relevante: "",
  temporal: "",
});

export function MetasTab() {
  const { showModal } = useApi();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<Meta[]>("/api/metas").then((data) => {
      setMetas(
        data.length > 0
          ? data.map((m) => ({
              objetivo: m.objetivo,
              especifica: m.especifica ?? "",
              mensuravel: m.mensuravel ?? "",
              alcancavel: m.alcancavel ?? "",
              relevante: m.relevante ?? "",
              temporal: m.temporal ?? "",
            }))
          : [emptyMeta()],
      );
    });
  }, []);

  function update(index: number, field: keyof Meta, value: string) {
    setMetas((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  }

  async function save(index: number) {
    setSavingIndex(index);
    try {
      await apiFetch("/api/metas", {
        method: "POST",
        body: JSON.stringify(metas[index]),
      });
      showModal("Meta SMART salva com sucesso.");
    } catch (err) {
      showModal(err instanceof Error ? err.message : "Erro");
    } finally {
      setSavingIndex(null);
    }
  }

  async function remove(index: number) {
    const m = metas[index];
    if (m.objetivo) {
      await apiFetch("/api/metas", {
        method: "POST",
        body: JSON.stringify({ action: "delete", objetivo: m.objetivo }),
      });
    }
    setMetas((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form className="mb-5" onSubmit={(e) => e.preventDefault()}>
      {metas.map((meta, index) => (
        <TabBloco key={index} title={`Meta SMART ${index + 1}`}>
          <div className="mb-3">
            <label className="form-label text-start w-100">
              Objetivo geral:
            </label>
            <input
              type="text"
              className="form-control"
              value={meta.objetivo}
              onChange={(e) => update(index, "objetivo", e.target.value)}
            />
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label text-start w-100">Específica:</label>
              <input
                type="text"
                className="form-control"
                value={meta.especifica}
                onChange={(e) => update(index, "especifica", e.target.value)}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label text-start w-100">Mensurável:</label>
              <input
                type="text"
                className="form-control"
                value={meta.mensuravel}
                onChange={(e) => update(index, "mensuravel", e.target.value)}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label text-start w-100">Alcançável:</label>
              <input
                type="text"
                className="form-control"
                value={meta.alcancavel}
                onChange={(e) => update(index, "alcancavel", e.target.value)}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label text-start w-100">Relevante:</label>
              <input
                type="text"
                className="form-control"
                value={meta.relevante}
                onChange={(e) => update(index, "relevante", e.target.value)}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label text-start w-100">Temporal:</label>
              <input
                type="text"
                className="form-control"
                value={meta.temporal}
                onChange={(e) => update(index, "temporal", e.target.value)}
              />
            </div>
          </div>
          <SaveRemoveButtons
            onSave={() => save(index)}
            onRemove={() => remove(index)}
            saving={savingIndex === index}
          />
        </TabBloco>
      ))}

      <div className="text-end">
        <button
          type="button"
          className="btn btn-secondary my-3"
          onClick={() => setMetas((p) => [...p, emptyMeta()])}
        >
          + Adicionar Meta
        </button>
      </div>
    </form>
  );
}
