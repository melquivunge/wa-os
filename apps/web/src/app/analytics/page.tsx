import { Activity, AlertTriangle, BarChart3, Eye, Megaphone, ReceiptText, Target } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { serverApiGet } from "@/lib/server-api";

type AnalyticsResponse = {
  data: {
    totals: {
      campaigns: number;
      messages: number;
      delivered: number;
      read: number;
      failed: number;
      spend: number;
      delivery_rate: number;
      read_rate: number;
      failure_rate: number;
    };
    teams: Array<{
      name: string;
      campaigns: number;
      messages: number;
      delivered: number;
      read: number;
      failed: number;
      spend: number;
      share: number;
      delivery_rate: number;
      read_rate: number;
      failure_rate: number;
    }>;
    campaigns: Array<{
      id: string;
      name: string;
      team_name: string;
      status: string;
      messages: number;
      spend: number;
      delivery_rate: number;
      read_rate: number;
      failure_rate: number;
    }>;
  };
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  scheduled: "Agendada",
  sending: "Enviando",
  completed: "Concluída",
  paused: "Pausada",
  failed: "Falhou",
  canceled: "Cancelada",
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

export default async function AnalyticsPage() {
  await requireAuthenticatedUser();
  const response = await serverApiGet<AnalyticsResponse>("/api/v1/campaigns/analytics");
  const analytics = response?.data ?? {
    totals: { campaigns: 0, messages: 0, delivered: 0, read: 0, failed: 0, spend: 0, delivery_rate: 0, read_rate: 0, failure_rate: 0 },
    teams: [],
    campaigns: [],
  };
  const numberFormatter = new Intl.NumberFormat("pt-BR");
  const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const bestTeam = analytics.teams[0];
  const topCampaign = analytics.campaigns[0];

  return (
    <AppShell activePath="/analytics">
      <div className="campaign-workspace analytics-workspace">
        <header className="campaign-header analytics-header">
          <div>
            <p className="eyebrow">ANALYTICS OPERACIONAL</p>
            <h1>Performance das campanhas</h1>
            <p>Entenda quais times, campanhas e gastos estão puxando leitura antes da integração real com a Meta.</p>
          </div>
          <Link className="primary-button" href="/campaigns">
            <Megaphone aria-hidden="true" size={18} /> Ver campanhas
          </Link>
        </header>

        <section className="campaign-stats analytics-stats" aria-label="Resumo de analytics">
          <article><Activity aria-hidden="true" size={20} /><span>Campanhas</span><b>{numberFormatter.format(analytics.totals.campaigns)}</b></article>
          <article><Target aria-hidden="true" size={20} /><span>Entrega</span><b>{analytics.totals.delivery_rate}%</b></article>
          <article><Eye aria-hidden="true" size={20} /><span>Leitura</span><b>{analytics.totals.read_rate}%</b></article>
          <article><ReceiptText aria-hidden="true" size={20} /><span>Gasto</span><b>{currencyFormatter.format(analytics.totals.spend)}</b></article>
        </section>

        <section className="analytics-grid">
          <article className="analytics-card analytics-hero">
            <div className="panel-head">
              <div>
                <h2>Distribuição por time</h2>
                <p>Participação, leitura e falhas sobre o volume demonstrativo</p>
              </div>
              <span>{numberFormatter.format(analytics.totals.messages)} mensagens</span>
            </div>
            <div className="team-performance-list">
              {analytics.teams.map((team) => (
                <div className="team-performance-row" key={team.name}>
                  <div className="team-performance-title">
                    <b>{team.name}</b>
                    <span>{team.campaigns} campanha{team.campaigns === 1 ? "" : "s"} · {currencyFormatter.format(team.spend)}</span>
                  </div>
                  <div className="analytics-bars" aria-label={`Performance do time ${team.name}`}>
                    <span className="share" style={{ width: `${clamp(team.share)}%` }} />
                    <span className="read" style={{ width: `${clamp(team.read_rate)}%` }} />
                    <span className="failure" style={{ width: `${clamp(team.failure_rate)}%` }} />
                  </div>
                  <dl>
                    <div><dt>Volume</dt><dd>{team.share}%</dd></div>
                    <div><dt>Leitura</dt><dd>{team.read_rate}%</dd></div>
                    <div><dt>Falhas</dt><dd>{team.failure_rate}%</dd></div>
                  </dl>
                </div>
              ))}
              {analytics.teams.length === 0 ? <p className="analytics-empty">Ainda não há campanhas para analisar.</p> : null}
            </div>
          </article>

          <aside className="analytics-card insight-card">
            <BarChart3 aria-hidden="true" size={22} />
            <h2>Leitura mais forte</h2>
            <p>{bestTeam ? `${bestTeam.name} concentra ${bestTeam.share}% do volume e ${bestTeam.read_rate}% de leitura.` : "Crie campanhas para comparar performance por time."}</p>
            <div>
              <span>Campanha destaque</span>
              <b>{topCampaign?.name ?? "—"}</b>
            </div>
          </aside>

          <article className="analytics-card campaign-ranking">
            <div className="panel-head">
              <div>
                <h2>Ranking de campanhas</h2>
                <p>Ordenado por leituras registradas no simulador</p>
              </div>
            </div>
            <div className="analytics-table">
              {analytics.campaigns.map((campaign) => (
                <Link className="analytics-campaign-row" href={`/campaigns/${campaign.id}`} key={campaign.id}>
                  <span>
                    <b>{campaign.name}</b>
                    <small>{campaign.team_name} · {statusLabels[campaign.status] ?? campaign.status}</small>
                  </span>
                  <i><span style={{ width: `${clamp(campaign.read_rate)}%` }} /></i>
                  <dl>
                    <div><dt>Leitura</dt><dd>{campaign.read_rate}%</dd></div>
                    <div><dt>Entrega</dt><dd>{campaign.delivery_rate}%</dd></div>
                    <div><dt>Gasto</dt><dd>{currencyFormatter.format(campaign.spend)}</dd></div>
                  </dl>
                </Link>
              ))}
            </div>
          </article>

          <article className="analytics-card risk-card">
            <AlertTriangle aria-hidden="true" size={22} />
            <h2>Falhas monitoradas</h2>
            <p>{analytics.totals.failed > 0 ? `${numberFormatter.format(analytics.totals.failed)} mensagens falharam no período demo.` : "Sem falhas registradas nas campanhas atuais."}</p>
            <strong>{analytics.totals.failure_rate}%</strong>
          </article>
        </section>
      </div>
    </AppShell>
  );
}
