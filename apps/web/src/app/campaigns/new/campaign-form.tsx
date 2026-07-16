"use client";

import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Eye,
  Megaphone,
  Send,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ApiError, campaignApi } from "@/lib/api-client";
import type { Audience, MessageTemplate } from "@/lib/api-client";

type CampaignFormProps = {
  audiences: Audience[];
  templates: MessageTemplate[];
};

type FormState = {
  name: string;
  audienceId: string;
  templateId: string;
  date: string;
  time: string;
};

const steps = ["Detalhes", "Audiência", "Template", "Revisão"];

function firstError(errors: Record<string, string[]>, field: string) {
  return errors[field]?.[0] ?? null;
}

function templateVariables(body: string) {
  const variables = Array.from(body.matchAll(/\{\{\s*([^}\s]+)\s*\}\}/g), (match) => match[1]);

  return Array.from(new Set(variables));
}

function previewBody(body: string) {
  return body
    .replace(/\{\{\s*nome\s*\}\}/gi, "Marina")
    .replace(/\{\{\s*cupom\s*\}\}/gi, "WA20")
    .replace(/\{\{\s*([^}\s]+)\s*\}\}/g, "valor demo");
}

export function CampaignForm({ audiences, templates }: CampaignFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const initialTeam = audiences[0]?.team_name ?? templates[0]?.team_name ?? "all";
  const [form, setForm] = useState<FormState>({
    name: "",
    audienceId: "",
    templateId: "",
    date: "",
    time: "",
  });
  const [teamFilter, setTeamFilter] = useState(initialTeam);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    [],
  );
  const numberFormatter = useMemo(() => new Intl.NumberFormat("pt-BR"), []);
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }),
    [],
  );
  const teams = useMemo(
    () => Array.from(new Set([
      ...audiences.map((audience) => audience.team_name),
      ...templates.map((template) => template.team_name),
    ])).sort((first, second) => first.localeCompare(second, "pt-BR")),
    [audiences, templates],
  );
  const filteredAudiences = useMemo(
    () => audiences.filter((audience) => teamFilter === "all" || audience.team_name === teamFilter),
    [audiences, teamFilter],
  );
  const selectedAudience = useMemo(
    () => audiences.find((audience) => audience.id === form.audienceId) ?? null,
    [audiences, form.audienceId],
  );
  const responsibleTeam = selectedAudience?.team_name ?? (teamFilter === "all" ? null : teamFilter);
  const filteredTemplates = useMemo(
    () => templates.filter((template) => !responsibleTeam || template.team_name === responsibleTeam),
    [templates, responsibleTeam],
  );
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === form.templateId) ?? null,
    [templates, form.templateId],
  );
  const scheduledAt = form.date && form.time ? `${form.date}T${form.time}:00` : null;
  const scheduleLabel = scheduledAt ? dateFormatter.format(new Date(scheduledAt)) : "Salvar como rascunho";
  const templateMatchesAudience = Boolean(selectedTemplate && (!selectedAudience || selectedTemplate.team_name === selectedAudience.team_name));
  const audienceHasContacts = Boolean(selectedAudience && selectedAudience.contact_count > 0);
  const status = scheduledAt ? "scheduled" : "draft";
  const variables = selectedTemplate ? templateVariables(selectedTemplate.body) : [];
  const checklist = [
    { label: "Nome definido", ready: form.name.trim().length > 0 },
    { label: "Audiência com contatos", ready: audienceHasContacts },
    { label: "Template aprovado do mesmo time", ready: templateMatchesAudience },
    { label: "Agenda ou rascunho definido", ready: true },
  ];
  const readyToCreate = checklist.every((item) => item.ready);
  const hasNoResources = audiences.length === 0 || templates.length === 0;

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => {
      if (field === "audienceId") {
        const nextAudience = audiences.find((audience) => audience.id === value) ?? null;
        const templateStillMatches = nextAudience
          ? templates.some((template) => template.id === current.templateId && template.team_name === nextAudience.team_name)
          : true;

        return {
          ...current,
          audienceId: value,
          templateId: templateStillMatches ? current.templateId : "",
        };
      }

      return { ...current, [field]: value };
    });
    setErrors((current) => ({
      ...current,
      [field]: [],
      ...(field === "audienceId" ? { audienceId: [] } : {}),
      ...(field === "templateId" ? { templateId: [] } : {}),
    }));
    setMessage(null);
  }

  function updateTeam(value: string) {
    setTeamFilter(value);
    setForm((current) => ({
      ...current,
      audienceId: audiences.find((audience) => value === "all" || audience.team_name === value)?.id ?? "",
      templateId: "",
    }));
    setErrors((current) => ({ ...current, audienceId: [], templateId: [] }));
    setMessage(null);
  }

  function canAdvance() {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 1) return Boolean(selectedAudience) && audienceHasContacts;
    if (step === 2) return templateMatchesAudience;

    return readyToCreate;
  }

  function goNext() {
    if (canAdvance()) setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAudience || !selectedTemplate || !readyToCreate) {
      setMessage("Complete os itens da revisão antes de salvar a campanha.");
      setStep(3);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setMessage(null);

    try {
      await campaignApi.create({
        name: form.name,
        audience_id: selectedAudience.id,
        message_template_id: selectedTemplate.id,
        scheduled_at: scheduledAt,
        status,
      });
      router.push("/campaigns");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({
          ...error.errors,
          audienceId: error.errors.audience_id ?? [],
          templateId: error.errors.message_template_id ?? [],
        });
        setMessage(error.message);
      } else {
        setMessage("Não foi possível salvar a campanha. Tente novamente.");
      }
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form className="campaign-form wizard-form" onSubmit={handleSubmit}>
        <ol className="wizard-steps" aria-label="Etapas da criação de campanha">
          {steps.map((label, index) => (
            <li className={index === step ? "active" : index < step ? "done" : ""} key={label}>
              <span>{index + 1}</span>
              <b>{label}</b>
            </li>
          ))}
        </ol>

        {message ? (
          <div className="form-alert" role="alert">
            <AlertCircle aria-hidden="true" size={18} />
            <span>{message}</span>
          </div>
        ) : null}

        {hasNoResources ? (
          <div className="empty-resource">
            Antes de criar uma campanha, confirme que existe pelo menos uma audiência e um template aprovado.
            <div className="inline-actions">
              <Link href="/audiences">Criar audiência</Link>
              <Link href="/templates">Sincronizar templates</Link>
            </div>
          </div>
        ) : null}

        {step === 0 ? (
          <div className="wizard-panel">
            <label>
              <span>Nome da campanha</span>
              <input
                aria-invalid={Boolean(firstError(errors, "name"))}
                autoComplete="off"
                name="name"
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Ex: Oferta de fim de semana"
                value={form.name}
              />
              {firstError(errors, "name") ? <small>{firstError(errors, "name")}</small> : null}
            </label>
            <div className="form-grid">
              <label>
                <span>Data de envio</span>
                <input onChange={(event) => updateField("date", event.target.value)} type="date" value={form.date} />
              </label>
              <label>
                <span>Hora</span>
                <input onChange={(event) => updateField("time", event.target.value)} type="time" value={form.time} />
              </label>
            </div>
            <div className="review-note">
              <CalendarClock aria-hidden="true" size={18} />
              <p>Sem data e hora, a campanha fica em rascunho para publicação manual.</p>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="wizard-panel">
            <label>
              <span>Filtrar por time</span>
              <select
                aria-label="Filtrar audiências por time"
                onChange={(event) => updateTeam(event.target.value)}
                value={teamFilter}
              >
                {teams.length > 1 ? <option value="all">Todos os times</option> : null}
                {teams.map((team) => <option key={team} value={team}>{team}</option>)}
              </select>
            </label>
            <div className="choice-grid">
              {filteredAudiences.map((audience) => {
                const isEmpty = audience.contact_count <= 0;

                return (
                  <button
                    aria-pressed={form.audienceId === audience.id}
                    className={form.audienceId === audience.id ? "choice-card selected" : "choice-card"}
                    key={audience.id}
                    onClick={() => updateField("audienceId", audience.id)}
                    type="button"
                  >
                    <span>{audience.team_name}</span>
                    <b>{audience.name}</b>
                    <small>{audience.source}</small>
                    <i>
                      {numberFormatter.format(audience.contact_count)} contatos · {currencyFormatter.format(audience.estimated_spend_amount)}
                      {isEmpty ? " · precisa de contatos" : ""}
                    </i>
                  </button>
                );
              })}
            </div>
            {filteredAudiences.length === 0 ? <div className="empty-resource">Nenhuma audiência encontrada para este time.</div> : null}
            {firstError(errors, "audienceId") ? <small>{firstError(errors, "audienceId")}</small> : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="wizard-panel">
            <div className="choice-grid">
              {filteredTemplates.map((template) => (
                <button
                  aria-pressed={form.templateId === template.id}
                  className={form.templateId === template.id ? "choice-card selected" : "choice-card"}
                  key={template.id}
                  onClick={() => updateField("templateId", template.id)}
                  type="button"
                >
                  <span>{template.category} · {template.language}</span>
                  <b>{template.name}</b>
                  <small>{template.body}</small>
                  <i>{template.team_name} · aprovado</i>
                </button>
              ))}
            </div>
            {filteredTemplates.length === 0 ? <div className="empty-resource">Nenhum template aprovado encontrado para este time.</div> : null}
            {firstError(errors, "templateId") ? <small>{firstError(errors, "templateId")}</small> : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="wizard-panel">
            <div className="launch-card">
              <div>
                <span className="eyebrow">REVISÃO FINAL</span>
                <h2>{form.name || "Campanha sem nome"}</h2>
                <p>{scheduleLabel} · {selectedAudience?.team_name ?? "Time pendente"}</p>
              </div>
              <b>{readyToCreate ? "Pronta" : "Pendente"}</b>
            </div>
            <div className="readiness-list">
              {checklist.map((item) => (
                <div className={item.ready ? "ready" : "pending"} key={item.label}>
                  {item.ready ? <CheckCircle2 aria-hidden="true" size={18} /> : <AlertCircle aria-hidden="true" size={18} />}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="form-actions wizard-actions">
          {step === 0 ? (
            <Link className="secondary-button" href="/campaigns">Cancelar</Link>
          ) : (
            <button className="secondary-button" onClick={() => setStep((current) => Math.max(current - 1, 0))} type="button">Voltar</button>
          )}
          {step < steps.length - 1 ? (
            <button className="primary-button" disabled={!canAdvance() || hasNoResources} onClick={goNext} type="button">
              Continuar <ChevronRight aria-hidden="true" size={18} />
            </button>
          ) : (
            <button className="primary-button" disabled={isSubmitting || !readyToCreate} type="submit">
              <Send aria-hidden="true" size={18} /> {isSubmitting ? "Salvando..." : "Salvar campanha"}
            </button>
          )}
        </div>
      </form>

      <aside className="campaign-preview launch-preview" aria-label="Prévia da campanha">
        <div className="preview-hero">
          <span><Megaphone aria-hidden="true" size={18} /> Campanha WhatsApp</span>
          <h2>{form.name || "Nomeie a campanha"}</h2>
          <p>{selectedTemplate ? previewBody(selectedTemplate.body) : "Escolha um template para ver a mensagem que será simulada."}</p>
        </div>

        <div className="preview-metrics">
          <div>
            <UsersRound aria-hidden="true" size={18} />
            <span>Contatos</span>
            <b>{numberFormatter.format(selectedAudience?.contact_count ?? 0)}</b>
          </div>
          <div>
            <ShieldCheck aria-hidden="true" size={18} />
            <span>Time</span>
            <b>{selectedAudience?.team_name ?? "—"}</b>
          </div>
          <div>
            <Eye aria-hidden="true" size={18} />
            <span>Status</span>
            <b>{status === "scheduled" ? "Agendada" : "Rascunho"}</b>
          </div>
        </div>

        <div className="preview-row">
          <span>Gasto estimado</span>
          <b>{currencyFormatter.format(selectedAudience?.estimated_spend_amount ?? 0)}</b>
        </div>
        <div className="preview-row">
          <span>Audiência</span>
          <b>{selectedAudience?.name ?? "Selecione"}</b>
        </div>
        <div className="preview-row">
          <span>Template</span>
          <b>{selectedTemplate?.name ?? "Selecione"}</b>
        </div>
        <div className="preview-row">
          <span>Agenda</span>
          <b>{scheduleLabel}</b>
        </div>

        <div className="variable-strip">
          <span>Variáveis</span>
          <div>
            {variables.length > 0 ? variables.map((variable) => <b key={variable}>{`{{${variable}}}`}</b>) : <b>Nenhuma</b>}
          </div>
        </div>
      </aside>
    </>
  );
}
