"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";

type Metric = {
  label: string;
  value: string;
};

type TeamFilterItem = {
  id: string;
  title: string;
  subtitle: string;
  teamName: string;
  badge: string;
  badgeTone: "green" | "neutral" | "violet";
  metrics: Metric[];
};

type TeamFilterListProps = {
  emptyDescription: string;
  emptyTitle: string;
  items: TeamFilterItem[];
  searchPlaceholder: string;
};

export function TeamFilterList({ emptyDescription, emptyTitle, items, searchPlaceholder }: TeamFilterListProps) {
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const teams = useMemo(
    () => Array.from(new Set(items.map((item) => item.teamName)))
      .sort((first, second) => first.localeCompare(second, "pt-BR")),
    [items],
  );
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const visibleItems = items.filter((item) => {
    const searchable = `${item.title} ${item.subtitle} ${item.teamName} ${item.badge} ${item.metrics.map((metric) => metric.value).join(" ")}`
      .toLocaleLowerCase("pt-BR");

    return (teamFilter === "all" || item.teamName === teamFilter)
      && (!normalizedQuery || searchable.includes(normalizedQuery));
  });

  return (
    <>
      <section className="campaign-toolbar" aria-label="Filtros">
        <label className="search-box campaign-search">
          <Search aria-hidden="true" size={16} />
          <input
            aria-label={searchPlaceholder}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            value={query}
          />
          {query ? (
            <button aria-label="Limpar busca" className="clear-search-button" onClick={() => setQuery("")} type="button">
              <X aria-hidden="true" size={15} />
            </button>
          ) : null}
        </label>
        <label className="team-filter">
          <span>Time</span>
          <select aria-label="Filtrar por time" onChange={(event) => setTeamFilter(event.target.value)} value={teamFilter}>
            <option value="all">Todos</option>
            {teams.map((team) => <option key={team} value={team}>{team}</option>)}
          </select>
        </label>
      </section>

      <section className="foundation-list" aria-label="Lista">
        {visibleItems.map((item) => (
          <article className="foundation-card" key={item.id}>
            <div className="foundation-card-main">
              <div>
                <h2>{item.title}</h2>
                <p>{item.subtitle}</p>
              </div>
              <span className={`foundation-badge ${item.badgeTone}`}>{item.badge}</span>
            </div>
            <dl className="foundation-metrics">
              {item.metrics.map((metric) => (
                <div key={metric.label}>
                  <dt>{metric.label}</dt>
                  <dd>{metric.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}

        {visibleItems.length === 0 ? (
          <div className="empty-state">
            <h2>{emptyTitle}</h2>
            <p>{emptyDescription}</p>
          </div>
        ) : null}
      </section>
    </>
  );
}
