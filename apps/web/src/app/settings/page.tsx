import { CheckCircle2, Clock3, KeyRound, LockKeyhole, PlugZap, ShieldCheck, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { serverApiGet } from "@/lib/server-api";

type Member = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "marketing" | "analyst";
};

type MembersResponse = { data: Member[] };

const roleLabels: Record<Member["role"], string> = {
  owner: "Owner",
  admin: "Admin",
  marketing: "Marketing",
  analyst: "Analyst",
};

const roleDescriptions: Record<Member["role"], string> = {
  owner: "Controle total da organização e integrações.",
  admin: "Gerencia membros, campanhas e dados de marketing.",
  marketing: "Cria campanhas e acompanha resultados.",
  analyst: "Acesso somente leitura a campanhas e analytics.",
};

export default async function SettingsPage() {
  const user = await requireAuthenticatedUser();
  const membersResponse = await serverApiGet<MembersResponse>(`/api/v1/organizations/${user.active_organization.id}/members`);
  const members = membersResponse?.data ?? [];
  const ownerCount = members.filter((member) => member.role === "owner").length;
  const writableMembers = members.filter((member) => member.role === "owner" || member.role === "admin" || member.role === "marketing").length;

  return (
    <AppShell activePath="/settings">
      <div className="campaign-workspace settings-workspace">
        <header className="campaign-header settings-header">
          <div>
            <p className="eyebrow">CONFIGURAÇÕES DO WORKSPACE</p>
            <h1>{user.active_organization.name}</h1>
            <p>Gerencie o contexto da organização, acesso dos membros e o estágio da integração WhatsApp.</p>
          </div>
          <span className="settings-role-pill"><ShieldCheck aria-hidden="true" size={17} /> {roleLabels[user.active_organization.role as Member["role"]] ?? user.active_organization.role}</span>
        </header>

        <section className="settings-grid">
          <article className="settings-card org-card">
            <div className="settings-card-title">
              <span><ShieldCheck aria-hidden="true" size={20} /></span>
              <div>
                <h2>Organização ativa</h2>
                <p>Contexto usado em todas as consultas tenant-safe.</p>
              </div>
            </div>
            <dl className="settings-definition-list">
              <div><dt>Nome</dt><dd>{user.active_organization.name}</dd></div>
              <div><dt>Slug</dt><dd>{user.active_organization.slug}</dd></div>
              <div><dt>Timezone</dt><dd>{user.active_organization.timezone}</dd></div>
              <div><dt>Seu acesso</dt><dd>{roleLabels[user.active_organization.role as Member["role"]] ?? user.active_organization.role}</dd></div>
            </dl>
          </article>

          <article className="settings-card provider-card">
            <div className="settings-card-title">
              <span><PlugZap aria-hidden="true" size={20} /></span>
              <div>
                <h2>WhatsApp provider</h2>
                <p>Camada preparada para Meta, rodando com simulador nesta fase.</p>
              </div>
            </div>
            <div className="provider-status">
              <div><CheckCircle2 aria-hidden="true" size={18} /><span>Simulador ativo</span><b>Determinístico</b></div>
              <div><Clock3 aria-hidden="true" size={18} /><span>Meta real</span><b>Próximo marco</b></div>
              <div><KeyRound aria-hidden="true" size={18} /><span>Credenciais</span><b>Não armazenadas</b></div>
            </div>
          </article>

          <article className="settings-card settings-members-card">
            <div className="settings-card-title">
              <span><UsersRound aria-hidden="true" size={20} /></span>
              <div>
                <h2>Membros e permissões</h2>
                <p>{members.length} membros · {ownerCount} owner · {writableMembers} com escrita em marketing</p>
              </div>
            </div>
            <div className="member-list">
              {members.map((member) => (
                <div className="member-row" key={member.id}>
                  <span className="member-avatar">{member.name.slice(0, 1).toUpperCase()}</span>
                  <div>
                    <b>{member.name}</b>
                    <small>{member.email}</small>
                  </div>
                  <strong className={`member-role role-${member.role}`}>{roleLabels[member.role]}</strong>
                  <p>{roleDescriptions[member.role]}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="settings-card security-card">
            <LockKeyhole aria-hidden="true" size={22} />
            <h2>Segurança aplicada</h2>
            <p>O backend resolve a organização ativa pela sessão/membership. IDs de outros tenants retornam 404 e não revelam existência.</p>
            <ul>
              <li>Cookies de sessão first-party</li>
              <li>CSRF nas mutações</li>
              <li>Analyst em modo somente leitura</li>
            </ul>
          </article>
        </section>
      </div>
    </AppShell>
  );
}
