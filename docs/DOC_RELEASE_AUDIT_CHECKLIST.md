# Checklist d'audit documentaire (release)

Utiliser cette checklist avant chaque release pour garantir que la documentation reste alignée sur le code.

## 1. Couverture architecture
- [ ] `README.md` reflète stack + scripts + état réel des fonctionnalités
- [ ] `docs/DOCUMENTATION_COMPLETE_PROJET.md` mis à jour (pages/routes/flux)
- [ ] Schéma Prisma documenté à jour avec migrations

## 2. Couverture API
- [ ] Toutes les routes `src/app/api/v1/*` figurent dans `docs/API_REFERENCE.md`
- [ ] Payloads JSON mis à jour (champs, enums, limites)
- [ ] Statuts d'erreur documentés (401/403/404/429/503)
- [ ] Sécurité CSRF/auth/rate-limit explicitée

## 3. Guides utilisateurs
- [ ] `docs/GUIDE_ELEVE.md` aligné avec UI réelle
- [ ] `docs/GUIDE_ENSEIGNANT.md` aligné avec flux enseignant réel
- [ ] Limites connues indiquées (features partielles)

## 4. Exploitation / runbook
- [ ] `docs/RUNBOOK_PROD.md` aligné avec architecture réelle
- [ ] Procédures backup/restauration testées
- [ ] Incident response et rollback à jour
- [ ] Variables d'environnement critiques listées

## 5. Traçabilité exigences
- [ ] `docs/TRACEABILITY_MATRIX.md` mis à jour par bloc
- [ ] Écarts résiduels explicitement mentionnés

## 6. Validation technique associée
- [ ] `npx tsc --noEmit` vert
- [ ] `npm run test:unit` vert
- [ ] `npm run test:e2e` vert
- [ ] En cas d'échec infra/sandbox, préciser cause environnementale

## 7. Qualité rédactionnelle
- [ ] Terminologie homogène (noms de routes, skills, modèles)
- [ ] Dates de mise à jour présentes
- [ ] Pas de fonctionnalités fantômes (non codées)
- [ ] Liens vers fichiers pertinents fournis
