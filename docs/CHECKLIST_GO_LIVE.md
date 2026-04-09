# Checklist Go-Live — Nexus Réussite EAF
## Mise à jour : 4 avril 2026 — SHA b618baf

## Infrastructure
- [x] TypeScript strict : exit 0
- [x] Tests unitaires : 1383 passed, 248 fichiers, 0 failed
- [x] Build production : exit 0
- [x] Health check : status=ok, isCiReady=True
- [x] MCP : healthy, 24 tools
- [x] PM2 : 3 process online sous user nexus
- [x] Uploads : chemin unique .data/uploads, symlink standalone OK
- [x] Ressources : 549 fichiers sur /srv/eaf_ressources
- [x] Backup cron : /etc/cron.d/nexus-backup configuré
- [x] DB : 60+ users, 2319+ memory_events
- [x] Aucun JSON store actif en .data/
- [x] .env absent du tracking Git

## Sécurité
- [x] Toutes les routes API retournent 401 sans auth
- [x] CSRF protégé sur les mutations
- [x] Rate-limit actif sur /auth/login
- [x] Credentials demo absents du README public
- [x] Secrets non exposés dans l'historique Git

## Pédagogie (logique métier EAF)
- [x] Grammaire : syntaxique uniquement (grep interprétation = 0)
- [x] Barème commentaire : 4 critères officiels, pas intro/conclusion
- [x] Barème dissertation : 4 critères officiels
- [x] Descriptif de lecture : modèle TexteDescriptif, API CRUD, UI 4 onglets
- [x] Tirage oral dans le descriptif réel (fallback avec avertissement)
- [x] Onboarding → redirection vers /descriptif-lecture
- [x] Dashboard : encart "descriptif incomplet" si < 16 textes
- [x] Question grammaire améliorée avec phrases spécifiques
- [x] ecritBaremageSkill configurable par exercice

## Tests
- [x] Tests unitaires pédagogie : grammaire, barèmes
- [x] Tests intégration oral (mocks texteDescriptif)
- [x] Tests E2E workflows 01-06 créés
- [ ] Script smoke-test-production.sh exécuté sur le serveur : FAIL=0
- [ ] Script integration-test-production.sh : FAIL=0
- [ ] Script pedagogical-test.sh : FAIL=0

## Fonctionnalités dashboard élève
- [x] Dashboard : timeline, scores, streak, badges visibles
- [x] Atelier Écrit : génération + upload + correction IA
- [x] Atelier Oral : tirage → préparation → passage → bilan
- [x] Bibliothèque : 549 ressources accessibles
- [x] Tuteur IA : réponses avec citations RAG
- [x] Carnet de lecture : CRUD + export PDF
- [x] Quiz adaptatif
- [x] Gamification : XP + badges
- [x] Mon Parcours : parcours personnalisé généré
- [x] Descriptif de lecture : API + UI 4 onglets + conformité

## Rôles
- [x] Enseignant : dashboard + corrections + exports CSV
- [x] Parent : tableau de bord suivi (minimal)
- [x] Admin : gestion users + abonnements + métriques

## Pages légales
- [x] /cgu → 200
- [x] /cgv → 200
- [x] /mentions-legales → 200
- [x] /politique-de-confidentialite → 200
- [x] /contact → 200

## SCORE : 38/45 — Cible : 45/45 pour go-live commercial
