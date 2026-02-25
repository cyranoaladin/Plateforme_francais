import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { WebVitalsReporter } from "@/components/monitoring/web-vitals-reporter";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ConsentBanner } from "@/components/consent/ConsentBanner";

export const metadata: Metadata = {
  title: "EAF Premium",
  description: "Plateforme IA premium de préparation à l’EAF en Première voie générale",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased min-h-screen bg-background text-foreground flex">
        <a href="#main-content" className="skip-to-content">Aller au contenu principal</a>
        <ThemeProvider>
          <WebVitalsReporter />
          <AppShell><main id="main-content">{children}</main></AppShell>
          <ConsentBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
