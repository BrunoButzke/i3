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
      <div className="i3-page">
        <AppHeader />
        <LoadingOverlay show />
      </div>
    );
  }

  const enviado = me.enviado === "SIM";

  return (
    <div className="i3-page">
      <AppHeader />
      <main className="i3-main">
        <div className="i3-company-card">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm i3-company-logout"
            onClick={logout}
          >
            <i className="bi bi-box-arrow-right me-1" />
            Sair
          </button>
          <h2 className="i3-company-name">{me.empresa}</h2>
          {me.cnpj && <p className="i3-company-meta">CNPJ: {me.cnpj}</p>}
          {me.representante && (
            <p className="i3-company-meta">{me.representante}</p>
          )}
          {enviado && (
            <span className="i3-badge-enviado">
              <i className="bi bi-check-circle-fill" />
              Diagnóstico enviado
            </span>
          )}
        </div>

        <div className="i3-tabs-wrapper">
          <nav className="i3-tabs-nav" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`i3-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="i3-tab-content" role="tabpanel">
            {activeTab === "diagnostico" && (
              <DiagnosticoTab
                empresaId={me.id}
                processos={me.processos}
                respostaTipos={me.respostas}
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
      </main>
      <AppFooter />
    </div>
  );
}
