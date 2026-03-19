Tu reprends ce chantier **sans aucune confiance dans ton dernier rapport**.

Ton précédent retour est **insuffisant** et **non recevable comme sign-off** pour les raisons suivantes :

1. Tu n’as réellement vérifié que la **Phase K**.
2. Les **phases L, M, N, O** ont été traitées comme un **survol**, alors qu’elles devaient être exécutées intégralement.
3. Tu as produit une conclusion “**PRODUCTION READY**” avec des **contradictions chiffrées** et des **preuves insuffisantes**.
4. Tu n’as pas respecté jusqu’au bout le **format de contrôle obligatoire** demandé.
5. Tu as laissé des ambiguïtés majeures sur :

   * le nombre réel de tests,
   * le nombre réel de fichiers de tests,
   * le nombre réel d’outils MCP,
   * l’état exact de la CI,
   * l’existence réelle et l’usage réel de certaines routes/API,
   * l’état réel de la bibliothèque côté frontend,
   * l’état réel de la production.

Tu dois donc effectuer une **reprise corrective stricte**, sans raccourci, sans formulation approximative, sans “audit rapide”.

---

## 1. Règle absolue

Tu repars du principe suivant :

**ton dernier rapport n’est pas la vérité.**
Il doit être **audité, corrigé et remplacé** par un rapport rigoureux.

Pour chaque sujet important, tu dois suivre exactement ce format :

### Format de contrôle obligatoire

* **Affirmation initiale**
* **Constat réel après vérification**
* **Preuve**
* **Écart**
* **Correction appliquée**
* **Résultat après correction**

Tu ne dois plus produire de formulations vagues du type :

* “semble correct”
* “production ready”
* “ok globalement”
* “à améliorer”
  sans preuve détaillée.

---

## 2. Travail demandé maintenant

Tu dois reprendre **les phases L à O intégralement**, puis refaire une **synthèse finale propre**.

Mais avant cela, tu dois aussi **revalider les points K qui ont une incidence sur L-O**, notamment :

* activation réelle ou non de `LLM_COST_TRACKING=true` en production ;
* cohérence réelle des chiffres coût/élève/mois ;
* usage réel des caches LRU ;
* hit rate Redis correctement interprété ;
* cohérence entre coût théorique et logs réels.

---

# PHASE L — TESTS / QUALITÉ / ZÉRO ANGLE MORT

Cette phase doit être refaite sérieusement.

## Tu dois produire les chiffres exacts et cohérents :

* nombre réel de fichiers de tests ;
* nombre réel de tests ;
* nombre réel de tests passés ;
* nombre réel de tests ignorés ;
* nombre réel de tests skipped ;
* couverture réelle si disponible ;
* état réel de TypeScript ;
* état réel de `next build`.

## Je veux une réconciliation stricte des contradictions :

Tu dois expliquer précisément pourquoi on a vu successivement :

* 159/159 fichiers et 1098/1098 tests,
* puis 177 fichiers et 605 tests,
* et déterminer **quelle est la vérité**, avec preuves.

## Tu dois exécuter réellement :

* tests unitaires ;
* tests d’intégration ;
* tests API ;
* tests endpoints ;
* tests middleware ;
* tests liés à auth / csrf / rate limiting ;
* tests liés à la bibliothèque ;
* tests liés au RAG ;
* tests liés au MCP si présents ;
* build TypeScript ;
* build Next.js.

## Interdiction

Aucun test cassé ne doit être laissé “pour plus tard”.
Aucun skip douteux ne doit être accepté sans justification écrite.

## Livrable attendu

Un tableau exhaustif :

* suite,
* commande,
* résultat,
* durée,
* blocage éventuel,
* correction appliquée.

---

# PHASE M — CI/CD / GITHUB ACTIONS / CHECKS / GREEN STATUS

Tu dois refaire cette phase proprement.

## À vérifier réellement :

* workflows GitHub Actions existants ;
* jobs exacts ;
* gates exacts ;
* conditions de déclenchement ;
* dépendances entre jobs ;
* secrets requis ;
* matrix éventuelle ;
* build check ;
* lint ;
* typecheck ;
* tests ;
* audit sécurité ;
* CodeQL si présent ;
* checks sur PR ;
* checks sur `main`.

## Je veux savoir :

* quels checks sont réellement obligatoires ;
* lesquels sont purement informatifs ;
* lesquels ont échoué historiquement ;
* lesquels sont encore fragiles ;
* quels sont les vrais prérequis d’un CI 100% vert.

## Tu dois corriger réellement

Tout échec CI relevant de ton périmètre doit être corrigé, pas documenté seulement.

## Livrable attendu

Un tableau :

* workflow ;
* job ;
* statut ;
* blocant ou non ;
* preuve ;
* correction ;
* état final.

---

# PHASE N — SÉCURITÉ OPÉRATIONNELLE

Tu dois revalider sans indulgence :

* CSP sur toutes les routes publiques et protégées ;
* nonce CSP réellement injecté ;
* `X-Powered-By` réellement supprimé ;
* HSTS ;
* cookies `Secure`, `HttpOnly`, `SameSite` ;
* auth guards ;
* rate limiting ;
* Redis ;
* fail-open / fail-closed ;
* CSRF sur endpoints concernés ;
* path traversal ;
* symlink ;
* null byte ;
* SSRF ;
* SQL injection ;
* leakage d’informations dans les endpoints de health ;
* variables d’environnement exposées ;
* permissions `.env` ;
* résilience au reboot ;
* PM2 / systemd / restart policies.

## Exigence

Je veux un tableau “avant / après / preuve”, et pas une simple liste de mesures théoriques.

---

# PHASE O — QUALITÉ ÉDITORIALE / FRANÇAIS / PRODUIT VISIBLE

Tu dois refaire une passe éditoriale plus sévère.

## Pages à recontrôler réellement :

* `/`
* `/login`
* `/pricing`
* `/contact`
* `/dashboard`
* `/bibliotheque`
* `/tuteur`
* `/quiz`
* `/carnet`
* `/profil`
* `/mon-parcours`
* `/atelier-ecrit`
* `/atelier-oral`
* `/atelier-langue`

## Je veux un vrai jugement produit

Pas seulement “pas de jargon”.

Tu dois juger :

* qualité des titres ;
* qualité des sous-titres ;
* clarté des CTA ;
* lisibilité ;
* crédibilité commerciale ;
* crédibilité pédagogique ;
* naturel du français ;
* ton élève-centré ;
* cohérence du tutoiement ;
* absence de métalangage produit ;
* absence de jargon UX / IA / dev ;
* qualité des labels ;
* qualité des placeholders ;
* qualité des messages d’erreur ;
* qualité du wording des quotas ;
* qualité du wording du paywall.

## Tu dois signaler explicitement ce qui est :

* excellent ;
* bon ;
* moyen ;
* médiocre ;
* à refaire.

---

# PHASE G BIS — BIBLIOTHÈQUE / RESSOURCES / UX / MAPPINGS / GATING

Je veux une seconde passe beaucoup plus exigeante sur la bibliothèque.

## 1. Source de vérité

Tu dois vérifier et réconcilier :

* `/srv/eaf_ressources`
* `ressources-scan.json`
* `RESSOURCES`
* `MEDIA_CATALOG`
* l’API `/api/v1/ressources/file`
* l’API `/api/v1/media/[id]`
* le frontend `/bibliotheque`

## 2. Correspondance frontend ↔ fichier réel

Tu dois auditer un échantillon large et représentatif, avec au minimum :

* annales,
* œuvres,
* documents,
* vidéos,
* rapports de jury.

Pour chaque ressource testée :

* identifiant frontend ;
* titre affiché ;
* catégorie ;
* statut free/locked ;
* mapping scan ;
* chemin réel ;
* endpoint réel ;
* MIME ;
* preview ;
* téléchargement ;
* auth ;
* résultat.

## 3. Titres et qualité éditoriale des ressources

Tu dois revoir l’organisation des ressources dans la bibliothèque pour que les **titres soient clairs, utiles et pédagogiques**.

Je veux explicitement :

* des titres propres ;
* des titres compréhensibles par un élève ;
* une suppression des formulations techniques, cryptiques ou garbled ;
* une hiérarchie éditoriale claire ;
* des catégories propres ;
* des titres cohérents avec le fichier réel.

## 4. Contrôle du freemium

Tu dois vérifier visuellement et fonctionnellement que :

* les ressources non accessibles en Freemium sont **grisées** ;
* elles portent un indicateur clair ;
* le verrouillage n’est pas cassé ;
* le paywall est cohérent ;
* l’utilisateur comprend pourquoi c’est verrouillé ;
* les limites free sont justes et pédagogiquement pertinentes ;
* les ressources gratuites sont bien choisies.

## 5. Contrôle preview / download

Tu dois vérifier que l’utilisateur peut :

* visionner correctement une ressource si c’est prévu ;
* télécharger correctement une ressource ;
* ouvrir une vidéo ;
* ouvrir un PDF ;
* recevoir le bon MIME ;
* utiliser les range requests ;
* ne pas contourner l’auth ;
* ne pas contourner le verrouillage premium.

## 6. Contrôle éditorial de la sélection Freemium

Point important :
je veux que tu regardes si les 28 ressources gratuites sont vraiment les bonnes.
Si la sélection est médiocre, trop administrative, ou peu utile pour un élève, tu la corriges réellement.

---

# PHASE H BIS — RAG / LLM / PERTINENCE PÉDAGOGIQUE / MCP

Tu dois reprendre cette partie avec encore plus de rigueur.

## A. RAG

Vérifie réellement :

* santé ;
* collection ;
* nombre de chunks ;
* pertinence réelle ;
* qualité des excerpts ;
* taille des excerpts ;
* filtrage low-score ;
* valeur réelle des stop words ;
* latence ;
* cache ;
* cohérence entre external RAG et rendu élève.

## B. LLM

Vérifie réellement :

* skills ;
* tiers ;
* prompts ;
* coûts ;
* logs ;
* trackLlmCall ;
* budget alerts ;
* circuit breaker ;
* fallback ;
* modèle utilisé par skill.

## C. MCP

Je veux une cartographie propre :

* nombre total réel d’outils ;
* outils effectivement utilisés ;
* outils réels non encore utilisés ;
* stubs ;
* legacy ;
* backlog ;
* justification de conservation ou suppression.

Je veux une vérification de :

* bindHost ;
* accessibilité depuis l’app ;
* auth ;
* clé API ;
* persistance PM2/systemd ;
* fonctionnement après reboot.

## D. Pertinence pédagogique réelle

Tu dois exécuter de vrais scénarios :

* tuteur libre ;
* quiz ;
* si possible oral ;
* éventuellement écrit.

Je veux vérifier :

* adaptation au niveau Première ;
* prise en compte de la voie ;
* prise en compte des œuvres ;
* prise en compte du J-XX ;
* qualité du ton ;
* qualité des citations ;
* refus anti-triche ;
* aide réellement utile à l’élève.

---

# PHASE P — INCIDENT ACTUEL À INVESTIGUER ABSOLUMENT

Point très important.

L’utilisateur signale un problème réel :

* lorsqu’on va sur `eaf.nexusreussite.academy`, on se retrouve renvoyé vers la page de connexion ;
* les textes visibles n’ont pas été modifiés comme attendu ;
* le rendu UI/UX, les couleurs, le design et la mise en page n’ont pas réellement changé comme promis.

Tu dois traiter cela comme un **incident produit critique**.

## À vérifier immédiatement :

1. quel build exact est réellement servi ;
2. quel process sert réellement le trafic ;
3. si Nginx pointe vers le bon backend ;
4. si PM2 sert le bon build ;
5. s’il existe encore un ghost process ou un ancien build ;
6. si le contenu HTML servi correspond réellement au code source actuel ;
7. si le cache navigateur / reverse proxy / Next / PM2 / Nginx provoque une confusion ;
8. si la homepage publique est réellement publique ;
9. si le middleware a une règle trop large ;
10. si `/` ou d’autres routes sont mal classées dans les routes publiques ;
11. si la page de login et la landing servies sont bien les dernières versions ;
12. si le design system est effectivement celui attendu en production.

## Exigence

Tu ne me rends pas un discours.
Tu identifies la cause racine, tu la corriges, tu redéploies proprement et tu prouves que la production sert bien la bonne version.

---

# PHASE Q — DÉPLOIEMENT FINAL ET VALIDATION PRODUCTION CONNECTÉE

Une fois les corrections faites, tu dois :

1. commit ;
2. push ;
3. PR ;
4. merge propre ;
5. synchroniser `main` ;
6. déployer ;
7. vérifier le SHA servi ;
8. vérifier les pages publiques ;
9. vérifier les pages connectées avec un compte test ;
10. vérifier la bibliothèque ;
11. vérifier le tuteur ;
12. vérifier le quiz ;
13. vérifier auth ;
14. vérifier les entêtes sécurité ;
15. vérifier les quotas et le gating.

---

# LIVRABLES OBLIGATOIRES

Tu dois produire :

## 1. Rapport maître

`docs/WINDSURF_SECOND_PASS_AUDIT.md`

## 2. Matrice des écarts

`docs/CLAUDE_GAP_MATRIX.md`

## 3. Rapport production

`docs/PRODUCTION_ACCEPTANCE_REPORT.md`

## 4. Backlog final

`docs/POST_AUDIT_BACKLOG.md`

---

# VERDICT FINAL AUTORISÉ

Tu ne termines qu’avec un de ces trois états :

* **ÉTAT A — GO total**
* **ÉTAT B — GO avec réserves mineures**
* **ÉTAT C — NO-GO**

Aucun autre verdict ne sera accepté.

---

# DERNIÈRE INSTRUCTION

Tu exécutes maintenant cette seconde passe **jusqu’au bout**.
Tu ne t’arrêtes ni à un audit partiel, ni à un rapport rapide, ni à une conclusion prématurée.

Tu dois :

* vérifier,
* corriger,
* tester,
* déployer,
* valider,
* puis conclure.

Et surtout :
**tu ne me vends plus un état “business-ready” tant que la réalité servie en production ne correspond pas strictement à ce qui est annoncé.**
Tu reprends ce chantier en mode EXÉCUTION OPÉRATIONNELLE STRICTE.

Tu n’as plus le droit à :
- un audit partiel,
- un “ça semble bon”,
- un “production ready” sans preuve,
- un rapport rapide,
- une conclusion prématurée,
- un test échoué laissé de côté,
- un point “documenté mais non corrigé” alors qu’il est corrigeable.

Tu dois travailler comme un lead engineer + release manager + QA engineer + product auditor.
Tu exécutes, tu vérifies, tu corriges, tu commits proprement, tu ouvres les PR nécessaires, tu merges proprement, tu déploies proprement, puis tu valides la production réellement servie.

======================================================================
0. RÈGLES ABSOLUES
======================================================================

R1. À chaque phase, tu produis ce format exact :
- Affirmation initiale
- Constat réel après vérification
- Preuve
- Écart
- Correction appliquée
- Résultat après correction

R2. Aucun test échoué ne doit être ignoré.
- Si un test échoue, tu le corriges réellement.
- Si un test doit être temporairement skip, tu dois justifier techniquement pourquoi, le documenter, et prouver qu’il n’existe pas de correction rapide raisonnable.

R3. Aucun angle mort :
- unit tests
- integration tests
- api tests
- endpoint tests
- middleware tests
- auth tests
- csrf tests
- rate-limit tests
- library tests
- rag tests
- mcp tests
- e2e tests
- build
- typecheck
- CI GitHub
- prod validation

R4. Pas de contamination :
- pas de hack,
- pas de --no-verify,
- pas de force push,
- pas de bypass temporaire non documenté,
- pas de TODO laissé dans le code pour masquer un problème.

R5. Chaque correction doit être suivie de :
- test ciblé local
- test de non-régression
- commit propre
- push
- PR si nécessaire
- merge propre
- redéploiement si nécessaire
- validation prod

R6. Tu considères que les précédents rapports de Claude ne sont PAS source de vérité.
La seule vérité = le code réellement présent + les tests réellement exécutés + la production réellement servie.

======================================================================
1. RÉPERTOIRES, CIBLES ET VARIABLES
======================================================================

Travaille avec ces cibles :

LOCAL_PROJECT="/home/alaeddine/Documents/Plateforme_Francais/eaf_platform"
SERVER="root@88.99.254.59"
SERVER_APP_DIR="/opt/eaf_platform"
SERVER_COMPOSE_DIR="/opt/nexus"
SERVER_RESSOURCES="/srv/eaf_ressources"
PROD_URL="https://eaf.nexusreussite.academy"

Avant toute action :
cd "$LOCAL_PROJECT"

Créer un dossier de logs d’audit local :
mkdir -p .windsurf_audit_logs

======================================================================
2. PHASE 1 — GEL DE L’ÉTAT ET PREUVES INITIALES
======================================================================

Objectif : figer l’état réel avant modification.

Commandes :

pwd
git status --short
git branch --show-current
git remote -v
git log --oneline -10
git fetch origin
git rev-parse HEAD
git rev-parse origin/main
git diff --stat origin/main...HEAD
find src -type f | wc -l
find tests -type f | wc -l

Sauvegarder :
git status --short > .windsurf_audit_logs/01_git_status.txt
git log --oneline -20 > .windsurf_audit_logs/02_git_log.txt
git diff --stat origin/main...HEAD > .windsurf_audit_logs/03_git_diff_stat.txt

Vérifications obligatoires :
- working tree propre ou non ;
- branche courante ;
- divergence éventuelle avec origin/main ;
- présence d’un chantier non committé ;
- présence de fichiers non suivis sensibles.

Si l’arbre n’est pas propre :
- identifier précisément chaque fichier ;
- décider s’il relève du périmètre ou non ;
- ne jamais continuer sans l’avoir documenté.

======================================================================
3. PHASE 2 — RÉCONCILIATION DES MÉTRIQUES CONTRADICTOIRES
======================================================================

Objectif : établir les chiffres vrais sur tests, outils MCP, skills, etc.

Commandes :

rg -n "describe\\(|it\\(|test\\(" tests > .windsurf_audit_logs/10_test_occurrences.txt
find tests -type f \\( -name "*.test.ts" -o -name "*.spec.ts" \\) | sort > .windsurf_audit_logs/11_test_files.txt
wc -l .windsurf_audit_logs/11_test_files.txt

rg -n "export type Skill|const skill|skillMap|router.*skill" src packages > .windsurf_audit_logs/12_skills.txt
rg -n "tool|MCP|mcp" packages/mcp-server src > .windsurf_audit_logs/13_mcp_refs.txt

Tu dois réconcilier factuellement :
- nombre de skills typées ;
- nombre de skills réellement routables ;
- nombre d’outils MCP définis ;
- nombre d’outils MCP réellement appelés ;
- nombre de tests ;
- nombre de fichiers de tests ;
- nombre de tests actifs ;
- nombre de tests skip ;
- nombre de tests passants.

Livrable intermédiaire :
docs/CLAUDE_GAP_MATRIX.md

======================================================================
4. PHASE 3 — TESTS, BUILD, TYPECHECK, ZÉRO ANGLE MORT
======================================================================

Objectif : exécuter la totalité des contrôles techniques.

Commandes de base :

npm ci
npx tsc --noEmit
npm run build
npx vitest run
npm test -- --runInBand || true

Si package.json contient d’autres scripts :
cat package.json | sed -n '1,220p'

Exécuter aussi :
npm run lint || true
npm run test:unit || true
npm run test:integration || true
npm run test:e2e || true
npm run test:visual || true

Si un script n’existe pas, le documenter explicitement.

Pour chaque échec :
1. capturer la sortie complète ;
2. identifier cause racine ;
3. corriger ;
4. relancer le test ciblé ;
5. relancer la suite globale.

Sauvegardes :
npx tsc --noEmit > .windsurf_audit_logs/20_tsc.txt 2>&1
npm run build > .windsurf_audit_logs/21_build.txt 2>&1
npx vitest run > .windsurf_audit_logs/22_vitest.txt 2>&1

Si la couverture existe :
npx vitest run --coverage > .windsurf_audit_logs/23_coverage.txt 2>&1 || true

Exigence :
- aucun test échoué ;
- aucune erreur TypeScript ;
- build clean ;
- aucune incohérence chiffrée entre les différents rapports.

======================================================================
5. PHASE 4 — CI/CD GITHUB ACTIONS ET CHECKS RÉELS
======================================================================

Objectif : contrôler la CI réellement configurée.

Commandes :

find .github/workflows -type f -maxdepth 2 | sort
sed -n '1,260p' .github/workflows/ci.yml 2>/dev/null || true
sed -n '1,320p' .github/workflows/ci-cd.yml 2>/dev/null || true
gh auth status || true
gh run list --limit 20 || true
gh pr list --limit 20 || true

Tu dois établir :
- workflows réels ;
- jobs réels ;
- gates réels ;
- secrets requis ;
- jobs obligatoires ;
- jobs informatifs ;
- derniers échecs ;
- stabilité de la CI.

Si un check CI relevant du périmètre est rouge :
- créer branche de fix ;
- corriger ;
- push ;
- PR ;
- merge propre.

Tu n’acceptes aucune conclusion “CI verte” sans preuve GitHub.

======================================================================
6. PHASE 5 — SÉCURITÉ OPÉRATIONNELLE
======================================================================

Objectif : revérifier tout le hardening réellement servi.

Audit code local :

rg -n "Content-Security-Policy|x-nonce|X-Frame-Options|X-Content-Type-Options|Referrer-Policy|Permissions-Policy" src middleware.ts next.config.* .
rg -n "COOKIE_SECURE|SameSite|httpOnly|secure:" src .env* config* || true
rg -n "validateCsrf|ensurePublicCsrfToken|ensureCsrfCookie|CSRF" src
rg -n "rate.?limit|Redis|fail-closed|fail closed|fail open" src packages

Audit production :

curl -I -s "$PROD_URL/" | tee .windsurf_audit_logs/30_prod_home_headers.txt
curl -I -s "$PROD_URL/login" | tee .windsurf_audit_logs/31_prod_login_headers.txt
curl -I -s "$PROD_URL/pricing" | tee .windsurf_audit_logs/32_prod_pricing_headers.txt
curl -s "$PROD_URL/api/v1/health" | tee .windsurf_audit_logs/33_prod_health.json
curl -s "$PROD_URL/api/v1/rag/health" | tee .windsurf_audit_logs/34_prod_rag_health.json

SSH serveur :
ssh "$SERVER" '
set -e
echo "=== ENV PERMS ==="
ls -l /opt/eaf_platform/.env /opt/eaf_platform/.env.local 2>/dev/null || true
echo "=== REDIS ==="
systemctl is-active redis-server || true
systemctl is-enabled redis-server || true
redis-cli ping || true
echo "=== PM2 ==="
pm2 ls || true
echo "=== PORTS ==="
ss -ltnp | grep -E ":3000|:3001|:3100|:6379" || true
echo "=== NGINX CONF ==="
nginx -T 2>/dev/null | grep -n "eaf.nexusreussite.academy" -A20 -B10 || true
'

Points à vérifier strictement :
- CSP sur toutes les routes ;
- nonce réellement présent ;
- X-Powered-By absent ;
- cookies secure ;
- auth guards ;
- rate limiting sain ;
- Redis actif ;
- pas de ghost app ;
- pas de process parasite ;
- PM2 propre ;
- .env permissions 600 ;
- MCP persistant.

======================================================================
7. PHASE 6 — INCIDENT CRITIQUE : PRODUCTION SERVIE ≠ CE QUI EST ANNONCÉ
======================================================================

Objectif : traiter le problème signalé par l’utilisateur.

Symptômes à investiguer :
- la homepage renvoie vers login ou se comporte comme si elle n’était pas publique ;
- les textes servis ne correspondent pas à ce qui a été promis ;
- l’UI/UX, les couleurs et la mise en page ne semblent pas refléter la refonte annoncée.

Tu dois prouver :
1. quel build est réellement servi ;
2. quel process sert réellement la prod ;
3. quel SHA est servi ;
4. si le HTML servi correspond au code actuel ;
5. si le middleware est correct ;
6. si la route / est bien publique ;
7. s’il existe un cache ou un ghost build.

Commandes locales :
rg -n "PUBLIC_PATHS|isPublicPath|'/'" middleware.ts src
sed -n '1,220p' middleware.ts

Commandes prod :
curl -s "$PROD_URL/" > .windsurf_audit_logs/40_prod_home.html
curl -s "$PROD_URL/login" > .windsurf_audit_logs/41_prod_login.html
curl -s "$PROD_URL/pricing" > .windsurf_audit_logs/42_prod_pricing.html
curl -s "$PROD_URL/api/v1/health" > .windsurf_audit_logs/43_prod_health.json

Analyser :
grep -n "Prépare ton Bac de Français" .windsurf_audit_logs/40_prod_home.html || true
grep -n "Ton espace de préparation" .windsurf_audit_logs/41_prod_login.html || true
grep -n "Volume de travail illimité" .windsurf_audit_logs/42_prod_pricing.html || true

SSH serveur :
ssh "$SERVER" '
set -e
echo "=== PM2 CURRENT ==="
pm2 describe eaf-nextjs || true
echo "=== APP DIR ==="
cd /opt/eaf_platform
git rev-parse HEAD || true
echo "=== BUILD FILES ==="
find .next -maxdepth 3 -type f | head -50 || true
echo "=== ENV URLS ==="
grep -n "NEXT_PUBLIC_APP_URL\\|COOKIE_SECURE" .env .env.local 2>/dev/null || true
'

Si la prod ne sert pas le bon build :
- identifier cause racine ;
- corriger ;
- rebuild ;
- restart ;
- revalider.

======================================================================
8. PHASE 7 — BIBLIOTHÈQUE / RESSOURCES / MAPPINGS / GATING / UX
======================================================================

Objectif : seconde passe très stricte sur la bibliothèque.

Vérités à réconcilier :
- /srv/eaf_ressources
- ressources-scan.json
- RESSOURCES export
- MEDIA_CATALOG
- /api/v1/ressources/file
- /api/v1/media/[id]
- frontend /bibliotheque

Commandes locales :
rg -n "ressources-scan|MEDIA_CATALOG|RESSOURCES|isResourceAccessible|LIBRARY_TOTAL_RESOURCES|FREE_LIBRARY_PERCENT" src scripts
find "$LOCAL_PROJECT" -type f | grep "ressources-scan.json"
sed -n '1,260p' src/app/bibliotheque/page.tsx
sed -n '1,260p' src/lib/library/library-gating.ts 2>/dev/null || true

Commandes serveur :
ssh "$SERVER" '
set -e
echo "=== SERVER RESSOURCES COUNT ==="
find /srv/eaf_ressources -type f | wc -l
echo "=== CATEGORIES ==="
find /srv/eaf_ressources -maxdepth 1 -mindepth 1 -type d | sort
echo "=== SAMPLE FILES ==="
find /srv/eaf_ressources -type f | sort | head -50
'

Tu dois auditer un échantillon significatif, au minimum :
- 5 annales ;
- 5 œuvres ;
- 10 documents ;
- 10 vidéos ;
- 5 rapports de jury.

Pour chaque entrée :
- titre frontend ;
- catégorie ;
- identifiant ;
- chemin scan ;
- chemin réel serveur ;
- endpoint ;
- réponse HTTP ;
- MIME ;
- preview ;
- download ;
- gating free/premium ;
- résultat.

Tu dois produire une matrice :
docs/LIBRARY_RESOURCE_MAPPING_AUDIT.md

### Titres et organisation
Tu dois améliorer si nécessaire :
- titres trop techniques ;
- titres garbled ;
- titres peu clairs ;
- titres sans auteur ;
- ressources mal catégorisées ;
- ordre peu pertinent.

### Freemium
Tu dois vérifier visuellement ET fonctionnellement :
- 28 ressources free environ 5% ;
- ressources premium grisées ;
- cadenas ;
- wording cohérent ;
- CTA upgrade ;
- pas de flash de contenu débloqué ;
- sélection gratuite pédagogiquement utile.

### Preview / download
Tester réellement :
- PDF ;
- vidéo webm ;
- vidéo mkv ;
- doc ;
- ppsx si autorisé ;
- range request ;
- download=1 ;
- sans auth ;
- path traversal ;
- ID inexistant.

======================================================================
9. PHASE 8 — RAG / LLM / MCP / PERTINENCE PÉDAGOGIQUE
======================================================================

Objectif : valider la plateforme du point de vue agentique et pédagogique.

### RAG
Commandes :
curl -s "$PROD_URL/api/v1/rag/health" | tee .windsurf_audit_logs/50_rag_health.json
rg -n "PREFETCH|excerpt|stopWords|RRF|rrf|hybrid|vector|lexical" src packages

Vérifier :
- santé ;
- collection ;
- taille corpus ;
- excerpts ;
- pertinence ;
- filtre low-score ;
- cache ;
- latence ;
- citations rendues à l’élève.

### LLM
rg -n "trackLlmCall|LlmCostLog|COST_BENCHMARKS|budget|anomaly|tier|mistral" src packages

Vérifier :
- skills réelles ;
- tiers réels ;
- modèle par skill ;
- coûts ;
- budgets ;
- alerts ;
- logs ;
- circuit breaker.

### MCP
rg -n "MCP|tool|bindHost|bind host|3100|MCP_HTTP_BIND|auth.ts" packages/mcp-server src

SSH serveur :
ssh "$SERVER" '
set -e
echo "=== MCP PM2 ==="
pm2 describe eaf-mcp || true
echo "=== MCP HEALTH ==="
curl -s http://127.0.0.1:3100/health || true
echo "=== MCP PORT ==="
ss -ltnp | grep 3100 || true
'

Tu dois établir :
- nombre réel d’outils ;
- utilisés ;
- non utilisés mais complets ;
- stubs ;
- legacy ;
- backlog ;
- conservation ou suppression.

### Scénarios pédagogiques réels
Avec un compte test si nécessaire, exécuter :
- tuteur libre ;
- quiz ;
- bibliothèque ;
- profil ;
- carnet ;
- si possible oral ;
- si possible écrit.

Tu dois juger :
- niveau Première ;
- voie ;
- œuvres ;
- J-XX ;
- ton ;
- aide utile ;
- anti-triche ;
- citations ;
- continuité pédagogique.

======================================================================
10. PHASE 9 — PERFORMANCE / CACHES / COÛTS (REPRISE RIGOUREUSE)
======================================================================

Tu reprends K proprement avec chiffres sourcés.

Commandes :
redis-cli info stats | tee .windsurf_audit_logs/60_redis_stats.txt || true
redis-cli info keyspace | tee .windsurf_audit_logs/61_redis_keyspace.txt || true
rg -n "LRUCache|ttl|maxSize|profileCache|ragCache|cost-tracker|trackLlmCall" src packages

Tu dois répondre avec précision :
- quels caches existent ;
- lesquels sont réellement utilisés ;
- TTL ;
- taille ;
- clés ;
- taux de hit Redis ;
- ce que Redis cache réellement ;
- ce que LRU cache réellement ;
- gains plausibles ;
- coûts LLM réellement suivis ou non ;
- `LLM_COST_TRACKING` réellement activé ou non en prod ;
- coût théorique vs logs réels ;
- optimisations encore possibles.

Pas de conclusion marketing. Seulement du factuel.

======================================================================
11. PHASE 10 — E2E ET VALIDATION CONNECTÉE EN PRODUCTION
======================================================================

Tu dois faire une validation connectée réelle.

Si un compte test n’existe pas, tu en crées un proprement si la plateforme le permet et si c’est sûr.
Sinon tu utilises un compte de test existant sans toucher aux données utiles.

Parcours minimum :
1. login ;
2. dashboard ;
3. profil ;
4. mon parcours ;
5. bibliothèque ;
6. tuteur ;
7. quiz ;
8. carnet ;
9. pricing ;
10. logout.

Pour chaque page :
- HTTP ;
- rendu ;
- console errors ;
- CTA ;
- wording ;
- thème ;
- cohérence visuelle ;
- état loading ;
- état vide ;
- erreur éventuelle ;
- friction UX.

======================================================================
12. PHASE 11 — CORRECTIONS, GIT FLOW, PR, MERGE
======================================================================

Pour chaque bloc de correction :
- branche dédiée ;
- commit propre ;
- push ;
- PR ;
- checks ;
- merge ;
- suppression branche ;
- sync main.

Commandes type :
git checkout -b fix/<scope>
git add ...
git commit -m "fix(<scope>): <message>"
git push -u origin HEAD
gh pr create --fill || true
gh pr checks <NUM> --watch || true
gh pr merge <NUM> --merge --delete-branch || true
git checkout main
git pull --ff-only origin main

Aucune correction directe sauvage sur main si une PR est raisonnablement possible.

======================================================================
13. PHASE 12 — DÉPLOIEMENT PROPRE
======================================================================

Après merge :
ssh "$SERVER" '
set -e
cd /opt/eaf_platform
git fetch origin
git checkout main
git pull --ff-only origin main
cd /opt/nexus
docker compose build next-app
docker compose up -d next-app
pm2 restart eaf-mcp || true
pm2 save || true
'

Puis validation post-déploiement :
curl -s "$PROD_URL/api/v1/health"
curl -I -s "$PROD_URL/"
curl -I -s "$PROD_URL/login"
curl -I -s "$PROD_URL/pricing"

SSH :
ssh "$SERVER" '
set -e
pm2 ls
docker ps
curl -s http://127.0.0.1:3000/api/v1/health || true
'

======================================================================
14. LIVRABLES OBLIGATOIRES
======================================================================

Tu dois produire et committer si pertinent :

1. docs/WINDSURF_SECOND_PASS_AUDIT.md
2. docs/CLAUDE_GAP_MATRIX.md
3. docs/PRODUCTION_ACCEPTANCE_REPORT.md
4. docs/POST_AUDIT_BACKLOG.md
5. docs/LIBRARY_RESOURCE_MAPPING_AUDIT.md

Chaque document doit être exploitable par un humain, pas verbeux pour rien, et adossé à des preuves réelles.

======================================================================
15. VERDICT FINAL AUTORISÉ
======================================================================

Tu termines uniquement avec :

- ÉTAT A — GO total
- ÉTAT B — GO avec réserves mineures
- ÉTAT C — NO-GO

Le verdict doit être motivé par :
- prod réellement servie,
- tests réellement exécutés,
- CI réellement verte,
- bibliothèque réellement cohérente,
- UX réellement validée,
- sécurité réellement vérifiée.

======================================================================
16. INTERDICTION DE SORTIE PRÉMATURÉE
======================================================================

Tu n’as pas le droit de t’arrêter après :
- un audit partiel,
- un rapport d’intention,
- une simple liste de constats,
- une conclusion “ça a l’air bon”.

Tu dois aller jusqu’au bout :
- vérifier,
- corriger,
- retester,
- merger,
- redéployer,
- revalider,
- conclure.

Commence maintenant par :
1. la réconciliation des métriques contradictoires,
2. l’exécution intégrale des tests,
3. l’investigation de l’incident “prod servie ≠ refonte annoncée”,
4. la seconde passe bibliothèque extrêmement stricte,
5. la validation connectée en production.

Et surtout :
tu n’emploies plus l’expression “business-ready” tant que la version réellement servie en production n’est pas strictement conforme au code, aux tests et aux promesses de rendu.
