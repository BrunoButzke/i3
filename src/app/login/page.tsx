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
    <>
      <AppHeader />
      <main className="container">
        <div className="row">
          <div className="col-sm-9 col-md-7 col-lg-5 mx-auto">
            <div className="card border-0 shadow rounded-3 my-5">
              <div className="card-body p-4 p-sm-5">
                <form onSubmit={handleSubmit}>
                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      id="usuario"
                      name="usuario"
                      className="form-control"
                      placeholder="Usuário"
                    />
                    <label htmlFor="usuario">Usuário</label>
                  </div>
                  <div className="form-floating mb-3">
                    <input
                      type="password"
                      id="senha"
                      name="senha"
                      className="form-control"
                      placeholder="Senha"
                    />
                    <label htmlFor="senha">Senha</label>
                  </div>
                  <div className="d-grid">
                    <button
                      type="submit"
                      className="btn btn-primary text-uppercase fw-bold"
                      disabled={loading}
                    >
                      {loading ? "Carregando..." : "Acessar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <hr />
      </main>
      <AppFooter />
    </>
  );
}
