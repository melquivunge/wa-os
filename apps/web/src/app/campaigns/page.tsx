import {
  ArrowRight,
  CalendarClock,
  Check,
  Clock3,
  Megaphone,
  MessageSquareText,
  MoreHorizontal,
  PauseCircle,
  Plus,
  Search,
  Send,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { serverApiGet } from "@/lib/server-api";

type Campaign = {
  id: string;
  name: string;
  audience_name: string;
  status: "draft" | "scheduled" | "sending" | "completed" | "paused" | "failed";
  message_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  progress: number;
  scheduled_at: string | null;
};

type CampaignsResponse = { data: Campaign[] };

const statusLabels: Record<Campaign["status"], string> = {
  draft: "Rascunho",
  scheduled: "Agendada",
  sending: "Enviando",
  completed: "Concluída",
  paused: "Pausada",
  failed: "Falhou",
};

const statusIcons = {
  draft: Clock3,
  scheduled: CalendarClock,
  sending: Send,
  completed: Check,
  paused: PauseCircle,
  failed: TriangleAlert,
};

export default async function CampaignsPage() {
  await requireAuthenticatedUser();

  const response = await serverApiGet<CampaignsResponse>("/api/v1/campaigns");
  const campaigns = response?.data ?? [];
  const numberFormatter = new Intl.NumberFormat("pt-BR");
  const totalMessages = campaigns.reduce((total, campaign) => total + campaign.message_count, 0);
  const sending = campaigns.filter((campaign) => campaign.status === "sending").length;
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
        <article><Send aria-hidden="true" size={20} /><span>Em envio</span><b>{sending}</b></article>
        <article><CalendarClock aria-hidden="true" size={20} /><span>Agendadas</span><b>{scheduled}</b></article>
      </section>

      <section className="campaign-toolbar" aria-label="Filtros de campanhas">
        <label className="search-box campaign-search">
          <Search aria-hidden="true" size={16} />
          <input aria-label="Buscar campanhas" placeholder="Buscar por campanha ou audiência" />
        </label>
        <div className="segment-control" aria-label="Status">
          <button className="active" type="button">Todas</button>
          <button type="button">Ativas</button>
          <button type="button">Agendadas</button>
          <button type="button">Rascunhos</button>
        </div>
      </section>

      <section className="campaign-list" aria-label="Lista de campanhas">
        {campaigns.map((campaign) => {
          const StatusIcon = statusIcons[campaign.status] ?? Clock3;

          return (
            <article className="campaign-row-card" key={campaign.id}>
              <div className={`campaign-status-icon ${campaign.status}`}>
                <StatusIcon aria-hidden="true" size={18} />
              </div>
              <div className="campaign-row-main">
                <div>
                  <h2>{campaign.name}</h2>
                  <p>{campaign.audience_name}</p>
                </div>
                <span className={`status status-${campaign.status}`}>{statusLabels[campaign.status]}</span>
              </div>
              <div className="campaign-progress-block">
                <div><span>Progresso</span><b>{campaign.progress}%</b></div>
                <i><span style={{ width: `${campaign.progress}%` }} /></i>
              </div>
              <dl className="campaign-metrics">
                <div><dt>Mensagens</dt><dd>{numberFormatter.format(campaign.message_count)}</dd></div>
                <div><dt>Entregues</dt><dd>{numberFormatter.format(campaign.delivered_count)}</dd></div>
                <div><dt>Lidas</dt><dd>{numberFormatter.format(campaign.read_count)}</dd></div>
                <div><dt>Falhas</dt><dd>{numberFormatter.format(campaign.failed_count)}</dd></div>
              </dl>
              <div className="campaign-actions">
                <button aria-label={`Ver campanha ${campaign.name}`} type="button"><ArrowRight aria-hidden="true" size={18} /></button>
                <button aria-label={`Mais opções para ${campaign.name}`} type="button"><MoreHorizontal aria-hidden="true" size={18} /></button>
              </div>
            </article>
          );
        })}

        {campaigns.length === 0 ? (
          <div className="empty-state">
            <Megaphone aria-hidden="true" size={22} />
            <h2>Nenhuma campanha ainda</h2>
            <p>Crie a primeira campanha para começar a acompanhar envios.</p>
          </div>
        ) : null}
      </section>
      </div>
    </AppShell>
  );
}
