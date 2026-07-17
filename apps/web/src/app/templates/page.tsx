import { CheckCircle2, FileText, Languages, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { serverApiGet } from "@/lib/server-api";
import type { OrganizationRole, WhatsAppAccount } from "@/lib/api-client";
import { TeamFilterList } from "../shared/team-filter-list";
import { TemplateSyncPanel } from "./template-sync-panel";

type MessageTemplate = {
  id: string;
  name: string;
  team_name: string;
  category: string;
  status: "approved" | "draft" | "rejected" | string;
  language: string;
  body: string;
  last_used_at: string | null;
};

type TemplatesResponse = { data: MessageTemplate[] };

function formatDate(value: string | null) {
  if (!value) return "Ainda não usado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function TemplatesPage() {
  const user = await requireAuthenticatedUser();

  const response = await serverApiGet<TemplatesResponse>("/api/v1/templates");
  const accountsResponse = await serverApiGet<{ data: WhatsAppAccount[] }>("/api/v1/whatsapp-accounts");
  const templates = response?.data ?? [];
  const currentRole = user.active_organization.role as OrganizationRole;
  const canSync = currentRole === "owner" || currentRole === "admin" || currentRole === "marketing";
  const approved = templates.filter((template) => template.status === "approved").length;
  const draft = templates.filter((template) => template.status === "draft").length;
  const languages = new Set(templates.map((template) => template.language)).size;

  return (
    <AppShell activePath="/templates">
      <div className="campaign-workspace">
        <header className="campaign-header">
          <div>
            <p className="eyebrow">BIBLIOTECA WHATSAPP</p>
            <h1>Templates</h1>
            <p>Templates sincronizados do provedor simulado, prontos para a próxima etapa do wizard de campanha.</p>
          </div>
        </header>

        <TemplateSyncPanel accounts={accountsResponse?.data ?? []} approved={approved} canSync={canSync} total={templates.length} />

        <section className="campaign-stats" aria-label="Resumo de templates">
          <article><FileText aria-hidden="true" size={20} /><span>Total</span><b>{templates.length}</b></article>
          <article><CheckCircle2 aria-hidden="true" size={20} /><span>Aprovados</span><b>{approved}</b></article>
          <article><ShieldAlert aria-hidden="true" size={20} /><span>Rascunhos</span><b>{draft}</b></article>
          <article><Languages aria-hidden="true" size={20} /><span>Idiomas</span><b>{languages}</b></article>
        </section>

        <TeamFilterList
          emptyDescription="Ajuste a busca ou escolha outro time para ver templates."
          emptyTitle="Nenhum template encontrado"
          items={templates.map((template) => ({
            id: template.id,
            title: template.name,
            subtitle: template.body,
            teamName: template.team_name,
            badge: template.status === "approved" ? "Aprovado" : "Rascunho",
            badgeTone: template.status === "approved" ? "green" : "neutral",
            metrics: [
              { label: "Categoria", value: template.category },
              { label: "Time", value: template.team_name },
              { label: "Último uso", value: formatDate(template.last_used_at) },
            ],
          }))}
          searchPlaceholder="Buscar templates"
        />
      </div>
    </AppShell>
  );
}
