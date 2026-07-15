"use client";

import {
  ArrowRight,
  CalendarClock,
  Check,
  Clock3,
  Megaphone,
  MoreHorizontal,
  PauseCircle,
  Search,
  Send,
  TriangleAlert,
  X,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export type Campaign = {
  id: string;
  name: string;
  audience_name: string;
  team_name: string;
  status: "draft" | "scheduled" | "sending" | "completed" | "paused" | "failed";
  message_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  spend_amount: number;
  progress: number;
  scheduled_at: string | null;
};

type FilterKey = "all" | "active" | "scheduled" | "draft";

type CampaignListClientProps = {
  campaigns: Campaign[];
};

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

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Todas" },
  { key: "active", label: "Ativas" },
  { key: "scheduled", label: "Agendadas" },
  { key: "draft", label: "Rascunhos" },
];

function matchesFilter(campaign: Campaign, filter: FilterKey) {
  if (filter === "all") return true;
  if (filter === "active") return campaign.status === "sending" || campaign.status === "paused";

  return campaign.status === filter;
}

export function CampaignListClient({ campaigns }: CampaignListClientProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const numberFormatter = new Intl.NumberFormat("pt-BR");
  const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const teams = Array.from(new Set(campaigns.map((campaign) => campaign.team_name)))
    .sort((first, second) => first.localeCompare(second, "pt-BR"));

  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const visibleCampaigns = campaigns.filter((campaign) => {
    const searchable = `${campaign.name} ${campaign.audience_name} ${campaign.team_name} ${statusLabels[campaign.status]}`
      .toLocaleLowerCase("pt-BR");

    return matchesFilter(campaign, filter)
      && (teamFilter === "all" || campaign.team_name === teamFilter)
      && (!normalizedQuery || searchable.includes(normalizedQuery));
  });

  return (
    <>
      <section className="campaign-toolbar" aria-label="Filtros de campanhas">
        <label className="search-box campaign-search">
          <Search aria-hidden="true" size={16} />
          <input
            aria-label="Buscar campanhas"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por campanha ou audiência"
            value={query}
          />
          {query ? (
            <button aria-label="Limpar busca" className="clear-search-button" onClick={() => setQuery("")} type="button">
              <X aria-hidden="true" size={15} />
            </button>
          ) : null}
        </label>
        <div className="segment-control" aria-label="Status">
          {filters.map((item) => (
            <button
              aria-pressed={filter === item.key}
              className={filter === item.key ? "active" : ""}
              key={item.key}
              onClick={() => setFilter(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="team-filter">
          <span>Time</span>
          <select aria-label="Filtrar por time" onChange={(event) => setTeamFilter(event.target.value)} value={teamFilter}>
            <option value="all">Todos</option>
            {teams.map((team) => <option key={team} value={team}>{team}</option>)}
          </select>
        </label>
      </section>

      <section className="campaign-list" aria-label="Lista de campanhas">
        {visibleCampaigns.map((campaign) => {
          const StatusIcon = statusIcons[campaign.status] ?? Clock3;

          return (
            <article className="campaign-row-card" key={campaign.id}>
              <div className={`campaign-status-icon ${campaign.status}`}>
                <StatusIcon aria-hidden="true" size={18} />
              </div>
              <div className="campaign-row-main">
                <div>
                  <h2>{campaign.name}</h2>
                  <p>{campaign.audience_name} · {campaign.team_name}</p>
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
                <div><dt>Gasto</dt><dd>{currencyFormatter.format(campaign.spend_amount)}</dd></div>
              </dl>
              <div className="campaign-actions">
                <Link aria-label={`Ver campanha ${campaign.name}`} href={`/campaigns/${campaign.id}`}><ArrowRight aria-hidden="true" size={18} /></Link>
                <button aria-label={`Mais opções para ${campaign.name}`} type="button"><MoreHorizontal aria-hidden="true" size={18} /></button>
              </div>
            </article>
          );
        })}

        {visibleCampaigns.length === 0 ? (
          <div className="empty-state">
            <Megaphone aria-hidden="true" size={22} />
            <h2>Nenhuma campanha encontrada</h2>
            <p>Ajuste a busca ou escolha outro status para ver mais campanhas.</p>
          </div>
        ) : null}
      </section>
    </>
  );
}
