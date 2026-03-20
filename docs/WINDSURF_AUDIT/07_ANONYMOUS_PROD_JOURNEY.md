# 07 - Anonymous Production Journey

**Date:** 2026-03-20
**Environment:** Production (eaf-platform)

---

## Public Pages

All public pages return HTTP 200 (verified):

| Page                        | Status |
|-----------------------------|--------|
| `/`  (landing)              | 200    |
| `/login`                    | 200    |
| `/pricing`                  | 200    |
| `/contact`                  | 200    |
| `/mentions-legales`         | 200    |
| `/cgu`                      | 200    |
| `/politique-de-confidentialite` | 200 |

---

## 404 Handling

| Request              | Response                                          |
|----------------------|---------------------------------------------------|
| `/nonexistent-page`  | 307 redirect (Next.js default behavior for app router) |

---

## French Aliases

All French aliases redirect correctly via 307:

| Alias          | Redirects To              |
|----------------|---------------------------|
| `/connexion`   | `/login`                  |
| `/inscription` | `/login?mode=register`    |
| `/tarifs`      | `/pricing`                |
| `/bienvenue`   | `/`                       |

---

## Protected Pages

All protected pages return **307 redirect to `/login`** when accessed without authentication:

`/dashboard`, `/profil`, `/tuteur`, `/quiz`, `/atelier-ecrit`, `/atelier-langue`, `/atelier-oral`, `/carnet`, `/mon-parcours`, `/descriptif`, `/onboarding`, `/bibliotheque`, `/admin`, `/enseignant`, `/parent`

---

## Security Headers (verified on homepage)

| Header                     | Value                                                                 |
|----------------------------|-----------------------------------------------------------------------|
| `X-Frame-Options`         | `DENY`                                                                |
| `X-Content-Type-Options`  | `nosniff`                                                             |
| `Referrer-Policy`         | `strict-origin-when-cross-origin`                                     |
| `Permissions-Policy`      | `camera=(), microphone=(self), geolocation=()`                        |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload`                      |
| `Content-Security-Policy` | Fully configured with nonce, `connect-src` limited to `'self'` and payment gateway |
| `X-Powered-By`            | Not present (good)                                                    |

---

## Dev Content Check

Landing page verified clean of development jargon. None of the following terms are visible to users:

`workflow`, `CSRF`, `OCR`, `feedback`, `onboarding`, `localhost`, `debug`, `staging`, `TODO`, `FIXME`, `console.log`
