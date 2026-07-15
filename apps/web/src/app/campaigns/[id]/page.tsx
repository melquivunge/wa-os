import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Eye,
  FileText,
  Megaphone,
  MessageSquareText,
  ReceiptText,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { serverApiGet } from "@/lib/server-api";

type CampaignDetail = {
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
  started_at: string | null;
  completed_at: string | null;
  audience: {
    name: string;
    source: string;
    contact_count: number;
    estimated_spend_amount: number;
    rules: string[];
  } | null;
  message_template: {
    name: string;
    category: string;
    language: string;
    body: string;
  } | null;
  timeline: Array<{
    label: string;
    state: "done" | "current" | "pending";
    value: string | null;
  }>;
};

type CampaignDetailResponse = { data: CampaignDetail };

const statusLabels: Record<CampaignDetail["status"], string> = {
  draft: "Rascunho",
  scheduled: "Agendada",
  sending: "Enviando",
  completed: "Concluída",
  paused: "Pausada",
  failed: "Falhou",
};

function formatDate(value: string | null) {
  if (!value) return "Pendente";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuthenticatedUser();
  const { id } = await params;
  const response = await serverApiGet<CampaignDetailResponse>(`/api/v1/campaigns/${id}`);

  if (!response?.data) notFound();

  const campaign = response.data;
  const numberFormatter = new Intl.NumberFormat("pt-BR");
  const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const deliveryRate = campaign.message_count > 0 ? Math.round((campaign.delivered_count / campaign.message_count) * 100) : 0;
  const readRate = campaign.delivered_count > 0 ? Math.round((campaign.read_count / campaign.delivered_count) * 100) : 0;
  const failureRate = campaign.message_count > 0 ? Math.round((campaign.failed_count / campaign.message_count) * 100) : 0;

  return (
    <AppShell activePath="/campaigns">
      <div className="campaign-workspace">
        <header className="campaign-header detail-header">
          <div>
            <Link className="back-link" href="/campaigns"><ArrowLeft aria-hidden="true" size={17} /> Campanhas</Link>
            <p className="eyebrow">DETALHE DA CAMPANHA</p>
            <h1>{campaign.name}</h1>
            <p>{campaign.audience_name} · {campaign.team_name} · {statusLabels[campaign.status]}</p>
          </div>
          <span className={`status status-${campaign.status}`}>{statusLabels[campaign.status]}</span>
        </header>

        <section className="campaign-stats" aria-label="Resumo da campanha">
          <article><MessageSquareText aria-hidden="true" size={20} /><span>Mensagens</span><b>{numberFormatter.format(campaign.message_count)}</b></article>
          <article><CheckCircle2 aria-hidden="true" size={20} /><span>Entrega</span><b>{deliveryRate}%</b></article>
          <article><Eye aria-hidden="true" size={20} /><span>Leitura</span><b>{readRate}%</b></article>
          <article><ReceiptText aria-hidden="true" size={20} /><span>Gasto</span><b>{currencyFormatter.format(campaign.spend_amount)}</b></article>
        </section>

        <section className="campaign-detail-grid">
          <article className="campaign-detail-card detail-hero-panel">
            <div className="panel-head">
              <div><h2>Progresso operacional</h2><p>Etapas principais derivadas da campanha</p></div>
              <b>{campaign.progress}%</b>
            </div>
            <div className="detail-progress"><span style={{ width: `${campaign.progress}%` }} /></div>
            <div className="detail-timeline">
              {campaign.timeline.map((item) => (
                <div className={item.state} key={item.label}>
                  <i />
                  <b>{item.label}</b>
                  <span>{formatDate(item.value)}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="campaign-detail-card detail-side-panel">
            <div className="panel-head"><div><h2>Saúde do envio</h2><p>Taxas calculadas sobre os totais atuais</p></div></div>
            <dl className="detail-rate-list">
              <div>
                <dt>Entregues</dt>
                <dd><span>{numberFormatter.format(campaign.delivered_count)}</span><b>{deliveryRate}%</b></dd>
                <i><span style={{ width: `${deliveryRate}%` }} /></i>
              </div>
              <div>
                <dt>Lidas</dt>
                <dd><span>{numberFormatter.format(campaign.read_count)}</span><b>{readRate}%</b></dd>
                <i><span style={{ width: `${readRate}%` }} /></i>
              </div>
              <div>
                <dt>Falhas</dt>
                <dd><span>{numberFormatter.format(campaign.failed_count)}</span><b>{failureRate}%</b></dd>
                <i className="danger"><span style={{ width: `${failureRate}%` }} /></i>
              </div>
            </dl>
          </article>

          <article className="campaign-detail-card resource-detail-card">
            <div className="resource-detail-title">
              <span className="resource-icon"><UsersRound aria-hidden="true" size={18} /></span>
              <h2>Audiência</h2>
            </div>
            <p>{campaign.audience?.name ?? campaign.audience_name}</p>
            <dl>
              <div><dt>Origem</dt><dd>{campaign.audience?.source ?? "Manual"}</dd></div>
              <div><dt>Contatos</dt><dd>{numberFormatter.format(campaign.audience?.contact_count ?? campaign.message_count)}</dd></div>
              <div><dt>Regras</dt><dd>{campaign.audience?.rules?.join(", ") || "—"}</dd></div>
            </dl>
          </article>

          <article className="campaign-detail-card resource-detail-card template">
            <div className="resource-detail-title">
              <span className="resource-icon"><FileText aria-hidden="true" size={18} /></span>
              <h2>Template</h2>
            </div>
            <p>{campaign.message_template?.name ?? "Template não informado"}</p>
            <dl>
              <div><dt>Categoria</dt><dd>{campaign.message_template?.category ?? "—"}</dd></div>
              <div><dt>Idioma</dt><dd>{campaign.message_template?.language ?? "—"}</dd></div>
            </dl>
            <blockquote>{campaign.message_template?.body ?? "Campanha criada antes da seleção de template."}</blockquote>
          </article>

          <article className="campaign-detail-card resource-detail-card">
            <div className="resource-detail-title">
              <span className="resource-icon"><CalendarClock aria-hidden="true" size={18} /></span>
              <h2>Agenda</h2>
            </div>
            <p>{formatDate(campaign.scheduled_at)}</p>
            <dl>
              <div><dt>Início</dt><dd>{formatDate(campaign.started_at)}</dd></div>
              <div><dt>Conclusão</dt><dd>{formatDate(campaign.completed_at)}</dd></div>
            </dl>
          </article>

          <article className="campaign-detail-card resource-detail-card">
            <div className="resource-detail-title">
              <span className="resource-icon"><Megaphone aria-hidden="true" size={18} /></span>
              <h2>Operação</h2>
            </div>
            <p>{campaign.team_name}</p>
            <dl>
              <div><dt>Status</dt><dd>{statusLabels[campaign.status]}</dd></div>
              <div><dt>Gasto</dt><dd>{currencyFormatter.format(campaign.spend_amount)}</dd></div>
            </dl>
          </article>
        </section>
      </div>
    </AppShell>
  );
}
