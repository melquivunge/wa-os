import {
  BarChart3,
  Bell,
  ChevronDown,
  CircleHelp,
  ContactRound,
  FileText,
  LayoutDashboard,
  Megaphone,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Search,
  Settings,
  Sparkles,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { label: "Visão geral", icon: LayoutDashboard, href: "/" },
  { label: "Campanhas", icon: Megaphone, href: "/campaigns" },
  { label: "Contatos", icon: ContactRound, href: "/contacts" },
  { label: "Audiências", icon: UsersRound, href: "/audiences" },
  { label: "Templates", icon: FileText, href: "/templates" },
  { label: "Analytics", icon: BarChart3, href: "/" },
];

type AppShellProps = {
  activePath: "/" | "/campaigns" | "/contacts" | "/audiences" | "/templates";
  children: ReactNode;
};

export function AppShell({ activePath, children }: AppShellProps) {
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
            <Link className={item.href === activePath ? "nav-item active" : "nav-item"} href={item.href} key={item.label}>
              <item.icon aria-hidden="true" size={18} strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item" type="button"><Settings aria-hidden="true" size={18} /> Configurações</button>
          <button className="nav-item" type="button"><CircleHelp aria-hidden="true" size={18} /> Ajuda e suporte</button>
          <div className="upgrade-card">
            <span className="upgrade-icon"><Sparkles aria-hidden="true" size={17} /></span>
            <b>Expanda seus envios</b>
            <p>Seu plano usou 68% das mensagens deste mês.</p>
            <button type="button">Ver meu plano</button>
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
              <input aria-label="Buscar" name="app-search" autoComplete="off" placeholder="Buscar campanhas, contatos..." />
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-button" aria-label="Notificações"><Bell aria-hidden="true" size={18} /><i /></button>
            <button className="account-switcher" aria-label="Trocar organização, atual: Acme Studio"><span className="avatar small">MA</span><span>Acme Studio</span><ChevronDown aria-hidden="true" size={15} /></button>
          </div>
        </header>

        {children}
      </main>

      <nav className="bottom-nav" aria-label="Navegação mobile">
        {navItems.slice(0, 4).map((item) => (
          <Link className={item.href === activePath ? "active" : ""} href={item.href} key={item.label}>
            <item.icon aria-hidden="true" size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
        <button type="button"><Menu aria-hidden="true" size={20} /><span>Mais</span></button>
      </nav>
    </div>
  );
}
