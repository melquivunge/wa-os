import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { serverApiGet } from "@/lib/server-api";
import type { Audience, MessageTemplate } from "@/lib/api-client";
import { CampaignForm } from "./campaign-form";

type AudiencesResponse = { data: Audience[] };
type TemplatesResponse = { data: MessageTemplate[] };

export default async function NewCampaignPage() {
  await requireAuthenticatedUser();
  const [audiencesResponse, templatesResponse] = await Promise.all([
    serverApiGet<AudiencesResponse>("/api/v1/audiences"),
    serverApiGet<TemplatesResponse>("/api/v1/templates?status=approved"),
  ]);
  const audiences = audiencesResponse?.data ?? [];
  const templates = templatesResponse?.data ?? [];

  return (
    <AppShell activePath="/campaigns" hideMobileNav>
      <div className="campaign-workspace">
        <header className="campaign-header">
          <div>
            <Link className="back-link" href="/campaigns"><ArrowLeft aria-hidden="true" size={17} /> Campanhas</Link>
            <p className="eyebrow">NOVA CAMPANHA</p>
            <h1>Criar campanha</h1>
            <p>Prepare nome, audiência, template e revisão operacional. A integração real com a Meta fica para o próximo marco.</p>
          </div>
        </header>

        <section className="campaign-form-layout">
          <CampaignForm audiences={audiences} templates={templates} />
        </section>
      </div>
    </AppShell>
  );
}
