import { useEffect, type RefObject } from "react";
import type { Chart } from "chart.js";

export const BAR_SCREEN = {
  barPercentage: 0.85,
  categoryPercentage: 0.78,
} as const;

export const BAR_PRINT_VERTICAL = {
  barPercentage: 0.72,
  categoryPercentage: 0.78,
  maxBarThickness: 50,
} as const;

export const BAR_PRINT_HORIZONTAL = {
  barPercentage: 0.55,
  categoryPercentage: 0.68,
  maxBarThickness: 12,
} as const;

function aplicarEstiloBarras(
  chart: Chart<"bar">,
  printing: boolean,
  mode: "vertical" | "horizontal",
) {
  if (!chart.options.datasets) chart.options.datasets = {};
  chart.options.datasets.bar = printing
    ? { ...(mode === "horizontal" ? BAR_PRINT_HORIZONTAL : BAR_PRINT_VERTICAL) }
    : { ...BAR_SCREEN };

  const scales = chart.options.scales;
  if (scales?.x?.ticks) {
    if (printing) {
      scales.x.ticks.font = { size: 7 };
      scales.x.ticks.maxRotation = 55;
      scales.x.ticks.minRotation = 55;
    } else {
      scales.x.ticks.font = { size: 11 };
      delete scales.x.ticks.maxRotation;
      delete scales.x.ticks.minRotation;
    }
  }
  if (scales?.y?.ticks) {
    scales.y.ticks.font = { size: printing ? 7 : 11 };
  }
}

export function useBarChartImpressao(
  chartRef: RefObject<Chart<"bar"> | null>,
  mode: "vertical" | "horizontal" = "vertical",
) {
  useEffect(() => {
    const atualizar = (printing: boolean) => {
      const chart = chartRef.current;
      if (!chart) return;
      aplicarEstiloBarras(chart, printing, mode);
      chart.update("none");
      chart.resize();
    };

    const onBefore = () => atualizar(true);
    const onAfter = () => atualizar(false);

    window.addEventListener("beforeprint", onBefore);
    window.addEventListener("afterprint", onAfter);
    return () => {
      window.removeEventListener("beforeprint", onBefore);
      window.removeEventListener("afterprint", onAfter);
    };
  }, [chartRef, mode]);
}
