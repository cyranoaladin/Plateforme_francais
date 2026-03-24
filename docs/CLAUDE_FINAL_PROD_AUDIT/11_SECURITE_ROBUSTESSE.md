# PHASE 11 — SÉCURITÉ ET ROBUSTESSE

## 1. En-têtes HTTP

`curl -I https://eaf.nexusreussite.academy/` retourne:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Content-Security-Policy: ... frame-ancestors 'none' ...`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(self), geolocation=()`

## 2. Cookies et CSRF

| Contrôle | Résultat |
| --- | --- |
| `eaf_session` | `HttpOnly`, `Secure`, `SameSite=Lax` |
| `eaf_role` | `HttpOnly`, `Secure`, `SameSite=Lax` |
| `eaf_csrf` | `Secure`, `SameSite=Lax` |
| Mutation sensible sans `X-CSRF-Token` | `403`, code `CSRF_INVALID` |

## 3. Fichiers et chemins sensibles

| Test | Résultat |
| --- | --- |
| `/.env` | `404` |
| `/prisma/schema.prisma` | `404` |
| Path traversal `--path-as-is` vers `/etc/passwd` via API resources | pas de fuite, redirection auth |
| Null byte via API resources | `400` |

## 4. Exposition réseau et clones parallèles

| Contrôle | Résultat |
| --- | --- |
| Ports publics | `22`, `80`, `443` |
| Ports applicatifs internes | `3000`, `3100`, `5432`, `5433`, `5435`, `6379`, `11434` sur loopback |
| Netlify zombie | `404` |
| Vercel zombie | `404`, `x-vercel-error: DEPLOYMENT_NOT_FOUND` |

## 5. Dépendances et chaîne logicielle

- `npm audit --audit-level=high` retourne maintenant `found 0 vulnerabilities` après correction `A12-03` sur `fast-xml-parser`.

## Conclusion

Aucune faille bloquante n'a été reproduite sur les surfaces de sécurité contrôlées pendant cette session. Les protections HTTP, CSRF, RBAC, la non-exposition des ports critiques et l'audit de dépendances sont conformes sur l'état final mesuré.
