# 01 - Frontend Routes Audit

> Generated: 2026-03-20
> Source: `src/app/` directory scan + `middleware.ts`

---

## Middleware Overview (`middleware.ts`)

### PUBLIC_PATHS (no session cookie required)

| Path | Notes |
|------|-------|
| `/` | Landing / home page |
| `/login` | Auth page (login, register, forgot, reset modes) |
| `/bienvenue` | Redirects to `/` (canonical alias) |
| `/pricing` | Pricing plans page |
| `/contact` | Contact form |
| `/paiement/confirmation` | Payment confirmation callback |
| `/paiement/refus` | Payment refusal callback |
| `/mentions-legales` | Legal notices |
| `/cgu` | Terms of service |
| `/politique-de-confidentialite` | Privacy policy |
| `/_next` | Next.js static assets (prefix match) |
| `/images` | Static images (prefix match) |
| `/favicon.ico` | Favicon |
| `/ressources` | Resources (prefix match) |

### CANONICAL_ALIAS_PATHS (redirect to `/`)

| Alias | Target |
|-------|--------|
| `/bienvenue` | `/` |
| `/landing` | `/` |

### FRENCH_ALIASES (redirect to canonical English paths)

| French Alias | Redirects To |
|--------------|-------------|
| `/connexion` | `/login` |
| `/inscription` | `/login?mode=register` |
| `/tarifs` | `/pricing` |

### Auth enforcement

- Non-public frontend routes without `eaf_session` cookie -> redirect to `/login?redirect=<path>`
- Non-public API routes without `eaf_session` cookie -> 401 JSON response
- No client-side role guards exist in any `page.tsx`; role enforcement is API-side only

---

## All Frontend Routes (page.tsx files)

### 1. Public - Landing & Marketing

| Path | Has page.tsx | Layout | Access | Role Required | Category |
|------|-------------|--------|--------|---------------|----------|
| `/` | Yes | Root layout | Public | None | landing |
| `/bienvenue` | Yes (redirects to `/`) | Root layout | Public | None | redirect |
| `/(public)/landing` | Yes (redirects to `/`) | Root layout | Public | None | redirect |

### 2. Public - Auth

| Path | Has page.tsx | Layout | Access | Role Required | Category |
|------|-------------|--------|--------|---------------|----------|
| `/login` | Yes | Root layout | Public | None | auth |

**Note:** Login page handles multiple modes via query param: `login`, `register`, `forgot`, `reset`.

### 3. Public - Legal

| Path | Has page.tsx | Layout | Access | Role Required | Category |
|------|-------------|--------|--------|---------------|----------|
| `/cgu` | Yes | Root layout | Public | None | legal |
| `/mentions-legales` | Yes | Root layout | Public | None | legal |
| `/politique-de-confidentialite` | Yes | Root layout | Public | None | legal |

### 4. Public - Billing / Pricing

| Path | Has page.tsx | Layout | Access | Role Required | Category |
|------|-------------|--------|--------|---------------|----------|
| `/pricing` | Yes | Root layout | Public | None | billing |
| `/paiement/confirmation` | Yes | Root layout | Public | None | billing |
| `/paiement/refus` | Yes | Root layout | Public | None | billing |

### 5. Public - Contact

| Path | Has page.tsx | Layout | Access | Role Required | Category |
|------|-------------|--------|--------|---------------|----------|
| `/contact` | Yes | Root layout | Public | None | contact |

### 6. Protected - Student (eleve) Pages

| Path | Has page.tsx | Layout | Access | Role Required | Category |
|------|-------------|--------|--------|---------------|----------|
| `/dashboard` | Yes | Root layout | Protected (session) | None (client-side) | student |
| `/onboarding` | Yes | Root layout | Protected (session) | None (client-side) | student |
| `/profil` | Yes | Root layout | Protected (session) | None (client-side) | student |
| `/mon-parcours` | Yes | Root layout | Protected (session) | None (client-side) | student |
| `/descriptif` | Yes | Root layout | Protected (session) | None (client-side) | student |
| `/atelier-ecrit` | Yes | Root layout | Protected (session) | None (client-side) | student |
| `/atelier-ecrit/correction/[copieId]` | Yes | Root layout | Protected (session) | None (client-side) | student |
| `/atelier-langue` | Yes | Root layout | Protected (session) | None (client-side) | student |
| `/atelier-oral` | Yes | Root layout | Protected (session) | None (client-side) | student |
| `/bibliotheque` | Yes | Root layout | Protected (session) | None (client-side) | student |
| `/carnet` | Yes | Root layout | Protected (session) | None (client-side) | student |
| `/quiz` | Yes | Root layout | Protected (session) | None (client-side) | student |
| `/tuteur` | Yes | Root layout | Protected (session) | None (client-side) | student |

**Note:** These pages have NO client-side role guard. Any authenticated user can access the page shell. Role enforcement happens at the API layer when data is fetched.

### 7. Protected - Teacher (enseignant) Page

| Path | Has page.tsx | Layout | Access | Role Required | Category |
|------|-------------|--------|--------|---------------|----------|
| `/enseignant` | Yes | Root layout | Protected (session) | `enseignant` (API-side only) | teacher |

**Note:** The page itself has no client-side role check. It calls `/api/v1/enseignant/dashboard` which uses `requireUserRole('enseignant')`. A non-teacher user will see the page skeleton but API calls will return 403.

### 8. Protected - Parent Page

| Path | Has page.tsx | Layout | Access | Role Required | Category |
|------|-------------|--------|--------|---------------|----------|
| `/parent` | Yes | Root layout | Protected (session) | None (client-side) | parent |

**Note:** Uses `useDashboard` hook which fetches `/api/v1/memory/timeline`. No explicit parent role guard exists on either the page or the API endpoint. Any authenticated user could access this page and see data.

### 9. Protected - Admin Page

| Path | Has page.tsx | Layout | Access | Role Required | Category |
|------|-------------|--------|--------|---------------|----------|
| `/admin` | Yes | Root layout | Protected (session) | `admin` (API-side only) | admin |

**Note:** The page shell renders for any authenticated user. All data-fetching API routes (`/api/v1/admin/stats`, `/api/v1/admin/users`, `/api/v1/admin/activation-codes`, `/api/v1/admin/manual-payment`) enforce `requireUserRole('admin')`. A non-admin user sees the page skeleton but all API calls return 403.

---

## Layout Structure

Only one layout file exists:

| File | Scope |
|------|-------|
| `src/app/layout.tsx` | Root layout - wraps all pages |

There are **no nested layouts**. The `(public)` route group has no dedicated layout.

---

## Route Group Summary

| Route Group | Directory | Purpose |
|-------------|-----------|---------|
| `(public)` | `src/app/(public)/` | Contains `/landing` which redirects to `/`. No layout. |

---

## Dynamic Routes

| Pattern | File | Description |
|---------|------|-------------|
| `/atelier-ecrit/correction/[copieId]` | `src/app/atelier-ecrit/correction/[copieId]/page.tsx` | View AI correction for a specific student copy |

---

## French Route Naming Convention

All frontend routes use French naming:

| English Concept | French Route |
|-----------------|-------------|
| Dashboard | `/dashboard` (kept in English) |
| Writing workshop | `/atelier-ecrit` |
| Oral workshop | `/atelier-oral` |
| Language workshop | `/atelier-langue` |
| Library | `/bibliotheque` |
| Notebook | `/carnet` |
| My path / progress | `/mon-parcours` |
| Description (exam texts) | `/descriptif` |
| Profile | `/profil` |
| Teacher | `/enseignant` |
| Tutor (AI chat) | `/tuteur` |
| Payment | `/paiement` |
| Welcome | `/bienvenue` |
| Terms of service | `/cgu` |
| Legal notices | `/mentions-legales` |
| Privacy policy | `/politique-de-confidentialite` |
| Login | `/login` (kept in English) |
| Pricing | `/pricing` (kept in English) |
| Quiz | `/quiz` (kept in English) |
| Onboarding | `/onboarding` (kept in English) |

---

## Audit Findings

### FINDING-01: No client-side role guards on any page

**Severity:** Medium
**Details:** All role enforcement is API-side only. The `/admin`, `/enseignant`, and `/parent` page components render their shell (headers, skeletons) for ANY authenticated user. Only when API calls fail with 403 does the user see an error state. This means:
- Admin page UI skeleton is visible to all authenticated users
- Teacher page UI skeleton is visible to all authenticated users
- There is no redirect-to-dashboard behavior for unauthorized roles

**Recommendation:** Add client-side role checks (e.g., via an auth context or a shared `useRequireRole()` hook) that redirect unauthorized users before rendering the page.

### FINDING-02: `/parent` route has no role guard at all

**Severity:** Medium
**Details:** Unlike `/admin` (which guards via `requireUserRole('admin')` on its APIs) and `/enseignant` (which guards via `requireUserRole('enseignant')` on its APIs), the `/parent` page fetches from `/api/v1/memory/timeline` -- an endpoint that does NOT enforce a `parent` role. Any authenticated user can access the parent dashboard and see the same data as their own dashboard.

**Recommendation:** Either add `requireUserRole('parent')` to the parent-specific API endpoints, or document that the parent view is intentionally available to all authenticated users.

### FINDING-03: Single layout, no nested auth layout

**Severity:** Low
**Details:** There is no dedicated authenticated layout that wraps protected routes (e.g., with a sidebar/navbar). All pages share the root layout. This is a design choice but means there is no structural separation between public and protected page shells.

### FINDING-04: `(public)` route group is vestigial

**Severity:** Low
**Details:** The `(public)` route group only contains `/landing` which immediately redirects to `/`. It has no layout file. It serves no functional purpose and could be removed.

### FINDING-05: French aliases are limited

**Severity:** Info
**Details:** Only three French aliases are defined (`/connexion`, `/inscription`, `/tarifs`). Other French-named routes (like `/atelier-ecrit`) are the primary routes, not aliases. This is consistent but worth noting for SEO or localization planning.

---

## Total Route Count

| Category | Count |
|----------|-------|
| Public pages | 10 (including 2 redirects) |
| Protected student pages | 13 |
| Protected teacher pages | 1 |
| Protected parent pages | 1 |
| Protected admin pages | 1 |
| **Total page.tsx files** | **26** |
| French aliases (middleware redirects) | 3 |
| Canonical alias redirects | 2 |
