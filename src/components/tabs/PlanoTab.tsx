"use client";

import { useEffect, useState } from "react";
import { apiFetch, useApi } from "@/components/layout/AppShell";
import { SaveRemoveButtons, TabBloco } from "@/components/tabs/shared";

type Plano = {
  id: number;
  oque: string;
  quem: string;
  quando: string;
  onde: string;
  porque: string;
  como: string;
  quanto: string;
  prioridade: string;
};

export function PlanoTab() {
  const { showModal } = useApi();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<Plano[]>("/api/plano-acao").then(setPlanos);
  }, []);

  function update(id: number, field: keyof Plano, value: string) {
    setPlanos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  }

  async function salvar(plano: Plano) {
    setSavingId(plano.id);
    try {
      await apiFetch("/api/plano-acao", {
        method: "POST",
        body: JSON.stringify(plano),
      });
      showModal("Plano de ação salvo.");
    } catch (err) {
      showModal(err instanceof Error ? err.message : "Erro");
    } finally {
      setSavingId(null);
    }
  }

  if (planos.length === 0) {
    return (
      <div className="alert alert-secondary text-center p-3 rounded mt-3">
        Nenhuma ação cadastrada até o momento
      </div>
    );
  }

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      {planos.map((p, index) => (
        <TabBloco
          key={p.id}
          title={`Plano de Ação ${index + 1}`}
          badge={p.prioridade || "Sem prioridade"}
        >
          <div className="row">
            <div className="mb-3 col-md-6">
              <label className="form-label text-start w-100">O quê?</label>
              <input
                type="text"
                className="form-control"
                value={p.oque}
                disabled
                readOnly
              />
            </div>
            <div className="mb-3 col-md-6">
              <label className="form-label text-start w-100">Quem?</label>
              <input
                type="text"
                className="form-control"
                value={p.quem}
                onChange={(e) => update(p.id, "quem", e.target.value)}
              />
            </div>
          </div>
          <div className="row">
            <div className="mb-3 col-md-4">
              <label className="form-label text-start w-100">Quando?</label>
              <input
                type="date"
                className="form-control"
                value={p.quando}
                onChange={(e) => update(p.id, "quando", e.target.value)}
              />
            </div>
            <div className="mb-3 col-md-4">
              <label className="form-label text-start w-100">Onde?</label>
              <input
                type="text"
                className="form-control"
                value={p.onde}
                onChange={(e) => update(p.id, "onde", e.target.value)}
              />
            </div>
            <div className="mb-3 col-md-4">
              <label className="form-label text-start w-100">Por que?</label>
              <input
                type="text"
                className="form-control"
                value={p.porque}
                onChange={(e) => update(p.id, "porque", e.target.value)}
              />
            </div>
          </div>
          <div className="row">
            <div className="mb-3 col-md-6">
              <label className="form-label text-start w-100">Como?</label>
              <input
                type="text"
                className="form-control"
                value={p.como}
                onChange={(e) => update(p.id, "como", e.target.value)}
              />
            </div>
            <div className="mb-3 col-md-6">
              <label className="form-label text-start w-100">Quanto?</label>
              <input
                type="text"
                className="form-control"
                value={p.quanto}
                onChange={(e) => update(p.id, "quanto", e.target.value)}
              />
            </div>
          </div>
          <SaveRemoveButtons
            onSave={() => salvar(p)}
            saving={savingId === p.id}
          />
        </TabBloco>
      ))}
    </form>
  );
}
