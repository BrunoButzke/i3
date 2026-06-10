"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AppFooter,
  AppHeader,
  LoadingOverlay,
  apiFetch,
} from "@/components/layout/AppShell";
import { TABS, TabId } from "@/lib/constants";
import { DiagnosticoTab } from "@/components/tabs/DiagnosticoTab";
import { SWOTTab } from "@/components/tabs/SWOTTab";
import { OKRTab } from "@/components/tabs/OKRTab";
import { MetasTab } from "@/components/tabs/MetasTab";
import { PriorizacaoTab } from "@/components/tabs/PriorizacaoTab";
import { PlanoTab } from "@/components/tabs/PlanoTab";
import { AcompanhamentoTab } from "@/components/tabs/AcompanhamentoTab";
import { MemoriaTab } from "@/components/tabs/MemoriaTab";
import { RelatorioTab } from "@/components/tabs/RelatorioTab";

type MeResponse = {
  id: number;
  empresa: string;
  cnpj: string | null;
  representante: string | null;
  enviado: string;
  processos: string[];
  respostas: string[];
};

export function DashboardClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("diagnostico");
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    apiFetch<MeResponse>("/api/auth/me")
      .then(setMe)
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (loading || !me) {
    return (
      <>
        <AppHeader />
        <LoadingOverlay show />
      </>
    );
  }

  const enviado = me.enviado === "SIM";

  return (
    <>
      <AppHeader />
      <main className="container">
        <div className="row text-center">
          <h2>
            {me.empresa} - {me.cnpj}
          </h2>
          <h4>{me.representante}</h4>
          {enviado && (
            <p className="text-success fw-bold">
              Diagnóstico enviado — edição bloqueada
            </p>
          )}
        </div>
        <div className="text-end mb-2">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={logout}>
            Sair
          </button>
        </div>
        <hr />

        <div className="row text-center px-4">
        <div className="container mt-4">
        <ul className="nav nav-tabs" role="tablist">
          {TABS.map((tab) => (
            <li key={tab.id} className="nav-item" role="presentation">
              <button
                type="button"
                className={`nav-link ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="tab-content py-3" id="menuTabsContent">
          {activeTab === "diagnostico" && (
            <DiagnosticoTab
              empresaId={me.id}
              processos={me.processos}
              respostaTipos={me.respostas}
              enviado={enviado}
              readonly={false}
            />
          )}
          {activeTab === "swot" && <SWOTTab />}
          {activeTab === "okr" && <OKRTab />}
          {activeTab === "metas" && <MetasTab />}
          {activeTab === "priorizacao" && (
            <PriorizacaoTab empresaId={me.id} />
          )}
          {activeTab === "plano" && <PlanoTab />}
          {activeTab === "acompanhamento" && <AcompanhamentoTab />}
          {activeTab === "memoria" && <MemoriaTab />}
          {activeTab === "relatorio" && <RelatorioTab />}
        </div>
        </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
