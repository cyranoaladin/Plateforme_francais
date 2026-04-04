# Checklist Go-Live — Nexus Réussite EAF

## Infrastructure
- [ ] TypeScript strict : exit 0
- [ ] Tests unitaires : 1363+ passed, 0 failed
- [ ] Build production : exit 0
- [ ] Smoke test prod : FAIL=0
- [ ] Health check : status=ok
- [ ] MCP : healthy
- [ ] PM2 : 3 process online sous user nexus
- [ ] Uploads : chemin unique .data/uploads, symlink OK
- [ ] Ressources : 500+ fichiers sur /srv/eaf_ressources
- [ ] Backup cron : /etc/cron.d/nexus-backup
- [ ] JSON stores actifs : 0

## Sécurité
- [ ] Toutes les routes API protégées retournent 401 sans auth
- [ ] CSRF protégé sur les mutations
- [ ] Rate-limit actif sur /auth/login
- [ ] Credentials demo absents du README

## Pédagogie (logique métier EAF)
- [ ] Question de grammaire : pas d'interprétation dans le prompt
- [ ] Barème commentaire : 4 critères officiels, pas intro/conclusion
- [ ] Barème commentaire : total = 20pts répartis officiellement
- [ ] Descriptif de lecture oral : route API et UI créés
- [ ] Inscription étape 3 : ne plante plus (bug corrigé)
- [ ] Lectures cursives : multiples œuvres sélectionnables

## Tests
- [ ] Tests unitaires pédagogie : grammaire, barèmes
- [ ] Tests intégration prod : PASS=0 FAIL
- [ ] Script smoke test : FAIL=0
- [ ] Tests pédagogiques : FAIL=0

## Fonctionnalités dashboard élève
- [ ] Dashboard : timeline, scores, streak, badges visibles
- [ ] Atelier Écrit : génération + upload + correction IA
- [ ] Atelier Oral : tirage → préparation → passage → bilan
- [ ] Atelier Langue : exercices grammaticaux fonctionnels
- [ ] Bibliothèque : ressources accessibles
- [ ] Tuteur IA : réponses avec citations RAG
- [ ] Carnet de lecture : CRUD + export PDF
- [ ] Mon Parcours : recommandations personnalisées
- [ ] Quiz adaptatif : génération selon niveau
- [ ] Gamification : XP + badges évalués correctement

## Rôles
- [ ] Enseignant : dashboard + corrections + exports CSV
- [ ] Parent : tableau de bord suivi
- [ ] Admin : gestion users + abonnements + métriques
