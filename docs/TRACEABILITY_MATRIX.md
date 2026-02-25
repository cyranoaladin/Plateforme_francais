# Matrice de traçabilité (exigences -> implémentation)

## Bloc 0
| Exigence | Statut | Implémentation principale |
|---|---|---|
| Cookie secure configurable | Fait | `src/lib/auth/session.ts` (`COOKIE_SECURE`) |
| Rate limit auth login/register | Fait | `src/lib/security/rate-limit.ts`, routes auth |
| CSRF double-submit | Fait | `src/lib/security/csrf.ts`, `src/lib/security/csrf-client.ts` |
| Validation Zod body API | Fait (JSON) | `src/lib/validation/schemas.ts`, `src/lib/validation/request.ts` |
| Migration Prisma + fallback | Fait | `prisma/*`, `src/lib/db/*`, `src/lib/memory/store.ts` |
| Dashboard connecté timeline | Fait | `src/hooks/useDashboard.ts`, `src/app/page.tsx` |

## Bloc 1
| Exigence | Statut | Implémentation principale |
|---|---|---|
| Provider LLM multi-modèle | Fait | `src/lib/llm/provider.ts`, `src/lib/llm/adapters/*`, `factory.ts` |
| RAG vectoriel pgvector | Fait | `src/lib/rag/vector-search.ts`, `indexer.ts` |
| Fallback lexical automatique | Fait | `src/lib/rag/search.ts` |
| Orchestrateur skill + JSON Zod | Fait | `src/lib/llm/orchestrator.ts`, `src/lib/llm/skills/*` |

## Bloc 2
| Exigence | Statut | Implémentation principale |
|---|---|---|
| Génération épreuve blanche | Fait | `POST /api/v1/epreuves/generate` |
| Upload copie multipart | Fait | `POST /api/v1/epreuves/{id}/copie` |
| OCR manuscrit | Fait | `src/lib/correction/ocr.ts` |
| Correction structurée | Fait | `src/lib/correction/correcteur.ts` |
| Job async + polling | Fait | `src/lib/epreuves/worker.ts`, GET copie status |
| Rapport correction premium + PDF | Fait | page correction + `report/route.ts` |
| S3 provider | Partiel | variable prévue, non implémenté (`storage/copies.ts`) |

## Bloc 3
| Exigence | Statut | Implémentation principale |
|---|---|---|
| Session orale réelle | Fait | start/interact/end routes |
| STT navigateur | Fait | `src/lib/stt/browser.ts` + UI oral |
| TTS feedback | Fait | UI oral (`speechSynthesis`) |
| Banque extraits 30+ | Fait (30) | `src/data/extraits-oeuvres.ts` |

## Bloc 4
| Exigence | Statut | Implémentation principale |
|---|---|---|
| Onboarding intelligent 3 étapes | Fait | `src/app/onboarding/page.tsx`, `/onboarding/complete` |
| Plan parcours personnalisé | Fait | `/api/v1/parcours/generate`, `/mon-parcours` |
| Quiz adaptatif | Fait | `/api/v1/quiz/generate`, `/quiz` |

## Bloc 5
| Exigence | Statut | Implémentation principale |
|---|---|---|
| Bibliothèque enrichie 50+ | Fait | `src/data/references.ts`, `/bibliotheque` |
| Filtres type + média intégré | Fait | UI bibliothèque |
| Tuteur libre chat + citations | Fait | `/api/v1/tuteur/message`, `/tuteur` |

## Bloc 6
| Exigence | Statut | Implémentation principale |
|---|---|---|
| Rôles utilisateur | Fait | Prisma `User.role`, auth/me, login/register |
| Middleware rôle enseignant/parent | Fait | `middleware.ts` |
| Système code classe | Fait | onboarding + `/api/v1/enseignant/class-code` |
| Dashboard enseignant | Fait | `/enseignant`, `/api/v1/enseignant/dashboard` |
| Export CSV | Fait | `/api/v1/enseignant/export` |
| Commentaire manuel correction | Fait | `/api/v1/enseignant/corrections/{copieId}/comment` |

## Bloc 7
| Exigence | Statut | Implémentation principale |
|---|---|---|
| Theme light/dark + toggle | Fait | `ThemeProvider`, sidebar |
| Sidebar redesign + mobile bottom nav | Fait | `src/components/layout/sidebar.tsx` |
| Landing `/bienvenue` | Fait | `src/app/bienvenue/page.tsx` |
| Accessibilité renforcée | Fait (large) | aria labels/status/alert + contrast ajusté |
| Responsive mobile | Fait (noyau) | sidebar bottom nav + modales mobile |
| Gamification badges + toasts + profil | Fait | badges lib/routes + `/profil` |

## Bloc 8
| Exigence | Statut | Implémentation principale |
|---|---|---|
| Logs structurés pino | Fait | `src/lib/logger.ts` + remplacements principaux |
| Logs appels LLM | Fait | orchestrateur (tokens/latence/model/success) |
| Web vitals frontend | Fait | reporter + `/api/v1/metrics/vitals` |
| Santé plateforme dashboard enseignant | Fait | panneau dans `/enseignant` |
| Tests unitaires correcteur/vector/orchestrator | Fait | `tests/unit/*.test.ts` dédiés |
| E2E upload+polling / onboarding->quiz->oral | Fait | `tests/e2e/flows.spec.ts` |
| Docs complètes + guides + env | Fait | `docs/*`, `.env.example` |

## Écarts résiduels explicites
- `STORAGE_PROVIDER=s3`: non implémenté.
- parent space: fonctionnel minimal, pas de dashboard dédié.
- agrégation web vitals: en mémoire process (non persistée).
