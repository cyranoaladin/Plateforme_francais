# Nexus Réussite EAF — MCP Server

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://typescriptlang.org)
[![MCP SDK](https://img.shields.io/badge/MCP_SDK-1.0-purple)](https://modelcontextprotocol.io)
[![Node](https://img.shields.io/badge/Node-20_LTS-green)](https://nodejs.org)

Serveur MCP (Model Context Protocol) custom pour la plateforme **Nexus Réussite EAF** — 24 outils pédagogiques spécialisés pour les agents IA de préparation à l'Épreuve Anticipée de Français.

---

## Démarrage en 5 minutes

```bash
# 1. Copier le .env
cp .env.example .env
# Remplir DATABASE_URL, REDIS_URL, MCP_API_KEY (et OLLAMA_BASE_URL)

# 2. Installer les dépendances
npm install

# 3. Générer le client Prisma (utilise la DB de l'app Next.js)
npx prisma generate --schema=../../prisma/schema.prisma

# 4. Démarrer en développement (mode stdio)
npm run dev

# 5. Tester avec MCP Inspector
npm run inspect
# → Ouvre http://localhost:5173 pour invoquer les outils visuellement
```

---

## Architecture

```
src/
├── index.ts          → Point d'entrée (stdio ou HTTP selon MCP_TRANSPORT)
├── server.ts         → Serveur MCP — routeur des 24 outils
├── tools/
│   ├── student/      → Profil élève, ErrorBank, Study Plan
│   ├── rag/          → Recherche corpus hybride pgvector+BM25
│   └── all-tools.ts  → Évaluations, Planning, Analytics, Compliance, Billing
├── resources/        → Ressources statiques (profil Markdown, règles EAF)
├── prompts/          → Templates prompts pour les agents
├── lib/
│   ├── db.ts         → Client Prisma singleton
│   ├── redis.ts      → Client Redis + rate limiting
│   ├── logger.ts     → Logs structurés pino
│   ├── auth.ts       → Vérification API Key + scopes agents
│   └── policy-gate.ts → Vérificateur compliance (R-AIACT-01, R-FRAUD-01...)
└── client.ts         → Client MCP pour l'app Next.js
```

---

## Les 24 outils disponibles

### Profil élève (5 outils)
| Outil | Description |
|-------|-------------|
| `eaf_get_student_profile` | Profil complet avec SkillMap 5 axes |
| `eaf_update_skill_map` | Mise à jour compétences + détection drift |
| `eaf_get_error_bank` | Révisions Spaced Repetition dues |
| `eaf_schedule_revision` | Programmer J+2/J+7/J+21 après erreur |
| `eaf_get_study_plan` | Plan rolling 7j du jour |

### RAG & Corpus (3 outils)
| Outil | Description |
|-------|-------------|
| `eaf_search_corpus` | Recherche hybride pgvector + BM25 avec reranking |
| `eaf_get_chunk` | Récupère un fragment avec contexte voisins |
| `eaf_index_document` | Indexe un doc officiel (admin, R-COPY-01) |

### Évaluations (3 outils)
| Outil | Description |
|-------|-------------|
| `eaf_get_correction` | Résultat correction avec grille par critère |
| `eaf_save_evaluation` | Sauvegarde quiz/oral + XP + badges |
| `eaf_get_oral_session` | Session orale avec grille 2/8/2/8 |

### Planning (2 outils)
| Outil | Description |
|-------|-------------|
| `eaf_generate_plan` | Plan 7j adaptatif selon profil |
| `eaf_mark_task_complete` | Complétion tâche + streak + adhérence |

### Analytics (3 outils)
| Outil | Description |
|-------|-------------|
| `eaf_get_weekly_stats` | Stats agrégées semaine |
| `eaf_get_skill_delta` | Évolution compétences entre deux dates |
| `eaf_generate_report` | Lance génération rapport PDF async |

### Compliance (2 outils)
| Outil | Description |
|-------|-------------|
| `eaf_check_policy` | Vérifie R-AIACT-01, R-FRAUD-01, R-RGPD-01... |
| `eaf_log_rule_event` | Audit trail compliance immuable |

### Billing (2 outils)
| Outil | Description |
|-------|-------------|
| `eaf_get_subscription` | Plan actif + gating feature |
| `eaf_get_usage` | Compteurs usage journalier/mensuel |

---

## Ressources disponibles

| URI | Description |
|-----|-------------|
| `nexus://student/{id}/profile` | Profil élève formaté Markdown |
| `nexus://corpus/eaf-rules` | Barèmes et règles officielles EAF 2026 |
| `nexus://system/compliance-rules` | Règles R-* compliance |

---

## Règles immuables (compliance)

Ces règles **ne peuvent jamais être désactivées** :

| ID | Règle |
|----|-------|
| **R-AIACT-01** | ❌ Pas d'inférence émotionnelle ("tu sembles stressé") |
| **R-AIACT-02** | ❌ Pas de proctoring/surveillance |
| **R-FRAUD-01** | ❌ Pas de rédaction complète de copie en mode examen |
| **R-RGPD-01** | ⚠️ Consentement parental si élève < 15 ans |
| **R-COPY-01** | ❌ Pas d'ingestion d'œuvres sous droits sans licence |
| **R-CITE-01** | ✅ Toute réponse normative cite une source officielle |
| **R-SCOPE-01** | 📖 Voie générale uniquement |

---

## Déploiement production (PM2)

```bash
# Build
npm run build

# Ajouter dans ecosystem.config.js de l'app principale :
{
  name: 'nexus-eaf-mcp',
  script: 'packages/mcp-server/dist/index.js',
  env_production: {
    NODE_ENV: 'production',
    MCP_TRANSPORT: 'http',
    MCP_PORT: 3100,
  },
  instances: 1,
  max_memory_restart: '512M',
}

# Démarrer
pm2 start ecosystem.config.js --only nexus-eaf-mcp --env production
```

**⚠️ Sécurité :** Le port 3100 ne doit **jamais** être exposé publiquement.
```bash
ufw deny 3100   # Accessible uniquement depuis localhost
```

---

## Tests

```bash
npm run test           # Tests unitaires (Vitest)
npm run typecheck      # Vérification TypeScript
npm run inspect        # MCP Inspector visuel
```

---

## Intégration dans l'app Next.js

```typescript
// src/lib/mcp/client.ts (copier depuis packages/mcp-server/src/client.ts)
import { mcpClient } from '@/lib/mcp/client'

// Dans l'orchestrateur LLM :
// AVANT : const profile = await prisma.studentProfile.findUnique(...)
// APRÈS :
const profile = await mcpClient.student.getProfile(studentId, 'diagnosticien')

// Recherche RAG :
const results = await mcpClient.rag.search(
  'barème épreuve orale EAF',
  { requireAuthorityA: true },
  'rag-librarian'
)

// Vérification compliance avant génération :
const policyCheck = await mcpClient.compliance.checkPolicy(
  { checkType: 'pre_generation', requestContext: { skill: 'correcteur', mode: 'examen' } },
  'correcteur',
  studentId
)
if (!policyCheck.allowed) throw new Error('Policy violation: ' + policyCheck.violations[0].ruleId)
```
