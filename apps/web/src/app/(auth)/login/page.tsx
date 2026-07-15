"use client";

import { AlertCircle, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ApiError, authApi } from "@/lib/api-client";
import styles from "../auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    setFieldErrors({});

    try {
      await authApi.login({
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
        remember: form.get("remember") === "on",
      });
      router.replace("/");
    } catch (caught) {
      const apiError = caught instanceof ApiError ? caught : new ApiError("Ocorreu um erro inesperado.", null);
      setError(apiError.message);
      setFieldErrors(apiError.errors);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <header className={styles.heading}>
        <h1>Bem-vindo de volta</h1>
        <p>Entre com seus dados para acessar seu workspace.</p>
      </header>
      <form className={styles.form} onSubmit={submit} noValidate={false}>
        {error && <div className={styles.alert} role="alert"><AlertCircle aria-hidden="true" size={18} /> <span>{error}</span></div>}
        <div className={styles.field}>
          <label htmlFor="email">E-mail</label>
          <div className={styles.inputWrap}>
            <Mail aria-hidden="true" size={18} />
            <input className={styles.input} id="email" name="email" type="email" autoComplete="email" placeholder="voce@empresa.com" required aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "email-error" : undefined} />
          </div>
          {fieldErrors.email?.[0] && <p className={styles.fieldError} id="email-error">{fieldErrors.email[0]}</p>}
        </div>
        <div className={styles.field}>
          <label htmlFor="password">Senha</label>
          <div className={styles.inputWrap}>
            <LockKeyhole aria-hidden="true" size={18} />
            <input className={styles.input} id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Digite sua senha" required aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "password-error" : undefined} />
            <button className={styles.reveal} type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
              {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
            </button>
          </div>
          {fieldErrors.password?.[0] && <p className={styles.fieldError} id="password-error">{fieldErrors.password[0]}</p>}
        </div>
        <div className={styles.row}>
          <label className={styles.check}><input name="remember" type="checkbox" /> Manter conectado</label>
          <Link className={styles.link} href="/forgot-password">Esqueci minha senha</Link>
        </div>
        <button className={styles.submit} type="submit" disabled={pending} aria-busy={pending}>
          {pending && <span className={styles.spinner} aria-hidden="true" />}
          {pending ? "Entrando…" : "Entrar no WA OS"}
        </button>
      </form>
      <p className={styles.footnote}>Acesso exclusivo para membros convidados da sua organização.</p>
    </>
  );
}
