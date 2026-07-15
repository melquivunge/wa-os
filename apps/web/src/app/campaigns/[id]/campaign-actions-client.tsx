"use client";

import { Pause, Play, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ApiError, campaignApi } from "@/lib/api-client";

type CampaignStatus = "draft" | "scheduled" | "sending" | "completed" | "paused" | "failed" | "canceled";

type CampaignActionsClientProps = {
  campaignId: string;
  status: CampaignStatus;
};

const actionLabels = {
  pause: "Pausar",
  resume: "Retomar",
  cancel: "Cancelar",
} as const;

export function CampaignActionsClient({ campaignId, status }: CampaignActionsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [runningAction, setRunningAction] = useState<keyof typeof actionLabels | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canPause = status === "scheduled" || status === "sending";
  const canResume = status === "paused";
  const canCancel = status === "draft" || status === "scheduled" || status === "sending" || status === "paused";
  const isBusy = isPending || runningAction !== null;

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
      setError(caught instanceof ApiError ? caught.message : "Não foi possível atualizar a campanha.");
    } finally {
      setRunningAction(null);
    }
  }

  if (!canPause && !canResume && !canCancel) return null;

  return (
    <div className="detail-actions" aria-label="Ações da campanha">
      <div>
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
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
