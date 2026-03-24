# PHASE 6 — BIBLIOTHÈQUE, RESSOURCES, STREAMING

## Défauts corrigés

| ID | Commit | Défaut | Preuve de retest prod |
| --- | --- | --- | --- |
| `A06-01` | `2812daa` | un Freemium pouvait télécharger un média premium par ID | le même appel retourne désormais `403` avec `LIBRARY_UPGRADE_REQUIRED` |
| `A06-02` | `896b06a` | `/api/v1/ressources` exposait le catalogue complet anonymement avec chemins internes | sans session: `401`; catalogue authentifié sanitisé sans `filePath`/`url` |
| `A06-03` | `bc94cbb` | le streaming média ignorait `Range` et envoyait le fichier complet | `206 Partial Content`, `accept-ranges: bytes`, `content-range` présent |

## Contrôles de sécurité retenus

| Test | Résultat |
| --- | --- |
| Path traversal `--path-as-is /api/v1/resources/../../../etc/passwd` | pas de fuite, redirection `307` vers `/login?redirect=%2Fetc%2Fpasswd` |
| Null byte `/api/v1/resources/fichier%00.pdf` | `400` |
| Accès catalogue sans auth | `401` |
| Accès direct à un média premium par utilisateur Free | `403` |

## Conclusion

Le gating back-end et le streaming HTTP des ressources sont alignés avec les plans visibles. Aucun chemin disque interne n'est exposé par l'API catalogue.
