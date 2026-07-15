import { MessageSquareText } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./auth.module.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.showcase} aria-label="Sobre o WA OS">
        <AuthBrand />
        <div className={styles.story}>
          <p className={styles.eyebrow}>Operação em movimento</p>
          <h2>Campanhas claras. Resultados que chegam.</h2>
          <p>Organize audiências, acompanhe cada mensagem e transforme conversas em decisões — tudo em um só lugar.</p>
        </div>
        <div className={styles.signal}><span><i /> Ambiente seguro</span> Seus dados protegidos de ponta a ponta.</div>
      </aside>
      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.mobileBrand}><AuthBrand /></div>
          {children}
        </div>
      </main>
    </div>
  );
}

function AuthBrand() {
  return (
    <div className={styles.brand}>
      <span className={styles.brandMark}><MessageSquareText aria-hidden="true" size={21} /></span>
      <span>WA <b>OS</b></span>
    </div>
  );
}
