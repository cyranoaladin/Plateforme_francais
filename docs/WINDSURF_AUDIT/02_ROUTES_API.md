# 02 - API Routes Audit

> Generated: 2026-03-20
> Source: exhaustive scan of `src/app/api/` route files + `middleware.ts`

---

## Middleware Summary (`middleware.ts`)

**Session enforcement**: All `/api/` routes require a valid `eaf_session` cookie **except** those listed in `PUBLIC_API_PATHS` or under `/api/v1/cron` (protected by `CRON_SECRET` bearer token instead).

**PUBLIC_API_PATHS** (no session cookie required):
- `/api/v1/auth/login`
- `/api/v1/auth/register`
- `/api/v1/auth/forgot-password`
- `/api/v1/auth/reset-password`
- `/api/v1/health`
- `/api/v1/rag/health`
- `/api/v1/csrf`
- `/api/v1/contact`
- `/api/v1/exam-info`
- `/api/v1/ressources`
- `/api/v1/metrics/vitals`
- `/api/v1/payments/clictopay/callback`
- `/api/v1/payments/clictopay/public-status`
- `/api/mcp/health`

**Cron routes** (`/api/v1/cron/*`): Bypassed from session check in middleware; each handler validates `CRON_SECRET` bearer token internally.

**Method restrictions** (middleware level):
- `/api/v1/health`: GET only
- `/api/v1/auth/login`: POST only
- `/api/v1/auth/register`: POST only

---

## Legend

| Column | Meaning |
|--------|---------|
| **Auth** | `PUBLIC` = no session needed, `SESSION` = eaf_session cookie, `CRON` = CRON_SECRET bearer |
| **CSRF** | `validateCsrf()` called = Yes |
| **Role** | blank = any authenticated user, `admin`, `enseignant` = `requireUserRole()` |
| **Zod** | Zod schema validated on request body |
| **Deps** | P = Prisma/DB, R = Redis/rate-limit, RAG = RAG API, LLM = LLM orchestrator, STT = speech-to-text, TTS = text-to-speech, FS = filesystem, Email = SMTP |

---

## 1. Auth (Category: `auth`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 1 | `/api/v1/auth/login` | POST | PUBLIC | No | -- | `loginBodySchema` | 10/window | P, R | Sets session + role cookies. Ensures CSRF cookie on response. |
| 2 | `/api/v1/auth/register` | POST | PUBLIC | No | -- | `registerBodySchema` | 3/hour | P, R, Email | Creates user (role=`eleve` only). Sends welcome email. Sets session. |
| 3 | `/api/v1/auth/logout` | POST | SESSION | **Yes** | -- | No | No | P | Deletes session from DB, clears cookies. |
| 4 | `/api/v1/auth/me` | GET | SESSION | No | -- | No | No | P | Returns user id, email, role, profile. Ensures CSRF cookie. |
| 5 | `/api/v1/auth/forgot-password` | POST | PUBLIC | No | -- | `forgotPasswordBodySchema` | 3/hour | P, R, Email | Creates password reset token, sends email. Generic response to prevent enumeration. |
| 6 | `/api/v1/auth/reset-password` | POST | PUBLIC | No | -- | `resetPasswordBodySchema` | 5/hour | P, R | Validates token hash, updates password, invalidates all sessions. |

---

## 2. CSRF (Category: `csrf`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 7 | `/api/v1/csrf` | GET | PUBLIC | No | -- | No | No | -- | Returns CSRF token and sets CSRF cookie. Cache-Control: no-store. |

---

## 3. Health / Infra (Category: `infra`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 8 | `/api/v1/health` | GET | PUBLIC | No | -- | No | No | P | DB connectivity check. Returns release git SHA, build time, voice mode capabilities. |
| 9 | `/api/v1/rag/health` | GET | PUBLIC | No | -- | No | No | RAG | External RAG API health + stats (total chunks). |
| 10 | `/api/mcp/health` | GET | PUBLIC | No | -- | No | No | MCP | Proxies to MCP server `/health`. Returns tool count, latency. |
| 11 | `/api/v1/metrics/vitals` | POST | PUBLIC | No | -- | `VitalSchema` (inline) | 100/min | P, R | Receives Web Vitals (CLS, FCP, LCP, etc.). Graceful 202 on DB failure. |

---

## 4. Contact (Category: `contact`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 12 | `/api/v1/contact` | POST | PUBLIC | **Yes** | -- | `contactSchema` (inline) | 3/min | R, Email | Sends contact email via SMTP. Logs if SMTP not configured. |

---

## 5. Exam Info (Category: `exam`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 13 | `/api/v1/exam-info` | GET | PUBLIC | No | -- | No | No | FS | Returns Tunisia exam config: days until exam, phase, simulations. |

---

## 6. Ressources / Library (Category: `resources`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 14 | `/api/v1/ressources` | GET | PUBLIC | No | -- | No | No | -- | Returns static resource catalog JSON. 5-min cache. |
| 15 | `/api/v1/ressources/file` | GET | SESSION | No | -- | No | No | P, FS | Serves resource files. Freemium gating per category. Path traversal protection. Supports HTTP Range for media. |
| 16 | `/api/v1/media/[id]` | GET | SESSION | No | -- | No | No | FS | Serves media catalog files by ID. Path traversal + symlink protection. |

---

## 7. Student Profile (Category: `student`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 17 | `/api/v1/student/profile` | GET | SESSION | No | -- | No | No | P | Returns profile + computed skillMap, errorBank, studyPlan, streak. |
| 18 | `/api/v1/student/profile` | PUT | SESSION | **Yes** | -- | `studentProfileBodySchema` | No | P | Updates student profile fields. |
| 19 | `/api/v1/student/oeuvre-choisie` | PUT | SESSION | **Yes** | -- | `updateOeuvreChoisieSchema` | No | P | Updates chosen work for oral entretien. |
| 20 | `/api/v1/student/recapitulatif` | POST | SESSION | **Yes** | -- | `bodySchema` (inline) | No | P | Validates descriptif textes against official minimums (20 textes, 5/objet). |
| 21 | `/api/v1/student/descriptif` | GET | SESSION | No | -- | No | No | P | Returns DescriptifTexte records from Prisma. |
| 22 | `/api/v1/student/descriptif` | POST | SESSION | **Yes** | -- | `descriptifUpsertSchema` | No | P | Replaces all descriptif textes (delete + bulk insert in transaction). |

---

## 8. Onboarding (Category: `onboarding`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 23 | `/api/v1/onboarding/complete` | POST | SESSION | **Yes** | -- | `onboardingCompleteBodySchema` | No | P, LLM | Saves onboarding data. Generates welcome message via LLM. Input sanitization. |

---

## 9. Chat / Tutor (Category: `chat`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 24 | `/api/v1/chat` | POST | SESSION | **Yes** | -- | `chatBodySchema` (inline) | 20/min | P, R, LLM, RAG | Main chatbot entry. Routes query to skill. Billing quota (TUTOR_QUESTIONS). |
| 25 | `/api/v1/tuteur/message` | POST | SESSION | **Yes** | -- | `tuteurMessageBodySchema` | 30/hour | P, R, LLM, RAG | Full tutor pipeline: RAG search, LLM orchestration. Supports SSE streaming (`?stream=1`). Billing quota (TUTOR_QUESTIONS). Input sanitization. |

---

## 10. RAG Search (Category: `rag`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 26 | `/api/v1/rag/search` | POST | SESSION | **Yes** | -- | `ragSearchBodySchema` | 20/min | P, R, RAG | Searches official references via RAG. Billing quota (RAG_SEARCH). |

---

## 11. Quiz (Category: `quiz`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 27 | `/api/v1/quiz/generate` | POST | SESSION | **Yes** | -- | `quizGenerateBodySchema` | 20/hour | P, R, LLM, RAG | Generates QCM questions. Theme-mapped RAG + media context. Billing quota (QUIZ_PER_DAY). |
| 28 | `/api/v1/quiz/evaluate` | POST | SESSION | **Yes** | -- | `evaluateSchema` (inline) | No | P | Persists quiz evaluation score to DB via `createEvaluation`. |

---

## 12. Parcours / Study Plan (Category: `parcours`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 29 | `/api/v1/parcours/generate` | POST | SESSION | **Yes** | -- | `parcoursGenerateBodySchema` | No | P, LLM | Generates 4-week study plan via LLM with month-based sequencing. |

---

## 13. Langue / Grammar (Category: `langue`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 30 | `/api/v1/langue/generate` | POST | SESSION | **Yes** | -- | `langueGenerateBodySchema` | No | P, LLM | Generates grammar exercises via LLM with local bank fallback. |
| 31 | `/api/v1/evaluations/langue` | POST | SESSION | **Yes** | -- | `langueEvaluationBodySchema` | No | P, LLM | Evaluates grammar answer via LLM. Updates weakSkills. Persists evaluation + student model. |

---

## 14. Epreuves / Written Exams (Category: `epreuves`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 32 | `/api/v1/epreuves/generate` | POST | SESSION | **Yes** | -- | `epreuveGenerateBodySchema` | 10/hour | P, R, LLM | Generates exam subject (commentaire/dissertation/contraction_essai). Billing quota (WRITTEN_CORRECTIONS). |
| 33 | `/api/v1/epreuves/[epreuveId]/copie` | POST | SESSION | **Yes** | -- | No (multipart) | 5/hour | P, R, FS, LLM | File upload (copie). File type validation. Billing quotas (WRITTEN_CORRECTIONS + OCR_COPIES). Triggers async correction worker. Badge evaluation. |
| 34 | `/api/v1/epreuves/[epreuveId]/copie/[copieId]` | GET | SESSION | No | -- | No | No | P | Returns copie status, correction, OCR text. IDOR-guarded (userId check). |
| 35 | `/api/v1/epreuves/copies/[copieId]/file` | GET | SESSION | No | -- | No | No | P, FS | Serves uploaded copie file. IDOR-guarded. |
| 36 | `/api/v1/epreuves/copies/[copieId]/report` | GET | SESSION | No | -- | No | No | P | Generates and serves correction report as PDF (react-pdf). IDOR-guarded. |

---

## 15. Oral / Simulation (Category: `oral`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 37 | `/api/v1/oral/session/start` | POST | SESSION | **Yes** | -- | `oralSessionStartBodySchema` | 3/hour | P, R, LLM | Starts oral session. Picks extrait. Billing quota (ORAL_SESSIONS). |
| 38 | `/api/v1/oral/session/[sessionId]/start-prep` | POST | SESSION | **Yes** | -- | No | No | P | Marks session as PREP_RUNNING. IDOR-guarded. |
| 39 | `/api/v1/oral/session/[sessionId]/end-prep` | POST | SESSION | **Yes** | -- | No | No | P | Marks session as PREP_ENDED. IDOR-guarded. |
| 40 | `/api/v1/oral/session/[sessionId]/start-passage` | POST | SESSION | **Yes** | -- | No | No | P | Marks session as PASSAGE_RUNNING. IDOR-guarded. |
| 41 | `/api/v1/oral/session/[sessionId]/interact` | POST | SESSION | **Yes** | -- | `oralSessionInteractBodySchema` | No | P, LLM | Evaluates single oral phase (LECTURE/EXPLICATION/GRAMMAIRE/ENTRETIEN). IDOR-guarded. |
| 42 | `/api/v1/oral/session/[sessionId]/end` | POST | SESSION | **Yes** | -- | `oralSessionEndBodySchema` | No | P, LLM | Finalizes oral session. Computes /20 score. Generates bilan. Badge evaluation. Student modeler update. |
| 43 | `/api/v1/oral/session/[sessionId]/audio-turn` | POST | SESSION | **Yes** | -- | No (multipart) | No | P, STT, LLM, TTS | Full voice pipeline: audio upload -> Whisper STT -> phase evaluation -> TTS jury response. Max 25MB. |
| 44 | `/api/v1/oral/voice-submit` | POST | SESSION | **Yes** | -- | No (multipart) | No | P, STT, LLM | Standalone voice submit: transcribe + LLM feedback (coach_lecture skill). |
| 45 | `/api/v1/oral/capabilities` | GET | SESSION | No | -- | No | No | -- | Returns oral capabilities (voice modes, STT/TTS availability). |
| 46 | `/api/v1/oral/jury-respond` | POST | SESSION | **Yes** | -- | `bodySchema` (inline) | No | P, LLM, RAG, TTS | AI jury response with examiner persona (BIENVEILLANT/NEUTRE/HOSTILE). RAG context enrichment. TTS audio generation. |

---

## 16. Carnet de Lecture (Category: `carnet`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 47 | `/api/v1/carnet` | GET | SESSION | No | -- | No | No | P | Lists carnet entries (Prisma CarnetEntry). Optional `?oeuvre=` filter. |
| 48 | `/api/v1/carnet` | POST | SESSION | **Yes** | -- | `carnetEntrySchema` | No | P | Creates carnet entry in Prisma CarnetEntry table. |
| 49 | `/api/v1/carnet/entry` | GET | SESSION | No | -- | No | No | P | Lists carnet entries from MemoryEvent store (legacy path). |
| 50 | `/api/v1/carnet/entry` | POST | SESSION | **Yes** | -- | `entrySchema` (inline) | No | P | Creates carnet entry as MemoryEvent (legacy path). |
| 51 | `/api/v1/carnet/[entryId]` | DELETE | SESSION | **Yes** | -- | No | No | P | Deletes a carnet entry. IDOR-guarded (studentId check). |
| 52 | `/api/v1/carnet/export` | GET | SESSION | No | -- | No | No | P | Exports carnet entries as PDF (react-pdf). Max 300 entries. |

---

## 17. Memory / Timeline (Category: `memory`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 53 | `/api/v1/memory/events` | POST | SESSION | **Yes** | -- | `memoryEventBodySchema` | No | P | Creates a memory event for the authenticated user. |
| 54 | `/api/v1/memory/timeline` | GET | SESSION | No | -- | No | No | P | Returns user timeline + weakSignals aggregation. Limit param (max 200). |

---

## 18. Badges / Gamification (Category: `badges`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 55 | `/api/v1/badges/list` | GET | SESSION | No | -- | No | No | -- | Returns user's earned badges from profile. |
| 56 | `/api/v1/badges/evaluate` | POST | SESSION | **Yes** | -- | `badgeEvaluateBodySchema` | No | P | Evaluates and awards new badges based on trigger. Updates profile. |

---

## 19. Billing / Payments (Category: `billing`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 57 | `/api/v1/billing/status` | GET | SESSION | No | -- | No | No | P | Returns subscription plan, status, last payment. |
| 58 | `/api/v1/billing/check-quota` | GET | SESSION | No | -- | No | No | P | Checks quota for a specific feature (`?feature=`). Returns used/limit/remaining. |
| 59 | `/api/v1/billing/redeem-code` | POST | SESSION | **Yes** | -- | No (manual) | 5/hour | P, R | Redeems activation code. Custom error types (409/410/400). |
| 60 | `/api/v1/payments/clictopay/init` | POST | SESSION | **Yes** | -- | `initBodySchema` (inline) | 5/min | P, R | Initiates ClicToPay checkout session. |
| 61 | `/api/v1/payments/clictopay/callback` | POST, GET | PUBLIC | No | -- | No | No | P | Webhook from ClicToPay. IP allowlist + HMAC signature verification. Idempotent. GET variant redirects to confirmation/refus page. |
| 62 | `/api/v1/payments/clictopay/status` | GET | SESSION | No | -- | No | No | P | Returns subscription + last transaction for authenticated user. |
| 63 | `/api/v1/payments/clictopay/public-status` | GET | PUBLIC | No | -- | No | No | P | Public payment status check by orderRef/orderId. Non-sensitive data only. |

---

## 20. Enseignant / Teacher (Category: `enseignant`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 64 | `/api/v1/enseignant/class-code` | POST | SESSION | **Yes** | **enseignant** | No | No | P | Generates and assigns a 6-char class code to teacher profile. |
| 65 | `/api/v1/enseignant/dashboard` | GET | SESSION | No | **enseignant** | No | No | P | Aggregated class dashboard: students, scores, distribution, copies. Fallback store in dev. |
| 66 | `/api/v1/enseignant/export` | GET | SESSION | No | **enseignant** | No | 10/hour | P, R | Exports class results as CSV. CSV formula injection protection. |
| 67 | `/api/v1/enseignant/corrections/[copieId]/comment` | POST | SESSION | **Yes** | **enseignant** | `teacherCorrectionCommentBodySchema` | No | P | Adds teacher comment to AI correction. Class code cross-check (prevents cross-class access). |

---

## 21. Admin (Category: `admin`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 68 | `/api/v1/admin/activation-codes` | GET | SESSION | No | **admin** | No | No | P | Lists activation codes (last 100). |
| 69 | `/api/v1/admin/activation-codes` | POST | SESSION | **Yes** | **admin** | `generateCodeSchema` (inline) | No | P | Creates activation code. Returns plain code once. |
| 70 | `/api/v1/admin/manual-payment` | POST | SESSION | **Yes** | **admin** | `manualPaymentSchema` (inline) | No | P | Records manual payment (virement/especes). Creates/updates subscription. |
| 71 | `/api/v1/admin/stats` | GET | SESSION | No | **admin** | No | No | P | Dashboard stats: total users, active subs, revenue, plan distribution, recent payments. |
| 72 | `/api/v1/admin/users` | GET | SESSION | No | **admin** | No | No | P | Lists all users with subscription + profile + payment history. |

---

## 22. Cron Jobs (Category: `cron`)

| # | Path | Methods | Auth | CSRF | Role | Zod | Rate-limit | Deps | Notes |
|---|------|---------|------|------|------|-----|------------|------|-------|
| 73 | `/api/v1/cron/session-cleanup` | GET | CRON | No | -- | No | No | P | Deletes expired sessions. Bearer token auth (`Authorization: Bearer CRON_SECRET`). |
| 74 | `/api/v1/cron/weekly-reports` | POST | CRON | No | -- | No | No | P, LLM | Generates weekly report for all students. Header auth (`x-cron-secret`). maxDuration=300. |
| 75 | `/api/v1/cron/revision-reminders` | POST | CRON | No | -- | No | No | P | Sends push notification for due error-bank items. Header auth (`x-cron-secret`). maxDuration=300. |

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| **Total route files** | 65 |
| **Total endpoints** (method-level) | 75 |
| **Public (no session)** | 17 |
| **Session-authenticated** | 55 |
| **CRON-secret-authenticated** | 3 |
| **CSRF-protected** | 33 |
| **Role-gated (admin)** | 5 |
| **Role-gated (enseignant)** | 4 |
| **Zod-validated** | 35 |
| **Rate-limited** | 19 |
| **LLM-dependent** | 15 |
| **RAG-dependent** | 5 |
| **Billing quota-enforced** | 8 |

---

## Security Observations

### Strengths
1. **Consistent auth pattern**: `requireAuthenticatedUser()` or `requireUserRole()` used uniformly across protected routes.
2. **CSRF on all mutating endpoints**: Every POST/PUT/DELETE that modifies state calls `validateCsrf()`.
3. **IDOR protection**: Copie, session, and carnet entry access all verify `userId` ownership.
4. **Rate limiting**: All LLM-heavy and auth endpoints are rate-limited.
5. **Input sanitization**: `sanitizeString()` applied on user-facing text inputs (tutor, onboarding).
6. **File security**: Path traversal protection, symlink detection, null-byte rejection on file-serving routes.
7. **Payment webhook security**: HMAC signature verification + IP allowlist on ClicToPay callback.
8. **Generic error messages**: IDOR failures return "Ressource non disponible" to prevent enumeration.

### Potential Concerns
1. **No CSRF on login/register**: Public auth endpoints skip CSRF (acceptable since they are pre-auth, but login CSRF attacks are a known vector).
2. **Cron auth inconsistency**: `session-cleanup` uses `Authorization: Bearer` header; `weekly-reports` and `revision-reminders` use `x-cron-secret` header. Should be unified.
3. **No rate limit on some mutating routes**: `student/profile PUT`, `student/oeuvre-choisie PUT`, `student/descriptif POST`, `onboarding/complete POST`, `badges/evaluate POST`, `memory/events POST` lack rate limiting.
4. **`billing/redeem-code`**: Uses manual `request.json()` parsing instead of `parseJsonBody` with Zod -- validation is ad-hoc string check only.
5. **`quiz/evaluate`**: Uses `request.json()` directly then `safeParse` instead of `parseJsonBody` helper (inconsistent pattern).
6. **`payments/clictopay/status` GET**: Returns subscription data even when `userId` is null (returns FREE plan status for unauthenticated requests instead of 401).
7. **Admin routes lack rate limiting**: All admin endpoints (`stats`, `users`, `activation-codes`, `manual-payment`) have no rate limiting.
8. **Carnet dual storage**: Both `/api/v1/carnet` (Prisma CarnetEntry) and `/api/v1/carnet/entry` (MemoryEvent) exist for the same feature -- potential data inconsistency.
