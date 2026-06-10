"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

type ConfirmState = {
  message: string;
  onConfirm: () => void;
};

type ModalContextValue = {
  showModal: (message: string) => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
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
    (msg: string, onConfirm: () => void) =>
      setConfirm({ message: msg, onConfirm }),
    [],
  );

  return (
    <ModalContext.Provider value={{ showModal, showConfirm }}>
      {children}
      {message !== null && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1262 }}
        >
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-body text-center py-4">
                <p className="mb-0">{message}</p>
              </div>
              <div className="modal-footer justify-content-center border-0 pb-4">
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
        </div>
      )}
      {confirm !== null && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1262 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar Envio</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Fechar"
                  onClick={() => setConfirm(null)}
                />
              </div>
              <div className="modal-body">
                {confirm.message}
                <br />
                <br />
                <strong>Atenção:</strong> Esta ação é irreversível e o
                formulário não poderá mais ser atualizado.
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setConfirm(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => {
                    const fn = confirm.onConfirm;
                    setConfirm(null);
                    fn();
                  }}
                >
                  Sim, Enviar
                </button>
              </div>
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
