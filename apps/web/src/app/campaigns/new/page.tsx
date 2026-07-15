import { ArrowLeft, CalendarClock, MessageSquareText, Send, UsersRound } from "lucide-react";
import Link from "next/link";
import { requireAuthenticatedUser } from "@/lib/server-auth";

export default async function NewCampaignPage() {
  await requireAuthenticatedUser();

  return (
    <main className="campaign-workspace">
      <header className="campaign-header">
        <div>
          <Link className="back-link" href="/campaigns"><ArrowLeft aria-hidden="true" size={17} /> Campanhas</Link>
          <p className="eyebrow">NOVA CAMPANHA</p>
          <h1>Criar campanha</h1>
          <p>Prepare nome, audiência e agenda. A criação real na Meta fica para o próximo marco.</p>
        </div>
      </header>

      <section className="campaign-form-layout">
        <form className="campaign-form">
          <label>
            <span>Nome da campanha</span>
            <input placeholder="Ex: Oferta de fim de semana" />
          </label>
          <label>
            <span>Audiência</span>
            <input placeholder="Ex: Clientes ativos" />
          </label>
          <label>
            <span>Mensagem</span>
            <textarea placeholder="Olá {{nome}}, temos uma oferta especial para você." rows={6} />
          </label>
          <div className="form-grid">
            <label>
              <span>Data</span>
              <input type="date" />
            </label>
            <label>
              <span>Hora</span>
              <input type="time" />
            </label>
          </div>
          <div className="form-actions">
            <Link className="secondary-button" href="/campaigns">Cancelar</Link>
            <button className="primary-button" type="button"><Send aria-hidden="true" size={18} /> Salvar rascunho</button>
          </div>
        </form>

        <aside className="campaign-preview" aria-label="Prévia da campanha">
          <div><UsersRound aria-hidden="true" size={19} /><span>Audiência estimada</span><b>2.615 contatos</b></div>
          <div><MessageSquareText aria-hidden="true" size={19} /><span>Canal</span><b>WhatsApp</b></div>
          <div><CalendarClock aria-hidden="true" size={19} /><span>Status inicial</span><b>Rascunho</b></div>
        </aside>
      </section>
    </main>
  );
}
