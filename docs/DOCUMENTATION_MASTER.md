# Documentation Master

Dernière mise à jour: 5 mars 2026

Ce fichier centralise les liens vers la documentation canonique réellement alignée sur le code.

## Lire dans cet ordre

1. `docs/DOCUMENTATION_AUDIT_COMPLETE_INDEX.md`
2. `docs/AUDIT_REPORT_COMPLETE.md`
3. `docs/ARCHITECTURE_SYSTEM_DETAILED.md`
4. `docs/SECURITY_COMPLIANCE_COMPLETE.md`
5. `docs/TESTS_QUALITY_COMPLETE.md`
6. `docs/APIS_INTEGRATIONS_COMPLETE.md`
7. `docs/TECHNICAL_SPECIFICATIONS_COMPLETE.md`
8. `docs/DEPLOYMENT_INFRASTRUCTURE_COMPLETE.md`

## Principes

- Le code et les tests exécutables sont la source ultime.
- Les documents historiques sont conservés pour contexte, mais ne sont plus normatifs.
- Toute affirmation chiffrée doit être vérifiable par commande dans le repo.

## Vérifications rapides

```bash
find src/app/api/v1 -name 'route.ts' | wc -l
find tests -type f | wc -l
npm run typecheck
npm run test:unit -- --coverage
```
