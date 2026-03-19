# WINDSURF AUDIT EXECUTION TRACKER
**Cahier des Charges V3 - Exécution dans les moindres détails**

---

## PRINCIPE DIRECTEUR
> **aucun rapport de Claude n'est considéré comme vrai tant qu'il n'est pas revalidé factuellement**

**Méthode :**
1. Vérifier chaque affirmation importante
2. Détecter contradictions, approximations, oublis, faux positifs
3. Corriger réellement le code, configuration, données, workflows, déploiement
4. Tester jusqu'à éliminer tout angle mort
5. Livrer verdict final sérieux avec preuves

---

## FORMAT DE CONTRÔLE OBLIGATOIRE

Pour chaque sujet important :
- **Affirmation initiale de Claude** : 
- **Constat réel après vérification** : 
- **Preuve** : 
- **Écart** : 
- **Action corrective** : 
- **Résultat après correction** :

---

## PHASE A — AUDIT GIT / GITHUB / HISTORIQUE / SOURCE DE VÉRITÉ

### A1. État Git actuel
- [ ] Branche courante réelle
- [ ] Relation avec origin/main
- [ ] Branches résiduelles
- [ ] PR ouvertes/mergées/fermées
- [ ] Commits réellement fusionnés
- [ ] Contradictions rapports ↔ état git
- [ ] Divergence local/remote/production
- [ ] Historique lots 2→14 et correctifs
- [ ] Fichiers untracked
- [ ] Absence pollution hors périmètre

### A2. Source de vérité à déterminer
- [ ] Quelle branche est réellement la source de vérité ?
- [ ] Claude a-t-il réellement mergé ce qu'il dit ?
- [ ] Déploiements faits hors de main ?
- [ ] SHA réellement servi ?

### A3. Livrable : tableau état Git
| Dépôt | Branche | HEAD local | origin/main | Commit servi en prod | État PR | Contradictions |
|-------|---------|------------|-------------|---------------------|---------|----------------|

---

## PHASE B — AUDIT DÉPLOIEMENT ET PRODUCTION

### B1. Infrastructure à auditer
- [ ] Nginx
- [ ] PM2
- [ ] Docker (si utilisé)
- [ ] Ports
- [ ] Health endpoints
- [ ] Build réellement servi
- [ ] Variables d'environnement prod
- [ ] Redis
- [ ] PostgreSQL
- [ ] RAG external
- [ ] MCP server
- [ ] Volumes montés
- [ ] Droits .env

### B2. Sécurité opérationnelle
- [ ] Secure cookies
- [ ] CSP
- [ ] HSTS
- [ ] Suppression X-Powered-By
- [ ] Port fantôme / conteneurs zombies
- [ ] Services dupliqués

### B3. Validation réelle
- [ ] HTML réellement servi
- [ ] Bundles JS
- [ ] buildTime
- [ ] SHA
- [ ] Entêtes
- [ ] Cookies
- [ ] Redirections
- [ ] Persistance au reboot
- [ ] Restart policies

---

## PHASE C — FRONTEND PUBLIC

### C1. Pages à auditer
- [ ] `/` - Landing
- [ ] `/login` - Connexion
- [ ] `/pricing` - Tarifs
- [ ] `/contact` - Contact
- [ ] `/cgu` - CGU
- [ ] `/politique-de-confidentialite` - Confidentialité
- [ ] `/mentions-legales` - Mentions légales
- [ ] Alias français (`/connexion`, `/inscription`, `/tarifs`)

### C2. Qualité éditoriale et UX
- [ ] Wording
- [ ] Cohérence du ton
- [ ] Suppression jargon technique
- [ ] Qualité pédagogique
- [ ] Crédibilité commerciale
- [ ] Clarté CTA
- [ ] Hiérarchie headings
- [ ] Cohérence cartes/sections/contrastes/icônes
- [ ] Lisibilité mobile/desktop
- [ ] Absence textes "produit-interne"
- [ ] Qualité français
- [ ] Cohérence tutoiement/vouvoiement
- [ ] Correction typographique

### C3. Points de vigilance explicites
- [ ] Termes interdits : RAG, OCR, cockpit, onboarding, feedback, workflow, CSRF, 200k/jour
- [ ] Placeholders non crédibles
- [ ] Textes méta laissés par erreur
- [ ] Sections FAQ incomplètes
- [ ] Promesses produit mal calibrées
- [ ] Mauvais ordre CTA
- [ ] Sections trop bavardes/abstraites
- [ ] Design premium réel

---

## PHASE D — FRONTEND CONNECTÉ

### D1. Pages minimales à tester avec compte réel
- [ ] `/dashboard`
- [ ] `/profil`
- [ ] `/mon-parcours`
- [ ] `/carnet`
- [ ] `/tuteur`
- [ ] `/quiz`
- [ ] `/atelier-ecrit`
- [ ] `/atelier-oral`
- [ ] `/atelier-langue`
- [ ] `/bibliotheque`

### D2. Qualité expérience connectée
- [ ] Rendu réel après connexion
- [ ] Cohérence visuelle design system
- [ ] Logique navigation
- [ ] Libellés et microcopies
- [ ] Chargements
- [ ] Empty states
- [ ] Error states
- [ ] Transitions
- [ ] Comportements sur quotas
- [ ] Messages verrouillage
- [ ] Présence jargon
- [ ] Pertinence vocabulaire
- [ ] Fluidité enchaînements

---

## PHASE E — AUTH / LOGIN / SESSIONS

### E1. Tests complets
- [ ] Mauvais identifiants
- [ ] Bons identifiants
- [ ] Inscription
- [ ] Retour après login
- [ ] Redirects avec `redirect=`
- [ ] Logout
- [ ] Comportement sans Redis
- [ ] Comportement avec Redis
- [ ] Cookies session (Secure/HttpOnly/SameSite)
- [ ] Comportement mobile
- [ ] Erreurs utilisateur
- [ ] Validation formulaire
- [ ] AutoComplete
- [ ] CSRF si applicable
- [ ] Reset password

### E2. Exigences ZÉRO PROBLÈME
- [ ] Plus aucune boucle d'auth
- [ ] Plus aucun 429 injustifié sur login
- [ ] Retour exact au bon écran
- [ ] UX login crédible sans friction

---

## PHASE F — DESIGN SYSTEM / UI KIT / DARK MODE

### F1. Tokens et composants
- [ ] Tokens light/dark
- [ ] Composants UI partagés
- [ ] Usages réels composants
- [ ] Classes hardcodées restantes
- [ ] Cohérence rayons/shadows/spacing

### F2. Thème
- [ ] Thème système/clair/sombre
- [ ] Persistence choix
- [ ] FOUC (Flash of Unstyled Content)
- [ ] Transition thème
- [ ] Sidebar theme switch
- [ ] Mobile theme switch
- [ ] Pages encore incohérentes
- [ ] Composants transverses
- [ ] Contrastes réels

### F3. Verdict honnête
- [ ] Excellent / Bon / Médiocre / À refaire

---

## PHASE G — BIBLIOTHÈQUE / RESSOURCES

### G1. Source de vérité
- [ ] Nombre ressources réelles
- [ ] Nombre indexées
- [ ] Nombre servies
- [ ] Répartition vidéos/PDF/rapports/œuvres/documents
- [ ] Fichiers exclus volontairement
- [ ] Entrées scan orphelines
- [ ] Fichiers existants non exposés

### G2. Organisation éditoriale
- [ ] Revue titres
- [ ] Détection titres médiocres/garbled/techniques/vides/ambigus
- [ ] Corrections titres
- [ ] Uniformisation chartes nommage
- [ ] Ajout auteur/année/nature si nécessaire
- [ ] Numérotation doublons
- [ ] Lisibilité pour élève

### G3. Association frontend ↔ fichier réel
Pour chaque catégorie (échantillonnage) :
- [ ] Carte affichée
- [ ] Titre
- [ ] Catégorie
- [ ] État gratuit/verrouillé
- [ ] Chemin ressource
- [ ] Fichier réel
- [ ] Endpoint réel
- [ ] MIME
- [ ] Visionnage
- [ ] Téléchargement

### G4. Correspondance propre à valider
- [ ] `/srv/eaf_ressources`
- [ ] `ressources-scan.json`
- [ ] Catalogue TS/JSON
- [ ] Frontend

### G5. Visionnage / téléchargement
- [ ] Preview PDF
- [ ] Preview vidéo
- [ ] Rapport de jury
- [ ] Doc/ppsx si conservés
- [ ] Téléchargement forcé `?download=1`
- [ ] Range requests
- [ ] Auth
- [ ] Traversal
- [ ] Symlink
- [ ] Null byte
- [ ] 404

### G6. Qualité sélection gratuite Freemium
- [ ] Vérification sélection actuelle
- [ ] Utilité ressources gratuites
- [ ] Représentativité
- [ ] Pertinence pédagogique
- [ ] Exploitabilité immédiate pour élève Première
- [ ] Correction ordre/logique si nécessaire

### G7. Verrouillage premium
- [ ] Grisage réel
- [ ] Badge verrouillé
- [ ] Cadenas
- [ ] Message explicatif
- [ ] CTA "booster le plan"
- [ ] Cohérence ton
- [ ] Absence frustration inutile
- [ ] Absence flash unlocked content
- [ ] Cohérence backend/frontend

### G8. Exigence finale
- [ ] Crédible
- [ ] Propre
- [ ] Élégant
- [ ] Cohérent
- [ ] Commercialement défendable
- [ ] Pédagogiquement utile

---

## PHASE H — RAG / LLM / ORCHESTRATION

### H1. RAG
- [ ] Santé
- [ ] Collection
- [ ] Nombre chunks réel
- [ ] Schéma réponse
- [ ] Contrat API
- [ ] Recherche directe
- [ ] Pertinence hits
- [ ] Scores
- [ ] Qualité excerpts
- [ ] Filtres low-score
- [ ] Stop words
- [ ] Fusion lexical/vector/external
- [ ] Fallback
- [ ] Temps réponse
- [ ] Cache RAG

### H2. LLM routing
- [ ] Tiers réellement configurés
- [ ] Cascade réelle providers
- [ ] Circuit breaker
- [ ] Erreurs
- [ ] Downgrade
- [ ] Coûts
- [ ] Tiers surdimensionnés
- [ ] Reclassification opportunities
- [ ] Prompts trop longs
- [ ] Répétitions
- [ ] Coûts inutiles

### H3. Orchestrateur
- [ ] Composition prompt
- [ ] Contexte mémoire
- [ ] Contexte élève
- [ ] RAG injecté
- [ ] Media injectés
- [ ] Taille totale
- [ ] Duplication informations
- [ ] Appels séquentiels évitables
- [ ] Latence

### H4. Réponses réelles (tests)
- [ ] Tuteur
- [ ] Quiz
- [ ] Oral (si applicable)

Vérifications :
- [ ] Adaptation niveau
- [ ] Prise en compte voie
- [ ] Prise en compte œuvres
- [ ] Prise en compte J-XX
- [ ] Ton
- [ ] Qualité pédagogique
- [ ] Citations
- [ ] Structure
- [ ] Refus anti-triche
- [ ] Rendu élève

### H5. Exigence
- [ ] Produit réellement pertinent, pas juste connecté

---

## PHASE I — PROFIL ÉLÈVE / MÉMOIRE / HISTORIQUE

### I1. Champs à contrôler
- [ ] classLevel
- [ ] voie
- [ ] selectedOeuvres
- [ ] eafDate
- [ ] weakSkills
- [ ] globalLevel
- [ ] avgOralScore
- [ ] avgEcritScore
- [ ] workMastery
- [ ] Historique utile
- [ ] recentSessions
- [ ] targetScore
- [ ] personaPreference
- [ ] weeklyGoalMinutes

### I2. Exploitation réelle
- [ ] Ce qui est collecté
- [ ] Ce qui est stocké
- [ ] Ce qui est réellement chargé
- [ ] Ce qui est injecté dans les prompts
- [ ] Ce qui est visible côté UI
- [ ] Ce qui est encore du faux-semblant

### I3. Corrections nécessaires
- [ ] Données existantes non utilisées
- [ ] Données manquantes à collecter

---

## PHASE J — MCP SERVERS / OUTILS

### J1. Audit complet
- [ ] Nombre réel d'outils
- [ ] Nombre outils réellement exposés
- [ ] Nombre outils réellement appelés
- [ ] Nombre stubs
- [ ] Scopes
- [ ] Permissions
- [ ] Auth
- [ ] Reachability depuis app
- [ ] bindHost
- [ ] PM2/systemd
- [ ] Résilience au reboot
- [ ] Santé réelle
- [ ] Latence
- [ ] Logs
- [ ] Outils morts
- [ ] Outils utiles non câblés

### J2. Classification finale
- [ ] **Actif et utilisé**
- [ ] **Actif mais non utilisé**
- [ ] **Implémenté mais sans call site**
- [ ] **Stub**
- [ ] **Legacy**
- [ ] **À supprimer**
- [ ] **À garder pour roadmap**

---

## PHASE K — PERFORMANCE / CACHES / COÛTS

### K1. Optimisations à revalider
- [ ] Cache profil
- [ ] Cache RAG
- [ ] TTL
- [ ] Invalidation
- [ ] Fire-and-forget
- [ ] Parallélisation
- [ ] Appels séquentiels évités
- [ ] Estimation tokens
- [ ] Taille prompts
- [ ] Extraits RAG
- [ ] Prefetch
- [ ] Coût par appel
- [ ] Coût mensuel estimé
- [ ] Optimisation skills
- [ ] Gains mesurés/estimés

### K2. Hotspots réels
- [ ] Pas seulement "c'est plus rapide"
- [ ] Hotspots identifiés
- [ ] Gains plausibles
- [ ] Risques
- [ ] Régressions possibles
- [ ] Prochaines optimisations sérieuses

---

## PHASE L — TESTS / QUALITÉ

### L1. Couverture à vérifier
- [ ] Unitaires
- [ ] Intégration
- [ ] API
- [ ] Endpoint
- [ ] Middleware
- [ ] Auth
- [ ] Bibliothèque
- [ ] RAG
- [ ] MCP si testable
- [ ] E2E
- [ ] Smoke tests
- [ ] Visual regression

### L2. Exigences ZÉRO ANGLE MORT
- [ ] Aucun test échoué ignoré
- [ ] Aucun skip opportuniste non justifié
- [ ] Aucun angle mort caché
- [ ] Tests faux/obsolètes corrigés
- [ ] Tests manquants ajoutés
- [ ] Comportements critiques non testés → ajouter tests

### L3. État final attendu
- [ ] X fichiers de test
- [ ] Y tests
- [ ] 0 échec
- [ ] 0 erreur TS
- [ ] Build clean

---

## PHASE M — CI/CD / GITHUB ACTIONS

### M1. Workflows et gates
- [ ] Workflows
- [ ] Gates
- [ ] Audit sécurité
- [ ] Lint
- [ ] Typecheck
- [ ] Tests
- [ ] Build
- [ ] CodeQL si présent
- [ ] Checks post-merge
- [ ] Échecs préexistants masqués
- [ ] Secrets CI
- [ ] Gates conditionnels
- [ ] Cohérence PR ↔ main

### M2. Exigence
- [ ] Aucun "CI verte sauf..."
- [ ] Tout périmètre corrigé réellement

---

## PHASE N — SÉCURITÉ OPÉRATIONNELLE

### N1. Points à revalider
- [ ] CSP sur toutes routes
- [ ] Nonce
- [ ] HSTS
- [ ] Suppression X-Powered-By
- [ ] Cookies sécurisés
- [ ] CSRF
- [ ] Path traversal
- [ ] Symlink
- [ ] Null byte
- [ ] Auth guard
- [ ] Rate limiting
- [ ] Redis
- [ ] SSRF
- [ ] SQLi
- [ ] Logs sensibles
- [ ] Health endpoints trop bavards
- [ ] Variables exposées
- [ ] Permissions fichiers
- [ ] Survivabilité après reboot

### N2. Info disclosure
- [ ] Aucune faille information disclosure

---

## PHASE O — QUALITÉ FRANÇAIS ET ÉDITORIAL

### O1. Audit éditorial professionnel
- [ ] Landing
- [ ] Login
- [ ] Pricing
- [ ] Bibliothèque
- [ ] Dashboard
- [ ] Tuteur
- [ ] Quiz
- [ ] Messages erreur
- [ ] Gating
- [ ] Notifications
- [ ] Labels
- [ ] FAQ
- [ ] Dashboard parent
- [ ] Mentions
- [ ] Textes cartes
- [ ] CTA
- [ ] Placeholders
- [ ] Statuts
- [ ] Modals
- [ ] Titres ressources

### O2. Corrections à appliquer
- [ ] Jargon
- [ ] Anglicismes
- [ ] Formulations internes
- [ ] Phrases abstraites
- [ ] Tutoiement/vouvoiement incohérent
- [ ] Apostrophes
- [ ] Accents
- [ ] Espaces insécables
- [ ] Titres laids
- [ ] Textes peu naturels
- [ ] Labels imprécis

---

## COMPTE(S) DE TEST : OBLIGATION D'EXÉCUTION RÉELLE

### Création/utilisation compte
- [ ] Utiliser compte existant si disponible
- [ ] Sinon en créer un
- [ ] Sinon créer compte technique propre

### Documentation compte
- [ ] Email
- [ ] Plan
- [ ] État onboarding
- [ ] Œuvres sélectionnées
- [ ] Rôle
- [ ] Maintien ou suppression après audit

---

## GESTION GITHUB : AUTONOMIE COMPLÈTE

### Branches et commits
- [ ] Branches de correction
- [ ] Commits propres
- [ ] Push
- [ ] PR
- [ ] Merge
- [ ] Suppression branche
- [ ] Resynchronisation main
- [ ] Vérification post-merge
- [ ] Redeploy si nécessaire

---

## POINTS DE VIGILANCE SPÉCIAUX

1. **Écart rapports ↔ réalité servie**
2. **Écart travail annoncé ↔ rendu utilisateur réel**
3. **Landing/login encore trop faibles/bavards/insuffisamment premium**
4. **Bibliothèque techniquement propre mais éditorial/tri médiocre**
5. **MCP/RAG/LLM annoncés "branchés" mais pas assez utiles en vrai**
6. **Trop validations basées sur 200/307/health, pas assez sur usage réel**
7. **Tendance "sign-off" sur sujets partiellement vérifiés**

---

## LIVRABLES OBLIGATOIRES

### 1. Rapport maître structuré
- [ ] `docs/WINDSURF_SECOND_PASS_AUDIT.md`

### 2. Journal des écarts Claude → réalité
- [ ] `docs/CLAUDE_GAP_MATRIX.md`

### 3. Backlog final priorisé
- [ ] `docs/POST_AUDIT_BACKLOG.md`
  - P0 bloquant
  - P1 critique
  - P2 important
  - P3 amélioration

### 4. Rapport validation production
- [ ] `docs/PRODUCTION_ACCEPTANCE_REPORT.md`

---

## VERDIT FINAL AUTORISÉ

Un seul état autorisé :

### ÉTAT A — GO total
Produit réellement propre, cohérent, connecté, testé, déployé, crédible.

### ÉTAT B — GO avec réserves mineures
Produit exploitable, mais avec quelques points non bloquants explicitement listés.

### ÉTAT C — NO-GO
Blocages sérieux restant à corriger avant exploitation.

**Interdits :** "globalement bon", "presque prêt", "ça peut aller"

---

## INSTRUCTION FINALE

> **Exécuter ce cahier des charges jusqu'au bout**
> 
> - Vérifier
> - Corriger
> - Tester  
> - Déployer si nécessaire
> - Valider
> - Puis rendre verdict final sérieux

**NE PAS S'ARRÊTER à :**
- Simple audit
- Rapport seulement  
- Liste de constats

---

## STATUT D'EXÉCUTION

*Dernière mise à jour : [DATE]*
*Phase en cours : [PHASE]*
*Prochaine action : [ACTION]*
