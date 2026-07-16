"use client";

import { SlidersHorizontal, Sparkles } from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ApiError, audienceApi, type Audience } from "@/lib/api-client";
import styles from "./audience-builder.module.css";

type ContactSeed = {
  id: string;
  team_name: string;
  status: string;
  tags: string[];
};

type AudienceBuilderProps = {
  canCreate: boolean;
  contacts: ContactSeed[];
};

type BuilderStatus = "all" | "active" | "inactive";
type FormErrors = Partial<Record<"name" | "team_name" | "status" | "tag", string>>;

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numberFormatter = new Intl.NumberFormat("pt-BR");

export function AudienceBuilder({ canCreate, contacts }: AudienceBuilderProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [teamName, setTeamName] = useState(() => contacts[0]?.team_name ?? "CRM");
  const [status, setStatus] = useState<BuilderStatus>("active");
  const [tag, setTag] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const teams = useMemo(
    () => Array.from(new Set(contacts.map((contact) => contact.team_name))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [contacts],
  );
  const tags = useMemo(
    () => Array.from(new Set(contacts.flatMap((contact) => contact.tags))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [contacts],
  );
  const matchingContacts = contacts.filter((contact) => {
    const matchesTeam = contact.team_name === teamName;
    const matchesStatus = status === "all" || contact.status === status;
    const matchesTag = tag === "" || contact.tags.includes(tag);

    return matchesTeam && matchesStatus && matchesTag;
  });
  const estimatedSpend = matchingContacts.length * 30;

  async function createAudience(formData: FormData) {
    setFeedback(null);
    setErrors({});

    try {
      const response = await audienceApi.create({
        name: String(formData.get("name") ?? ""),
        team_name: String(formData.get("team_name") ?? ""),
        status: String(formData.get("status") ?? "all") as BuilderStatus,
        tag: String(formData.get("tag") ?? ""),
      });
      const audience: Audience = response.data;
      formRef.current?.reset();
      setTag("");
      setFeedback({ tone: "success", message: `${audience.name} criada com ${numberFormatter.format(audience.contact_count)} contatos.` });
      startTransition(() => router.refresh());
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({
          name: error.errors.name?.[0],
          team_name: error.errors.team_name?.[0],
          status: error.errors.status?.[0],
          tag: error.errors.tag?.[0],
        });
        setFeedback({ tone: "error", message: error.message });
        return;
      }

      setFeedback({ tone: "error", message: "Não foi possível criar a audiência." });
    }
  }

  return (
    <section className={styles.builder} aria-label="Construtor de audiência">
      <article className={styles.panel}>
        <div className={styles.head}>
          <div>
            <h2>Construtor de audiência</h2>
            <p>Transforme contatos importados em um segmento pronto para campanha, com volume e gasto estimado.</p>
          </div>
          <span className={styles.badge}><SlidersHorizontal aria-hidden="true" size={15} /> Segmento demo</span>
        </div>

        {canCreate ? (
          <form action={createAudience} className={styles.form} ref={formRef}>
            {feedback ? <p className={`${styles.feedback} ${feedback.tone === "success" ? styles.success : styles.error}`}>{feedback.message}</p> : null}
            <div className={styles.formGrid}>
              <label>
                <span>Nome da audiência</span>
                <input aria-invalid={Boolean(errors.name)} name="name" placeholder="VIP ativos de julho" required />
                {errors.name ? <small>{errors.name}</small> : null}
              </label>
              <label>
                <span>Time</span>
                <select aria-invalid={Boolean(errors.team_name)} name="team_name" onChange={(event) => setTeamName(event.target.value)} value={teamName}>
                  {teams.length === 0 ? <option value="CRM">CRM</option> : null}
                  {teams.map((team) => <option key={team} value={team}>{team}</option>)}
                </select>
                {errors.team_name ? <small>{errors.team_name}</small> : null}
              </label>
            </div>
            <div className={styles.formGrid}>
              <label>
                <span>Status</span>
                <select aria-invalid={Boolean(errors.status)} name="status" onChange={(event) => setStatus(event.target.value as BuilderStatus)} value={status}>
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
                {errors.status ? <small>{errors.status}</small> : null}
              </label>
              <label>
                <span>Tag opcional</span>
                <select aria-invalid={Boolean(errors.tag)} name="tag" onChange={(event) => setTag(event.target.value)} value={tag}>
                  <option value="">Sem tag</option>
                  {tags.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                {errors.tag ? <small>{errors.tag}</small> : null}
              </label>
            </div>
            <div className={styles.ruleTape} aria-label="Prévia dos filtros">
              <span>Filtro <b>{teamName}</b></span>
              <span>Status <b>{status === "all" ? "Todos" : status === "active" ? "Ativos" : "Inativos"}</b></span>
              <span>Tag <b>{tag || "Sem tag"}</b></span>
            </div>
            <div className={styles.actions}>
              <p>A audiência salva usa o volume atual da base demo.</p>
              <button disabled={isPending} type="submit"><Sparkles aria-hidden="true" size={17} /> Criar audiência</button>
            </div>
          </form>
        ) : (
          <p className={styles.readonly}>Seu papel atual permite visualizar audiências, mas não criar novos segmentos.</p>
        )}
      </article>

      <aside className={styles.preview} aria-label="Estimativa da audiência">
        <div className={styles.head}>
          <div>
            <h2>Prévia</h2>
            <p>Estimativa calculada a partir dos contatos carregados.</p>
          </div>
        </div>
        <div className={styles.previewCard}>
          <span>Contatos encontrados</span>
          <strong>{numberFormatter.format(matchingContacts.length)}</strong>
          <p>{teamName} · {status === "all" ? "todos os status" : status === "active" ? "ativos" : "inativos"}{tag ? ` · ${tag}` : ""}</p>
        </div>
        <div className={styles.previewCard}>
          <span>Gasto estimado</span>
          <strong>{currencyFormatter.format(estimatedSpend)}</strong>
          <p>Base demo usa R$ 0,30 por contato.</p>
        </div>
      </aside>
    </section>
  );
}
