"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AppFooter, AppHeader, apiFetch } from "@/components/layout/AppShell";
import { useModal } from "@/components/ModalProvider";

export default function LoginPage() {
  const router = useRouter();
  const { showModal } = useModal();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const usuario = String(form.get("usuario") ?? "");
    const senha = String(form.get("senha") ?? "");

    if (!usuario) {
      showModal("Informe o usuário...");
      return;
    }
    if (!senha) {
      showModal("Informe a senha...");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ usuario, senha }),
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      showModal(err instanceof Error ? err.message : "Erro no login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="i3-login-page">
      <AppHeader />
      <main className="i3-login-main">
        <div className="i3-login-card">
          <img
            className="i3-login-card-logo"
            src="https://lh3.googleusercontent.com/d/1RAZXpjSac0tirGTy07tAkIMhnef2pI7Q"
            alt="i3"
          />
          <h2>Bem-vindo</h2>
          <p className="i3-login-desc">
            Acesse sua conta para continuar o diagnóstico
          </p>
          <form onSubmit={handleSubmit}>
            <div className="form-floating mb-3">
              <input
                type="text"
                id="usuario"
                name="usuario"
                className="form-control"
                placeholder="Usuário"
                autoComplete="username"
              />
              <label htmlFor="usuario">Usuário</label>
            </div>
            <div className="form-floating mb-4">
              <input
                type="password"
                id="senha"
                name="senha"
                className="form-control"
                placeholder="Senha"
                autoComplete="current-password"
              />
              <label htmlFor="senha">Senha</label>
            </div>
            <div className="d-grid">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    />
                    Entrando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2" />
                    Acessar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
