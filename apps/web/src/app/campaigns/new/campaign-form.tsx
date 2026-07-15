"use client";

import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ApiError, campaignApi } from "@/lib/api-client";

type FormState = {
  name: string;
  audienceName: string;
  messageCount: string;
  date: string;
  time: string;
};

const initialState: FormState = {
  name: "",
  audienceName: "",
  messageCount: "1000",
  date: "",
  time: "",
};

function firstError(errors: Record<string, string[]>, field: string) {
  return errors[field]?.[0] ?? null;
}

export function CampaignForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const status = form.date && form.time ? "scheduled" : "draft";
  const audienceEstimate = useMemo(() => {
    const value = Number.parseInt(form.messageCount, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }, [form.messageCount]);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: [] }));
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setMessage(null);

    const scheduledAt = form.date && form.time ? `${form.date}T${form.time}:00` : null;

    try {
      await campaignApi.create({
        name: form.name,
        audience_name: form.audienceName,
        message_count: audienceEstimate,
        scheduled_at: scheduledAt,
        status,
      });
      router.push("/campaigns");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({
          ...error.errors,
          audienceName: error.errors.audience_name ?? [],
          messageCount: error.errors.message_count ?? [],
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
      <form className="campaign-form" onSubmit={handleSubmit}>
        {message ? (
          <div className="form-alert" role="alert">
            <AlertCircle aria-hidden="true" size={18} />
            <span>{message}</span>
          </div>
        ) : null}

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

        <label>
          <span>Audiência</span>
          <input
            aria-invalid={Boolean(firstError(errors, "audienceName"))}
            autoComplete="off"
            name="audienceName"
            onChange={(event) => updateField("audienceName", event.target.value)}
            placeholder="Ex: Clientes ativos"
            value={form.audienceName}
          />
          {firstError(errors, "audienceName") ? <small>{firstError(errors, "audienceName")}</small> : null}
        </label>

        <label>
          <span>Quantidade estimada</span>
          <input
            aria-invalid={Boolean(firstError(errors, "messageCount"))}
            min="0"
            name="messageCount"
            onChange={(event) => updateField("messageCount", event.target.value)}
            type="number"
            value={form.messageCount}
          />
          {firstError(errors, "messageCount") ? <small>{firstError(errors, "messageCount")}</small> : null}
        </label>

        <label>
          <span>Mensagem</span>
          <textarea placeholder="Olá {{nome}}, temos uma oferta especial para você." rows={6} />
        </label>

        <div className="form-grid">
          <label>
            <span>Data</span>
            <input onChange={(event) => updateField("date", event.target.value)} type="date" value={form.date} />
          </label>
          <label>
            <span>Hora</span>
            <input onChange={(event) => updateField("time", event.target.value)} type="time" value={form.time} />
          </label>
        </div>

        <div className="form-actions">
          <Link className="secondary-button" href="/campaigns">Cancelar</Link>
          <button className="primary-button" disabled={isSubmitting} type="submit">
            <Send aria-hidden="true" size={18} /> {isSubmitting ? "Salvando..." : "Salvar campanha"}
          </button>
        </div>
      </form>

      <aside className="campaign-preview" aria-label="Prévia da campanha">
        <div><CheckCircle2 aria-hidden="true" size={19} /><span>Status inicial</span><b>{status === "scheduled" ? "Agendada" : "Rascunho"}</b></div>
        <div><CheckCircle2 aria-hidden="true" size={19} /><span>Audiência estimada</span><b>{new Intl.NumberFormat("pt-BR").format(audienceEstimate)} contatos</b></div>
        <div><CheckCircle2 aria-hidden="true" size={19} /><span>Canal</span><b>WhatsApp</b></div>
      </aside>
    </>
  );
}
