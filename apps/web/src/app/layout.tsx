import type { Metadata } from "next";
import { Manrope, Sora, Space_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"] });
const spaceMono = Space_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "WA OS — Operação de campanhas",
  description: "Gerencie campanhas, audiências e resultados do WhatsApp em um só lugar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${sora.variable} ${spaceMono.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
