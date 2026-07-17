import { AppShell } from "@/components/app-shell";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { serverApiGet } from "@/lib/server-api";
import { IntegrationPanel } from "../integration-panel";
import type { WhatsAppAccount } from "@/lib/api-client";

export default async function IntegrationsPage() {
  const user = await requireAuthenticatedUser();
  const response = await serverApiGet<{ data: WhatsAppAccount[] }>("/api/v1/whatsapp-accounts");

  return (
    <AppShell activePath="/settings">
      <div className="campaign-workspace settings-workspace">
        <header className="campaign-header settings-header">
          <div>
            <p className="eyebrow">CANAIS E CONEXÕES</p>
            <h1>Integrações</h1>
            <p>Conecte o WhatsApp Business, valide a conta e acompanhe o estado do canal antes de publicar campanhas.</p>
          </div>
        </header>
        <IntegrationPanel accounts={response?.data ?? []} canManage={user.active_organization.role === "owner"} />
      </div>
    </AppShell>
  );
}
