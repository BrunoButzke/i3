"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

export type ConfirmOptions = {
  title?: string;
  confirmLabel?: string;
  warning?: string | null;
  confirmVariant?: "primary" | "danger";
  confirmIcon?: string;
};

type ConfirmState = {
  message: string;
  onConfirm: () => void;
  options: ConfirmOptions;
};

type ModalContextValue = {
  showModal: (message: string) => void;
  showConfirm: (
    message: string,
    onConfirm: () => void,
    options?: ConfirmOptions,
  ) => void;
};

const ENVIAR_DEFAULTS: ConfirmOptions = {
  title: "Confirmar envio",
  confirmLabel: "Sim, enviar",
  warning:
    "Esta ação é irreversível e o formulário não poderá mais ser atualizado.",
  confirmVariant: "primary",
  confirmIcon: "bi-send",
};

const ModalContext = createContext<ModalContextValue>({
  showModal: () => {},
  showConfirm: () => {},
});

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const showModal = useCallback((msg: string) => setMessage(msg), []);
  const showConfirm = useCallback(
    (msg: string, onConfirm: () => void, options?: ConfirmOptions) =>
      setConfirm({
        message: msg,
        onConfirm,
        options: { ...ENVIAR_DEFAULTS, ...options },
      }),
    [],
  );

  const confirmOpts = confirm?.options ?? ENVIAR_DEFAULTS;

  return (
    <ModalContext.Provider value={{ showModal, showConfirm }}>
      {children}
      {message !== null && (
        <div className="i3-modal-backdrop" onClick={() => setMessage(null)}>
          <div
            className="i3-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="i3-modal-body text-center py-4">
              <i
                className="bi bi-info-circle text-primary mb-3 d-block"
                style={{ fontSize: "2rem" }}
              />
              <p className="mb-0">{message}</p>
            </div>
            <div className="i3-modal-footer center">
              <button
                type="button"
                className="btn btn-primary px-4"
                onClick={() => setMessage(null)}
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
      {confirm !== null && (
        <div className="i3-modal-backdrop">
          <div className="i3-modal i3-modal-lg" role="dialog">
            <div className="i3-modal-header">
              <h5 className="i3-modal-title">{confirmOpts.title}</h5>
            </div>
            <div className="i3-modal-body">
              <p className="mb-0">{confirm.message}</p>
              {confirmOpts.warning && (
                <div
                  className="p-3 rounded mt-3"
                  style={{
                    background: "var(--i3-blue-50)",
                    border: "1px solid var(--i3-blue-200)",
                    fontSize: "0.875rem",
                  }}
                >
                  <strong>Atenção:</strong> {confirmOpts.warning}
                </div>
              )}
            </div>
            <div className="i3-modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setConfirm(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={`btn btn-${confirmOpts.confirmVariant ?? "primary"}`}
                onClick={() => {
                  const fn = confirm.onConfirm;
                  setConfirm(null);
                  fn();
                }}
              >
                {confirmOpts.confirmIcon && (
                  <i className={`bi ${confirmOpts.confirmIcon} me-1`} />
                )}
                {confirmOpts.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}
