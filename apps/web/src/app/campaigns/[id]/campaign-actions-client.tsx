"use client";

import { ClipboardCheck, Pause, Play, Rocket, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ApiError, campaignApi } from "@/lib/api-client";

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

export function CampaignActionsClient({ campaignId, status }: CampaignActionsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [runningAction, setRunningAction] = useState<keyof typeof actionLabels | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<{ ready: boolean; text: string } | null>(null);

  const canStart = status === "draft" || status === "scheduled";
  const canPause = status === "scheduled" || status === "sending";
  const canResume = status === "paused";
  const canCancel = status === "draft" || status === "scheduled" || status === "sending" || status === "paused";
  const isBusy = isPending || runningAction !== null || isValidating;

  async function validateCampaign() {
    setError(null);
    setValidation(null);
    setIsValidating(true);

    try {
      const response = await campaignApi.validate(campaignId);
      const errors = Object.values(response.data.errors).flat();
      const details = [...errors, ...response.data.warnings];
      setValidation({
        ready: response.data.ready,
        text: response.data.ready ? "Campanha pronta para simular envio." : details.join(" "),
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

  if (!canStart && !canPause && !canResume && !canCancel) return null;

  return (
    <div className="detail-actions" aria-label="Ações da campanha">
      <div>
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
      {validation ? <p className={validation.ready ? "success" : ""} role="status">{validation.text}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
