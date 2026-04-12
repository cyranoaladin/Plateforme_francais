# STRATÉGIE MÉMOIRE DURABLE PRODUCTION
**Version:** 1.0.0  
**Date:** 2026-04-12

---

## DÉCISION FINALE: Option A - Fallback JSON interdit pour données métier critiques

Les données métier critiques DOIVENT résider exclusivement en PostgreSQL.

---

## DONNÉES CONCERNÉES

| Type de données | Table DB | Fallback JSON | Statut |
|----------------|----------|---------------|--------|
| Profil élève | `StudentProfile` | - | ✅ DB uniquement |
| Mémoire événements | `MemoryEvent` | `memory-store.json` | ⚠️ À migrer |
| Timeline | `TimelineEvent` | - | ✅ DB uniquement |
| Sessions orales | `OralSession` | `oral-sessions.json` | ⚠️ À migrer |
| Copies/Épreuves | `Copie` | `epreuves-store.json` | ⚠️ À migrer |
| Abonnements | `Subscription` | `premium-store.json` | ✅ DB uniquement |
| Codes activation | `ActivationCode` | - | ✅ DB uniquement |

---

## MIGRATION REQUISE

### Avant production (ou immédiatement)

```bash
# 1. Exécuter la migration
bash scripts/migrate-json-stores-to-db.sh

# 2. Vérifier la cohérence
bash scripts/check-memory-prod.sh

# 3. Si OK, archiver les JSON
mv /opt/eaf/shared/data/*.json /opt/eaf/shared/backups/json-archive-$(date +%Y%m%d)/
```

---

## VÉRITÉ SOURCE UNIQUE

```
┌─────────────────────────────────────┐
│         POSTGRESQL                  │
│   (seule source de vérité)          │
└─────────────────────────────────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
┌───▼──┐  ┌──▼───┐  ┌──▼────┐
│ Web  │  │Worker│  │RAG/LLM│
└──────┘  └──────┘  └───────┘
```

---

## GARANTIES

1. **Atomicité:** Toute écriture métier est une transaction DB
2. **Durabilité:** PostgreSQL avec WAL (Write-Ahead Log)
3. **Cohérence:** Foreign keys et contraintes
4. **Backup:** pg_dump quotidien

---

## FALLBACKS AUTORISÉS (NON CRITIQUES)

| Usage | Type | Durée de vie |
|-------|------|--------------|
| Cache Redis | Volatile | TTL configuré |
| Files temporaires | Local | Session uniquement |
| Logs applicatifs | Fichiers | Rotation 30j |

---

## SUPPRESSION DES FALLBACKS JSON

Après migration réussie:

```bash
# Archiver (ne pas supprimer immédiatement)
mkdir -p /opt/eaf/shared/backups/json-archive-$(date +%Y%m%d)
mv /opt/eaf/shared/data/memory-store.json /opt/eaf/shared/backups/json-archive-$(date +%Y%m%d)/
mv /opt/eaf/shared/data/oral-sessions.json /opt/eaf/shared/backups/json-archive-$(date +%Y%m%d)/
mv /opt/eaf/shared/data/epreuves-store.json /opt/eaf/shared/backups/json-archive-$(date +%Y%m%d)/
mv /opt/eaf/shared/data/premium-store.json /opt/eaf/shared/backups/json-archive-$(date +%Y%m%d)/

# Vérifier qu'il ne reste que les répertoires
ls -la /opt/eaf/shared/data/
```

---

## MONITORING

```bash
# Vérifier quotidiennement
bash scripts/check-memory-prod.sh
```

Alertes si:
- Fichiers JSON réapparaissent
- Divergence DB vs attente
- Erreurs de persistance
