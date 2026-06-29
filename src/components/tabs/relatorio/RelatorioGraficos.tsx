"use client";

import { useRef } from "react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import type { Chart } from "chart.js";
import { Bar } from "react-chartjs-2";
import type { RelatorioTeor } from "@/lib/relatorio/relatorio-types";
import {
  BAR_SCREEN,
  useBarChartImpressao,
} from "@/components/tabs/relatorio/use-bar-chart-impressao";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CORES_MATURIDADE = [
  "#93c5fd",
  "#60a5fa",
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
  "#1e3a8a",
];

const OPCOES_BARRA = {
  responsive: true,
  maintainAspectRatio: false,
  datasets: {
    bar: { ...BAR_SCREEN },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { parsed: { y: number | null } }) =>
          `${ctx.parsed.y?.toFixed(2) ?? 0}%`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: { callback: (v: number | string) => `${v}%` },
    },
  },
} as const;

type PercentualItem = { resposta: string; percentual: string };

export function GraficoPercentuaisMaturidade({
  titulo,
  items,
  corBase,
}: {
  titulo: string;
  items: PercentualItem[];
  corBase?: string;
}) {
  const chartRef = useRef<Chart<"bar">>(null);
  useBarChartImpressao(chartRef, "vertical");

  if (items.every((i) => parseFloat(i.percentual) === 0)) return null;

  const data = {
    labels: items.map((i) => i.resposta),
    datasets: [
      {
        label: titulo,
        data: items.map((i) => parseFloat(i.percentual)),
        backgroundColor: corBase
          ? items.map(() => corBase)
          : CORES_MATURIDADE.slice(0, items.length),
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="i3-relatorio-doc-grafico">
      <Bar ref={chartRef} data={data} options={OPCOES_BARRA} />
    </div>
  );
}

export function GraficoTeorBenchmark({ teor }: { teor: RelatorioTeor }) {
  const chartRef = useRef<Chart<"bar">>(null);
  useBarChartImpressao(chartRef, "horizontal");

  const rows = teor.benchmarkComparativo;
  if (rows.length === 0) return null;

  const labels = rows.map((r) =>
    r.dimensao.length > 28 ? `${r.dimensao.slice(0, 26)}…` : r.dimensao,
  );

  const data = {
    labels,
    datasets: [
      {
        label: "Nível empresa",
        data: rows.map((r) => r.nivelEmpresa),
        backgroundColor: "#2563eb",
        borderRadius: 3,
      },
      {
        label: "Referência setor",
        data: rows.map((r) => r.referenciaSetor),
        backgroundColor: "#94a3b8",
        borderRadius: 3,
      },
    ],
  };

  return (
    <div className="i3-relatorio-doc-grafico i3-relatorio-doc-grafico--teor">
      <Bar
        ref={chartRef}
        data={data}
        options={{
          indexAxis: "y" as const,
          responsive: true,
          maintainAspectRatio: false,
          datasets: {
            bar: { ...BAR_SCREEN },
          },
          plugins: { legend: { position: "bottom" as const } },
          scales: {
            x: {
              beginAtZero: true,
              max: 5,
              ticks: { stepSize: 1 },
            },
          },
        }}
      />
    </div>
  );
}
