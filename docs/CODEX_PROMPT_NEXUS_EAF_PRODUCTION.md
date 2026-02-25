# PROMPT CODEX — NEXUS RÉUSSITE EAF
## Finalisation complète pour déploiement production
### Serveur dédié · eaf.nexusreussite.academy · LLM local + RAG local + OpenAI ponctuel

---

## CONTEXTE GÉNÉRAL

Tu travailles sur **Nexus Réussite EAF**, une plateforme SaaS 100% agentique de préparation à l'Épreuve Anticipée de Français (Première générale, voie générale). La plateforme sera déployée sur un serveur dédié en sous-domaine `eaf.nexusreussite.academy`.

### Infrastructure cible
- **Serveur dédié** (Linux, nginx en reverse proxy)
- **LLM local** : Ollama (modèles disponibles localement, ex: `llama3.1:70b`, `mistral-nemo`, `qwen2.5:14b`)
- **RAG local** : pgvector (PostgreSQL) + index BM25 local
- **OpenAI API** (ponctuel uniquement) : utilisé SEULEMENT quand la requête exige une précision et pertinence maximale (ex: correction OCR complexe, feedback oral détaillé, diagnostic initial)
- **Stack** : Next.js 16 + App Router, TypeScript strict, Tailwind CSS 4, Prisma 6 + PostgreSQL

### Vision produit
**Plateforme 100% agentique sans aucune intervention humaine** (ni enseignant, ni coach humain). L'élève est accompagné uniquement par des agents IA spécialisés. Modèle commercial : abonnement mensuel (14,90€) ou achat à vie (89€). La plateforme évolue automatiquement selon le profil et le parcours de l'élève.

---

## MISSION GLOBALE

Implémenter toutes les fonctionnalités, corrections, et améliorations listées ci-dessous pour produire un produit **finalisé, testé et prêt au déploiement en production** sur `eaf.nexusreussite.academy`. Chaque bloc doit être complété dans l'ordre de priorité indiqué.

---

## BLOC 0 — CONFIGURATION LLM HYBRIDE LOCAL + OPENAI PONCTUEL

### 0.1 — Refonte du LLM Router

Crée `src/lib/llm/router.ts` qui implémente la logique de sélection automatique du provider :

```typescript
// Logique de routage :
// - Par défaut : Ollama local (modèle configuré via OLLAMA_MODEL=llama3.1:70b)
// - OpenAI ponctuel si : qualityMode === 'precision' OU si la task est dans HIGH_PRECISION_TASKS
// HIGH_PRECISION_TASKS = ['correcteur', 'diagnosticien', 'coach_oral_final', 'avocat_diable']

type QualityMode = 'standard' | 'precision'

interface LLMRouterConfig {
  task: string
  qualityMode?: QualityMode
  forceProvider?: 'ollama' | 'openai'
}

export function selectProvider(config: LLMRouterConfig): 'ollama' | 'openai'
```

**Variables d'environnement à ajouter dans `.env` et `.env.example` :**

```env
# LLM Local (Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:70b
OLLAMA_FAST_MODEL=qwen2.5:7b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# LLM Précision (OpenAI ponctuel)
OPENAI_API_KEY=sk-...
OPENAI_PRECISION_MODEL=gpt-4o
OPENAI_PRECISION_TASKS=correcteur,diagnosticien,coach_oral_final,avocat_diable

# Routing
LLM_QUALITY_THRESHOLD=0.75
LLM_COST_TRACKING=true

# RAG Local
RAG_PROVIDER=pgvector
RAG_EMBED_PROVIDER=ollama
RAG_EMBED_MODEL=nomic-embed-text
RAG_TOP_K=8
RAG_RERANK=true

# App
NEXT_PUBLIC_APP_URL=https://eaf.nexusreussite.academy
NEXT_PUBLIC_APP_NAME=Nexus Réussite EAF
```

### 0.2 — Adapter Ollama

Crée `src/lib/llm/adapters/ollama.ts` :
- Client HTTP vers `OLLAMA_BASE_URL`
- Support streaming (Server-Sent Events → `ReadableStream`)
- Support chat completions format compatible avec l'orchestrateur existant
- Retry automatique (3 tentatives, backoff exponentiel 500ms/1s/2s)
- Timeout configurable (30s par défaut, 120s pour tâches lourdes)
- Health check : `GET /api/health` → `GET http://localhost:11434/api/tags` pour vérifier Ollama
- Fallback : si Ollama unreachable → log d'alerte + bascule automatique sur OpenAI

### 0.3 — Adapter OpenAI ponctuel

Mets à jour `src/lib/llm/adapters/openai.ts` :
- Utiliser `openai` npm package (pas de fetch manuel)
- Modèle par défaut : `OPENAI_PRECISION_MODEL=gpt-4o`
- Tracker les tokens consommés dans la table `LlmCostLog` (nouvelle table Prisma)
- Budget mensuel configurable : si `OPENAI_MONTHLY_BUDGET_EUR` dépassé → alerter admin + basculer Ollama

### 0.4 — RAG avec embeddings Ollama locaux

Mets à jour `src/lib/rag/indexer.ts` et `src/lib/rag/vector-search.ts` :
- Génération des embeddings via Ollama (`nomic-embed-text`, dimension 768) en local
- Stocker dimension dans `EMBEDDING_DIM=768` (actuellement 3072 pour OpenAI → migration nécessaire)
- Migration Prisma : modifier `vector(3072)` → `vector(768)` dans le chunk schema
- Commande de ré-indexation complète : `npm run rag:reindex`
- Reranker local : cross-encoder BM25 pour top-50 → top-8 (implémentation TypeScript pure, pas de service externe)

---

## BLOC 1 — MODÈLE COMMERCIAL COMPLET (STRIPE)

### 1.1 — Schema Prisma Subscription

Ajoute dans `prisma/schema.prisma` :

```prisma
model Subscription {
  id                   String             @id @default(cuid())
  userId               String             @unique
  user                 User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeCustomerId     String?            @unique
  stripeSubscriptionId String?            @unique
  stripePriceId        String?
  plan                 SubscriptionPlan   @default(FREE)
  status               SubscriptionStatus @default(ACTIVE)
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean            @default(false)
  trialEnd             DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
}

model LlmCostLog {
  id          String   @id @default(cuid())
  userId      String
  provider    String   // 'ollama' | 'openai'
  model       String
  task        String
  inputTokens Int      @default(0)
  outputTokens Int     @default(0)
  costEur     Float    @default(0)
  createdAt   DateTime @default(now())
}

enum SubscriptionPlan {
  FREE
  MONTHLY
  LIFETIME
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIALING
  PAUSED
}
```

### 1.2 — Feature Gating Middleware

Crée `src/lib/billing/gating.ts` :

```typescript
// Plans et leurs limites
const PLAN_LIMITS = {
  FREE: {
    epreuvesPerMonth: 3,
    correctionsPerMonth: 1,
    oralSessionsPerMonth: 2,
    tuteurMessagesPerDay: 10,
    quizPerDay: 3,
    adaptiveParcours: false,
    avocatDuDiable: false,
    spacedRepetition: false,
    rapportHebdo: false,
    graphRag: false,
  },
  MONTHLY: {
    epreuvesPerMonth: Infinity,
    correctionsPerMonth: Infinity,
    oralSessionsPerMonth: Infinity,
    tuteurMessagesPerDay: Infinity,
    quizPerDay: Infinity,
    adaptiveParcours: true,
    avocatDuDiable: true,
    spacedRepetition: true,
    rapportHebdo: true,
    graphRag: false,
  },
  LIFETIME: {
    // tout illimité + graphRag: true
  }
}

// Middleware à utiliser dans chaque route API
export async function requirePlan(
  userId: string,
  feature: keyof typeof PLAN_LIMITS.FREE
): Promise<{ allowed: boolean; reason?: string; upgradeUrl?: string }>
```

Crée `src/middleware/billing.ts` :
- Injecter le plan dans chaque requête auth (`req.plan`)
- Répondre `402 Payment Required` avec body `{ error: 'PLAN_LIMIT', feature, upgradeUrl: '/pricing' }` si dépassement
- Compteurs mensuels/journaliers en base de données (table `UsageCounter`)

### 1.3 — API Routes Stripe

Crée `src/app/api/v1/billing/` :

**`checkout/route.ts`** — POST :
- Créer ou récupérer Stripe Customer
- Créer Checkout Session (mode `subscription` pour mensuel, mode `payment` pour lifetime)
- IDs prix : `STRIPE_PRICE_MONTHLY_ID`, `STRIPE_PRICE_LIFETIME_ID`
- Trial 7 jours sur le mensuel : `trial_period_days: 7`
- `success_url`: `/dashboard?activated=true`
- `cancel_url`: `/pricing`

**`webhook/route.ts`** — POST :
- Vérifier signature Stripe (`STRIPE_WEBHOOK_SECRET`)
- Gérer : `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Mettre à jour table `Subscription` selon les événements
- Sur `invoice.payment_failed` → email automatique (template dans `/emails/payment-failed.tsx`)

**`portal/route.ts`** — POST :
- Créer Stripe Customer Portal Session
- Permet à l'élève de gérer son abonnement (annulation, changement CB)

**`status/route.ts`** — GET :
- Retourner plan actuel, date expiration, usage du mois

### 1.4 — Variables Stripe

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY_ID=price_...
STRIPE_PRICE_LIFETIME_ID=price_...
STRIPE_MONTHLY_BUDGET_OPENAI_EUR=50
```

---

## BLOC 2 — SUPPRESSION DÉPENDANCE ENSEIGNANT HUMAIN

### 2.1 — Transformation espace enseignant → Analytics Auto

**Supprimer** :
- Le commentaire manuel des copies par un enseignant (`POST /api/v1/enseignant/corrections/{copieId}/comment`)
- La page de commentaire dans `/enseignant`
- La référence au rôle `enseignant` dans l'UI principale

**Conserver et automatiser** :
- Le code classe (renommé "code établissement B2B") → route `/api/v1/b2b/class-code`
- Le dashboard → transformer en **rapport analytique auto-généré**

**Créer** `src/app/analytics/page.tsx` :
- Accessible uniquement avec plan LIFETIME ou via code B2B établissement payant
- Généré automatiquement par l'agent `rapport_auto` chaque dimanche
- Contenu : progression SkillMap agrégée, taux d'adhérence, erreurs récurrentes, prédiction
- Téléchargeable en PDF via route existante adaptée

### 2.2 — Nettoyage des rôles

Dans `prisma/schema.prisma` :
- Remplacer `role: eleve|enseignant|parent` par `role: eleve|admin`
- Migration Prisma pour renommer/consolider

Dans `middleware.ts` :
- Supprimer les guards `/enseignant/*` et `/parent/*`
- Ajouter guard `/analytics/*` → requirePlan LIFETIME

Dans la seed :
- Supprimer le compte enseignant de démonstration
- Garder uniquement compte élève démo

---

## BLOC 3 — STORAGE S3 + WORKER BULLMQ

### 3.1 — Storage S3/Compatible

Implémente `src/lib/storage/s3.ts` :
- Utiliser `@aws-sdk/client-s3` avec `@aws-sdk/s3-request-presigner`
- Compatible avec : AWS S3, Cloudflare R2, MinIO (selon `STORAGE_PROVIDER`)
- Fonctions : `uploadFile(buffer, key, mimeType)`, `getFileUrl(key)`, `deleteFile(key)`, `getPresignedUrl(key, expiresIn)`
- Pour serveur dédié local : option `STORAGE_PROVIDER=local` qui stocke dans `/var/eaf/uploads/` (chemin configurable via `LOCAL_STORAGE_PATH`)

```env
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=/var/eaf/uploads
# Ou si S3 :
# STORAGE_PROVIDER=s3
# S3_BUCKET=nexus-eaf-uploads
# S3_REGION=eu-west-3
# S3_ACCESS_KEY_ID=...
# S3_SECRET_ACCESS_KEY=...
# S3_ENDPOINT=https://... (pour R2/MinIO)
```

### 3.2 — Worker BullMQ

Installe : `npm install bullmq ioredis`

Crée `src/lib/queue/correction-queue.ts` :
- Queue `correction-jobs` avec Redis (`REDIS_URL=redis://localhost:6379`)
- Job type : `{ copieId, userId, epreuveId, ocrText? }`
- Concurrence : `concurrency: 3` (3 corrections parallèles max)
- Timeout : 180s par job
- Retry : 2 fois sur erreur LLM, 0 fois sur erreur validation

Crée `src/workers/correction-worker.ts` :
- Démarré séparément via `npm run worker` (script dans `package.json`)
- Traite les jobs de correction : OCR → Correcteur agent → mise à jour DB
- Logs structurés pino avec `{ jobId, copieId, duration, provider, success }`
- PM2 config incluse dans `ecosystem.config.js` pour le serveur dédié

```env
REDIS_URL=redis://localhost:6379
WORKER_CONCURRENCY=3
```

---

## BLOC 4 — ONBOARDING PREMIUM 5 ÉTAPES

Refonte complète de `src/app/onboarding/page.tsx` en 5 étapes avec état géré par un stepper animé.

### Étape 1 — Révélation (30 secondes)
- Animation d'intro fullscreen : texte "Nexus analyse 847 patterns EAF..." avec compteur animé
- Affichage des stats sociales : "1 247 élèves préparés · Progression moyenne +2,3 pts"
- Bouton : "Découvrir mon niveau →"

### Étape 2 — Identité (formulaire premium)
- Prénom (obligatoire)
- Date EAF → countdown ticker visible immédiatement ("J-47 avant tes EAF")
- Sélection œuvres : interface **card visuelle** avec titre + auteur + image de couverture (SVG généré), sélection multiple avec animation checkmark
- Code établissement (optionnel, champ discret)

### Étape 3 — Diagnostic IA Live (8 minutes)
**C'est le cœur de l'onboarding.** L'élève répond à de VRAIES questions EAF, pas des curseurs.

**Séquence :**
1. Extrait texte (150 mots) → question : "Identifie et commente UN procédé stylistique de cet extrait" → textarea avec 5 min countdown
2. Question de grammaire : "Réécris cette phrase en changeant le temps verbal" → input
3. Question orale (optionnelle) : bouton microphone STT → 60 secondes pour lire un extrait à voix haute

**Appel API pendant que l'élève écrit :**
- `POST /api/v1/onboarding/analyze-response` → agent `diagnosticien` avec `qualityMode: 'standard'` (Ollama)
- Streaming de l'analyse (typewriter) pendant que l'élève voit "Nexus analyse ta réponse..."

### Étape 4 — Révélation du Profil
- Animation spectaculaire du **radar SkillMap** (Recharts RadarChart) qui se construit axe par axe
- Affichage : "Nexus a analysé 12 micro-compétences"
- Les 3 priorités avec icônes et labels clairs
- Premier plan J+7 généré en temps réel (affichage progressif)

### Étape 5 — Activation
- Si pas encore abonné : carte pricing 3 colonnes (Free/Mensuel/Lifetime) avec focus sur Mensuel
- Trial 7 jours gratuit mis en avant : "7 jours gratuits, sans engagement, tu peux annuler quand tu veux"
- Bouton Stripe Checkout via `/api/v1/billing/checkout`
- Bouton "Continuer en mode découverte" (plan FREE)

**API à créer :**
- `POST /api/v1/onboarding/analyze-response` — analyse la réponse diagnostic et retourne le profil partiel
- Mettre à jour `POST /api/v1/onboarding/complete` pour accepter les nouvelles données (diagnosticResponses, analysisResult)

---

## BLOC 5 — LANDING PAGE CONVERTISSANTE

Remplace `src/app/bienvenue/page.tsx` par une landing page premium full-conversion :

### Structure (dans cet ordre exact)

**HERO SECTION**
- Titre H1 grand format : "Ton précepteur IA pour les EAF. Disponible 24h/24, jamais fatigué, jamais impatient."
- Sous-titre : "La seule plateforme qui connaît tes erreurs par cœur et te fait progresser automatiquement — sans enseignant."
- CTA primaire → `/onboarding` : "Découvrir mon niveau gratuitement →"
- CTA secondaire → `#demo` : "Voir une démonstration"
- Social proof immédiat : "⭐ 4,8/5 · 1 247 élèves · Progression moyenne +2,3 pts"

**SECTION DEMO INTERACTIVE** (id="demo")
- Gif/vidéo courte ou simulation statique animée montrant : un extrait → correction IA → rapport
- Sans inscription requise : 1 exemple de correction visible directement

**SECTION FEATURES (3 colonnes)**
- ✏️ Corrections illimitées avec rapport détaillé
- 🎤 Simulation jury oral 2/8/2/8
- 🧠 Parcours qui s'adapte à chaque erreur

**SECTION PRICING** (id="pricing")
- 3 cartes : Découverte (gratuit) / Mensuel 14,90€ / Lifetime 89€
- Badge "Meilleure valeur" sur Lifetime
- Sous le prix mensuel : "= 0,49€/jour · Moins cher qu'1h de soutien scolaire"
- CTA différenciés : "Commencer gratuitement" / "Essayer 7 jours gratuits" / "Accès à vie"
- Boutons checkout Stripe directs

**SECTION SOCIAL PROOF**
- 3 testimonials (texte + prénom + classe)
- Statistiques : temps moyen de progression, note moyenne après 6 semaines

**FAQ** (6 questions/réponses en accordéon)
- "Est-ce que c'est vraiment sans enseignant ?" → "Oui, 100% IA"
- "Que se passe-t-il après les EAF ?" → "L'accès lifetime reste actif"
- "Mes données sont-elles sécurisées ?"
- "Puis-je annuler n'importe quand ?" → Oui pour mensuel
- "Ça marche pour toutes les œuvres ?"
- "Comment ça sait ce que je dois travailler ?"

**FOOTER** avec liens légaux (CGV, Politique de confidentialité, Mentions légales)

---

## BLOC 6 — DASHBOARD NARRATIF

Refonte de `src/app/page.tsx` (dashboard principal) :

### Layout 5 zones

**ZONE 1 — Header dynamique contextuel**
```
"Bonjour {prénom} ☀️   J-{countdown} avant tes EAF"
Message IA contextuel selon heure + dernier accès (généré par agent, mis en cache 24h)
```

**ZONE 2 — Mission du jour** (générée par l'agent Planner)
- 1 à 3 tâches prioritaires avec bouton d'action direct
- Chaque tâche : icône + titre + durée estimée + bouton "→ Commencer"
- Si tâche ErrorBank due : badge rouge "Révision urgente : tu avais raté [procédé X] il y a 7 jours"
- Appel API : `GET /api/v1/parcours/today` (nouveau endpoint, plan du jour simplifié)

**ZONE 3 — Progression cette semaine**
- RadarChart SkillMap animé (Recharts) avec delta vs semaine précédente
- Streak counter avec animation flamme 🔥
- Message narratif : "Tu as progressé de 12% en explication linéaire cette semaine 🎯"

**ZONE 4 — Dernières activités**
- 3 dernières corrections avec score et bouton "Revoir"
- Dernière session orale avec note /20

**ZONE 5 — Quick chat Tuteur**
- Input minimal "Pose une question à Nexus..."
- Redirige vers `/tuteur` avec message pré-rempli

---

## BLOC 7 — STREAMING LLM DANS TOUS LES ATELIERS

### 7.1 — API Routes avec Streaming

Toutes les routes LLM doivent retourner un `ReadableStream` (Server-Sent Events) :

Pattern à appliquer sur **toutes** les routes : `/tuteur/message`, `/atelier-oral/interact`, `/quiz/generate`, `/parcours/generate` :

```typescript
// Exemple pattern streaming
export async function POST(req: Request) {
  // ...validation...
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  
  // Lancer la génération en arrière-plan
  generateWithStreaming(prompt, writer) // fire & forget
  
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

### 7.2 — Hook client useStreamingChat

Crée `src/hooks/useStreamingChat.ts` :
- `useStreamingChat({ endpoint, onToken, onComplete, onError })`
- Gère l'EventSource, le buffer des tokens, et le rendu progressif
- Expose : `send(message)`, `isStreaming`, `currentText`, `abort()`

### 7.3 — Composant TypewriterText

Crée `src/components/ui/typewriter-text.tsx` :
- Anime l'apparition des tokens avec curseur clignotant
- Props : `text: string`, `speed?: number`, `onComplete?: () => void`

---

## BLOC 8 — AGENTS NOUVEAUX

### 8.1 — Agent Avocat du Diable

Crée `src/lib/agents/avocat-diable.ts` :

```typescript
// System prompt strict :
// - Mode entraînement uniquement (PolicyGate bloque en mode examen)
// - Input : thèse + plan de l'élève
// - Output Zod :
{
  objections: Array<{ point: string; contreArgument: string; source?: string }>; // max 3
  suggestions: Array<{ axe: string; renforcement: string }>; // max 3
  verdict: 'solide' | 'à_renforcer' | 'fragile';
  score: number; // 0-100
}
// - Provider : Ollama par défaut, OpenAI si verdict complexe
// - Citations obligatoires (R-CITE-01)
```

Route : `POST /api/v1/avocat-diable/analyze`
Gating : requirePlan('avocatDuDiable')

### 8.2 — Agent Rapport Auto

Crée `src/lib/agents/rapport-auto.ts` :

```typescript
// Génération rapport hebdomadaire sans intervention humaine
// Appelé par le cron job chaque dimanche à 20h (voir Bloc 11)
// Input : studentId, weekNumber
// Output :
{
  weekLabel: string; // "Semaine du 17 au 23 février"
  skillMapDelta: SkillMapDelta[];
  sessionsStats: { planned: number; completed: number; adherenceRate: number };
  topErrors: ErrorBankItem[];
  prediction: string; // texte pédagogique, pas de score chiffré (R-AIACT-01)
  nextWeekFocus: string[];
  pdfUrl: string; // URL du PDF généré
}
```

Route : `GET /api/v1/rapport/latest` — retourner le dernier rapport de l'élève connecté
Route : `POST /api/v1/rapport/generate` — forcer la régénération (admin seulement)

### 8.3 — Agent Rappel Spaced Repetition

Crée `src/lib/agents/rappel-agent.ts` :
- Consulte `ErrorBankItem` avec `nextRevision <= now()`
- Génère un micro-exercice personnalisé sur l'erreur exacte
- Marque la révision comme faite ou replanifie selon le résultat
- Déclenché au login si des révisions sont dues

Ajoute dans `ErrorBankItem` (Prisma) :
```prisma
model ErrorBankItem {
  id                String   @id @default(cuid())
  studentId         String
  errorType         String   // 'contresens' | 'hors_sujet' | 'problematique_floue' | etc.
  sourceInteraction String   // ID de l'interaction source
  errorContext      String   // extrait de la copie concernée
  nextRevision      DateTime // J+2 / J+7 / J+21
  revisionCount     Int      @default(0)
  lastResult        String?  // 'success' | 'failure'
  archivedAt        DateTime?
  createdAt         DateTime @default(now())
}
```

---

## BLOC 9 — DESIGN SYSTEM & UI PREMIUM

### 9.1 — Tokens CSS (Tailwind Config)

Mets à jour `tailwind.config.ts` :

```typescript
extend: {
  colors: {
    nexus: {
      50: '#EFF6FF', 100: '#DBEAFE', 500: '#3B82F6', 600: '#2563EB',
      700: '#1D4ED8', 900: '#1E3A8A',
    },
    ai: {
      50: '#F5F3FF', 100: '#EDE9FE', 500: '#8B5CF6', 600: '#7C3AED',
      700: '#6D28D9', 900: '#4C1D95',
    },
    energy: { 400: '#FBBF24', 500: '#F59E0B', 600: '#D97706' },
  },
  fontFamily: {
    display: ['Plus Jakarta Sans', 'sans-serif'],
    body: ['Inter', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  animation: {
    'streak-pulse': 'streak-pulse 2s ease-in-out infinite',
    'radar-build': 'radar-build 1.5s ease-out forwards',
    'typewriter': 'typewriter 0.05s steps(1) infinite',
  },
}
```

Ajoute dans `src/app/layout.tsx` :
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono&display=swap" rel="stylesheet">
```

### 9.2 — Composants UI Prioritaires

Crée `src/components/ui/` :

**`skill-radar.tsx`** — RadarChart animé SkillMap
- Props : `skillMap: SkillMap`, `previousSkillMap?: SkillMap`, `animate?: boolean`
- Utilise Recharts RadarChart
- Couleurs : bleu pour actuel, gris transparent pour précédent
- Animation : `radar-build` keyframe CSS (build axe par axe)

**`streak-counter.tsx`** — Compteur de série
- Flamme 🔥 animée si streak > 0
- Props : `streak: number`, `maxStreak: number`
- Freeze visuel si streak en danger aujourd'hui

**`mission-card.tsx`** — Carte tâche du jour
- Props : `task: PlannedSession`, `onStart: () => void`
- Badge "Révision urgente" en rouge si ErrorBank due
- Barre de progression si tâche partiellement commencée

**`plan-badge.tsx`** — Badge plan abonnement
- Props : `plan: SubscriptionPlan`
- FREE : gris | MONTHLY : bleu | LIFETIME : gradient violet-or

**`upgrade-prompt.tsx`** — CTA upgrade
- Affiché quand `requirePlan` retourne 402
- Props : `feature: string`, `currentPlan: SubscriptionPlan`
- Message personnalisé selon la feature bloquée

### 9.3 — Sidebar Intelligente

Mets à jour `src/components/layout/sidebar.tsx` :
- Afficher les 3 tâches du jour avec checkbox
- Badge rouge sur l'icône de l'atelier si révision ErrorBank due
- Streak counter en haut (permanent)
- Plan badge avec lien `/pricing` si FREE
- Countdown EAF en bas : "J-{n} ⏱"
- Mode focus : bouton pour masquer la sidebar et centrer le contenu

---

## BLOC 10 — PWA + NOTIFICATIONS PUSH

### 10.1 — Service Worker

Crée `public/sw.js` :
- Cache stratégie : Network First pour API, Cache First pour assets statiques
- Cache offline : bibliothèque (liste des ressources), plan du jour (dernière version), profil élève
- Message de fallback offline si pas de cache disponible

Crée `public/manifest.json` :
```json
{
  "name": "Nexus Réussite EAF",
  "short_name": "Nexus EAF",
  "description": "Ton précepteur IA pour réussir les EAF",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0F172A",
  "theme_color": "#1B4FD8",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Crée les icônes SVG→PNG dans `public/icons/` (192x192 et 512x512) avec le logo N stylisé.

### 10.2 — Push Notifications

Crée `src/lib/notifications/push.ts` :
- VAPID keys : `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (générer via `web-push generate-vapid-keys`)
- Table Prisma `PushSubscription` : userId, endpoint, p256dh, auth
- Route `POST /api/v1/notifications/subscribe` — enregistrer l'endpoint
- Fonction `sendPushNotification(userId, title, body, url)` — avec `web-push`

**Notifications déclenchées automatiquement :**
- Révision ErrorBank due : "📚 Rappel Nexus : tu as 3 révisions en attente aujourd'hui"
- Streak en danger (pas de session aujourd'hui à 19h) : "🔥 Ta série de {n} jours est en danger !"
- Rapport hebdo disponible : "📊 Ton rapport de la semaine est prêt"
- Rapport de correction disponible : "✅ Ta correction est prête !"

---

## BLOC 11 — JOBS AUTOMATIQUES (CRON)

Crée `src/lib/cron/scheduler.ts` :
- Utiliser `node-cron` (npm install node-cron)
- À lancer via `npm run scheduler` (PM2 séparé)

**Jobs définis :**

```typescript
// Révisions Spaced Repetition : tous les jours à 8h
cron.schedule('0 8 * * *', async () => {
  // Trouver tous les élèves avec ErrorBankItem.nextRevision <= aujourd'hui
  // Envoyer push notification si pushSubscription existe
  // Marquer dans DB: notificationSentAt
})

// Streak check : tous les jours à 19h
cron.schedule('0 19 * * *', async () => {
  // Trouver les élèves sans session aujourd'hui avec streak > 0
  // Envoyer push notification "Ta série est en danger"
})

// Rapport hebdomadaire : dimanche à 20h
cron.schedule('0 20 * * 0', async () => {
  // Pour chaque élève actif (session dans les 14 derniers jours)
  // Appeler agent rapport-auto
  // Générer PDF
  // Envoyer email + push notification
  // Stocker dans DB avec URL PDF
})

// Replanification parcours : chaque lundi à 6h
cron.schedule('0 6 * * 1', async () => {
  // Pour chaque élève actif
  // Appeler Planner agent → nouveau plan 7 jours
  // Stocker en DB
})

// Nettoyage : premier du mois à 3h
cron.schedule('0 3 1 * *', async () => {
  // Reset compteurs usage mensuel (UsageCounter)
  // Purge logs LLM > 90 jours
  // Purge MemoryEvents > 365 jours (R-RET-01)
})
```

---

## BLOC 12 — EMAIL TRANSACTIONNEL

Installe `@react-email/components` + `resend` (ou `nodemailer` selon `EMAIL_PROVIDER`).

Crée `src/emails/` :

**`welcome.tsx`** — Email de bienvenue post-inscription
**`trial-ending.tsx`** — J-1 avant fin du trial (CTA conversion)
**`payment-failed.tsx`** — Paiement échoué (lien portail Stripe)
**`rapport-hebdo.tsx`** — Rapport hebdomadaire avec lien dashboard
**`correction-ready.tsx`** — Correction de copie disponible

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
EMAIL_FROM=nexus@eaf.nexusreussite.academy
EMAIL_REPLY_TO=support@nexusreussite.academy
```

---

## BLOC 13 — PAGES LÉGALES & CGV

Crée les pages statiques suivantes en Markdown rendu par MDX ou en JSX simple :

- `src/app/legal/cgu/page.tsx` — Conditions Générales d'Utilisation
- `src/app/legal/cgv/page.tsx` — Conditions Générales de Vente (prix, remboursement, trial)
- `src/app/legal/confidentialite/page.tsx` — Politique de Confidentialité (RGPD, données collectées, durées)
- `src/app/legal/mentions/page.tsx` — Mentions Légales (éditeur, hébergeur = serveur dédié)

Contenu minimal réel (pas de placeholder) respectant le RGPD et l'AI Act.

---

## BLOC 14 — CONFIGURATION SERVEUR DÉDIÉ

### 14.1 — Scripts de déploiement

Crée `scripts/deploy.sh` :
```bash
#!/bin/bash
# Déploiement production sur serveur dédié
set -e

echo "=== Nexus EAF — Déploiement Production ==="

# 1. Pull code
git pull origin main

# 2. Install deps
npm ci --production=false

# 3. Build
npm run build

# 4. Migrations DB
npx prisma migrate deploy

# 5. Ré-indexation RAG si corpus mis à jour
if [ "$RAG_REINDEX" = "true" ]; then
  npm run rag:reindex
fi

# 6. Restart services via PM2
pm2 reload ecosystem.config.js --env production

echo "=== Déploiement terminé ==="
```

### 14.2 — PM2 Ecosystem

Crée `ecosystem.config.js` :
```javascript
module.exports = {
  apps: [
    {
      name: 'nexus-eaf-web',
      script: 'node_modules/.bin/next',
      args: 'start',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '1G',
    },
    {
      name: 'nexus-eaf-worker',
      script: 'src/workers/correction-worker.ts',
      interpreter: 'tsx',
      env_production: { NODE_ENV: 'production' },
      instances: 1,
    },
    {
      name: 'nexus-eaf-scheduler',
      script: 'src/lib/cron/scheduler.ts',
      interpreter: 'tsx',
      env_production: { NODE_ENV: 'production' },
      instances: 1,
    },
  ],
}
```

### 14.3 — Nginx Config

Crée `nginx/eaf.nexusreussite.academy.conf` :
```nginx
server {
  listen 443 ssl http2;
  server_name eaf.nexusreussite.academy;

  ssl_certificate /etc/letsencrypt/live/eaf.nexusreussite.academy/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/eaf.nexusreussite.academy/privkey.pem;

  # Uploads statiques (si storage local)
  location /uploads/ {
    alias /var/eaf/uploads/;
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # App Next.js
  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # SSE pour streaming LLM
    proxy_buffering off;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
  }

  # Stripe Webhook (pas de rate limit)
  location /api/v1/billing/webhook {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_read_timeout 30s;
  }
}

server {
  listen 80;
  server_name eaf.nexusreussite.academy;
  return 301 https://$host$request_uri;
}
```

### 14.4 — Checklist déploiement initial

Crée `docs/DEPLOY_CHECKLIST.md` :
```markdown
## Checklist déploiement production

### Prérequis serveur
- [ ] Node.js 20 LTS installé
- [ ] PostgreSQL 16 avec pgvector extension
- [ ] Redis 7 installé et démarré
- [ ] Ollama installé et modèles téléchargés (llama3.1:70b + nomic-embed-text)
- [ ] PM2 installé globalement (npm i -g pm2)
- [ ] Nginx configuré avec config fournie
- [ ] SSL Certbot configuré (Let's Encrypt)
- [ ] Répertoire /var/eaf/uploads/ créé avec permissions app

### Configuration
- [ ] .env.production complété avec toutes les variables
- [ ] STRIPE_WEBHOOK_SECRET configuré (endpoint Stripe Dashboard)
- [ ] VAPID keys générées (web-push generate-vapid-keys)
- [ ] OLLAMA_MODEL vérifié (ollama list)

### Base de données
- [ ] npx prisma migrate deploy
- [ ] npm run db:seed (compte démo)
- [ ] npm run rag:reindex (corpus initial)

### Services
- [ ] pm2 start ecosystem.config.js --env production
- [ ] pm2 save && pm2 startup
- [ ] Vérification : pm2 status (3 apps ONLINE)

### Vérifications finales
- [ ] https://eaf.nexusreussite.academy accessible
- [ ] /api/health retourne { status: 'ok', ollama: 'connected', db: 'connected' }
- [ ] Test onboarding complet (compte de test)
- [ ] Test paiement Stripe (mode test)
- [ ] Test notification push
- [ ] Test correction copie (upload + correction + rapport PDF)
```

---

## BLOC 15 — ENDPOINT DE SANTÉ ENRICHI

Mets à jour `GET /api/health` pour retourner :

```typescript
{
  status: 'ok' | 'degraded' | 'error',
  timestamp: string,
  version: string, // package.json version
  services: {
    database: { status: 'ok' | 'error', latencyMs: number },
    ollama: { status: 'ok' | 'error' | 'unavailable', model: string, latencyMs: number },
    openai: { status: 'ok' | 'not_configured', configured: boolean },
    redis: { status: 'ok' | 'error', latencyMs: number },
    storage: { status: 'ok' | 'error', provider: string },
    rag: { status: 'ok' | 'degraded', chunkCount: number, mode: 'vector' | 'lexical' },
  },
  workers: {
    correction: { status: 'ok' | 'stopped', queueLength: number },
    scheduler: { status: 'ok' | 'stopped', nextJobs: string[] },
  }
}
```

---

## BLOC 16 — GAMIFICATION AVANCÉE

### 16.1 — Système XP

Ajoute dans `StudentProfile` :
```prisma
xp            Int      @default(0)
level         Int      @default(1)  // 1-10
xpToNextLevel Int      @default(100)
```

Barème XP :
- Correction soumise : +20 XP
- Score > 14/20 : +30 XP bonus
- Session orale complète : +25 XP
- Quiz parfait : +15 XP
- Révision ErrorBank réussie : +10 XP
- Connexion quotidienne : +5 XP

Niveaux : Apprenti (0-99) → Lecteur (100-249) → Analyste (250-499) → Commentateur (500-899) → Rhétoricien (900-1499) → Expert EAF (1500+)

### 16.2 — Challenges Hebdomadaires

Crée `src/lib/gamification/challenges.ts` :
- 3 challenges générés automatiquement chaque lundi par le Planner
- Exemples : "Complète 2 simulations orales cette semaine", "Score > 15/20 à une correction"
- Badge spécial + XP bonus à la complétion

---

## BLOC 17 — TESTS & QUALITÉ

### 17.1 — Tests unitaires supplémentaires

Crée dans `tests/unit/` :
- `billing-gating.test.ts` — test des limites par plan (FREE bloque, MONTHLY passe)
- `llm-router.test.ts` — test du routage ollama vs openai
- `spaced-repetition.test.ts` — test du scheduling J+2/J+7/J+21
- `rapport-auto.test.ts` — test génération rapport avec LLM_PROVIDER=mock

### 17.2 — Tests E2E supplémentaires

Crée dans `tests/e2e/` :
- `onboarding-premium.spec.ts` — flow complet 5 étapes
- `billing.spec.ts` — checkout Stripe (mode test), gating plan FREE
- `streaming.spec.ts` — vérifier que le typewriter fonctionne

### 17.3 — Variables CI

Ajoute `.env.test` :
```env
LLM_PROVIDER=mock
STRIPE_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://test:test@localhost:5432/eaf_test
```

---

## CONTRAINTES & RÈGLES IMMUABLES

### Ne jamais violer :
1. **R-AIACT-01** : Aucune inférence émotionnelle dans aucun output LLM
2. **R-FRAUD-01** : PolicyGate bloque toute rédaction complète de copie
3. **R-RGPD-01** : Consentement parental si age < 15 (double opt-in)
4. **R-CITE-01** : Toute réponse normative doit citer une source authority A
5. **Aucune intervention humaine** : Aucun endpoint ne doit nécessiter une action manuelle d'un enseignant ou coach

### Règles de code :
- TypeScript strict (`noImplicitAny: true`, `strictNullChecks: true`) sur tout nouveau fichier
- Validation Zod sur tous les inputs API
- Logger pino sur toutes les actions sensibles (LLM call, paiement, correction)
- Jamais de secret hardcodé — toujours via `process.env`
- Imports Ollama toujours via le router `selectProvider()`, jamais en direct

---

## ORDRE D'EXÉCUTION RECOMMANDÉ

1. **Bloc 0** — LLM Router + Ollama adapter (fondation de tout)
2. **Bloc 3** — S3 Storage + BullMQ (fiabilité production)
3. **Bloc 1** — Stripe complet (monétisation)
4. **Bloc 2** — Suppression espace enseignant humain
5. **Bloc 15** — Health endpoint enrichi (vérification infra)
6. **Bloc 9** — Design system (fondation UI)
7. **Bloc 5** — Landing page
8. **Bloc 4** — Onboarding 5 étapes
9. **Bloc 6** — Dashboard narratif
10. **Bloc 7** — Streaming LLM
11. **Bloc 8** — Agents nouveaux (Avocat, Rapport, Rappel)
12. **Bloc 10** — PWA + Push
13. **Bloc 11** — Cron jobs
14. **Bloc 12** — Emails transactionnels
15. **Bloc 16** — Gamification avancée
16. **Bloc 13** — Pages légales
17. **Bloc 14** — Config serveur dédié
18. **Bloc 17** — Tests

---

## VÉRIFICATION FINALE AVANT LIVRAISON

Une fois tous les blocs implémentés, exécuter :

```bash
# Vérification TypeScript
npx tsc --noEmit

# Tests
npm run test:unit
npm run test:e2e

# Build de production
npm run build

# Vérification linting
npm run lint

# Health check local
npm run dev
curl http://localhost:3000/api/health | jq .
```

Le build doit passer sans erreur. Le health check doit retourner `status: ok` avec Ollama connecté.

---

*Prompt généré le 23 février 2026 — Nexus Réussite EAF — eaf.nexusreussite.academy*
