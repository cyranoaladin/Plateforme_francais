# PHASE 1 — INVENTAIRE EXHAUSTIF DES SURFACES

> **Audit frais 2026-03-22 ~12:30 UTC+1** — Contre-expertise finale intégrale
> SHA : `9e386b514025711d4b42acf99ae3b819373defc8`

---

## 1. Pages publiques (pas d'auth requise)

| Route | Type | Description |
|-------|------|-------------|
| `/` | Landing | Page d'accueil / machine à conversions |
| `/login` | Auth | Connexion + inscription + reset password |
| `/bienvenue` | Redirect | Redirige vers `/` |
| `/landing` | Redirect | Redirige vers `/` |
| `/pricing` | Vitrine | Plans tarifaires |
| `/contact` | Formulaire | Formulaire de contact public |
| `/mentions-legales` | Légal | Mentions légales |
| `/cgu` | Légal | Conditions générales d'utilisation |
| `/politique-de-confidentialite` | Légal | Politique de confidentialité RGPD |
| `/paiement/confirmation` | Billing | Page confirmation paiement |
| `/paiement/refus` | Billing | Page refus paiement |
| `/connexion` | Alias FR | Redirige → `/login` |
| `/inscription` | Alias FR | Redirige → `/login?mode=register` |
| `/tarifs` | Alias FR | Redirige → `/pricing` |

## 2. Pages protégées — Élève

| Route | Description |
|-------|-------------|
| `/dashboard` | Tableau de bord principal élève |
| `/onboarding` | Parcours d'onboarding initial |
| `/mon-parcours` | Parcours personnalisé |
| `/profil` | Profil utilisateur |
| `/atelier-ecrit` | Atelier écrit (sujets + dépôt) |
| `/atelier-ecrit/correction/[copieId]` | Correction détaillée d'une copie |
| `/atelier-oral` | Atelier oral (simulation EAF) |
| `/atelier-langue` | Atelier langue (exercices grammaire) |
| `/quiz` | Quiz thématiques |
| `/tuteur` | Tuteur IA libre |
| `/carnet` | Carnet de notes personnelles |
| `/descriptif` | Descriptif de lecture pour l'oral |
| `/bibliotheque` | Bibliothèque de ressources |

## 3. Pages protégées — Parent

| Route | Description |
|-------|-------------|
| `/parent` | Dashboard parent (suivi enfants) |

## 4. Pages protégées — Enseignant

| Route | Description |
|-------|-------------|
| `/enseignant` | Dashboard enseignant (suivi classe) |

## 5. Pages protégées — Admin

| Route | Description |
|-------|-------------|
| `/admin` | Dashboard admin (users, codes, paiements) |

## 6. Routes API publiques (middleware whitelist)

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `GET /api/v1/health` | GET | Health check (DB + app + voice) |
| `POST /api/v1/auth/login` | POST | Connexion |
| `POST /api/v1/auth/register` | POST | Inscription |
| `POST /api/v1/auth/forgot-password` | POST | Mot de passe oublié |
| `POST /api/v1/auth/reset-password` | POST | Réinitialisation mot de passe |
| `GET /api/v1/csrf` | GET | Obtenir token CSRF |
| `POST /api/v1/contact` | POST | Formulaire de contact |
| `GET /api/v1/exam-info` | GET | Infos examen EAF |
| `GET /api/v1/ressources` | GET | Catalogue ressources |
| `POST /api/v1/metrics/vitals` | POST | Web Vitals collecte |
| `GET /api/v1/rag/health` | GET | RAG health check |
| `POST /api/v1/payments/clictopay/callback` | POST | Callback paiement (legacy) |
| `GET /api/v1/payments/clictopay/public-status` | GET | Status paiement public (legacy) |
| `GET /api/mcp/health` | GET | MCP health check |

## 7. Routes API protégées — Auth

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `GET /api/v1/auth/me` | GET | Profil utilisateur courant |
| `POST /api/v1/auth/logout` | POST | Déconnexion |

## 8. Routes API protégées — Élève / Student

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `GET /api/v1/student/profile` | GET | Profil étudiant |
| `PUT /api/v1/student/profile` | PUT | Mise à jour profil |
| `GET/POST /api/v1/student/descriptif` | GET/POST | Descriptif de lecture |
| `GET/POST /api/v1/student/oeuvre-choisie` | GET/POST | Œuvre choisie entretien |
| `GET /api/v1/student/recapitulatif` | GET | Récapitulatif parcours |
| `POST /api/v1/onboarding/complete` | POST | Finaliser onboarding |
| `POST /api/v1/parcours/generate` | POST | Générer parcours |

## 9. Routes API protégées — Oral

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `POST /api/v1/oral/session/start` | POST | Démarrer session orale |
| `POST /api/v1/oral/session/[id]/start-prep` | POST | Commencer préparation |
| `POST /api/v1/oral/session/[id]/end-prep` | POST | Terminer préparation |
| `POST /api/v1/oral/session/[id]/start-passage` | POST | Commencer passage |
| `POST /api/v1/oral/session/[id]/interact` | POST | Interaction avec jury |
| `POST /api/v1/oral/session/[id]/end` | POST | Terminer session |
| `POST /api/v1/oral/session/[id]/audio-turn` | POST | Tour audio (voix) |
| `POST /api/v1/oral/jury-respond` | POST | Réponse jury IA |
| `POST /api/v1/oral/voice-submit` | POST | Soumission voix |
| `GET /api/v1/oral/capabilities` | GET | Capacités voix/audio |

## 10. Routes API protégées — Écrit / Épreuves

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `POST /api/v1/epreuves/generate` | POST | Générer sujet |
| `POST /api/v1/epreuves/[id]/copie` | POST | Déposer copie |
| `GET /api/v1/epreuves/[id]/copie/[copieId]` | GET | Récupérer copie |
| `GET /api/v1/epreuves/copies/[copieId]/file` | GET | Télécharger fichier copie |
| `GET /api/v1/epreuves/copies/[copieId]/report` | GET | Rapport de correction PDF |

## 11. Routes API protégées — Langue / Quiz

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `POST /api/v1/langue/generate` | POST | Générer exercice langue |
| `POST /api/v1/evaluations/langue` | POST | Évaluer exercice langue |
| `POST /api/v1/quiz/generate` | POST | Générer quiz |
| `POST /api/v1/quiz/evaluate` | POST | Évaluer quiz |

## 12. Routes API protégées — Tuteur / Chat

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `POST /api/v1/chat` | POST | Chat tuteur IA |
| `POST /api/v1/tuteur/message` | POST | Message tuteur |

## 13. Routes API protégées — Carnet

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `GET /api/v1/carnet` | GET | Liste entrées carnet |
| `POST /api/v1/carnet/entry` | POST | Créer entrée |
| `PUT/DELETE /api/v1/carnet/[entryId]` | PUT/DELETE | Modifier/supprimer entrée |
| `GET /api/v1/carnet/export` | GET | Export carnet |

## 14. Routes API protégées — Billing

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `GET /api/v1/billing/status` | GET | Statut abonnement |
| `POST /api/v1/billing/check-quota` | POST | Vérifier quota |
| `POST /api/v1/billing/redeem-code` | POST | Activer code |
| `POST /api/v1/payments/clictopay/init` | POST | Init paiement (legacy) |
| `GET /api/v1/payments/clictopay/status` | GET | Status paiement (legacy) |

## 15. Routes API protégées — Badges / Mémoire

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `POST /api/v1/badges/evaluate` | POST | Évaluer badges |
| `GET /api/v1/badges/list` | GET | Liste badges |
| `GET /api/v1/memory/events` | GET | Événements mémoire |
| `GET /api/v1/memory/timeline` | GET | Timeline mémoire |

## 16. Routes API protégées — Enseignant

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `GET /api/v1/enseignant/dashboard` | GET | Dashboard enseignant |
| `POST /api/v1/enseignant/class-code` | POST | Générer code classe |
| `GET /api/v1/enseignant/export` | GET | Export CSV |
| `POST /api/v1/enseignant/corrections/[id]/comment` | POST | Commenter copie |

## 17. Routes API protégées — Admin

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `GET /api/v1/admin/stats` | GET | Statistiques |
| `GET /api/v1/admin/users` | GET | Liste utilisateurs |
| `POST /api/v1/admin/activation-codes` | POST | Générer code activation |
| `POST /api/v1/admin/manual-payment` | POST | Enregistrer paiement manuel |

## 18. Routes API protégées — Ressources / Média

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `GET /api/v1/ressources` | GET | Catalogue ressources (aussi public) |
| `GET /api/v1/ressources/file` | GET | Télécharger fichier ressource |
| `GET /api/v1/media/[id]` | GET | Streaming média |

## 19. Routes API — RAG / RGPD / Cron / Dev

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `GET /api/v1/rag/health` | GET | RAG health |
| `POST /api/v1/rag/search` | POST | Recherche RAG |
| `GET/POST /api/v1/rgpd/consent` | GET/POST | Consentement RGPD |
| `POST /api/v1/cron/revision-reminders` | POST | Rappels révision (cron) |
| `POST /api/v1/cron/session-cleanup` | POST | Nettoyage sessions (cron) |
| `POST /api/v1/cron/weekly-reports` | POST | Rapports hebdo (cron) |
| `POST /api/dev/test-email` | POST | Test email (dev only) |

## 20. Modèles Prisma (36 tables)

User, Session, StudentProfile, MemoryEvent, MemorySummary, SkillMapEntry, WeakSkillEntry, WeakSkillRevision, WorkMastery, DiagnosticSnapshot, StudyPlanSnapshot, WeeklyReportSnapshot, OralSession, OralPhaseScore, OralBilan, OralTranscript, EpreuveBlanche, CopieDeposee, DocumentDeposit, Evaluation, CarnetEntry, DescriptifTexte, OfficialWork, ErrorBankItem, Subscription, ActivationCode, PaymentTransaction, UsageCounter, AgentInteraction, LlmCostLog, LlmBudgetAlert, ComplianceLog, PushSubscription, WebVital, Chunk, PasswordResetToken

## 21. Enums Prisma (21 enums)

UserRole, SubscriptionPlan, SubscriptionStatus, PaymentStatus, PaymentProvider, CopieStatus, DocStatus, DocType, OralSessionStatus, OralPhase, OralMode, ExamPersona, EafSkill, SkillLevel, SkillTrend, WeakSeverity, WeakStatus, RevisionPhase, SummaryType, AgentTypeEnum, Voie

## 22. Plans et quotas

| Plan ID | Label commercial | Prix |
|---------|-----------------|------|
| FREE | Freemium | 0 TND |
| PREMIUM | Premium | 99 TND/mois |
| PRO | Masterium | 129 TND/mois |

⚠️ **PRO** = ID technique interne pour "Masterium" commercial. MAX existe en enum mais non utilisé au go-live.

## 23. Checklist de couverture

- [ ] 14 pages publiques (dont 3 alias/redirects)
- [ ] 13 pages élève
- [ ] 1 page parent
- [ ] 1 page enseignant
- [ ] 1 page admin
- [ ] 73 routes API (14 publiques + 59 protégées)
- [ ] 36 modèles Prisma
- [ ] 21 enums
- [ ] 3 plans tarifaires
- [ ] 4 rôles (eleve, parent, enseignant, admin)
- [ ] Emails: welcome, reset password, parental consent, contact
- [ ] Cron: revision reminders, session cleanup, weekly reports
- [ ] MCP: 27 outils
- [ ] RAG: search + health
- [ ] Média: streaming + download
