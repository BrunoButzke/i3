"use client";

import { useModal } from "@/components/ModalProvider";

export function AppHeader() {
  return (
    <header className="container">
      <hr />
      <div className="row">
        <div className="col-3 text-center">
          <img
            className="w-50"
            src="https://lh3.googleusercontent.com/d/1RAZXpjSac0tirGTy07tAkIMhnef2pI7Q"
            alt="i3"
          />
        </div>
        <div className="col fw-bold text-center align-self-center">
          <h1>Índice da Indústria Inteligente</h1>
        </div>
      </div>
      <hr />
    </header>
  );
}

export function AppFooter() {
  return (
    <footer className="container">
      <div className="row">
        <div className="col fs-8 m-5">
          <span className="fw-bold">Aviso Legal:</span> Os dados pessoais
          coletados serão utilizados para atender sua solicitação e enviar
          conteúdo personalizado do Instituto SENAI de Tecnologia de Santa
          Catarina - IST/SC. Não utilizaremos seus dados para outras
          finalidades ou para compartilhamento com terceiros. Desejando mais
          informações sobre o tratamento dos seus dados ou para o exercício dos
          direitos do titular, consulte a nossa Política de Privacidade (
          <a
            href="https://fiesc.com.br/politica-de-privacidade"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://fiesc.com.br/politica-de-privacidade
          </a>
          ) ou entre em contato com nossa Encarregada de Dados - DPO em{" "}
          <a href="mailto:lgpd@fiesc.com.br">lgpd@fiesc.com.br</a>
        </div>
      </div>
      <div className="row">
        <div className="col text-center align-self-center">
          <p>
            Desenvolvido pelo Instituto SENAI de Tecnologia em Excelência
            Operacional
            <br />
            http://institutostecnologia.senai.br/
            <br />
            (47) 3341.2929
          </p>
        </div>
      </div>
    </footer>
  );
}

export function LoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      style={{
        display: "block",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 9999,
        textAlign: "center",
        paddingTop: "20%",
      }}
    >
      <div
        className="spinner-border text-light"
        style={{ width: "4rem", height: "4rem" }}
        role="status"
      />
      <div className="text-light mt-3 fs-5">Carregando dados...</div>
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
