"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  TEOR_BANDAS_DEFAULTS,
  TEOR_BANDAS_IDS,
  TEOR_BENCHMARKS,
  TEOR_CUSTOS_KEYS,
  TEOR_HORIZONTES,
  TEOR_KPIS,
} from "@/lib/teor-data";
import {
  calcularTeor,
  parseTeorFromDados,
  type TeorRankingItem,
} from "@/lib/teor-calculo";
import { apiFetch, useApi } from "@/components/layout/AppShell";

const CUSTOS: { key: (typeof TEOR_CUSTOS_KEYS)[number]; label: string }[] = [
  { key: "materiaPrima", label: "Matéria-prima e consumíveis" },
  { key: "utilidades", label: "Utilidades" },
  { key: "maoObra", label: "Mão de obra" },
  { key: "manutencao", label: "Manutenção e Reparo" },
  { key: "locacao", label: "Locação e Locação Operacional" },
  { key: "depreciacao", label: "Depreciação" },
  { key: "pesquisa", label: "Pesquisa e Desenvolvimento (P&D)" },
  { key: "posVenda", label: "Serviços de pós-venda / Garantia" },
  { key: "despesasGerais", label: "Despesas de vendas, gerais e administrativas" },
  { key: "transporte", label: "Transporte e Distribuição" },
];

const BANDAS_LABELS: Record<string, string> = {
  "integracao-vertical": "Integração vertical",
  "integracao-horizontal": "Integração horizontal",
  "ciclo-de-vida-do-produto": "Ciclo de vida do produto",
  "automacao-chao-de-fabrica": "Chão de fábrica",
  "automacao-empresarial": "Empresarial",
  "automacao-instalacoes": "Instalações",
  "conectividade-chao-de-fabrica": "Chão de fábrica",
  "conectividade-empresarial": "Empresarial",
  "conectividade-instalacoes": "Instalações",
  "inteligencia-chao-de-fabrica": "Chão de fábrica",
  "inteligencia-empresarial": "Empresarial",
  "inteligencia-instalacoes": "Instalações",
  "desenvolvimento-da-forca-de-trabalho": "Desenvolvimento da força de trabalho",
  "competencia-da-lideranca": "Competência da liderança",
  "colaboracao-inter-e-intra-companhia": "Colaboração inter e intra companhia",
  "estrategia-e-governanca": "Estratégia e governança",
};

const GRUPO_TITULOS: Record<string, string> = {
  processo: "Processo",
  tecnologia: "Tecnologia",
  operacao: "Operação",
  maiorRestante: "Maior dos Restantes",
};

export function MemoriaTab() {
  const { showModal } = useApi();
  const [dados, setDados] = useState<Record<string, string>>({});
  const [ranking, setRanking] = useState<TeorRankingItem[] | null>(null);

  useEffect(() => {
    apiFetch<Record<string, string>[]>("/api/memoria").then((rows) => {
      const base: Record<string, string> = {};
      Object.entries(TEOR_BANDAS_DEFAULTS).forEach(([k, v]) => {
        base[k] = String(v);
      });
      if (rows[0]) {
        const loaded = rows[0] as Record<string, string>;
        setDados({ ...base, ...loaded });
      } else {
        setDados(base);
      }
    });
  }, []);

  function toggleKpi(kpi: string) {
    const atual = (dados.kpisString ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const sel = new Set(atual);
    if (sel.has(kpi)) {
      if (sel.size <= 1) {
        showModal("Selecione ao menos um KPI.");
        return;
      }
      sel.delete(kpi);
    } else {
      if (sel.size >= 5) {
        showModal("Selecione no máximo 5 KPIs.");
        return;
      }
      sel.add(kpi);
    }
    setDados({ ...dados, kpisString: [...sel].join(", ") });
  }

  function kpiSelecionado(kpi: string) {
    return (dados.kpisString ?? "")
      .split(",")
      .map((s) => s.trim())
      .includes(kpi);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/api/memoria", {
        method: "POST",
        body: JSON.stringify(dados),
      });
      showModal("Memória SIRI salva com sucesso.");
    } catch (err) {
      showModal(err instanceof Error ? err.message : "Erro");
    }
  }

  function calcular() {
    try {
      const input = parseTeorFromDados(dados);
      const result = calcularTeor(input);
      setRanking(result);
    } catch (err) {
      showModal(err instanceof Error ? err.message : "Erro no cálculo");
    }
  }

  return (
    <form className="mt-3" onSubmit={handleSubmit}>
      <div className="custo-bloco border p-3 mb-4 rounded bg-white">
        <h5 className="i3-section-header">
          Custos
        </h5>
        <div className="row align-items-stretch">
          {CUSTOS.map(({ key, label }) => (
            <div key={key} className="col-md-4 mb-3 d-flex">
              <div className="i3-labelled-field">
                <label className="form-label i3-field-label">{label}:</label>
                <input
                  type="number"
                  className="form-control"
                  value={dados[key] ?? ""}
                  onChange={(e) => setDados({ ...dados, [key]: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="custo-bloco border p-3 mb-4 rounded bg-white">
        <h5 className="i3-section-header">
          KPI (Selecione até 5 itens)
        </h5>
        <div className="row">
          {TEOR_KPIS.map((kpi, i) => (
            <div key={kpi} className="col-md-4 mb-2">
              <input
                type="checkbox"
                className="btn-check"
                id={`kpi-${i}`}
                checked={kpiSelecionado(kpi)}
                onChange={() => toggleKpi(kpi)}
              />
              <label
                className="btn btn-outline-primary w-100"
                htmlFor={`kpi-${i}`}
              >
                {kpi}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="custo-bloco border p-3 mb-4 rounded bg-white">
        <h5 className="i3-section-header">
          Benchmark (Selecione apenas 1 item)
        </h5>
        <div className="row">
          {TEOR_BENCHMARKS.map((bench, i) => (
            <div key={bench} className="col-md-4 mb-2">
              <input
                type="radio"
                className="btn-check"
                name="benchmark"
                id={`bench-${i}`}
                checked={dados.benchmarkString === bench}
                onChange={() => setDados({ ...dados, benchmarkString: bench })}
              />
              <label
                className="btn btn-outline-primary w-100"
                htmlFor={`bench-${i}`}
              >
                {bench}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="custo-bloco border p-3 mb-4 rounded bg-white">
        <h5 className="i3-section-header">
          Horizonte de Planejamento (Selecione apenas 1 item)
        </h5>
        <div className="row">
          {TEOR_HORIZONTES.map((h, i) => (
            <div key={h} className="col-md-4 mb-2">
              <input
                type="radio"
                className="btn-check"
                name="horizonte"
                id={`horizonte-${i}`}
                checked={dados.horizonteString === h}
                onChange={() => setDados({ ...dados, horizonteString: h })}
              />
              <label
                className="btn btn-outline-primary w-100"
                htmlFor={`horizonte-${i}`}
              >
                {h}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="custo-bloco border p-3 mb-4 rounded bg-white">
        <h5 className="i3-section-header">
          Bandas
        </h5>
        <h6 className="text-start fw-bold mt-3">Processo</h6>
        <div className="row align-items-stretch">
          {TEOR_BANDAS_IDS.slice(0, 3).map((id) => (
            <div key={id} className="col-md-4 mb-3 d-flex">
              <div className="i3-labelled-field">
                <label className="form-label i3-field-label">{BANDAS_LABELS[id]}</label>
                <input
                  type="number"
                  className="form-control input-ajuste"
                  value={dados[id] ?? TEOR_BANDAS_DEFAULTS[id]}
                  onChange={(e) => setDados({ ...dados, [id]: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
        {(["automacao", "conectividade", "inteligencia"] as const).map((grupo) => (
          <div key={grupo}>
            <h6 className="text-start fw-bold mt-3 text-capitalize">
              Tecnologia - {grupo === "automacao" ? "Automação" : grupo === "conectividade" ? "Conectividade" : "Inteligência"}
            </h6>
            <div className="row align-items-stretch">
              {TEOR_BANDAS_IDS.filter((id) => id.startsWith(grupo)).map((id) => (
                <div key={id} className="col-md-4 mb-3 d-flex">
                  <div className="i3-labelled-field">
                    <label className="form-label i3-field-label">{BANDAS_LABELS[id]}</label>
                    <input
                      type="number"
                      className="form-control input-ajuste"
                      value={dados[id] ?? TEOR_BANDAS_DEFAULTS[id]}
                      onChange={(e) => setDados({ ...dados, [id]: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <h6 className="text-start fw-bold mt-3">Organização</h6>
        <div className="row align-items-stretch">
          {TEOR_BANDAS_IDS.slice(12).map((id) => (
            <div key={id} className="col-md-3 mb-3 d-flex">
              <div className="i3-labelled-field i3-labelled-field--wide">
                <label className="form-label i3-field-label">{BANDAS_LABELS[id]}</label>
                <input
                  type="number"
                  className="form-control input-ajuste"
                  value={dados[id] ?? TEOR_BANDAS_DEFAULTS[id]}
                  onChange={(e) => setDados({ ...dados, [id]: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2 mb-4">
        <button type="submit" className="btn btn-primary">
          <i className="bi bi-save" /> Salvar
        </button>
        <button type="button" className="btn btn-success" onClick={calcular}>
          <i className="bi bi-calculator" /> Calcular
        </button>
      </div>

      {ranking && (
        <div className="mt-4 mb-4 border rounded bg-white p-3">
          <p className="fs-6 fw-bold">RESULTADOS MÁXIMOS POR GRUPO</p>
          <table className="table table-bordered mb-0">
            <thead className="table-light">
              <tr>
                <th>Grupo</th>
                <th>Item</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r) => (
                <tr key={r.grupo}>
                  <td className="fw-bold">{GRUPO_TITULOS[r.grupo] ?? r.grupo}</td>
                  <td>{r.chave}</td>
                  <td>{r.valor.toFixed(6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </form>
  );
}
