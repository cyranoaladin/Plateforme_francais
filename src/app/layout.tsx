import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { WebVitalsReporter } from "@/components/monitoring/web-vitals-reporter";
import { ConsentBanner } from "@/components/consent/ConsentBanner";

export const metadata: Metadata = {
  title: "Nexus Réussite — Préparation EAF",
  description: "Plateforme premium de préparation à l'EAF avec parcours personnalisé, corpus officiel et suivi de progression en Première voie générale",
};

// Force dynamic rendering - required for ThemeProvider with Context
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased min-h-screen bg-background text-foreground flex">
        <a href="#main-content" className="skip-to-content">Aller au contenu principal</a>
        <WebVitalsReporter />
        <AppShell><main id="main-content">{children}</main></AppShell>
        <ConsentBanner />
      </body>
    </html>
  );
}
