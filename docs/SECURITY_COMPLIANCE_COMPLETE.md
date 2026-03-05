# Sécurité & Conformité - État Réel

Dernière mise à jour: 5 mars 2026

## Contrôles implémentés

1. Authentification/session
- Guard d'auth: `src/lib/auth/guard.ts`
- Sessions: `src/lib/auth/session.ts`
- Protection middleware pour routes non publiques: `middleware.ts`

2. CSRF
- Validation côté serveur: `src/lib/security/csrf.ts`
- Jeton côté client: `src/lib/security/csrf-client.ts`
- Audit routes CI: `scripts/audit-csrf-routes.mjs`, script `npm run ci:audit-csrf`

3. CSP et headers
- Baseline headers: `next.config.ts`
- CSP avec nonce runtime: `middleware.ts`
- Headers complémentaires: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

4. Upload sécurisé
- Détection MIME par magic bytes: `src/lib/security/file-validator.ts`
- Sanitation nom de fichier contre path traversal
- Tests dédiés: `tests/unit/security/file-validator.test.ts`

5. Rate limiting
- LLM quotas rpm + daily par skill: `src/lib/security/llm-rate-limiter.ts`
- Rate limiting générique: `src/lib/security/rate-limit.ts`
- Tests dédiés: `tests/unit/llm/rate-limiter.test.ts`, `tests/unit/security/rate-limit.test.ts`

6. Anti-triche/prompt injection
- Classification et refus: `src/lib/compliance/anti-triche.ts`
- Tests payloads: `tests/unit/security/prompt-injection.test.ts`

7. Sécurité callback paiement (`POST /api/v1/payments/clictopay/callback`)
- Cette route est exemptée du contrôle CSRF (confirmé par `audit-csrf-routes.mjs`) car elle reçoit des notifications server-to-server depuis la plateforme bancaire ClicToPay. Les contrôles de sécurité alternatifs suivants sont en place :
  - **HMAC signature** : chaque notification entrante contient un header `X-ClicToPay-Signature` vérifié côté serveur à partir du secret partagé (`CLICTOPAY_HMAC_SECRET`). Toute requête avec une signature invalide ou absente est rejetée (HTTP 403).
  - **IP allowlist** : la route n'accepte les requêtes que depuis les plages IP documentées par ClicToPay. Les requêtes provenant d'adresses IP non autorisées sont bloquées au niveau middleware (HTTP 403).
  - **Idempotence** : chaque notification comporte un identifiant de transaction unique (`transactionId`). Le handler vérifie en base de données que la transaction n'a pas déjà été traitée. En cas de doublon, la requête est acquittée (HTTP 200) sans re-traitement, empêchant les attaques par rejeu.
- Référence code : `src/app/api/v1/payments/clictopay/callback/route.ts`

8. Sessions & durée de vie
- Cookie session: `eaf_session` (`httpOnly`, `sameSite=lax`, `secure` selon env)
- TTL cookie actuel: 14 jours
- Renouvellement activité: `touchSession(token)` à chaque requête authentifiée
- Rotation forcée des tokens: non implémentée nativement à chaque requête (rotation ponctuelle via nouvelle session login/logout)

## Sécurité automatisée

- Contract/RBAC tests (Schemathesis + scripts): `tests/contracts/**`
- OWASP ZAP script: `tests/security/run-zap.sh`
- CI gate sécurité: workflow `/.github/workflows/ci-cd.yml` (Snyk, CodeQL, Gitleaks, npm audit)
- Audit CSRF automatisé: `npm run ci:audit-csrf` -> "CSRF audit passed (48 route files scanned)." (run local du 5 mars 2026)

## Gestion des secrets CI/CD

- Stockage: GitHub Encrypted Secrets.
- Périmètre: hôtes SSH de déploiement, tokens Snyk/Codecov, clés providers/API.
- Accès: mainteneurs du dépôt uniquement.
- Rotation recommandée:
  - clés LLM/RAG: tous les 90 jours
  - clés SSH de déploiement: tous les 180 jours
- Procédure compromission:
  - révocation immédiate côté provider
  - génération d'une nouvelle clé
  - mise à jour du secret GitHub
  - redéploiement + vérification fonctionnelle

## RGPD - données de mineurs

- La plateforme traite des données d'élèves mineurs (copies, évaluations, historique).
- Données sensibles concernées: textes de copies, feedback IA, progression.
- Sous-traitance externe (LLM/OCR): DPA à formaliser avec chaque fournisseur utilisé en production.
- Statut DPA (5 mars 2026): en cours de formalisation documentaire (hors dépôt applicatif).
- Statut documentaire actuel: notice de conformité technique présente, contractualisation RGPD externe à compléter (hors dépôt applicatif).
- Rétention recommandée pour copies uploadées: 24 mois maximum après dernière activité, puis suppression automatique planifiée.
- Contrôle d'accès attendu:
  - copie/rapport accessibles uniquement au propriétaire élève et rôles autorisés (enseignant/admin selon règles RBAC).

## Écarts connus

1. Résultats ZAP/perf/mutation dépendent des runs `workflow_dispatch`/`schedule`; pas exécutés en permanence sur chaque PR.
2. La conformité réglementaire formelle (RGPD/ISO, DPA signés, registre CNIL) n'est pas certifiée automatiquement par ce dépôt seul.

## Conclusion

Le socle sécurité applicative est en place et testé sur les surfaces critiques du rapport (CSRF, quotas LLM, upload, RBAC, injection). Les audits externes doivent se baser sur ces preuves techniques, pas sur les anciens rapports narratifs.
