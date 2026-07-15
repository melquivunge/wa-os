import { ReceiptText, RefreshCcw, UsersRound, Wand2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { serverApiGet } from "@/lib/server-api";
import { TeamFilterList } from "../shared/team-filter-list";

type Audience = {
  id: string;
  name: string;
  team_name: string;
  source: string;
  contact_count: number;
  estimated_spend_amount: number;
  rules: string[];
  refreshed_at: string | null;
};

type AudiencesResponse = { data: Audience[] };

function formatDate(value: string | null) {
  if (!value) return "Pendente";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function AudiencesPage() {
  await requireAuthenticatedUser();

  const response = await serverApiGet<AudiencesResponse>("/api/v1/audiences");
  const audiences = response?.data ?? [];
  const numberFormatter = new Intl.NumberFormat("pt-BR");
  const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const contacts = audiences.reduce((total, audience) => total + audience.contact_count, 0);
  const estimatedSpend = audiences.reduce((total, audience) => total + audience.estimated_spend_amount, 0);
  const teams = new Set(audiences.map((audience) => audience.team_name)).size;

  return (
    <AppShell activePath="/audiences">
      <div className="campaign-workspace">
        <header className="campaign-header">
          <div>
            <p className="eyebrow">SEGMENTOS OPERACIONAIS</p>
            <h1>Audiências</h1>
            <p>Compare públicos por time, tamanho e gasto estimado antes de montar a campanha.</p>
          </div>
        </header>

        <section className="campaign-stats" aria-label="Resumo de audiências">
          <article><UsersRound aria-hidden="true" size={20} /><span>Audiências</span><b>{audiences.length}</b></article>
          <article><Wand2 aria-hidden="true" size={20} /><span>Contatos</span><b>{numberFormatter.format(contacts)}</b></article>
          <article><ReceiptText aria-hidden="true" size={20} /><span>Gasto estimado</span><b>{currencyFormatter.format(estimatedSpend)}</b></article>
          <article><RefreshCcw aria-hidden="true" size={20} /><span>Times</span><b>{teams}</b></article>
        </section>

        <TeamFilterList
          emptyDescription="Ajuste a busca ou escolha outro time para ver audiências."
          emptyTitle="Nenhuma audiência encontrada"
          items={audiences.map((audience) => ({
            id: audience.id,
            title: audience.name,
            subtitle: `${audience.source} · ${audience.rules.join(" + ") || "Sem regras"}`,
            teamName: audience.team_name,
            badge: audience.team_name,
            badgeTone: "violet",
            metrics: [
              { label: "Contatos", value: numberFormatter.format(audience.contact_count) },
              { label: "Gasto estimado", value: currencyFormatter.format(audience.estimated_spend_amount) },
              { label: "Atualizada", value: formatDate(audience.refreshed_at) },
            ],
          }))}
          searchPlaceholder="Buscar audiências"
        />
      </div>
    </AppShell>
  );
}
