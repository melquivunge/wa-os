"use client";

import { CheckCircle2, CircleAlert, KeyRound, Plus, RefreshCcw, Smartphone } from "lucide-react";
import { useState } from "react";
import { ApiError, whatsappApi, type WhatsAppAccount } from "@/lib/api-client";

export function IntegrationPanel({ accounts: initial, canManage }: { accounts: WhatsAppAccount[]; canManage: boolean }) {
  const [accounts, setAccounts] = useState(initial);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "Conta principal", business_account_id: "", phone_number_id: "", access_token: "" });

  async function addAccount() {
    try {
      const response = await whatsappApi.create(form);
      setAccounts((current) => [...current, response.data]);
      setFeedback("Conta adicionada. Valide a conexão para confirmar o canal.");
      setForm({ name: "Conta principal", business_account_id: "", phone_number_id: "", access_token: "" });
    } catch (error) { setFeedback(error instanceof ApiError ? error.message : "Não foi possível adicionar a conta."); }
  }

  async function validate(id: string) {
    try {
      const response = await whatsappApi.validate(id);
      setAccounts((current) => current.map((account) => account.id === id ? response.data : account));
      setFeedback(response.data.message);
    } catch (error) { setFeedback(error instanceof ApiError ? error.message : "Não foi possível validar a conexão."); }
  }

  return <section className="integration-layout">
    <div className="settings-card">
      <div className="settings-card-title"><span><Smartphone size={20} /></span><div><h2>Contas WhatsApp</h2><p>Credenciais ficam protegidas; tokens nunca são exibidos depois do cadastro.</p></div></div>
      {accounts.length === 0 ? <div className="empty-state"><CircleAlert size={22} /><div><b>Nenhum canal conectado</b><p>Adicione uma conta Meta para liberar validação e sincronização.</p></div></div> : <div className="integration-account-list">{accounts.map((account) => <article className="integration-account" key={account.id}><div className="account-icon"><Smartphone size={20} /></div><div><b>{account.name}</b><p>{account.display_phone_number ?? "Número ainda não validado"}</p></div><span className={`status-dot ${account.status === "connected" ? "is-good" : ""}`}><CheckCircle2 size={15} /> {account.status}</span>{canManage ? <button className="secondary-button" onClick={() => void validate(account.id)} type="button"><RefreshCcw size={15} /> Validar</button> : null}</article>)}</div>}
      {feedback ? <p className="inline-feedback">{feedback}</p> : null}
    </div>
    {canManage ? <div className="settings-card integration-form"><div className="settings-card-title"><span><KeyRound size={20} /></span><div><h2>Adicionar canal</h2><p>Use os identificadores fornecidos pelo Meta Business Manager.</p></div></div><label>Nome da conta<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Business account ID<input value={form.business_account_id} onChange={(event) => setForm({ ...form, business_account_id: event.target.value })} /></label><label>Phone number ID<input value={form.phone_number_id} onChange={(event) => setForm({ ...form, phone_number_id: event.target.value })} /></label><label>Access token<input type="password" value={form.access_token} onChange={(event) => setForm({ ...form, access_token: event.target.value })} /></label><button className="primary-button" onClick={() => void addAccount()} type="button"><Plus size={17} /> Adicionar conta</button></div> : <div className="settings-card integration-form"><div className="settings-card-title"><span><KeyRound size={20} /></span><div><h2>Checklist do canal</h2><p>O Owner precisa concluir estes passos antes do primeiro envio.</p></div></div><div className="provider-status"><div><CheckCircle2 size={18} /><span>Conta Meta cadastrada</span><b>Aguardando</b></div><div><CheckCircle2 size={18} /><span>Conexão validada</span><b>Aguardando</b></div><div><CheckCircle2 size={18} /><span>Templates sincronizados</span><b>Aguardando</b></div></div></div>}
  </section>;
}
