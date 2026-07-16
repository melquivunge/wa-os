"use client";

import { ClipboardList, FileUp, ShieldCheck } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ApiError, contactImportApi, type ContactImport } from "@/lib/api-client";
import styles from "./contact-import-panel.module.css";

type ContactImportPanelProps = {
  canImport: boolean;
  imports: ContactImport[];
};

type FormErrors = Partial<Record<"source_name" | "team_name" | "csv_text", string>>;

const sampleCsv = [
  "name,phone,email,status,tags",
  "Mariana Costa,+55 11 94444-1001,mariana@example.test,active,VIP|Julho",
  "Paulo Nunes,+55 21 95555-2002,paulo@example.test,inactive,Retenção",
].join("\n");

function formatDate(value: string | null) {
  if (!value) return "Pendente";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ContactImportPanel({ canImport, imports }: ContactImportPanelProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  async function createImport(formData: FormData) {
    setFeedback(null);
    setErrors({});

    try {
      const response = await contactImportApi.create({
        source_name: String(formData.get("source_name") ?? ""),
        team_name: String(formData.get("team_name") ?? ""),
        csv_text: String(formData.get("csv_text") ?? ""),
      });
      formRef.current?.reset();
      setFeedback({
        tone: response.data.failed_rows > 0 ? "error" : "success",
        message: `${response.data.accepted_rows} contatos importados${response.data.failed_rows > 0 ? ` · ${response.data.failed_rows} linhas com erro` : ""}.`,
      });
      startTransition(() => router.refresh());
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({
          source_name: error.errors.source_name?.[0],
          team_name: error.errors.team_name?.[0],
          csv_text: error.errors.csv_text?.[0],
        });
        setFeedback({ tone: "error", message: error.message });
        return;
      }

      setFeedback({ tone: "error", message: "Não foi possível processar a importação." });
    }
  }

  return (
    <section className={styles.panel} aria-label="Importação de contatos">
      <article className={styles.dropzone}>
        <div className={styles.heading}>
          <div>
            <h2>Importar contatos demo</h2>
            <p>Cole um CSV simples para atualizar contatos por telefone. O upload real fica preparado para a próxima iteração.</p>
          </div>
          <span className={styles.badge}><ShieldCheck aria-hidden="true" size={15} /> Tenant-safe</span>
        </div>

        {canImport ? (
          <form action={createImport} className={styles.form} ref={formRef}>
            {feedback ? <p className={`${styles.feedback} ${feedback.tone === "success" ? styles.success : styles.error}`}>{feedback.message}</p> : null}
            <div className={styles.formGrid}>
              <label>
                <span>Origem</span>
                <input aria-invalid={Boolean(errors.source_name)} name="source_name" placeholder="Planilha de julho" required />
                {errors.source_name ? <small>{errors.source_name}</small> : null}
              </label>
              <label>
                <span>Time</span>
                <input aria-invalid={Boolean(errors.team_name)} name="team_name" placeholder="CRM" required />
                {errors.team_name ? <small>{errors.team_name}</small> : null}
              </label>
            </div>
            <label>
              <span>CSV</span>
              <textarea
                aria-invalid={Boolean(errors.csv_text)}
                defaultValue={sampleCsv}
                name="csv_text"
                required
              />
              {errors.csv_text ? <small>{errors.csv_text}</small> : null}
            </label>
            <div className={styles.actions}>
              <p className={styles.sample}>Cabeçalhos aceitos: name, phone, email, status, tags. Separe tags com “|”.</p>
              <button disabled={isPending} type="submit"><FileUp aria-hidden="true" size={17} /> Processar CSV</button>
            </div>
          </form>
        ) : (
          <p className={styles.readonly}>Seu papel atual permite visualizar contatos, mas não importar ou alterar a base.</p>
        )}
      </article>

      <article className={styles.ledger}>
        <div className={styles.heading}>
          <div>
            <h2>Histórico de importações</h2>
            <p>Últimos processamentos registrados para este workspace.</p>
          </div>
          <span className={styles.badge}><ClipboardList aria-hidden="true" size={15} /> Recibo</span>
        </div>

        <div className={styles.ledgerList}>
          {imports.map((item) => (
            <article className={styles.importRow} key={item.id}>
              <div>
                <h3>{item.source_name}</h3>
                <p>{item.team_name} · {formatDate(item.processed_at)}</p>
              </div>
              <span className={`${styles.status} ${item.failed_rows > 0 ? styles.statusWarn : ""}`}>
                {item.failed_rows > 0 ? "Com alertas" : "Processado"}
              </span>
              <div className={styles.counts}>
                <span><b>{item.total_rows}</b> linhas</span>
                <span><b>{item.accepted_rows}</b> aceitas</span>
                <span><b>{item.failed_rows}</b> falhas</span>
              </div>
              {item.failure_samples.length > 0 ? (
                <ul className={styles.failures}>
                  {item.failure_samples.map((failure) => (
                    <li key={`${item.id}-${failure.line}`}>Linha {failure.line}: {failure.reason}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}

          {imports.length === 0 ? (
            <p className={styles.empty}>Nenhuma importação registrada ainda. Processe um CSV demo para criar o primeiro recibo.</p>
          ) : null}
        </div>
      </article>
    </section>
  );
}
