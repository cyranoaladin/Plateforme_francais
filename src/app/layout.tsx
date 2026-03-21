import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Playfair_Display, Merriweather } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { WebVitalsReporter } from "@/components/monitoring/web-vitals-reporter";
import { ConsentBanner } from "@/components/consent/ConsentBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "700"],
});

const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-merriweather",
  display: "swap",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Nexus Réussite — Préparation EAF Bac Français 2026",
  description: "Prépare ton Bac de Français avec Nexus : correction de copies, simulation d'oral officiel, tuteur IA avec sources citées. Inscris-toi gratuitement.",
  keywords: ['bac français', 'EAF', 'préparation bac', 'oral français', 'correction copie', 'Première générale', 'bac 2026'],
  openGraph: {
    title: "Nexus Réussite — Préparation EAF 2026",
    description: "Correction de copies, simulation d'oral, tuteur IA avec corpus officiel. Commence gratuitement.",
    url: 'https://eaf.nexusreussite.academy',
    siteName: 'Nexus Réussite',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Nexus Réussite — Préparation EAF 2026",
    description: "Correction de copies IA, simulation d'oral officiel.",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon.svg',
  },
};

// Force dynamic rendering - required for ThemeProvider with Context
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable} ${merriweather.variable}`} suppressHydrationWarning>
      <head>
        {/* Inline script to prevent flash of wrong theme (FOUC).
            Runs synchronously before first paint. */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('eaf_theme');if(s==='dark'||(s!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        <link rel="preload" href="/assets/oral-simulator-preview.svg" as="image" type="image/svg+xml" fetchPriority="high" />
      </head>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground flex">
        <a href="#main-content" className="skip-to-content">Aller au contenu principal</a>
        <WebVitalsReporter />
        <AppShell><main id="main-content">{children}</main></AppShell>
        <ConsentBanner />
      </body>
    </html>
  );
}
