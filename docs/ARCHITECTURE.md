# Architecture technique — Nexus Réussite EAF

## Structure du projet

```
eaf_platform/
├── src/app/                    # Pages et API routes (Next.js App Router)
│   ├── api/v1/                 # 65+ endpoints REST
│   ├── admin/                  # Dashboard admin
│   ├── atelier-ecrit/          # Atelier écrit + correction
│   ├── atelier-oral/           # Simulation oral EAF
│   ├── atelier-langue/         # Exercices grammaire
│   ├── bibliotheque/           # Bibliothèque 548 ressources
│   ├── dashboard/              # Tableau de bord élève
│   ├── login/                  # Inscription + connexion
│   ├── onboarding/             # Configuration initiale du parcours
│   ├── pricing/                # Page tarifs
│   └── ...                     # Autres pages (profil, carnet, tuteur, etc.)
├── src/lib/                    # Logique métier
│   ├── auth/                   # Sessions, CSRF, guards
│   ├── billing/                # Plans, quotas, codes d'activation
│   ├── llm/                    # Router LLM, skills, orchestrateur
│   ├── oral/                   # Logique orale (scoring, service)
│   ├── rag/                    # Client RAG externe + search local
│   ├── memory/                 # Mémoire élève, signaux faibles
│   └── security/               # Rate limiting, sanitization
├── src/components/             # Composants React réutilisables
├── packages/mcp-server/        # Serveur MCP (20 outils pédagogiques)
├── emails/                     # Templates React Email
├── prisma/                     # Schéma + 18 migrations
├── tests/                      # Unit, E2E, contracts, visual
├── scripts/                    # Deploy, seed, scan-ressources
└── config/                     # FR copy baseline, banned phrases
```

## Base de données

- **PostgreSQL 16** avec extension pgvector pour la recherche vectorielle
- **Prisma 6** comme ORM (32 modèles, 21 enums)
- **Redis** pour le rate limiting, les quotas billing et BullMQ (file de correction)

### Modèles principaux

| Modèle | Description |
|--------|------------|
| User | Compte utilisateur (email, rôle, hash mot de passe) |
| StudentProfile | Profil élève (œuvres, niveau, scores, badges) |
| Subscription | Abonnement actif (plan, dates, statut) |
| ActivationCode | Codes d'activation générés par l'admin |
| PaymentTransaction | Transactions de paiement |
| OralSession | Sessions d'oral (4 phases, scores) |
| MemoryEvent | Événements d'apprentissage (timeline) |
| Evaluation | Évaluations et scores |
| DescriptifTexte | Descriptif de lecture pour l'oral |
| CarnetEntry | Notes du carnet de lecture |

## LLM et IA

### Router LLM (`src/lib/llm/router.ts`)

- **Provider primaire** : Mistral (5 tiers de modèles)
- **Fallback** : Gemini → OpenAI → Ollama
- **Circuit breaker** : 3 erreurs / 5 min → bascule
- **12+ skills** : tuteur_libre, quiz_maitre, examinateur_virtuel, coach_ecrit, langue_generator, etc.

### RAG (`src/lib/rag/`)

- **Externe** : ingestor Docker (ChromaDB + Ollama embeddings)
- **Local** : pgvector avec BM25 lexical
- **Hybride** : RRF reranking, authority levels A-D
- **Corpus** : BO, Eduscol, rapports de jury EAF, œuvres au programme

### MCP Server (`packages/mcp-server/`)

- 20 outils pédagogiques exposés via le protocole MCP
- Health endpoint : `/api/mcp/health`
- PM2 process : `eaf-mcp` sur port 3100

## Email

- **Transport** : SMTP Hostinger (port 587, STARTTLS)
- **Templates** : React Email (`emails/WelcomeEmail.tsx`, `emails/SubscriptionEmail.tsx`)
- **Déclenchement** : fire-and-forget avec retry 3x (backoff exponentiel)
- **DNS** : SPF + DKIM + DMARC configurés

## Sécurité

- Sessions : cookies HttpOnly + Secure + SameSite=lax
- CSRF : double-submit token (cookie + header)
- CSP : nonce dynamique par requête
- HSTS : max-age=63072000, includeSubDomains, preload
- Rate limiting : Redis (fail-closed en production)
- Sanitization : null byte, path traversal, LLM output
- RBAC : 4 rôles (élève, parent, enseignant, admin)

## CI/CD

Pipeline GitHub Actions avec 6 gates :
1. Analyse statique (TSC, ESLint, Knip, FR copy, npm audit)
2. Tests unitaires (162 fichiers, 1128 tests)
3. Tests intégration (Prisma + PostgreSQL)
4. Tests E2E (Playwright Chromium, 97+ specs)
5. Sécurité (GitLeaks, CodeQL, Snyk)
6. Deploy production (blue-green)
