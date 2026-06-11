"use client";

import { useModal } from "@/components/ModalProvider";

export function AppHeader() {
  return (
    <header className="i3-header">
      <div className="i3-header-inner">
        <img
          className="i3-header-logo"
          src="https://lh3.googleusercontent.com/d/1RAZXpjSac0tirGTy07tAkIMhnef2pI7Q"
          alt="i3"
        />
        <div className="i3-header-brand">
          <h1 className="i3-header-title">Índice da Indústria Inteligente</h1>
          <p className="i3-header-subtitle">
            Diagnóstico · Maturidade · Plano de Ação
          </p>
        </div>
      </div>
    </header>
  );
}

export function AppFooter() {
  return (
    <footer className="i3-footer">
      <div className="i3-footer-inner">
        <p className="i3-footer-legal">
          <strong>Aviso Legal:</strong> Os dados pessoais coletados serão
          utilizados para atender sua solicitação e enviar conteúdo
          personalizado do Instituto SENAI de Tecnologia de Santa Catarina —
          IST/SC. Não utilizaremos seus dados para outras finalidades ou para
          compartilhamento com terceiros. Consulte a{" "}
          <a
            href="https://fiesc.com.br/politica-de-privacidade"
            target="_blank"
            rel="noopener noreferrer"
          >
            Política de Privacidade
          </a>{" "}
          ou entre em contato com nossa Encarregada de Dados em{" "}
          <a href="mailto:lgpd@fiesc.com.br">lgpd@fiesc.com.br</a>.
        </p>
        <p className="i3-footer-credits">
          Desenvolvido pelo Instituto SENAI de Tecnologia em Excelência
          Operacional
          <br />
          institutostecnologia.senai.br · (47) 3341-2929
        </p>
      </div>
    </footer>
  );
}

export function LoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="i3-loading-overlay">
      <div className="i3-loading-spinner" role="status" aria-label="Carregando" />
      <div className="i3-loading-text">Carregando dados...</div>
    </div>
  );
}

export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Erro na requisição");
  }
  return data as T;
}

export function useApi() {
  const { showModal, showConfirm } = useModal();
  return {
    fetch: apiFetch,
    showModal,
    showConfirm,
  };
}
