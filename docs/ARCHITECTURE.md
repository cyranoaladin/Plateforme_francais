# Architecture technique

## Structure du projet

```
src/
  app/                  # Next.js App Router (pages + API routes)
    (ateliers)/         # Pages des 4 ateliers (écrit, oral, langue, quiz)
    admin/              # Interface admin (codes, paiements, monitoring)
    api/v1/             # Routes API REST (/health, /auth, /billing, /llm, etc.)
  components/           # Composants React réutilisables
  lib/                  # Logique métier
    auth/               # Session, CSRF, middleware d'authentification
    billing/            # Plan catalog, quotas, usage tracking, activation codes
    llm/                # Routeur LLM multi-provider, 30 skills spécialisées
    rag/                # Client RAG, recherche sémantique
    email/              # Envoi SMTP, templates
    db/                 # Client Prisma, helpers base de données
  data/                 # Données statiques (scan ressources, config œuvres)
  scripts/              # Scripts CLI (génération codes, migration, deploy)
packages/
  mcp-server/           # Serveur MCP autonome (25 outils pour agents IA)
prisma/
  schema.prisma         # Schéma de la base de données
  migrations/           # 19 migrations Prisma
emails/                 # Templates React Email (vérification, reset, etc.)
scripts/                # Scripts d'exploitation (deploy.sh, etc.)
```

## Base de données

PostgreSQL avec Prisma 6 comme ORM. Le schéma (`prisma/schema.prisma`) définit les tables principales :

- `User`, `Session`, `Account` -- authentification et profils
- `Plan`, `Subscription`, `ActivationCode` -- facturation
- `OralSession`, `WrittenSubmission`, `QuizAttempt` -- travail élève
- `Resource`, `ResourceCategory` -- bibliothèque pédagogique
- `LlmUsage`, `RagQuery` -- tracking consommation IA

L'extension `pgvector` est activée pour le fallback RAG local (embeddings stockés en base).

## LLM et IA

Le routeur LLM (`src/lib/llm/router.ts`) gère le dispatch vers les providers :

- **Tier 1** : Mistral raisonnement (magistral-medium)
- **Tier 2** : Mistral standard (mistral-small)
- **Tier 3** : Ollama local (llama3.1:70b)
- **Fallback** : Gemini, OpenAI

Chaque skill dans `src/lib/llm/skills/` encapsule un prompt système, un modèle de réponse et une logique de validation. Exemples : `correcteur.ts` (correction de copies), `coach-oral.ts` (simulation entretien), `quiz-maitre.ts` (génération de quiz).

## RAG (Retrieval-Augmented Generation)

Deux modes de fonctionnement :

1. **Ingesteur externe** : conteneur Docker qui indexe les ressources PDF et répond via API REST (`RAG_API_URL`). Mode principal en production.
2. **Fallback pgvector** : embeddings stockés dans PostgreSQL, recherche par similarité cosinus. Utilisé si l'ingesteur est indisponible.

Configuration : variables `RAG_*` dans `.env`.

## Email

Envoi via SMTP Hostinger sur le port 587 avec STARTTLS en production. Les templates sont définis avec React Email dans `emails/`. Le service d'envoi se trouve dans `src/lib/email/`.

## Facturation

Source de vérité : `src/lib/billing/plan-catalog.ts`. Trois plans métier sont exposés : `Freemium`, `Premium`, `Masterium`. Les identifiants techniques internes sont normalisés dans le catalogue. Le suivi de consommation passe par `src/lib/billing/usage.ts`. Les codes d'activation sont hachés (SHA-256 + pepper) et stockés en base.

Voir [PLANS_AND_BILLING.md](PLANS_AND_BILLING.md) pour le détail des quotas.

## MCP Server

Serveur MCP autonome dans `packages/mcp-server/`. Expose 25 outils pour les agents IA (consultation de ressources, interrogation de la base, exécution de skills LLM). Communique via HTTP (`MCP_SERVER_URL`), authentifié par `MCP_API_KEY`.

## Authentification

Session server-side stockée en base. Le cookie de session est HttpOnly, SameSite=Lax, Secure en production. La protection CSRF utilise le pattern double-submit cookie. Middleware dans `src/lib/auth/`.
