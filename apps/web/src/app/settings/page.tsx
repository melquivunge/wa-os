import { ArrowRight, CheckCircle2, Clock3, KeyRound, LockKeyhole, PlugZap, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { MemberManagement } from "@/app/settings/member-management";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { serverApiGet } from "@/lib/server-api";
import type { OrganizationMember, OrganizationRole } from "@/lib/api-client";

type MembersResponse = { data: OrganizationMember[] };

const roleLabels: Record<OrganizationRole, string> = {
  owner: "Owner",
  admin: "Admin",
  marketing: "Marketing",
  analyst: "Analyst",
};

export default async function SettingsPage() {
  const user = await requireAuthenticatedUser();
  const membersResponse = await serverApiGet<MembersResponse>(`/api/v1/organizations/${user.active_organization.id}/members`);
  const members = membersResponse?.data ?? [];
  const currentRole = user.active_organization.role as OrganizationRole;
  const canManageMembers = currentRole === "owner" || currentRole === "admin";

  return (
    <AppShell activePath="/settings">
      <div className="campaign-workspace settings-workspace">
        <header className="campaign-header settings-header">
          <div>
            <p className="eyebrow">CONFIGURAÇÕES DO WORKSPACE</p>
            <h1>{user.active_organization.name}</h1>
            <p>Gerencie o contexto da organização, acesso dos membros e o estágio da integração WhatsApp.</p>
          </div>
          <div className="settings-header-actions"><Link className="primary-action settings-open-integrations" href="/settings/integrations"><PlugZap aria-hidden="true" size={16} /> Abrir integrações</Link><span className="settings-role-pill"><ShieldCheck aria-hidden="true" size={17} /> {roleLabels[currentRole] ?? user.active_organization.role}</span></div>
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
              <div><dt>Seu acesso</dt><dd>{roleLabels[currentRole] ?? user.active_organization.role}</dd></div>
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
            <Link className="panel-link settings-integration-link" href="/settings/integrations">Gerenciar contas e validar canal <ArrowRight size={15} /></Link>
          </article>

          <MemberManagement
            canManageMembers={canManageMembers}
            currentMemberRole={currentRole}
            members={members}
            organizationId={user.active_organization.id}
          />

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
