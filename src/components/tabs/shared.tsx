import { ReactNode } from "react";

export function TabBlocoHeader({
  title,
  badge,
}: {
  title: string;
  badge?: string;
}) {
  return (
    <h5 className="i3-section-header">
      <span>{title}</span>
      {badge && <span className="badge bg-secondary">{badge}</span>}
    </h5>
  );
}

export function SaveRemoveButtons({
  onSave,
  onRemove,
  saving,
}: {
  onSave: () => void;
  onRemove?: () => void;
  saving?: boolean;
}) {
  return (
    <div className="d-flex justify-content-end gap-2">
      {onRemove && (
        <button
          type="button"
          className="btn btn-sm btn-danger"
          onClick={onRemove}
          disabled={saving}
        >
          <i className="bi bi-trash" /> Remover
        </button>
      )}
      <button
        type="button"
        className="btn btn-sm btn-primary"
        onClick={onSave}
        disabled={saving}
      >
        {saving ? (
          <span className="spinner-border spinner-border-sm" role="status" />
        ) : (
          <>
            <i className="bi bi-save" /> Salvar
          </>
        )}
      </button>
    </div>
  );
}

export function TabBloco({
  title,
  badge,
  children,
  className = "mb-4",
}: {
  title: string;
  badge?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`i3-bloco ${className}`}>
      <TabBlocoHeader title={title} badge={badge} />
      {children}
    </div>
  );
}

export function calcularPrioridadeGUT(g: number, u: number, t: number): {
  pontuacao: number;
  prioridade: string;
} {
  const pontuacao = g * u * t;
  if (!g || !u || !t) return { pontuacao: 0, prioridade: "" };
  let prioridade: string;
  if (pontuacao <= 20) prioridade = "Prioridade baixa";
  else if (pontuacao <= 60) prioridade = "Prioridade média";
  else prioridade = "Prioridade alta";
  return { pontuacao, prioridade };
}

export const STATUS_ACOMPANHAMENTO = {
  pendente: { label: "Pendente", color: "#d97706" },
  executando: { label: "Executando", color: "#2563eb" },
  concluido: { label: "Concluído", color: "#16a34a" },
  cancelado: { label: "Cancelado", color: "#dc2626" },
} as const;

export type StatusAcompanhamento = keyof typeof STATUS_ACOMPANHAMENTO;

export function normalizarStatus(status: string): StatusAcompanhamento {
  const s = status.toLowerCase().trim();
  if (s === "em andamento" || s === "executando") return "executando";
  if (s === "concluído" || s === "concluido") return "concluido";
  if (s === "cancelado") return "cancelado";
  return "pendente";
}
