"use client";

import { useEffect, useState } from "react";
import { apiFetch, useApi } from "@/components/layout/AppShell";
import { SaveRemoveButtons, TabBloco } from "@/components/tabs/shared";

type OKR = {
  id?: number;
  objetivo: string;
  okr1: string;
  okr2: string;
  okr3: string;
};

const emptyOkr = (): OKR => ({
  objetivo: "",
  okr1: "",
  okr2: "",
  okr3: "",
});

export function OKRTab() {
  const { showModal } = useApi();
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<OKR[]>("/api/okr").then((data) => {
      setOkrs(data.length > 0 ? data : [emptyOkr()]);
    });
  }, []);

  function update(index: number, field: keyof OKR, value: string) {
    setOkrs((prev) =>
      prev.map((o, i) => (i === index ? { ...o, [field]: value } : o)),
    );
  }

  async function save(index: number) {
    const o = okrs[index];
    setSavingIndex(index);
    try {
      await apiFetch("/api/okr", { method: "POST", body: JSON.stringify(o) });
      showModal("OKR salvo com sucesso.");
    } catch (err) {
      showModal(err instanceof Error ? err.message : "Erro");
    } finally {
      setSavingIndex(null);
    }
  }

  async function remove(index: number) {
    const o = okrs[index];
    if (o.objetivo) {
      await apiFetch("/api/okr", {
        method: "POST",
        body: JSON.stringify({ action: "delete", ...o }),
      });
    }
    setOkrs((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form className="mb-5" onSubmit={(e) => e.preventDefault()}>
      {okrs.map((okr, index) => (
        <TabBloco key={index} title={`OKR ${index + 1}`}>
          <div className="mb-3">
            <label className="form-label text-start w-100">Objetivo:</label>
            <input
              type="text"
              className="form-control"
              value={okr.objetivo}
              onChange={(e) => update(index, "objetivo", e.target.value)}
            />
          </div>
          <div className="row">
            {(["okr1", "okr2", "okr3"] as const).map((k, i) => (
              <div key={k} className="col-md-4 mb-3">
                <label className="form-label text-start w-100">
                  OKR{i + 1}:
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={okr[k]}
                  onChange={(e) => update(index, k, e.target.value)}
                />
              </div>
            ))}
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
          onClick={() => setOkrs((p) => [...p, emptyOkr()])}
        >
          + Adicionar OKR
        </button>
      </div>
    </form>
  );
}
