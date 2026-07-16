"use client";

import { Trash2, UserPlus, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ApiError, organizationMemberApi, type OrganizationMember, type OrganizationRole } from "@/lib/api-client";
import styles from "./member-management.module.css";

const roleLabels: Record<OrganizationRole, string> = {
  owner: "Owner",
  admin: "Admin",
  marketing: "Marketing",
  analyst: "Analyst",
};

const roleDescriptions: Record<OrganizationRole, string> = {
  owner: "Controle total da organização e integrações.",
  admin: "Gerencia membros, campanhas e dados de marketing.",
  marketing: "Cria campanhas e acompanha resultados.",
  analyst: "Acesso somente leitura a campanhas e analytics.",
};

const roles: OrganizationRole[] = ["owner", "admin", "marketing", "analyst"];
const roleStyles: Record<OrganizationRole, string> = {
  owner: styles.owner,
  admin: styles.admin,
  marketing: styles.marketing,
  analyst: styles.analyst,
};

type MemberManagementProps = {
  organizationId: string;
  members: OrganizationMember[];
  canManageMembers: boolean;
  currentMemberRole: OrganizationRole;
};

type FormErrors = Partial<Record<"name" | "email" | "role", string>>;

export function MemberManagement({ organizationId, members, canManageMembers, currentMemberRole }: MemberManagementProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);

  const ownerCount = members.filter((member) => member.role === "owner").length;
  const writableMembers = members.filter((member) => member.role === "owner" || member.role === "admin" || member.role === "marketing").length;

  function refresh(message: string) {
    setFeedback({ tone: "success", message });
    startTransition(() => router.refresh());
  }

  function handleError(error: unknown) {
    if (error instanceof ApiError) {
      setErrors({
        name: error.errors.name?.[0],
        email: error.errors.email?.[0],
        role: error.errors.role?.[0],
      });
      setFeedback({ tone: "error", message: error.message });
      return;
    }

    setFeedback({ tone: "error", message: "Não foi possível concluir a ação." });
  }

  async function inviteMember(formData: FormData) {
    setErrors({});
    setFeedback(null);

    try {
      await organizationMemberApi.create(organizationId, {
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        role: String(formData.get("role") ?? "analyst") as OrganizationRole,
      });
      formRef.current?.reset();
      refresh("Membro adicionado ao workspace.");
    } catch (error) {
      handleError(error);
    }
  }

  async function updateRole(member: OrganizationMember, role: OrganizationRole) {
    if (member.role === role) return;
    setBusyMemberId(member.id);
    setFeedback(null);

    try {
      await organizationMemberApi.updateRole(organizationId, member.id, role);
      refresh(`Permissão de ${member.name} atualizada.`);
    } catch (error) {
      handleError(error);
    } finally {
      setBusyMemberId(null);
    }
  }

  async function removeMember(member: OrganizationMember) {
    setBusyMemberId(member.id);
    setFeedback(null);

    try {
      await organizationMemberApi.remove(organizationId, member.id);
      refresh(`${member.name} removido do workspace.`);
    } catch (error) {
      handleError(error);
    } finally {
      setBusyMemberId(null);
    }
  }

  return (
    <article className="settings-card settings-members-card">
      <div className={`settings-card-title ${styles.head}`}>
        <span><UsersRound aria-hidden="true" size={20} /></span>
        <div>
          <h2>Membros e permissões</h2>
          <p>{members.length} membros · {ownerCount} owner · {writableMembers} com escrita em marketing</p>
        </div>
        <strong className={`${styles.pill} ${roleStyles[currentMemberRole]}`}>Você: {roleLabels[currentMemberRole]}</strong>
      </div>

      {feedback ? <p className={`${styles.feedback} ${feedback.tone === "success" ? styles.success : styles.error}`}>{feedback.message}</p> : null}

      {canManageMembers ? (
        <form action={inviteMember} className={styles.inviteForm} ref={formRef}>
          <label>
            <span>Nome</span>
            <input aria-invalid={Boolean(errors.name)} name="name" placeholder="Nome do membro" required />
            {errors.name ? <small>{errors.name}</small> : null}
          </label>
          <label>
            <span>Email</span>
            <input aria-invalid={Boolean(errors.email)} name="email" placeholder="membro@empresa.com" required type="email" />
            {errors.email ? <small>{errors.email}</small> : null}
          </label>
          <label>
            <span>Permissão</span>
            <select aria-invalid={Boolean(errors.role)} defaultValue="analyst" name="role">
              {roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
            </select>
            {errors.role ? <small>{errors.role}</small> : null}
          </label>
          <button disabled={isPending} type="submit"><UserPlus aria-hidden="true" size={17} /> Adicionar</button>
        </form>
      ) : (
        <p className={styles.readonlyNote}>Seu papel atual permite visualizar membros, mas não alterar permissões.</p>
      )}

      <div className={styles.list}>
        {members.map((member) => {
          const isLastOwner = member.role === "owner" && ownerCount <= 1;
          const isBusy = busyMemberId === member.id || isPending;

          return (
            <div className={styles.row} key={member.id}>
              <span className={styles.avatar}>{member.name.slice(0, 1).toUpperCase()}</span>
              <div>
                <b>{member.name}</b>
                <small>{member.email}</small>
              </div>
              {canManageMembers ? (
                <select
                  aria-label={`Alterar permissão de ${member.name}`}
                  className={`${styles.roleSelect} ${roleStyles[member.role]}`}
                  disabled={isBusy || isLastOwner}
                  onChange={(event) => void updateRole(member, event.target.value as OrganizationRole)}
                  value={member.role}
                >
                  {roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
                </select>
              ) : (
                <strong className={`${styles.pill} ${roleStyles[member.role]}`}>{roleLabels[member.role]}</strong>
              )}
              <p>{roleDescriptions[member.role]}</p>
              {canManageMembers ? (
                <button
                  aria-label={`Remover ${member.name}`}
                  className={styles.removeButton}
                  disabled={isBusy || isLastOwner}
                  onClick={() => void removeMember(member)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={16} />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </article>
  );
}
