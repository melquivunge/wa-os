"use client";

import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { ApiError, authApi } from "@/lib/api-client";
import styles from "../auth.module.css";

export default function ForgotPasswordPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    setPending(true);
    setError(null);
    setFieldError(null);
    setSuccess(null);

    try {
      await authApi.requestPasswordReset(email);
      setSuccess("Se o e-mail estiver cadastrado, você receberá as instruções em instantes.");
    } catch (caught) {
      const apiError = caught instanceof ApiError ? caught : new ApiError("Ocorreu um erro inesperado.", null);
      setError(apiError.message);
      setFieldError(apiError.errors.email?.[0] ?? null);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <header className={styles.heading}>
        <h1>Recupere seu acesso</h1>
        <p>Informe seu e-mail e enviaremos as instruções para criar uma nova senha.</p>
      </header>
      <form className={styles.form} onSubmit={submit}>
        {error && <div className={styles.alert} role="alert"><AlertCircle aria-hidden="true" size={18} /> <span>{error}</span></div>}
        {success && <div className={`${styles.alert} ${styles.success}`} role="status"><CheckCircle2 aria-hidden="true" size={18} /> <span>{success}</span></div>}
        <div className={styles.field}>
          <label htmlFor="email">E-mail da conta</label>
          <div className={styles.inputWrap}>
            <Mail aria-hidden="true" size={18} />
            <input className={styles.input} id="email" name="email" type="email" autoComplete="email" placeholder="voce@empresa.com" required aria-invalid={Boolean(fieldError)} aria-describedby={fieldError ? "email-error" : undefined} />
          </div>
          {fieldError && <p className={styles.fieldError} id="email-error">{fieldError}</p>}
        </div>
        <button className={styles.submit} type="submit" disabled={pending} aria-busy={pending}>
          {pending && <span className={styles.spinner} aria-hidden="true" />}
          {pending ? "Enviando…" : "Enviar instruções"}
        </button>
        <div className={styles.row} style={{ justifyContent: "center" }}>
          <Link className={styles.link} href="/login"><ArrowLeft aria-hidden="true" size={16} /> Voltar para o login</Link>
        </div>
      </form>
    </>
  );
}
