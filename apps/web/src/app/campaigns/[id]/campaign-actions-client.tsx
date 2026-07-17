"use client";

import { AlertCircle, CheckCircle2, ClipboardCheck, Pause, Play, Rocket, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ApiError, campaignApi, deliveryApi } from "@/lib/api-client";

type CampaignStatus = "draft" | "scheduled" | "sending" | "completed" | "paused" | "failed" | "canceled";

type CampaignActionsClientProps = {
  campaignId: string;
  status: CampaignStatus;
};

const actionLabels = {
  start: "Simular envio",
  pause: "Pausar",
  resume: "Retomar",
  cancel: "Cancelar",
} as const;

type ValidationState = {
  ready: boolean;
  errors: string[];
  warnings: string[];
};

export function CampaignActionsClient({ campaignId, status }: CampaignActionsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [runningAction, setRunningAction] = useState<keyof typeof actionLabels | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationState | null>(null);

  const canStart = status === "draft" || status === "scheduled";
  const canPause = status === "scheduled" || status === "sending";
  const canResume = status === "paused";
  const canCancel = status === "draft" || status === "scheduled" || status === "sending" || status === "paused";
  const canQueue = status === "sending" || status === "completed";
  const isBusy = isPending || runningAction !== null || isValidating;
  const primaryHint = canStart
    ? "Valide a campanha e rode uma simulação com dados demonstrativos."
    : canPause
      ? "Pausar mantém o histórico e permite retomar depois."
      : canResume
        ? "Retome para voltar ao fluxo operacional anterior."
        : "A campanha está em estado final.";

  async function validateCampaign() {
    setError(null);
    setValidation(null);
    setIsValidating(true);

    try {
      const response = await campaignApi.validate(campaignId);
      setValidation({
        ready: response.data.ready,
        errors: Object.values(response.data.errors).flat(),
        warnings: response.data.warnings,
      });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível validar a campanha.");
    } finally {
      setIsValidating(false);
    }
  }

  async function runAction(action: keyof typeof actionLabels) {
    if (action === "cancel" && !window.confirm("Cancelar esta campanha? Mensagens já aceitas pelo provedor não podem ser recuperadas.")) {
      return;
    }

    setError(null);
    setRunningAction(action);

    try {
      await campaignApi.transition(campaignId, action);
      startTransition(() => router.refresh());
    } catch (caught) {
      if (caught instanceof ApiError) {
        const details = Object.values(caught.errors).flat();
        setError(details.length > 0 ? details.join(" ") : caught.message);
      } else {
        setError("Não foi possível atualizar a campanha.");
      }
    } finally {
      setRunningAction(null);
    }
  }

  async function queueDelivery() {
    setError(null);
    setRunningAction(null);
    try {
      const response = await deliveryApi.dispatch(campaignId);
      setValidation({ ready: true, errors: [], warnings: [`${response.data.queued} destinatários adicionados à fila · ${response.data.existing} já estavam protegidos por idempotência.`] });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível preparar a fila de envio.");
    }
  }

  if (!canStart && !canPause && !canResume && !canCancel && !canQueue) return null;

  return (
    <div className="detail-actions" aria-label="Ações da campanha">
      <span>{primaryHint}</span>
      <div>
        {canQueue ? <button disabled={isBusy} onClick={() => void queueDelivery()} type="button"><Rocket aria-hidden="true" size={16} /> Preparar fila</button> : null}
        {canStart ? (
          <>
            <button disabled={isBusy} onClick={() => void validateCampaign()} type="button">
              <ClipboardCheck aria-hidden="true" size={16} />
              {isValidating ? "Validando..." : "Validar"}
            </button>
            <button className="primary-action" disabled={isBusy} onClick={() => void runAction("start")} type="button">
              <Rocket aria-hidden="true" size={16} />
              {runningAction === "start" ? "Simulando..." : actionLabels.start}
            </button>
          </>
        ) : null}
        {canPause ? (
          <button disabled={isBusy} onClick={() => void runAction("pause")} type="button">
            <Pause aria-hidden="true" size={16} />
            {runningAction === "pause" ? "Pausando..." : actionLabels.pause}
          </button>
        ) : null}
        {canResume ? (
          <button disabled={isBusy} onClick={() => void runAction("resume")} type="button">
            <Play aria-hidden="true" size={16} />
            {runningAction === "resume" ? "Retomando..." : actionLabels.resume}
          </button>
        ) : null}
        {canCancel ? (
          <button className="danger" disabled={isBusy} onClick={() => void runAction("cancel")} type="button">
            <XCircle aria-hidden="true" size={16} />
            {runningAction === "cancel" ? "Cancelando..." : actionLabels.cancel}
          </button>
        ) : null}
      </div>
      {validation ? (
        <div className={validation.ready ? "action-feedback success" : "action-feedback"} role="status">
          {validation.ready ? <CheckCircle2 aria-hidden="true" size={16} /> : <AlertCircle aria-hidden="true" size={16} />}
          <div>
            <b>{validation.ready ? "Pronta para simular" : "Revise antes de simular"}</b>
            {validation.errors.length > 0 || validation.warnings.length > 0 ? (
              <ul>
                {[...validation.errors, ...validation.warnings].map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : (
              <small>Audiência, template, agenda e volume foram validados.</small>
            )}
          </div>
        </div>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
