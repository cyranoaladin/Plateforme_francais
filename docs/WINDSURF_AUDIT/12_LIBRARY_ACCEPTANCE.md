# 12 - Library Acceptance

Date: 2026-03-20

## Catalogue

| Metric | Value |
|--------|-------|
| Total resources | 548 |
| Annales_EAF | 27 |
| Documents_Extraits | 160 |
| Oeuvres | 9 |
| Videos | 322 |
| eaf_rapport_jury | 30 |

**Status:** VALIDATED

## Gating

- Free user accessing first resource (within limit): **200** -- PDF served correctly.
- Free user accessing last annale (beyond limit): **403** -- `"Ressource reservee aux abonnes Premium ou Masterium."` with code `LIBRARY_UPGRADE_REQUIRED` and `upgradeUrl=/pricing`.
- Gating is per-category based on `FREE_LIBRARY_LIMITS`.

> **Note:** All 548 resources report `isFree=false` in the API response. The actual gating happens at download time based on category index position vs `FREE_LIBRARY_LIMITS`. Frontend likely uses a different mechanism to show lock icons.

**Status:** VALIDATED

## Download API

- **Endpoint:** `GET /api/v1/ressources/file?path=ressources/...`
- Returns correct MIME types (`application/pdf` verified).
- Path traversal protection: null byte rejection, `isWithinRessourcesRoot` check.
- Symlink rejection: `lstat` check.
- Range request support for media files.
- Memory event logged on download.

**Status:** VALIDATED

## Direct Access

- `GET /ressources/...` returns **404** (correct -- files are served via API only).

**Status:** VALIDATED
