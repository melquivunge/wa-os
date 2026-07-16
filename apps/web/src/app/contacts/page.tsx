import { ContactRound, Filter, Tags, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { serverApiGet } from "@/lib/server-api";
import type { ContactImport, OrganizationRole } from "@/lib/api-client";
import { TeamFilterList } from "../shared/team-filter-list";
import { ContactImportPanel } from "./contact-import-panel";

type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  team_name: string;
  status: "active" | "inactive" | string;
  tags: string[];
  last_seen_at: string | null;
};

type ContactsResponse = { data: Contact[] };
type ContactImportsResponse = { data: ContactImport[] };

function formatDate(value: string | null) {
  if (!value) return "Sem atividade";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function ContactsPage() {
  const user = await requireAuthenticatedUser();

  const [response, importsResponse] = await Promise.all([
    serverApiGet<ContactsResponse>("/api/v1/contacts"),
    serverApiGet<ContactImportsResponse>("/api/v1/contact-imports"),
  ]);
  const contacts = response?.data ?? [];
  const imports = importsResponse?.data ?? [];
  const currentRole = user.active_organization.role as OrganizationRole;
  const canImport = currentRole === "owner" || currentRole === "admin" || currentRole === "marketing";
  const activeContacts = contacts.filter((contact) => contact.status === "active").length;
  const teams = new Set(contacts.map((contact) => contact.team_name)).size;
  const taggedContacts = contacts.filter((contact) => contact.tags.length > 0).length;

  return (
    <AppShell activePath="/contacts">
      <div className="campaign-workspace">
        <header className="campaign-header">
          <div>
            <p className="eyebrow">BASE DE CONTATOS</p>
            <h1>Contatos</h1>
            <p>Veja a base demo segmentada por time, status e tags. Use a importação demo para alimentar a operação sem sair do workspace.</p>
          </div>
        </header>

        <ContactImportPanel canImport={canImport} imports={imports} />

        <section className="campaign-stats" aria-label="Resumo de contatos">
          <article><ContactRound aria-hidden="true" size={20} /><span>Total</span><b>{contacts.length}</b></article>
          <article><UsersRound aria-hidden="true" size={20} /><span>Ativos</span><b>{activeContacts}</b></article>
          <article><Filter aria-hidden="true" size={20} /><span>Times</span><b>{teams}</b></article>
          <article><Tags aria-hidden="true" size={20} /><span>Com tags</span><b>{taggedContacts}</b></article>
        </section>

        <TeamFilterList
          emptyDescription="Ajuste a busca ou escolha outro time para ver contatos."
          emptyTitle="Nenhum contato encontrado"
          items={contacts.map((contact) => ({
            id: contact.id,
            title: contact.name,
            subtitle: `${contact.phone}${contact.email ? ` · ${contact.email}` : ""}`,
            teamName: contact.team_name,
            badge: contact.status === "active" ? "Ativo" : "Inativo",
            badgeTone: contact.status === "active" ? "green" : "neutral",
            metrics: [
              { label: "Time", value: contact.team_name },
              { label: "Tags", value: contact.tags.join(", ") || "—" },
              { label: "Última atividade", value: formatDate(contact.last_seen_at) },
            ],
          }))}
          searchPlaceholder="Buscar contatos"
        />
      </div>
    </AppShell>
  );
}
