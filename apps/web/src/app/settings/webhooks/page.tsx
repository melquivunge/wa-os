import { Activity, CheckCircle2, Clock3, Code2, RadioTower, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { serverApiGet } from "@/lib/server-api";

type WebhookEvent = { id: string; provider: string; provider_event_id: string | null; status: string; received_at: string | null; processed_at: string | null; processing_error: string | null; payload: Record<string, unknown> };

function date(value: string | null) { return value ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "—"; }

export default async function WebhooksPage() {
  await requireAuthenticatedUser();
  const response = await serverApiGet<{ data: WebhookEvent[] }>("/api/v1/webhooks/meta/events");
  const events = response?.data ?? [];
  const received = events.length;
  const processed = events.filter((event) => event.status === "processed").length;
  const errors = events.filter((event) => event.status === "failed").length;

  return <AppShell activePath="/settings"><div className="campaign-workspace settings-workspace"><header className="campaign-header settings-header"><div><p className="eyebrow">OPERAÇÃO E DIAGNÓSTICO</p><h1>Webhooks Meta</h1><p>Veja os eventos recebidos pelo canal e identifique falhas antes que afetem as métricas.</p></div><span className="settings-role-pill"><RadioTower size={17} /> Endpoint ativo</span></header><section className="campaign-stats webhook-stats"><article><Activity size={20} /><span>Recebidos</span><b>{received}</b></article><article><CheckCircle2 size={20} /><span>Processados</span><b>{processed}</b></article><article><Clock3 size={20} /><span>Aguardando</span><b>{Math.max(0, received - processed - errors)}</b></article><article><ShieldCheck size={20} /><span>Falhas</span><b>{errors}</b></article></section><section className="settings-card webhook-events-card"><div className="settings-card-title"><span><Code2 size={20} /></span><div><h2>Eventos recentes</h2><p>Os payloads são armazenados por workspace para auditoria e replay.</p></div></div>{events.length === 0 ? <div className="empty-state"><RadioTower size={22} /><div><b>Nenhum webhook recebido</b><p>Configure o callback da Meta para começar a acompanhar eventos aqui.</p></div></div> : <div className="webhook-event-list">{events.map((event) => <details className="webhook-event" key={event.id}><summary><span className={`status-dot ${event.status === "processed" ? "is-good" : ""}`}>{event.status}</span><b>{event.provider_event_id ?? "Evento sem ID"}</b><time>{date(event.received_at)}</time></summary><pre>{JSON.stringify(event.payload, null, 2)}</pre></details>)}</div>}</section></div></AppShell>;
}
