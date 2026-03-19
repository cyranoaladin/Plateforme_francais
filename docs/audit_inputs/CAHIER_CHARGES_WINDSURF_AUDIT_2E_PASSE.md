# Cahier des charges — deuxième passe Windsurf
## Audit exhaustif, vérification indépendante, corrections, durcissement et remise à niveau du dépôt `Plateforme_francais`

## 1. Objet de la mission

Tu reprends **intégralement** le travail déjà réalisé sur la plateforme **Nexus Réussite EAF** avec un objectif simple :

- **ne rien croire sur parole** ;
- **vérifier par le code, les tests, les builds, les workflows CI, le comportement réel et la production** ;
- **corriger immédiatement** tout écart, toute incohérence, toute régression, tout wording maladroit, toute promesse non tenue ;
- **durcir la plateforme** jusqu’à obtenir un résultat **fonctionnel, propre, cohérent, commercialement crédible, pédagogiquement pertinent et techniquement défendable**.

Le but n’est **pas** de produire un nouveau rapport flatteur.
Le but est de produire une **contre-expertise indépendante**, de relever les écarts éventuels laissés par Claude, de **les réparer réellement**, puis de **prouver** que tout fonctionne.

Tu dois travailler comme un **lead engineer + QA lead + product auditor + reviewer pédagogique**.

---

## 2. Règles non négociables

1. **Aucune affirmation sans preuve.**
   - Si tu affirmes qu’une fonctionnalité existe, tu cites le fichier, le composant, la route, l’endpoint, le test, le workflow, ou la preuve runtime.
   - Si tu affirmes qu’un point est déployé, tu le prouves par build, SHA, health check, réponse HTTP, DOM servi, ou capture reproductible.

2. **Aucun angle mort.**
   - Toute page, tout endpoint, tout flux critique, tout test cassé, toute route protégée, tout bouton important, tout connecteur LLM/RAG/MCP, toute logique de quota, toute partie bibliothèque doit être inspectée.

3. **Aucun test échoué ne doit être ignoré.**
   - Pas de “on skippe et on verra plus tard” sans justification précise.
   - Pas de `--no-verify`, pas de force push, pas de contournement silencieux.
   - Tout test cassé doit être **corrigé réellement**, ou documenté comme dépendance externe strictement justifiée.

4. **Ne jamais confondre “le code existe” avec “la fonctionnalité fonctionne”.**
   - Il faut vérifier le code **et** l’exécution réelle.

5. **Le résultat attendu est business-ready.**
   - Pas seulement “ça compile”.
   - L’élève doit pouvoir utiliser la plateforme **sans friction**, sans wording incompréhensible, sans faux verrou, sans bug d’auth, sans décalage entre UI et données, sans ressources cassées.

---

## 3. Source de vérité à retenir

La seule source de vérité acceptable est l’ensemble suivant, dans cet ordre :

1. **Le code réellement présent sur la branche audité**e.
2. **Les tests réellement présents dans le dépôt**.
3. **Les workflows GitHub Actions réellement exécutés**.
4. **Le comportement runtime réel** en local et, si pertinent, en environnement déployé.
5. **Le contenu réellement servi au navigateur**.

Ne prends jamais pour acquis :
- un rapport précédent,
- une assertion narrative,
- un intitulé de commit,
- une documentation non vérifiée,
- une valeur annoncée dans un README si le code contredit cette valeur.

---

## 4. Inventaire confirmé à reprendre et revérifier

### 4.1 Structure générale du dépôt
À revérifier réellement dans le dépôt :

- `.github/workflows`
- `docs`
- `packages/mcp-server`
- `prisma`
- `public`
- `scripts`
- `src`
- `tests`
- `package.json`
- `vitest.config.ts`
- `playwright.config.ts`
- `playwright.visual.config.ts`
- `middleware.ts`
- `next.config.ts`
- `ecosystem.config.cjs`

### 4.2 Pages / modules applicatifs visibles dans `src/app`
À re-cartographier et revalider :

- landing `/`
- `/login`
- `/pricing`
- `/contact`
- `/dashboard`
- `/tuteur`
- `/quiz`
- `/atelier-ecrit`
- `/atelier-langue`
- `/atelier-oral`
- `/bibliotheque`
- `/carnet`
- `/descriptif`
- `/profil`
- `/onboarding`
- `/mon-parcours`
- `/parent`
- `/enseignant`
- `/paiement/*`
- pages légales
- alias FR éventuels (`/connexion`, `/inscription`, `/tarifs`)

### 4.3 Familles de tests confirmées
À re-vérifier réellement, fichier par fichier.

#### E2E connus
- `tests/e2e/descriptif-carnet.spec.ts`
- `tests/e2e/flows.spec.ts`
- `tests/e2e/navigation.spec.ts`
- `tests/e2e/payment-flow.spec.ts`
- `tests/e2e/platform.spec.ts`

#### Intégration connus
- `tests/integration/oral-session-flow.test.ts`
- `tests/integration/orchestrator-pipeline.test.ts`
- `tests/integration/rag-pipeline.test.ts`
- `tests/integration/router-agent.test.ts`

#### Unitaires : domaines confirmés
Sous-répertoires à inventorier **exhaustivement** :
- `tests/unit/agents`
- `tests/unit/api`
- `tests/unit/billing`
- `tests/unit/compliance`
- `tests/unit/data`
- `tests/unit/gamification`
- `tests/unit/llm`
- `tests/unit/memory`
- `tests/unit/notifications`
- `tests/unit/onboarding`
- `tests/unit/oral`
- `tests/unit/parent`
- `tests/unit/pdf`
- `tests/unit/portfolio`
- `tests/unit/queue`
- `tests/unit/rag`
- `tests/unit/rgpd`
- `tests/unit/security`
- `tests/unit/skills`
- `tests/unit/spaced-repetition`
- `tests/unit/store`
- `tests/unit/validation`

#### Fichiers unitaires de premier niveau confirmés
- `tests/unit/badges.test.ts`
- `tests/unit/billing-gating.test.ts`
- `tests/unit/correcteur.test.ts`
- `tests/unit/cost-tracker-v2.test.ts`
- `tests/unit/langue-evaluation.test.ts`
- `tests/unit/mcp-client.test.ts`
- `tests/unit/mistral-ocr.test.ts`
- `tests/unit/mistral-router-v2.test.ts`
- `tests/unit/oral-session.test.ts`
- `tests/unit/orchestrator.test.ts`
- `tests/unit/policy-gate-tunisia.test.ts`
- `tests/unit/rag-search.test.ts`
- `tests/unit/rappel-agent-mcp.test.ts`
- `tests/unit/spaced-repetition.test.ts`
- `tests/unit/upload-copie.test.ts`
- `tests/unit/vector-search.test.ts`

#### Visuels
À revérifier dans `tests/visual` :
- `auth.setup.ts`
- `visual-regression.spec.ts`
- `connected-visual.spec.ts`
- `mobile-visual.spec.ts`
- snapshots éventuels

### 4.4 Scripts de test déclarés dans `package.json`
À vérifier et exécuter réellement :

- `test`
- `test:unit`
- `test:e2e`
- `test:all`
- `test:contracts`
- `test:contracts:auth`
- `test:contracts:teacher-rbac`
- `test:contracts:teacher-comment-rbac`
- `test:contracts:teacher-export-rbac`
- `test:mutation`
- `mcp:test`
- `test:visual`
- `test:visual:update`
- `test:visual:public`
- `test:visual:connected`
- `test:visual:mobile`

### 4.5 Workflows GitHub Actions confirmés
À auditer intégralement :

- `.github/workflows/ci.yml`
- `.github/workflows/ci-cd.yml`

Vérifier notamment les gates suivants :
- static analysis
- TypeScript
- ESLint
- CSRF audit
- npm audit / audit-ci
- knip
- unit tests
- integration tests
- contract tests
- E2E Playwright
- security scan
- CodeQL
- performance tests (Artillery)
- OWASP ZAP
- mutation tests
- deploy staging
- deploy production
- post-deploy monitoring

---

## 5. Mission Windsurf — livrable attendu

Tu dois produire une **matrice exhaustive de couverture** avec, pour chaque surface :

- module / page / route / endpoint / service ;
- rôle fonctionnel ;
- tests existants (unit / integration / e2e / visual / contract) ;
- statut réel ;
- preuves ;
- écarts trouvés ;
- corrections appliquées ;
- angle mort restant éventuel ;
- décision finale : OK / À corriger / Backlog / Bloquant.

Le résultat attendu est un audit de type :

| Surface | Type | Couverture existante | Vérification runtime | Écart | Action | Statut |
|---|---|---|---|---|---|---|

Tu ne dois pas rester au niveau narratif. Tu dois livrer une **matrice opérationnelle**.

---

## 6. Checklist opérationnelle à exécuter point par point

# 6.1 Préparation locale

```bash
git fetch --all --prune
git checkout main
git pull --ff-only
node -v
npm -v
npm ci
npx prisma generate
```

Vérifier :
- absence de modifications locales parasites ;
- version de Node cohérente ;
- installation propre ;
- workspaces OK ;
- package MCP installable ;
- Prisma généré sans erreur.

---

# 6.2 Inventaire exhaustif des tests

Produire l’inventaire **réel**, pas supposé.

```bash
find tests -type f | sort
find tests/unit -type f | sort
find tests/integration -type f | sort
find tests/e2e -type f | sort
find tests/visual -type f | sort 2>/dev/null || true
```

Puis établir :
- le **nombre exact** de fichiers par famille ;
- le **nombre exact** de tests par famille ;
- les tests qui ciblent directement l’auth, la navigation, la bibliothèque, le RAG, le LLM, le MCP, le billing, les quotas, les ressources ;
- les zones du code **sans aucun test**.

---

# 6.3 Audit des scripts et workflows

```bash
cat package.json
cat vitest.config.ts
cat playwright.config.ts
cat playwright.visual.config.ts
find .github/workflows -maxdepth 1 -type f | sort
```

Vérifier :
- que chaque script référencé existe réellement ;
- que chaque workflow appelle bien des commandes valides ;
- que les environnements test/CI sont cohérents ;
- que les gates ne mentent pas sur le périmètre couvert ;
- que les services PostgreSQL / Redis / pgvector / MCP nécessaires sont cohérents.

---

# 6.4 TypeScript + lint + build

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run build:ci
cd packages/mcp-server && npx tsc --noEmit && cd -
cd packages/mcp-server && npm test -- --runInBand || true && cd -
```

Règles :
- **0 erreur TypeScript**.
- **0 erreur ESLint**.
- Le build Next doit réussir.
- Le build MCP doit réussir.
- Tout warning important doit être trié : acceptable ou à corriger.

---

# 6.5 Tests unitaires / intégration / MCP

```bash
npm run test:unit
npm run mcp:test
npx vitest run tests/integration
```

Puis :
- relever **toutes** les erreurs ;
- corriger **réellement** ;
- relancer ;
- ne pas conclure tant que ce n’est pas vert.

Si une dépendance externe manque, tu dois :
1. la provisionner proprement,
2. ou la mocker proprement,
3. ou documenter pourquoi elle ne doit pas être dans le scope de la suite.

Mais jamais laisser un échec non traité.

---

# 6.6 Tests de contrats API

```bash
chmod +x tests/contracts/*.sh 2>/dev/null || true
npm run test:contracts
npm run test:contracts:auth
npm run test:contracts:teacher-rbac
npm run test:contracts:teacher-comment-rbac
npm run test:contracts:teacher-export-rbac
```

À vérifier :
- cohérence OpenAPI / endpoints ;
- routes auth ;
- RBAC enseignant ;
- export / commentaires / accès restreints ;
- messages d’erreur en français côté utilisateur.

---

# 6.7 Tests E2E Playwright

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

Tu dois recenser exactement quels scénarios sont testés :

## Navigation
- login
- redirections pages protégées
- sidebar
- pages principales sans 404
- absence d’erreur runtime JS

## Auth
- connexion bons/mauvais credentials
- inscription
- redirection post-login
- session persistante
- logout si présent
- cookies et sécurité si testables

## Onboarding
- progression étapes
- enregistrement données
- œuvres choisies
- date EAF
- redirection finale

## Tuteur
- envoi message
- réponse IA reçue
- absence d’URL brute inutile
- citations / contexte éventuel
- comportement en cas d’erreur LLM

## Quiz
- génération questions
- réponses radio
- validation
- score
- persistance si implémentée

## Atelier oral
- démarrage session
- sélection œuvre
- apparition extrait
- chrono / structure de session
- transitions de phases

## Atelier écrit
- génération sujet
- upload de fichier
- bouton correction
- polling / statut / rendu

## Descriptif
- compteurs
- objets d’étude
- ajout / suppression / sauvegarde
- règles / warnings

## Carnet
- ajout d’entrée
- groupement par œuvre
- export PDF

## Paiement / pricing
- présence des plans
- CTA upgrade
- pages confirmation / refus
- activation code si présent

Toute régression doit être corrigée et rejouée.

---

# 6.8 Tests visuels

```bash
npm run test:visual
npm run test:visual:public
npm run test:visual:connected
npm run test:visual:mobile
```

À vérifier :
- stabilité des screenshots ;
- couverture des pages publiques ;
- couverture des pages connectées ;
- couverture mobile ;
- état de l’auth setup ;
- baselines présentes ou régénérées proprement si nécessaire ;
- aucun snapshot instable laissé sans explication.

---

# 6.9 Audit fonctionnel manuel page par page

Tu dois faire une revue réelle de rendu et de cohérence sur :

## Pages publiques
- `/`
- `/login`
- `/pricing`
- `/contact`
- `/mentions-legales`
- `/cgu`
- `/politique-de-confidentialite`

## Pages connectées
- `/dashboard`
- `/tuteur`
- `/quiz`
- `/atelier-ecrit`
- `/atelier-oral`
- `/atelier-langue`
- `/bibliotheque`
- `/carnet`
- `/descriptif`
- `/profil`
- `/onboarding`
- `/mon-parcours`
- `/parent`
- `/enseignant`

Vérifier systématiquement :
- titres et sous-titres ;
- hiérarchie des headings ;
- clarté du langage ;
- cohérence tu/vous ;
- absence de jargon technique visible à l’élève ;
- qualité UI/UX ;
- cohérence des CTA ;
- états vides ;
- états loading ;
- erreurs ;
- responsive ;
- contrastes ;
- dark mode si présent ;
- accessibilité de base ;
- cohérence pédagogique.

---

# 6.10 Auth, sessions, middleware, cookies, redirections

Audit complet à mener sur :
- middleware ;
- guards ;
- redirection vers login ;
- gestion du paramètre `redirect=` ;
- session après login ;
- cookies secure/httpOnly/sameSite ;
- CSRF public et routes sensibles ;
- rate limiting ;
- comportement Redis up/down ;
- fail-open/fail-closed justifié ;
- routes publiques réelles vs routes déclarées.

À prouver par :
- code,
- tests,
- requêtes HTTP,
- comportement navigateur.

---

# 6.11 RAG / LLM / orchestrateur / MCP

C’est un bloc critique. Tu dois recontrôler **sans indulgence**.

## RAG
Vérifier :
- configuration ;
- URL ;
- token ;
- health ;
- schéma de réponse ;
- recherche vectorielle / lexicale / fusion ;
- filtrage des résultats faibles ;
- cohérence des extraits ;
- taille du contexte injecté ;
- citations rendues côté utilisateur.

## LLM
Vérifier :
- router ;
- tiers ;
- providers ;
- fallback ;
- circuit breaker ;
- coût ;
- temps de réponse ;
- prompts ;
- logique anti-triche ;
- messages d’erreur utilisateur.

## Orchestrateur
Vérifier :
- composition du contexte ;
- mémoire ;
- selectedOeuvres ;
- classLevel ;
- voie ;
- date EAF / J-XX ;
- weakSkills ;
- quality gating ;
- fallbackSkillOutput ;
- JSON structuré ;
- validation Zod.

## MCP
Tu dois :
- lister **tous** les outils réellement définis ;
- lister **tous** les outils réellement appelés ;
- distinguer outils actifs / outils conservés / stubs / dead code ;
- vérifier le bind host ;
- vérifier l’auth ;
- vérifier l’accessibilité depuis l’app ;
- vérifier le transport (stdio / HTTP) ;
- vérifier le health ;
- vérifier la persistance du process (PM2/systemd) ;
- vérifier qu’aucun outil critique annoncé n’est en fait non branché.

---

# 6.12 Performance / caches / coûts

Tu dois refaire la seconde passe perf, mais plus rigoureusement.

## Vérifier réellement
- cache LRU profils ;
- cache LRU RAG ;
- TTL ;
- taille ;
- hit rate Redis ;
- invalidation ;
- parallélisation des requêtes DB ;
- select minimal ;
- appels séquentiels inutiles ;
- tracking coûts LLM ;
- budgets ;
- alertes ;
- Web Vitals ;
- sendBeacon / fallback.

## Exigence
Ne te contente pas de constater. Si tu vois une optimisation évidente et sûre, tu l’appliques.

Exemples de points à vérifier et éventuellement améliorer :
- multiplication des accès profil/memory sur une même requête ;
- appels RAG répétitifs sur des prompts proches ;
- absence de cache sur appels déterministes ;
- contextes LLM trop longs ;
- prompts système redondants ;
- appels coûteux non nécessaires pour de simples flows ;
- absence de mémoïsation sur estimation de tokens ;
- requêtes DB séquentielles évitables ;
- logs trop bavards en production.

L’objectif est une plateforme **rapide et économiquement soutenable**.

---

# 6.13 Bibliothèque / ressources — bloc critique

Ce bloc doit être audité de manière **éditoriale, UX, technique et commerciale**.

## Objectifs
1. Les ressources doivent être **bien organisées** dans le frontend.
2. Chaque ressource affichée doit correspondre à **un fichier réel** et correct dans le dossier ressources.
3. L’utilisateur doit pouvoir **visionner ou télécharger** proprement.
4. Le **freemium** doit être **strictement respecté**.
5. Les ressources non accessibles en FREE doivent être **grisées et clairement verrouillées**.
6. Les titres doivent être **clairs, français, pertinents, pédagogiques**.

## Vérifications obligatoires

### 6.13.1 Mapping catalogue ↔ fichiers
- correspondance exacte frontend ↔ `ressources-scan.json` ↔ fichier physique ;
- zéro chemin mort ;
- zéro doublon incohérent ;
- zéro titre vide ;
- zéro ressource orpheline ;
- zéro ressource hors programme si elle ne doit pas être visible.

### 6.13.2 Consultation / téléchargement
- preview PDF ;
- lecture vidéo ;
- support `Range` ;
- mode téléchargement ;
- types MIME ;
- comportement sans session ;
- erreurs 401/403/404 propres ;
- path traversal bloqué ;
- symlinks et null bytes bloqués.

### 6.13.3 Organisation éditoriale
- catégories pertinentes ;
- titres nettoyés ;
- auteurs présents quand ils doivent l’être ;
- années si utiles ;
- re-tri des ressources gratuites pour qu’elles soient vraiment utiles à un élève ;
- pas de documents administratifs absurdes dans le top free si on peut l’éviter.

### 6.13.4 Freemium
- vérification du total ;
- vérification du nombre free par catégorie ;
- vérification du pourcentage réel ;
- vérification du gating serveur ;
- vérification du rendu frontend :
  - carte grisée,
  - cadenas,
  - badge Premium,
  - message explicatif,
  - CTA vers `/pricing`.

### 6.13.5 Recherche bibliothèque
- recherche textuelle ;
- recherche dite “intelligente” si branchée ;
- état vide ;
- filtres ;
- compteurs ;
- cohérence du résultat avec les ressources réellement présentes.

---

# 6.14 Pédagogie et qualité élève

Tu dois juger le produit non seulement comme ingénieur, mais comme correcteur et concepteur pédagogique.

À vérifier :
- qualité du langage adressé à l’élève ;
- absence de jargon interne ;
- cohérence avec l’EAF ;
- adaptation au niveau ;
- barèmes officiels ;
- aide méthodologique réelle ;
- refus anti-triche bien formulé ;
- citations et corpus ;
- feedback utile ;
- continuité entre diagnostic, production, correction et relance ;
- qualité des documents produits (PDF, corrections, rapports) ;
- qualité des rendus JSON → UI.

Le produit doit être **utile à un élève**, **rassurant pour un parent**, et **crédible pour un enseignant**.

---

# 6.15 Sécurité et robustesse

Vérifier et corriger si nécessaire :
- CSRF ;
- CSP ;
- nonce CSP ;
- X-Powered-By supprimé ;
- headers HSTS ;
- cookies Secure ;
- secrets non commités ;
- permissions `.env` ;
- Redis actif au boot ;
- PM2 / restart policies ;
- service MCP persistant ;
- DB correcte ;
- port bindings corrects ;
- absence de process fantôme ;
- absence de build fantôme ;
- health routes non bavardes ;
- pas de fuite d’URL ou de secrets dans des endpoints de health.

---

## 7. Commandes de contrôle recommandées

### Git / état dépôt
```bash
git status
git branch -vv
git log --oneline -20
```

### Inventaire tests
```bash
find tests -type f | sort
```

### TypeScript / lint / build
```bash
npx tsc --noEmit
npm run lint
npm run build
npm run build:ci
```

### Unit / integration / MCP
```bash
npm run test:unit
npm run mcp:test
npx vitest run tests/integration
```

### Contracts
```bash
npm run test:contracts
npm run test:contracts:auth
npm run test:contracts:teacher-rbac
npm run test:contracts:teacher-comment-rbac
npm run test:contracts:teacher-export-rbac
```

### E2E
```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

### Visuels
```bash
npm run test:visual
npm run test:visual:public
npm run test:visual:connected
npm run test:visual:mobile
```

### Coverage si nécessaire
```bash
npx vitest run --coverage
```

### Prisma / DB
```bash
npx prisma validate
npx prisma generate
npx prisma migrate deploy
npm run db:seed
```

### MCP
```bash
cd packages/mcp-server
npx tsc --noEmit
npm test
cd -
```

### Recherche de signaux faibles
```bash
rg -n "TODO|FIXME|console\.log|workflow|feedback|RAG|CSRF|OCR|cockpit|onboarding" src tests
rg -n "skip\(|test\.skip|describe\.skip|it\.skip" tests
rg -n "any\b|@ts-ignore|eslint-disable" src packages tests
```

---

## 8. Ce que tu dois corriger si tu détectes un écart

Si tu constates un écart entre la promesse et la réalité, tu dois :

1. **le qualifier** (frontend, backend, data, wording, sécurité, perf, tests, RAG, MCP, UX, pédagogie) ;
2. **le reproduire** ;
3. **identifier la cause racine** ;
4. **corriger dans le bon périmètre** ;
5. **ajouter ou corriger le test** correspondant ;
6. **rebuild / redeploy** si nécessaire ;
7. **fournir la preuve post-correction**.

Aucune correction “cosmétique” ne doit casser le produit.
Aucune correction “technique” ne doit détériorer le copy ou l’UX.

---

## 9. Sortie attendue de Windsurf

Je veux un rendu final structuré en 5 blocs :

### Bloc 1 — Inventaire réel
- fichiers de test,
- workflows,
- pages,
- endpoints,
- composants critiques,
- services RAG/LLM/MCP.

### Bloc 2 — Matrice de couverture
Pour chaque surface :
- tests existants,
- statut,
- preuves,
- écarts.

### Bloc 3 — Corrections réellement appliquées
- fichiers modifiés,
- justification,
- commit(s),
- impact.

### Bloc 4 — Vérification finale
- TypeScript,
- lint,
- build,
- tests,
- E2E,
- visuel,
- health,
- auth,
- production si concerné.

### Bloc 5 — Verdict sans complaisance
- GO / NO GO,
- réserves bloquantes,
- réserves non bloquantes,
- backlog réel,
- prochaine action exacte.

---

## 10. Exigence finale

Tu dois considérer que le propriétaire de la plateforme est **déçu** du résultat précédent.
Donc :

- tu ne dois pas protéger le travail passé ;
- tu dois protéger le produit ;
- tu dois être plus exigeant que Claude ;
- tu dois considérer qu’un point non vérifié est un point **non validé** ;
- tu dois aller jusqu’au bout des corrections.

Le standard attendu n’est pas “ça semble bien”.
Le standard attendu est :

**plateforme propre, fluide, crédible, testée, cohérente, sans friction, sans promesse mensongère, sans jargon résiduel, sans bug d’auth, sans gating incohérent, sans ressource fantôme, sans blind spot technique ou produit.**

