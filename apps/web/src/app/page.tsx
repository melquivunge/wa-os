import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  ContactRound,
  Eye,
  FileText,
  LayoutDashboard,
  Megaphone,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { serverApiGet } from "@/lib/server-api";

const navItems = [
  { label: "Visão geral", icon: LayoutDashboard, active: true, href: "/" },
  { label: "Campanhas", icon: Megaphone, href: "/campaigns" },
  { label: "Contatos", icon: ContactRound, href: "/contacts" },
  { label: "Audiências", icon: UsersRound, href: "/audiences" },
  { label: "Templates", icon: FileText, href: "/templates" },
  { label: "Analytics", icon: BarChart3, href: "/analytics" },
];

type Campaign = {
  id: string;
  name: string;
  audience_name: string;
  status: "draft" | "scheduled" | "sending" | "completed" | "paused" | "failed" | "canceled";
  message_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  progress: number;
  scheduled_at: string | null;
};

const campaignStatusLabels: Record<Campaign["status"], string> = {
  draft: "Rascunho",
  scheduled: "Agendada",
  sending: "Enviando",
  completed: "Concluída",
  paused: "Pausada",
  failed: "Falhou",
  canceled: "Cancelada",
};

type CampaignSummary = {
  data: {
    totals: {
      campaigns: number;
      sent: number;
      delivered: number;
      read: number;
      failed: number;
    };
    active_campaign: Campaign | null;
    recent_campaigns: Campaign[];
  };
};

const chart = [32, 44, 38, 57, 49, 64, 72, 61, 78, 69, 86, 82, 96, 77];

export default async function Home() {
  await requireAuthenticatedUser();
  const summary = await serverApiGet<CampaignSummary>("/api/v1/campaigns/summary");

  const numberFormatter = new Intl.NumberFormat("pt-BR");
  const totals = summary?.data.totals ?? { campaigns: 0, sent: 0, delivered: 0, read: 0, failed: 0 };
  const activeCampaign = summary?.data.active_campaign;
  const campaigns = summary?.data.recent_campaigns ?? [];
  const metrics = [
    { label: "Enviadas", value: totals.sent, change: "+12,8%", color: "violet", icon: MessageSquareText },
    { label: "Entregues", value: totals.delivered, change: totals.sent > 0 ? `${Math.round((totals.delivered / totals.sent) * 100)}%` : "0%", color: "blue", icon: Check },
    { label: "Lidas", value: totals.read, change: totals.delivered > 0 ? `${Math.round((totals.read / totals.delivered) * 100)}%` : "0%", color: "green", icon: Eye },
    { label: "Falhas", value: totals.failed, change: totals.sent > 0 ? `${Math.round((totals.failed / totals.sent) * 100)}%` : "0%", color: "orange", icon: AlertTriangle },
  ];
  const formattedDate = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
    .format(new Date(2026, 6, 14)).toLocaleUpperCase("pt-BR");

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><MessageSquareText aria-hidden="true" size={20} /></span>
          <span>WA <b>OS</b></span>
        </div>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          <p className="nav-label">Workspace</p>
          {navItems.map((item) => (
            <Link className={item.active ? "nav-item active" : "nav-item"} href={item.href} key={item.label}>
              <item.icon aria-hidden="true" size={18} strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <Link className="nav-item" href="/settings"><Settings aria-hidden="true" size={18} /> Configurações</Link>
          <button className="nav-item" type="button"><CircleHelp aria-hidden="true" size={18} /> Ajuda e suporte</button>
          <div className="upgrade-card">
            <span className="upgrade-icon"><Sparkles aria-hidden="true" size={17} /></span>
            <b>Expanda seus envios</b>
            <p>Seu plano usou 68% das mensagens deste mês.</p>
            <button>Ver meu plano</button>
          </div>
          <div className="profile">
            <div className="avatar">MA</div>
            <div><b>Marina Alves</b><span>Acme Studio</span></div>
            <MoreHorizontal aria-hidden="true" size={18} />
          </div>
        </div>
      </aside>

      <main className="main-content" id="main-content">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Abrir menu"><Menu aria-hidden="true" size={20} /></button>
          <div className="mobile-brand">WA <b>OS</b></div>
          <div className="topbar-actions">
            <label className="search-box">
              <Search aria-hidden="true" size={16} />
              <input aria-label="Buscar" name="dashboard-search" autoComplete="off" placeholder="Buscar campanhas, contatos…" />
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-button" aria-label="Notificações"><Bell aria-hidden="true" size={18} /><i /></button>
            <button className="account-switcher" aria-label="Trocar organização, atual: Acme Studio"><span className="avatar small">MA</span><span>Acme Studio</span><ChevronDown aria-hidden="true" size={15} /></button>
          </div>
        </header>

        <div className="page">
          <section className="page-heading">
            <div>
              <p className="eyebrow">DADOS DEMONSTRATIVOS · {formattedDate}</p>
              <h1>Bom dia, Marina.</h1>
              <p>Acompanhe a operação das suas campanhas em tempo real.</p>
            </div>
            <Link className="primary-button" href="/campaigns/new"><Plus aria-hidden="true" size={18} /> Nova campanha</Link>
          </section>

          <section className="metric-grid" aria-label="Métricas do período">
            {metrics.map((metric) => (
              <article className="metric-card" key={metric.label}>
                <div className={`metric-icon ${metric.color}`}><metric.icon aria-hidden="true" size={18} /></div>
                <span className="metric-label">{metric.label}</span>
                <strong>{numberFormatter.format(metric.value)}</strong>
                <span className={`metric-change ${metric.color}`}>{metric.change}</span>
                <small>nos últimos 30 dias</small>
              </article>
            ))}
          </section>

          <section className="dashboard-grid">
            <article className="panel activity-panel">
              <div className="panel-head">
                <div><h2>Atividade de mensagens</h2><p>Envios e leituras nos últimos 14 dias</p></div>
                <button className="select-button" aria-label="Selecionar período do gráfico, atual: 14 dias">14 dias <ChevronDown aria-hidden="true" size={15} /></button>
              </div>
              <div className="chart-legend"><span><i className="legend-violet" /> Enviadas</span><span><i className="legend-lilac" /> Lidas</span></div>
              <p className="sr-only" id="activity-chart-description">Gráfico de barras dos últimos 14 dias. O volume enviado cresce de 32 para 77 por cento da escala, com pico de 96 por cento. As leituras acompanham os envios.</p>
              <div className="chart-area" role="img" aria-labelledby="activity-chart-description">
                <div className="axis-labels"><span>3 mil</span><span>2 mil</span><span>1 mil</span><span>0</span></div>
                <div className="bars">
                  {chart.map((height, index) => (
                    <div className="bar-group" key={index}>
                      <span className="bar sent" style={{ "--bar-scale": height / 100 } as CSSProperties} />
                      <span className="bar read" style={{ "--bar-scale": Math.max(18, height - 18) / 100 } as CSSProperties} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="chart-days"><span>01 jul</span><span>04 jul</span><span>07 jul</span><span>10 jul</span><span>14 jul</span></div>
            </article>

            <article className="panel operation-panel">
              <div className="panel-head"><div><h2>Operação agora</h2><p>Campanha em andamento</p></div><span className="live-badge"><i /> AO VIVO</span></div>
              <div className="active-campaign">
                <span className="campaign-icon"><Megaphone aria-hidden="true" size={19} /></span>
                <div><b>{activeCampaign?.name ?? "Nenhuma campanha ativa"}</b><span>{activeCampaign?.audience_name ?? "Crie ou agende uma campanha"} · {numberFormatter.format(activeCampaign?.message_count ?? 0)} contatos</span></div>
                <Link aria-label="Ver campanhas" href="/campaigns"><ArrowRight aria-hidden="true" size={18} /></Link>
              </div>
              <div className="progress-copy"><span>Progresso do envio</span><b>{activeCampaign?.progress ?? 0}%</b></div>
              <div className="progress"><span style={{ width: `${activeCampaign?.progress ?? 0}%` }} /></div>
              <div className="journey">
                <div className="journey-line"><span className="done" /><span className="done" /><span className="current" /><span /></div>
                <div className="journey-labels">
                  <span><i><Check aria-hidden="true" size={12} /></i><b>Agendada</b><small>13:55</small></span>
                  <span><i><Check aria-hidden="true" size={12} /></i><b>Enviando</b><small>14:00</small></span>
                  <span><i><Clock3 aria-hidden="true" size={12} /></i><b>Entregue</b><small>6.480</small></span>
                  <span><i><Eye aria-hidden="true" size={12} /></i><b>Lida</b><small>4.912</small></span>
                </div>
              </div>
              <div className="operation-note"><Clock3 aria-hidden="true" size={15} /><span>Previsão de conclusão</span><b>14:38</b></div>
            </article>
          </section>

          <section className="panel campaigns-panel">
              <div className="panel-head"><div><h2>Campanhas recentes</h2><p>Desempenho das últimas campanhas</p></div><Link className="panel-link" href="/campaigns">Ver todas <ArrowRight aria-hidden="true" size={15} /></Link></div>
            <table className="campaign-table">
              <caption className="sr-only">Campanhas recentes e seus resultados</caption>
              <thead><tr className="table-row table-header"><th>Campanha</th><th>Envio</th><th>Mensagens</th><th>Leitura</th><th>Status</th><th><span className="sr-only">Ações</span></th></tr></thead>
              <tbody>
              {campaigns.map((campaign, index) => (
                <tr className="table-row" key={campaign.id}>
                  <th scope="row" className="campaign-name"><i className={`campaign-dot dot-${index}`}><Megaphone aria-hidden="true" size={15} /></i><span><b>{campaign.name}</b><small>{campaign.audience_name}</small></span></th>
                  <td data-label="Envio">{campaign.scheduled_at ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(campaign.scheduled_at)) : "Sem data"}</td>
                  <td data-label="Mensagens">{numberFormatter.format(campaign.message_count)}</td>
                  <td data-label="Leitura">{campaign.read_count > 0 ? `${Math.round((campaign.read_count / Math.max(campaign.delivered_count, 1)) * 100)}%` : "—"}</td>
                  <td data-label="Status"><i className={`status status-${campaign.status}`}>{campaignStatusLabels[campaign.status]}</i></td>
                  <td><button aria-label={`Opções de ${campaign.name}`}><MoreHorizontal aria-hidden="true" size={18} /></button></td>
                </tr>
              ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>

      <nav className="bottom-nav" aria-label="Navegação mobile">
        {navItems.slice(0, 4).map((item) => <Link className={item.active ? "active" : ""} href={item.href} key={item.label}><item.icon aria-hidden="true" size={20} /><span>{item.label}</span></Link>)}
        <button type="button"><Menu aria-hidden="true" size={20} /><span>Mais</span></button>
      </nav>
    </div>
  );
}
