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

export type Campaign = {
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
  const numberFormatter = new Intl.NumberFormat("pt-BR");

  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const visibleCampaigns = campaigns.filter((campaign) => {
    const searchable = `${campaign.name} ${campaign.audience_name} ${statusLabels[campaign.status]}`
      .toLocaleLowerCase("pt-BR");

    return matchesFilter(campaign, filter) && (!normalizedQuery || searchable.includes(normalizedQuery));
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
