import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { CampaignForm } from "./campaign-form";

export default async function NewCampaignPage() {
  await requireAuthenticatedUser();

  return (
    <AppShell activePath="/campaigns">
      <div className="campaign-workspace">
      <header className="campaign-header">
        <div>
          <Link className="back-link" href="/campaigns"><ArrowLeft aria-hidden="true" size={17} /> Campanhas</Link>
          <p className="eyebrow">NOVA CAMPANHA</p>
          <h1>Criar campanha</h1>
          <p>Prepare nome, audiência e agenda. A integração real com a Meta fica para o próximo marco.</p>
        </div>
      </header>

      <section className="campaign-form-layout">
        <CampaignForm />
      </section>
      </div>
    </AppShell>
  );
}
