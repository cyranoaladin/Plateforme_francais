# Checklist d'audit documentaire (release)

Utiliser cette checklist avant chaque release pour garantir que la documentation reste alignée sur le code.

Dernier audit complet : **25 février 2026**

## 1. Couverture architecture
- [x] `README.md` reflète stack + scripts + état réel des fonctionnalités
- [x] `docs/DOCUMENTATION_COMPLETE_PROJET.md` mis à jour (pages/routes/flux)
- [x] Schéma Prisma documenté à jour avec migrations (8 migrations, 25+ modèles)

## 2. Couverture API
- [x] Toutes les routes `src/app/api/v1/*` figurent dans `docs/API_REFERENCE.md` (33 routes + MCP)
- [x] Payloads JSON mis à jour (champs, enums, limites)
- [x] Statuts d'erreur documentés (401/403/404/429/503)
- [x] Sécurité CSRF/auth/rate-limit explicitée (table rate-limits par route)

## 3. Guides utilisateurs
- [x] `docs/GUIDE_ELEVE.md` aligné avec UI réelle (pricing, toggle mdp, XP/niveaux)
- [x] `docs/GUIDE_ENSEIGNANT.md` aligné avec flux enseignant réel
- [x] Limites connues indiquées (S3 non implémenté, espace parent minimal)

## 4. Exploitation / runbook
- [x] `docs/RUNBOOK_PROD.md` aligné avec architecture réelle (VPS, PM2, Redis, Nginx)
- [x] Procédures backup/restauration documentées (PostgreSQL, Redis, fichiers locaux)
- [x] Incident response et rollback à jour (CSP, Redis down, BullMQ)
- [x] Variables d'environnement critiques listées (Mistral, ClicToPay, VAPID, etc.)

## 5. Traçabilité exigences
- [x] `docs/TRACEABILITY_MATRIX.md` mis à jour par bloc (13 blocs, 0→12)
- [x] Écarts résiduels explicitement mentionnés (S3, parent)

## 6. Validation technique associée
- [x] `npx tsc --noEmit` vert
- [x] `npm run test:unit` vert
- [ ] `npm run test:e2e` — requiert serveur Next.js en cours d'exécution (non testable en CI sans setup)
- [x] En cas d'échec infra/sandbox, cause environnementale précisée

## 7. Qualité rédactionnelle
- [x] Terminologie homogène (noms de routes, skills, modèles)
- [x] Dates de mise à jour présentes sur tous les docs
- [x] Pas de fonctionnalités fantômes (non codées)
- [x] Liens vers fichiers pertinents fournis
