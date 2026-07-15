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
import type { CSSProperties } from "react";

const navItems = [
  { label: "Visão geral", icon: LayoutDashboard, active: true },
  { label: "Campanhas", icon: Megaphone },
  { label: "Contatos", icon: ContactRound },
  { label: "Audiências", icon: UsersRound },
  { label: "Templates", icon: FileText },
  { label: "Analytics", icon: BarChart3 },
];

const metrics = [
  { label: "Enviadas", value: 18492, change: "+12,8%", color: "violet", icon: MessageSquareText },
  { label: "Entregues", value: 17841, change: "96,5%", color: "blue", icon: Check },
  { label: "Lidas", value: 14626, change: "82,0%", color: "green", icon: Eye },
  { label: "Falhas", value: 651, change: "3,5%", color: "orange", icon: AlertTriangle },
];

const campaigns = [
  { name: "Boas-vindas de julho", audience: "Novos clientes", time: "Hoje, 09:30", sent: 4280, read: "86,4%", status: "Concluída" },
  { name: "Oferta de inverno", audience: "Clientes ativos", time: "Hoje, 14:00", sent: 8142, read: "Em curso", status: "Enviando" },
  { name: "Reativação 30 dias", audience: "Clientes inativos", time: "Amanhã, 10:15", sent: 2615, read: "—", status: "Agendada" },
];

const chart = [32, 44, 38, 57, 49, 64, 72, 61, 78, 69, 86, 82, 96, 77];

export default function Home() {
  const numberFormatter = new Intl.NumberFormat("pt-BR");
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
            <a className={item.active ? "nav-item active" : "nav-item"} href="#" key={item.label}>
              <item.icon aria-hidden="true" size={18} strokeWidth={1.8} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <a className="nav-item" href="#"><Settings aria-hidden="true" size={18} /> Configurações</a>
          <a className="nav-item" href="#"><CircleHelp aria-hidden="true" size={18} /> Ajuda e suporte</a>
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
              <input aria-label="Buscar" placeholder="Buscar campanhas, contatos…" />
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-button" aria-label="Notificações"><Bell aria-hidden="true" size={18} /><i /></button>
            <button className="account-switcher" aria-label="Trocar organização, atual: Acme Studio"><span className="avatar small">MA</span><span>Acme Studio</span><ChevronDown aria-hidden="true" size={15} /></button>
          </div>
        </header>

        <div className="page">
          <section className="page-heading">
            <div>
              <p className="eyebrow">{formattedDate}</p>
              <h1>Bom dia, Marina.</h1>
              <p>Acompanhe a operação das suas campanhas em tempo real.</p>
            </div>
            <button className="primary-button"><Plus aria-hidden="true" size={18} /> Nova campanha</button>
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
                <div><b>Oferta de inverno</b><span>Clientes ativos · 8.142 contatos</span></div>
                <button aria-label="Ver campanha Oferta de inverno"><ArrowRight aria-hidden="true" size={18} /></button>
              </div>
              <div className="progress-copy"><span>Progresso do envio</span><b>64%</b></div>
              <div className="progress"><span /></div>
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
            <div className="panel-head"><div><h2>Campanhas recentes</h2><p>Desempenho das últimas campanhas</p></div><a href="#">Ver todas <ArrowRight aria-hidden="true" size={15} /></a></div>
            <table className="campaign-table">
              <caption className="sr-only">Campanhas recentes e seus resultados</caption>
              <thead><tr className="table-row table-header"><th>Campanha</th><th>Envio</th><th>Mensagens</th><th>Leitura</th><th>Status</th><th><span className="sr-only">Ações</span></th></tr></thead>
              <tbody>
              {campaigns.map((campaign, index) => (
                <tr className="table-row" key={campaign.name}>
                  <th scope="row" className="campaign-name"><i className={`campaign-dot dot-${index}`}><Megaphone aria-hidden="true" size={15} /></i><span><b>{campaign.name}</b><small>{campaign.audience}</small></span></th>
                  <td data-label="Envio">{campaign.time}</td>
                  <td data-label="Mensagens">{numberFormatter.format(campaign.sent)}</td>
                  <td data-label="Leitura">{campaign.read}</td>
                  <td data-label="Status"><i className={`status status-${index}`}>{campaign.status}</i></td>
                  <td><button aria-label={`Opções de ${campaign.name}`}><MoreHorizontal aria-hidden="true" size={18} /></button></td>
                </tr>
              ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>

      <nav className="bottom-nav" aria-label="Navegação mobile">
        {navItems.slice(0, 4).map((item) => <a className={item.active ? "active" : ""} href="#" key={item.label}><item.icon aria-hidden="true" size={20} /><span>{item.label}</span></a>)}
        <a href="#"><Menu aria-hidden="true" size={20} /><span>Mais</span></a>
      </nav>
    </div>
  );
}
