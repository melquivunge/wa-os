"use client";

import { RadioTower, RefreshCcw, ShieldCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ApiError, templateApi, type TemplateSyncResult } from "@/lib/api-client";
import styles from "./template-sync-panel.module.css";

type TemplateSyncPanelProps = {
  approved: number;
  canSync: boolean;
  total: number;
};

function formatDate(value: string | null) {
  if (!value) return "Aguardando sincronização";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function TemplateSyncPanel({ approved, canSync, total }: TemplateSyncPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastSync, setLastSync] = useState<TemplateSyncResult | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  async function syncTemplates() {
    setFeedback(null);

    try {
      const response = await templateApi.sync();
      setLastSync(response.data);
      setFeedback({
        tone: "success",
        message: `${response.data.created} novos · ${response.data.updated} atualizados · ${response.data.approved} aprovados.`,
      });
      startTransition(() => router.refresh());
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof ApiError ? error.message : "Não foi possível sincronizar templates.",
      });
    }
  }

  return (
    <section className={styles.panel} aria-label="Sincronização de templates">
      <article className={styles.syncCard}>
        <div className={styles.head}>
          <div>
            <h2>Sincronização do provedor</h2>
            <p>Atualize a biblioteca local com o catálogo determinístico do simulador. A integração real com a Meta fica para o próximo marco.</p>
          </div>
          <span className={styles.badge}><RadioTower aria-hidden="true" size={15} /> Simulador ativo</span>
        </div>

        {feedback ? <p className={`${styles.feedback} ${feedback.tone === "success" ? styles.success : styles.error}`}>{feedback.message}</p> : null}

        <div className={styles.pipeline} aria-label="Etapas da sincronização">
          <div className={styles.stage}><span>Catálogo</span><b>Provider demo</b></div>
          <div className={styles.stage}><span>Validação</span><b>Status normalizado</b></div>
          <div className={styles.stage}><span>Biblioteca</span><b>Pronto para campanha</b></div>
        </div>

        {canSync ? (
          <div className={styles.actions}>
            <p>Sincronização idempotente: repetir atualiza o estado local.</p>
            <button disabled={isPending} onClick={() => void syncTemplates()} type="button">
              <RefreshCcw aria-hidden="true" size={17} /> Sincronizar templates
            </button>
          </div>
        ) : (
          <p className={styles.readonly}>Seu papel atual permite visualizar templates, mas não sincronizar a biblioteca.</p>
        )}
      </article>

      <aside className={styles.receipt} aria-label="Recibo da biblioteca">
        <div className={styles.metric}>
          <span>Biblioteca local</span>
          <strong>{total}</strong>
          <p>{approved} templates aprovados disponíveis agora.</p>
        </div>
        <div className={styles.metric}>
          <span>Última sincronização</span>
          <strong>{lastSync ? `${lastSync.created}/${lastSync.updated}` : "—"}</strong>
          <p>{lastSync ? formatDate(lastSync.synced_at) : "Novos / atualizados aparecerão aqui."}</p>
        </div>
        <div className={styles.metric}>
          <span>Garantia</span>
          <strong><ShieldCheck aria-hidden="true" size={24} /></strong>
          <p>Dados sempre presos ao workspace ativo.</p>
        </div>
      </aside>
    </section>
  );
}
