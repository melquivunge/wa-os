import {
  CalendarClock,
  Megaphone,
  MessageSquareText,
  Plus,
  ReceiptText,
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { serverApiGet } from "@/lib/server-api";
import { CampaignListClient, type Campaign } from "./campaign-list-client";

type CampaignsResponse = { data: Campaign[] };

export default async function CampaignsPage() {
  await requireAuthenticatedUser();

  const response = await serverApiGet<CampaignsResponse>("/api/v1/campaigns");
  const campaigns = response?.data ?? [];
  const numberFormatter = new Intl.NumberFormat("pt-BR");
  const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const totalMessages = campaigns.reduce((total, campaign) => total + campaign.message_count, 0);
  const totalSpend = campaigns.reduce((total, campaign) => total + campaign.spend_amount, 0);
  const scheduled = campaigns.filter((campaign) => campaign.status === "scheduled").length;

  return (
    <AppShell activePath="/campaigns">
      <div className="campaign-workspace">
      <header className="campaign-header">
        <div>
          <p className="eyebrow">OPERAÇÃO DE CAMPANHAS</p>
          <h1>Campanhas</h1>
          <p>Crie, acompanhe e organize envios de WhatsApp antes da integração real com a Meta.</p>
        </div>
        <Link className="primary-button" href="/campaigns/new"><Plus aria-hidden="true" size={18} /> Nova campanha</Link>
      </header>

      <section className="campaign-stats" aria-label="Resumo de campanhas">
        <article><Megaphone aria-hidden="true" size={20} /><span>Total</span><b>{campaigns.length}</b></article>
        <article><MessageSquareText aria-hidden="true" size={20} /><span>Mensagens</span><b>{numberFormatter.format(totalMessages)}</b></article>
        <article><ReceiptText aria-hidden="true" size={20} /><span>Gasto</span><b>{currencyFormatter.format(totalSpend)}</b></article>
        <article><CalendarClock aria-hidden="true" size={20} /><span>Agendadas</span><b>{scheduled}</b></article>
      </section>

      <CampaignListClient campaigns={campaigns} />
      </div>
    </AppShell>
  );
}
