# Matrice de traçabilité (exigences -> implémentation)

Dernière mise à jour : 25 février 2026

## Bloc 0 — Sécurité & fondations
| Exigence | Statut | Implémentation principale |
|---|---|---|
| Cookie secure configurable | Fait | `src/lib/auth/session.ts` (`COOKIE_SECURE`) |
| Rate limit auth login (10/min) | Fait | `src/lib/security/rate-limit.ts`, route login |
| Rate limit auth register (3/h) | Fait | `src/lib/security/rate-limit.ts`, route register |
| CSRF double-submit | Fait | `src/lib/security/csrf.ts`, `src/lib/security/csrf-client.ts` |
| Validation Zod body API | Fait (JSON) | `src/lib/validation/schemas.ts`, `src/lib/validation/request.ts` |
| Migration Prisma + fallback | Fait | `prisma/*` (8 migrations), `src/lib/db/*`, `src/lib/memory/store.ts` |
| Dashboard connecté timeline | Fait | `src/hooks/useDashboard.ts`, `src/app/page.tsx` |
| CSP headers middleware | Fait | `middleware.ts` (`script-src 'self' 'unsafe-inline'`, HSTS, X-Frame-Options) |
| Security headers (HSTS, nosniff) | Fait | `middleware.ts` (63072000s, includeSubDomains, preload) |

## Bloc 1 — LLM & RAG
| Exigence | Statut | Implémentation principale |
|---|---|---|
| Provider LLM multi-modèle | Fait | `src/lib/llm/adapters/mistral.ts`, `gemini.ts`, `openai.ts` |
| Routeur Mistral multi-tier | Fait | `src/lib/llm/router.ts` (reasoning/standard/micro/ocr) |
| RAG vectoriel pgvector | Fait | `src/lib/rag/vector-search.ts`, `indexer.ts` |
| Fallback lexical automatique | Fait | `src/lib/rag/search.ts` |
| Orchestrateur skill + JSON Zod | Fait | `src/lib/llm/orchestrator.ts` (via `getRouterProvider`) |
| Cost tracking LLM | Fait | `src/lib/llm/cost-tracker.ts` → Prisma `LlmCostLog` + `LlmBudgetAlert` |
| Self-reflection | Fait | `src/lib/llm/self-reflection.ts` |

## Bloc 2 — Atelier écrit
| Exigence | Statut | Implémentation principale |
|---|---|---|
| Génération épreuve blanche | Fait | `POST /api/v1/epreuves/generate` |
| Upload copie multipart | Fait | `POST /api/v1/epreuves/{id}/copie` (rate-limit 5/h/élève) |
| Validation MIME + taille | Fait | `src/lib/storage/copies.ts` (JPEG/PNG/WEBP/PDF, 20 Mo) |
| OCR manuscrit | Fait | `src/lib/correction/ocr.ts` (Mistral OCR, fallback Gemini, timeout 60s) |
| Correction structurée | Fait | `src/lib/correction/correcteur.ts` |
| Job async BullMQ + polling | Fait | `src/lib/epreuves/worker.ts` + `processInteraction` → SkillMap |
| Rapport correction premium + PDF | Fait | page correction + `report/route.ts` |
| S3 provider | Partiel | variable prévue, non implémenté (`storage/copies.ts`) |

## Bloc 3 — Atelier oral
| Exigence | Statut | Implémentation principale |
|---|---|---|
| Session orale 4 phases | Fait | start/interact/end routes (rate-limit 3/h + gating premium) |
| STT navigateur | Fait | `src/lib/stt/browser.ts` + UI oral |
| TTS feedback | Fait | UI oral (`speechSynthesis`) |
| Bilan oral /20 | Fait | `src/lib/oral/service.ts` (`generateOralBilan`) |
| Banque extraits 30+ | Fait (30) | `src/data/extraits-oeuvres.ts` |
| Modèles OralPhaseScore/Transcript/Bilan | Fait | `prisma/schema.prisma` |

## Bloc 4 — Onboarding & parcours
| Exigence | Statut | Implémentation principale |
|---|---|---|
| Onboarding intelligent 3 étapes | Fait | `src/app/onboarding/page.tsx`, `/onboarding/complete` |
| Plan parcours personnalisé | Fait | `/api/v1/parcours/generate`, `/mon-parcours` |
| Quiz adaptatif | Fait | `/api/v1/quiz/generate`, `/quiz` |

## Bloc 5 — Bibliothèque & tuteur
| Exigence | Statut | Implémentation principale |
|---|---|---|
| Bibliothèque enrichie 50+ | Fait | `src/data/references.ts`, `/bibliotheque` |
| Filtres type + média intégré | Fait | UI bibliothèque |
| Tuteur libre chat + citations | Fait | `/api/v1/tuteur/message` (rate-limit 30/h), `/tuteur` |
| RAG search rate-limited | Fait | `/api/v1/rag/search` (rate-limit 20/min) |

## Bloc 6 — Enseignant & rôles
| Exigence | Statut | Implémentation principale |
|---|---|---|
| Rôles utilisateur (4) | Fait | Prisma `User.role` (`eleve`, `enseignant`, `parent`, `admin`) |
| Middleware rôle enseignant/parent | Fait | `middleware.ts` |
| Système code classe | Fait | onboarding + `/api/v1/enseignant/class-code` |
| Dashboard enseignant | Fait | `/enseignant`, `/api/v1/enseignant/dashboard` |
| Export CSV | Fait | `/api/v1/enseignant/export` |
| Commentaire manuel correction | Fait | `/api/v1/enseignant/corrections/{copieId}/comment` |

## Bloc 7 — UX & gamification
| Exigence | Statut | Implémentation principale |
|---|---|---|
| Theme light/dark + toggle | Fait | `ThemeProvider`, sidebar |
| Sidebar redesign + mobile bottom nav | Fait | `src/components/layout/sidebar.tsx` |
| Landing `/bienvenue` | Fait | `src/app/bienvenue/page.tsx` |
| Accessibilité renforcée | Fait (large) | aria labels/status/alert + contrast ajusté |
| Responsive mobile | Fait (noyau) | sidebar bottom nav + modales mobile |
| Gamification badges + XP + niveaux + streaks | Fait | badges lib/routes + `/profil` |
| Toggle mot de passe login | Fait | `src/app/login/page.tsx` |

## Bloc 8 — Observabilité & tests
| Exigence | Statut | Implémentation principale |
|---|---|---|
| Logs structurés pino | Fait | `src/lib/logger.ts` |
| Logs appels LLM (coûts) | Fait | orchestrateur + `LlmCostLog` Prisma |
| Web vitals frontend | Fait | reporter + `POST /api/v1/metrics/vitals` (Redis TTL 24h) |
| Santé plateforme dashboard enseignant | Fait | panneau dans `/enseignant` |
| Tests unitaires (60+ fichiers) | Fait | `tests/unit/**/*.test.ts` |
| E2E Playwright | Fait | `tests/e2e/flows.spec.ts`, `tests/e2e/platform.spec.ts` |
| Tests MCP Server | Fait | `packages/mcp-server/tests/` |
| Docs complètes + guides | Fait | `docs/*`, `README.md` |

## Bloc 9 — Billing & paiements
| Exigence | Statut | Implémentation principale |
|---|---|---|
| Plans subscription (FREE/PRO/MAX/MONTHLY/LIFETIME) | Fait | `prisma/schema.prisma` (`Subscription`), `src/lib/billing/gating.ts` |
| Gating premium par feature | Fait | `src/lib/billing/gating.ts` (`requirePlan`, `incrementUsage`) |
| ClicToPay callback | Fait | `POST /api/v1/payments/clictopay/callback` |
| Quotas par feature/période | Fait | Prisma `UsageCounter` |
| Expiration MONTHLY / LIFETIME | Fait | `src/lib/billing/gating.ts` |
| Pages pricing/paiement | Fait | `/pricing`, `/paiement/confirmation`, `/paiement/refus` |

## Bloc 10 — Notifications & crons
| Exigence | Statut | Implémentation principale |
|---|---|---|
| Push notifications (VAPID) | Fait | `web-push`, Prisma `PushSubscription` |
| Emails transactionnels | Fait | `resend`, `src/lib/notifications/` |
| Cron rapports hebdomadaires | Fait | `POST /api/v1/cron/weekly-reports` (protégé `CRON_SECRET`) |
| Cron rappels révision | Fait | `POST /api/v1/cron/revision-reminders` (protégé `CRON_SECRET`) |
| Scheduler node-cron | Fait | `src/lib/cron/scheduler.ts` (`START_SCHEDULER=true`) |

## Bloc 11 — Modèle élève avancé (ADDENDUM)
| Exigence | Statut | Implémentation principale |
|---|---|---|
| SkillMapEntry (compétences EAF + spaced rep) | Fait | Prisma `SkillMapEntry` (24 skills EafSkill) |
| WeakSkillEntry (faiblesses + sévérité) | Fait | Prisma `WeakSkillEntry` |
| WorkMastery (maîtrise par œuvre) | Fait | Prisma `WorkMastery` |
| MemorySummary (résumés contexte) | Fait | Prisma `MemorySummary` |
| DocumentDeposit (dépôts) | Fait | Prisma `DocumentDeposit` |
| AgentInteraction (tracking agents) | Fait | Prisma `AgentInteraction` |
| ErrorBankItem (banque erreurs + révision) | Fait | Prisma `ErrorBankItem` |
| ComplianceLog (audit AI Act/RGPD) | Fait | Prisma `ComplianceLog` |
| OfficialWork (œuvres versionnées) | Fait | Prisma `OfficialWork` |

## Bloc 12 — MCP Server
| Exigence | Statut | Implémentation principale |
|---|---|---|
| MCP Server transport HTTP | Fait | `packages/mcp-server/` (port 3100) |
| Health check MCP | Fait | `GET /api/mcp/health` |
| Tests MCP | Fait | `packages/mcp-server/tests/` |

## Écarts résiduels explicites
- `STORAGE_PROVIDER=s3` : non implémenté (stockage local uniquement).
- Espace parent : fonctionnel minimal, pas de dashboard dédié.
