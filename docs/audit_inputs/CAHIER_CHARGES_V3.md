# Cahier des charges — Seconde passe exhaustive après Claude

## Projet : Nexus Réussite EAF

## Mission : Audit, vérification, correction, amélioration, sign-off réel

## 0. Principe directeur

Tu repars du principe suivant :

**aucun rapport de Claude n’est considéré comme vrai tant qu’il n’est pas revalidé factuellement.**

Tu ne dois pas te contenter de lire ses rapports ni de supposer que les tâches ont été correctement réalisées.
Tu dois :

1. **vérifier** chaque affirmation importante ;
2. **détecter** les contradictions, approximations, oublis et faux positifs ;
3. **corriger** réellement le code, la configuration, les données, les workflows, le déploiement et la production ;
4. **tester** jusqu’à éliminer tout angle mort ;
5. **livrer un verdict final sérieux**, avec preuves.

Je veux une seconde passe **plus rigoureuse que la première**.

---

# 1. Objectif global

Tu dois effectuer une **revue complète, corrective et durcissante** de la plateforme EAF sur tous les axes suivants :

* frontend public ;
* frontend connecté ;
* UI/UX ;
* copywriting et qualité du français ;
* design system ;
* dark mode ;
* login / auth / sessions ;
* bibliothèque et ressources ;
* freemium gating ;
* RAG ;
* LLM ;
* orchestration agentique ;
* MCP servers ;
* profil élève / mémoire / historique ;
* workflows pédagogiques ;
* performance / cache / coûts LLM ;
* API / endpoints ;
* tests unitaires, intégration, e2e, visual QA ;
* CI/CD ;
* déploiement et production ;
* cohérence Git / GitHub / branches / PR / commits ;
* sécurité opérationnelle.

---

# 2. Positionnement attendu

Tu agis comme :

* un **lead engineer** ;
* un **architecte produit** ;
* un **auditeur QA** ;
* un **relecteur UX/UI exigeant** ;
* un **responsable de la qualité pédagogique** ;
* un **responsable mise en production**.

Tu ne dois pas adopter une posture de simple exécutant docile.
Tu dois signaler ce qui est :

* faux,
* fragile,
* inachevé,
* trompeur,
* non prouvé,
* non cohérent,
* acceptable,
* bon,
* excellent.

---

# 3. Méthode imposée

## 3.1. Règle d’or

Toute affirmation doit être classée dans l’une des catégories suivantes :

* **Confirmée**
* **Partiellement vraie**
* **Fausse**
* **Obsolète**
* **Non prouvée**
* **Corrigée**
* **Encore problématique**

## 3.2. Format de contrôle obligatoire

Pour chaque sujet important, tu dois produire :

* **affirmation initiale de Claude** ;
* **constat réel après vérification** ;
* **preuve** ;
* **écart** ;
* **action corrective** ;
* **résultat après correction**.

## 3.3. Interdiction

Tu ne dois pas produire un rapport “optimiste” ou “déclaratif”.
Tu ne dois jamais écrire des phrases du type :

* “semble correct” ;
* “probablement bon” ;
* “ça devrait fonctionner” ;
* “prêt si nécessaire”.

Je veux des **preuves**, des **tests**, des **captures de résultat**, des **diffs**, des **logs**, des **états git**, des **retours d’API**, des **pages réellement servies**, des **vérifications de production**.

---

# 4. Livrables obligatoires

Tu dois produire **tous** les éléments suivants :

## 4.1. Un rapport maître structuré

Nom recommandé :
`docs/WINDSURF_SECOND_PASS_AUDIT.md`

## 4.2. Un journal des écarts Claude → réalité

Nom recommandé :
`docs/CLAUDE_GAP_MATRIX.md`

Contenu :

* affirmation ;
* source ;
* statut réel ;
* correction appliquée ;
* commit / PR associé.

## 4.3. Un backlog final priorisé

Nom recommandé :
`docs/POST_AUDIT_BACKLOG.md`

Priorités :

* P0 bloquant
* P1 critique
* P2 important
* P3 amélioration

## 4.4. Un rapport de validation production

Nom recommandé :
`docs/PRODUCTION_ACCEPTANCE_REPORT.md`

## 4.5. Si nécessaire, des PR propres

Tu gères toi-même :

* branches,
* commits,
* PR,
* merge,
* nettoyage,
* synchronisation locale,
* déploiement.

---

# 5. Périmètre exhaustif à recontrôler

---

## PHASE A — AUDIT GIT / GITHUB / HISTORIQUE / SOURCE DE VÉRITÉ

Tu dois reconstituer la vérité exacte du projet.

### À vérifier :

1. branche courante réelle ;
2. relation avec `origin/main` ;
3. branches résiduelles ;
4. PR ouvertes, mergées, fermées ;
5. commits réellement fusionnés ;
6. éventuelles contradictions entre rapports et état git ;
7. divergence entre local, remote et production ;
8. historique des lots 2→14 et des correctifs ultérieurs ;
9. état réel des fichiers untracked ;
10. absence de pollution hors périmètre.

### Exigences :

* déterminer quelle branche est réellement la source de vérité ;
* dire si Claude a réellement mergé ce qu’il dit avoir mergé ;
* dire si certaines affirmations de déploiement ont été faites alors que le code n’était pas sur `main` ;
* clarifier définitivement le SHA réellement servi.

### Livrable attendu :

un tableau propre :

* dépôt,
* branche,
* HEAD local,
* origin/main,
* commit servi en prod,
* état des PR,
* contradictions relevées.

---

## PHASE B — AUDIT DÉPLOIEMENT ET PRODUCTION

Tu dois vérifier l’état réel de la production, pas celui annoncé dans les rapports.

### À auditer :

* Nginx ;
* PM2 ;
* Docker ;
* ports ;
* health endpoints ;
* build réellement servi ;
* variables d’environnement de prod ;
* Redis ;
* PostgreSQL ;
* RAG external ;
* MCP server ;
* volumes montés ;
* droits `.env` ;
* secure cookies ;
* CSP ;
* HSTS ;
* suppression de `X-Powered-By` ;
* port fantôme / conteneurs zombies ;
* services dupliqués.

### Exigences :

* aucune ambiguïté entre app PM2 et conteneur docker ;
* aucun service fantôme ;
* aucun faux “healthy” ;
* aucun rate limiter fail-closed qui casse l’auth ;
* aucune URL localhost embarquée dans les bundles client ;
* aucune variable dev résiduelle en prod.

### Tu dois vérifier :

* le HTML réellement servi ;
* les bundles JS ;
* le `buildTime` ;
* le SHA ;
* les entêtes ;
* les cookies ;
* les redirections ;
* la persistance au reboot ;
* les restart policies.

---

## PHASE C — FRONTEND PUBLIC : LANDING / LOGIN / PRICING / CGU / CONFIDENTIALITÉ / CONTACT

Tu dois refaire une **revue éditoriale, visuelle et produit** de toutes les pages publiques.

### Pages :

* `/`
* `/login`
* `/pricing`
* `/contact`
* `/cgu`
* `/politique-de-confidentialite`
* `/mentions-legales`
* alias français éventuels (`/connexion`, `/inscription`, `/tarifs`)

### À vérifier :

* wording ;
* cohérence du ton ;
* disparition totale du jargon technique ;
* qualité pédagogique ;
* crédibilité commerciale ;
* clarté des CTA ;
* hiérarchie des headings ;
* cohérence des cartes, sections, contrastes, icônes ;
* lisibilité mobile et desktop ;
* absence de textes “produit-interne” ;
* qualité du français ;
* cohérence du tutoiement / vouvoiement ;
* correction typographique.

### Points à surveiller explicitement :

* termes comme RAG, OCR, cockpit, onboarding, feedback, workflow, CSRF, 200k/jour ;
* placeholders non crédibles ;
* textes méta laissés par erreur ;
* sections FAQ incomplètes ou paresseuses ;
* promesses produit mal calibrées ;
* mauvais ordre de CTA ;
* sections trop bavardes ou trop abstraites ;
* design premium réel, pas seulement “propre”.

### Exigence :

tu dois juger la qualité finale comme un produit commercial destiné :

* à l’élève,
* aux parents,
* aux enseignants.

---

## PHASE D — FRONTEND CONNECTÉ : DASHBOARD / PROFIL / PARCOURS / CARNET / TUTEUR / QUIZ / ATELIERS

Tu dois vérifier les pages connectées avec un vrai compte test.

### Pages minimales :

* `/dashboard`
* `/profil`
* `/mon-parcours`
* `/carnet`
* `/tuteur`
* `/quiz`
* `/atelier-ecrit`
* `/atelier-oral`
* `/atelier-langue`
* `/bibliotheque`

### À vérifier :

* rendu réel après connexion ;
* cohérence visuelle avec le design system ;
* logique de navigation ;
* libellés et microcopies ;
* chargements ;
* empty states ;
* error states ;
* transitions ;
* comportements sur quotas ;
* messages de verrouillage ;
* présence ou non de jargon ;
* pertinence du vocabulaire ;
* fluidité des enchaînements.

### Exigence :

Je ne veux aucun écran “techniquement fonctionnel mais produit médiocre”.

---

## PHASE E — AUTH / LOGIN / SESSIONS / REDIRECTIONS / RATE LIMIT

Tu dois auditer entièrement l’authentification.

### À tester :

* mauvais identifiants ;
* bons identifiants ;
* inscription ;
* retour après login ;
* redirects avec `redirect=` ;
* logout ;
* comportement sans Redis ;
* comportement avec Redis ;
* cookies session ;
* flags Secure / HttpOnly / SameSite ;
* comportement mobile ;
* erreurs utilisateur ;
* validation formulaire ;
* autoComplete ;
* CSRF si applicable ;
* reset password s’il existe.

### Exigence :

* plus jamais de boucle d’auth ;
* plus jamais de 429 injustifié sur login ;
* retour exact au bon écran ;
* UX de login crédible et sans friction.

---

## PHASE F — DESIGN SYSTEM / UI KIT / DARK MODE / THÈME

Tu dois vérifier si la refonte design rapportée par Claude a été réellement correctement livrée.

### À contrôler :

* tokens light/dark ;
* composants UI partagés ;
* usages réels des composants ;
* classes hardcodées restantes ;
* cohérence des rayons / shadows / spacing ;
* thème système / clair / sombre ;
* persistence du choix ;
* FOUC ;
* transition de thème ;
* sidebar theme switch ;
* mobile theme switch ;
* pages encore incohérentes ;
* composants transverses ;
* contrastes réels.

### Exigence :

si le dark mode n’est pas réellement bon, tu le dis.
Si certains composants sont seulement “passables”, tu le dis.

Je veux une appréciation honnête :

* excellent,
* bon,
* médiocre,
* à refaire.

---

## PHASE G — BIBLIOTHÈQUE / RESSOURCES / UX PRODUIT / TITRAGE / MAPPINGS

C’est un axe critique.

Tu dois refaire toute la validation de la bibliothèque **comme un vrai produit**.

### 1. Source de vérité

Tu dois clarifier définitivement :

* combien de ressources réelles existent ;
* combien sont indexées ;
* combien sont servies ;
* combien sont vidéos, PDF, rapports, œuvres, documents ;
* quels fichiers ont été exclus volontairement ;
* quelles entrées du scan sont orphelines ;
* quels fichiers existent sans être exposés.

### 2. Organisation éditoriale

Tu dois :

* revoir les titres ;
* détecter les titres médiocres, garbled, techniques, vides, ambigus, peu pédagogiques ;
* les corriger ;
* uniformiser les chartes de nommage ;
* ajouter auteur / année / nature si nécessaire ;
* numéroter proprement les doublons ;
* rendre les titres lisibles pour un élève.

### 3. Association frontend ↔ fichier réel

Pour chaque catégorie, tu dois échantillonner et vérifier :

* carte affichée ;
* titre ;
* catégorie ;
* état gratuit / verrouillé ;
* chemin ressource ;
* fichier réel ;
* endpoint réel ;
* MIME ;
* visionnage ;
* téléchargement.

Je veux une **correspondance propre** entre :

* dossier `/srv/eaf_ressources`,
* `ressources-scan.json`,
* catalogue TS/JSON,
* frontend.

### 4. Visionnage / téléchargement

Tu dois tester réellement :

* preview PDF ;
* preview vidéo ;
* rapport de jury ;
* doc/ppsx si conservés ;
* téléchargement forcé `?download=1` ;
* range requests ;
* auth ;
* traversal ;
* symlink ;
* null byte ;
* 404.

### 5. Qualité de la sélection gratuite Freemium

Point non négociable.

Tu dois **vérifier et améliorer** la sélection des ressources gratuites.

Je ne veux pas un tri alphabétique bête.
Je veux un **tri éditorial pertinent**.

Tu dois t’assurer que les ressources gratuites sont :

* utiles ;
* représentatives ;
* pédagogiquement pertinentes ;
* immédiatement exploitables pour un élève de Première.

Si les ressources gratuites actuelles ne sont pas les bonnes, tu corriges réellement l’ordre ou la logique.

### 6. Verrouillage premium

Tu dois vérifier :

* grisage réel ;
* badge verrouillé ;
* cadenas ;
* message explicatif ;
* CTA “booster le plan” ou équivalent ;
* cohérence du ton ;
* absence de frustration inutile ;
* absence de flash of unlocked content ;
* cohérence backend/frontend.

### 7. Exigence finale sur la bibliothèque

Je veux que la bibliothèque soit :

* crédible ;
* propre ;
* élégante ;
* cohérente ;
* commercialement défendable ;
* pédagogiquement utile.

---

## PHASE H — RAG / LLM / ORCHESTRATION / PERTINENCE DES AGENTS

Tu dois vérifier tout le système agentique **en réel**, pas seulement par lecture de code.

### 1. RAG

À contrôler :

* santé ;
* collection ;
* nombre de chunks réel ;
* schéma de réponse ;
* contrat API ;
* recherche directe ;
* pertinence des hits ;
* scores ;
* qualité des excerpts ;
* filtres low-score ;
* stop words ;
* fusion lexical/vector/external ;
* fallback ;
* temps de réponse ;
* cache RAG.

### 2. LLM routing

À contrôler :

* tiers réellement configurés ;
* cascade réelle des providers ;
* circuit breaker ;
* erreurs ;
* downgrade ;
* coûts ;
* tiers surdimensionnés ;
* opportunités de reclassification ;
* prompts trop longs ;
* répétitions ;
* coûts inutiles.

### 3. Orchestrateur

À contrôler :

* composition du prompt ;
* contexte mémoire ;
* contexte élève ;
* RAG injecté ;
* media injectés ;
* taille totale ;
* duplication d’informations ;
* appels séquentiels évitables ;
* latence.

### 4. Réponses réelles

Tu dois poser de vraies questions :

* tuteur ;
* quiz ;
* éventuellement oral.

Je veux vérifier :

* adaptation au niveau ;
* prise en compte de la voie ;
* prise en compte des œuvres ;
* prise en compte du J-XX ;
* ton ;
* qualité pédagogique ;
* citations ;
* structure ;
* refus anti-triche ;
* rendu élève.

### 5. Exigence

Je veux un produit réellement pertinent, pas juste connecté.

---

## PHASE I — PROFIL ÉLÈVE / MÉMOIRE / HISTORIQUE / PERSONNALISATION

Tu dois vérifier si la plateforme exploite réellement le profil élève.

### À contrôler :

* classLevel ;
* voie ;
* selectedOeuvres ;
* eafDate ;
* weakSkills ;
* globalLevel ;
* avgOralScore ;
* avgEcritScore ;
* workMastery ;
* historique utile ;
* recentSessions ;
* targetScore ;
* personaPreference ;
* weeklyGoalMinutes.

### Je veux savoir :

* ce qui est collecté ;
* ce qui est stocké ;
* ce qui est réellement chargé ;
* ce qui est réellement injecté dans les prompts ;
* ce qui est réellement visible côté UI ;
* ce qui est encore du faux-semblant.

### Exigence :

si certaines données existent en DB mais ne servent pas, tu le dis et tu proposes la correction.
Si certaines données devraient être collectées mais ne le sont pas, tu le signales proprement.

---

## PHASE J — MCP SERVERS / OUTILS / CÂBLAGE / UTILITÉ RÉELLE

Tu dois auditer le MCP de manière rigoureuse.

### À vérifier :

* nombre réel d’outils ;
* nombre d’outils réellement exposés ;
* nombre d’outils réellement appelés ;
* nombre de stubs ;
* scopes ;
* permissions ;
* auth ;
* reachability depuis l’app ;
* bindHost ;
* PM2/systemd ;
* résilience au reboot ;
* santé réelle ;
* latence ;
* logs ;
* nombre d’outils morts ;
* nombre d’outils utiles mais non câblés.

### Exigence :

Tu dois distinguer clairement :

* **actif et utilisé** ;
* **actif mais non utilisé** ;
* **implémenté mais sans call site** ;
* **stub** ;
* **legacy** ;
* **à supprimer** ;
* **à garder pour roadmap**.

Je ne veux pas de chiffres approximatifs ni hardcodés.

---

## PHASE K — PERFORMANCE / CACHES / COÛTS / LATENCE

Tu dois reprendre toutes les optimisations annoncées et les revalider.

### À vérifier :

* cache profil ;
* cache RAG ;
* TTL ;
* invalidation ;
* fire-and-forget ;
* parallélisation ;
* appels séquentiels évités ;
* estimation de tokens ;
* taille des prompts ;
* extraits RAG ;
* prefetch ;
* coût par appel ;
* coût mensuel estimé ;
* optimisation possible des skills ;
* gains mesurés ou estimés.

### Exigence :

* pas seulement “c’est plus rapide” ;
* je veux les hotspots réels ;
* les gains plausibles ;
* les risques ;
* les régressions possibles ;
* les prochaines optimisations sérieuses.

---

## PHASE L — TESTS / QUALITÉ / ZÉRO ANGLE MORT

Tu dois recontrôler tout le dispositif de tests.

### À couvrir :

* unitaires ;
* intégration ;
* API ;
* endpoint ;
* middleware ;
* auth ;
* bibliothèque ;
* RAG ;
* MCP si testable ;
* e2e ;
* smoke tests ;
* visual regression si encore pertinente.

### Exigences :

* aucun test échoué ignoré ;
* aucun skip opportuniste non justifié ;
* aucun angle mort caché ;
* si un test est faux ou obsolète, il faut le corriger ;
* si un test manque, tu l’ajoutes ;
* si un comportement produit critique n’est pas testé, tu ajoutes le test.

Je veux un état final du type :

* X fichiers de test ;
* Y tests ;
* 0 échec ;
* 0 erreur TS ;
* build clean.

---

## PHASE M — CI/CD / GITHUB ACTIONS / CHECKS VERTS

Tu dois vérifier que la CI est réellement robuste et propre.

### À contrôler :

* workflows ;
* gates ;
* audit sécurité ;
* lint ;
* typecheck ;
* tests ;
* build ;
* CodeQL si présent ;
* checks post-merge ;
* échecs préexistants masqués ;
* secrets de CI ;
* gates conditionnels ;
* cohérence entre PR et main.

### Exigence :

Aucun “CI verte sauf…”.
Tout ce qui relève du périmètre doit être corrigé réellement.

---

## PHASE N — SÉCURITÉ OPÉRATIONNELLE

Tu dois revalider :

* CSP sur toutes les routes ;
* nonce ;
* HSTS ;
* suppression de `X-Powered-By` ;
* cookies sécurisés ;
* CSRF ;
* path traversal ;
* symlink ;
* null byte ;
* auth guard ;
* rate limiting ;
* Redis ;
* SSRF ;
* SQLi ;
* logs sensibles ;
* health endpoints trop bavards ;
* variables exposées ;
* permissions fichiers ;
* survivabilité après reboot.

### Exigence :

si une faille d’info disclosure existe encore, tu la corriges réellement.

---

## PHASE O — QUALITÉ DU FRANÇAIS ET QUALITÉ ÉDITORIALE

Tu dois faire une dernière passe **éditoriale professionnelle** sur tout ce qui est visible par l’utilisateur.

### À auditer :

* landing ;
* login ;
* pricing ;
* bibliothèque ;
* dashboard ;
* tuteur ;
* quiz ;
* messages d’erreur ;
* gating ;
* notifications ;
* labels ;
* FAQ ;
* dashboard parent ;
* mentions ;
* textes des cartes ;
* CTA ;
* placeholders ;
* statuts ;
* modals ;
* titres de ressources.

### À corriger :

* jargon ;
* anglicismes ;
* formulations internes ;
* phrases abstraites ;
* tutoiement/vouvoiement incohérent ;
* apostrophes ;
* accents ;
* espaces insécables ;
* titres laids ;
* textes peu naturels ;
* labels imprécis.

---

# 6. Compte(s) de test : obligation d’exécution réelle

Tu ne me redemandes pas un compte si tu peux l’obtenir ou le créer proprement.

Tu dois :

* utiliser un compte existant si disponible ;
* sinon en créer un ;
* sinon créer un compte technique propre.

Et tu dois documenter :

* email,
* plan,
* état onboarding,
* œuvres sélectionnées,
* rôle,
* maintien ou suppression après audit.

---

# 7. Gestion GitHub : autonomie complète

Tu gères toi-même :

* branches de correction ;
* commits propres ;
* push ;
* PR ;
* merge ;
* suppression de branche ;
* resynchronisation de `main` ;
* vérification post-merge ;
* redeploy si nécessaire.

Je ne veux pas d’étape laissée “à faire plus tard” si elle peut être faite maintenant.

---

# 8. Interdits

Tu ne dois pas :

* masquer un problème derrière une formulation douce ;
* classer en “non bloquant” quelque chose qui détériore réellement le produit ;
* ignorer un test cassé ;
* laisser des incohérences de données ou de catalogue ;
* laisser des textes pauvres ou jargonneux ;
* conclure trop tôt ;
* t’arrêter à un simple rapport.

---

# 9. Points de vigilance issus de la déception actuelle

Tu dois être particulièrement sévère sur ces points, car c’est là que la confiance a été entamée :

1. **écart entre rapports et réalité servie** ;
2. **écart entre travail annoncé et rendu utilisateur réel** ;
3. **landing et login encore trop faibles, trop bavards ou insuffisamment premium** ;
4. **bibliothèque techniquement propre mais potentiellement encore médiocre en éditorial/tri** ;
5. **MCP / RAG / LLM annoncés comme “branchés” mais pas forcément assez utiles en vrai** ;
6. **trop de validations basées sur 200/307/health, pas assez sur usage réel** ;
7. **tendance à présenter en “sign-off” des sujets encore partiellement vérifiés**.

Je veux que tu corriges cette faiblesse méthodologique.

---

# 10. Forme du rapport final attendue

Ton rapport final doit impérativement comporter ces sections :

1. Résumé exécutif
2. Matrice des écarts Claude → réalité
3. État Git / GitHub / branches / PR / merge / SHA réellement servi
4. Audit production et déploiement
5. Comptes de test utilisés
6. Validation auth connectée réelle
7. Audit UI/UX public réel
8. Audit UI/UX connecté réel
9. Bibliothèque : audit éditorial, mapping, preview, download, freemium, verrouillage
10. Validation RAG / LLM / orchestration / prompts / pertinence
11. Validation MCP / câblage / utilité / backlog réel
12. Profil élève / mémoire / personnalisation réelle
13. Performance / caches / latence / coûts
14. Tests / couverture / non-régression
15. Sécurité
16. Corrections réellement appliquées
17. Déploiement final / post-déploiement
18. Reliquats réels
19. Verdict final

---

# 11. Verdict final autorisé

Tu dois conclure par un seul de ces états :

## ÉTAT A — GO total

Produit réellement propre, cohérent, connecté, testé, déployé, crédible.

## ÉTAT B — GO avec réserves mineures

Produit exploitable, mais avec quelques points non bloquants explicitement listés.

## ÉTAT C — NO-GO

Blocages sérieux restant à corriger avant exploitation.

Tu n’utilises pas “globalement bon”, “presque prêt”, “ça peut aller”.

---

# 12. Instruction finale à exécuter

Tu exécutes maintenant ce cahier des charges **jusqu’au bout**.

Tu ne t’arrêtes ni à un audit, ni à un rapport, ni à une simple liste de constats.

Tu dois :

* vérifier,
* corriger,
* tester,
* déployer si nécessaire,
* valider,
* puis rendre un verdict final sérieux.

