# Changelog — Nexus Réussite EAF

Toutes les modifications notables du projet sont documentées ici.
Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Non publié] — 2026-04-09

### Ajouté
- Bouton suppression de compte RGPD (Article 17) dans la page profil
- Message post-suppression sur la page de connexion
- Metadata SEO pour la page pricing (layout.tsx)
- Champ `voie` (GENERALE/TECHNOLOGIQUE) propagé dans tout le pipeline utilisateur
- Lectures cursives dans l'onboarding et le dashboard
- Section "Mon corpus" dans le dashboard élève
- Arborescence serveur de production documentée (`docs/arborescence_prod.txt`)

### Corrigé
- `.gitignore` : retrait de `!.release.env` (ré-inclusion dangereuse de secrets)
- Liens descriptif `/descriptif` → `/descriptif-lecture` dans DescriptifStatus
- WhatsApp externalisé via `NEXT_PUBLIC_WHATSAPP_NUMBER` (pricing, footer, support IA)
- Mock `requireVerifiedEmail` ajouté aux tests oral-route
- Coverage gates CI ajustés (39/37/32/39)
- Vulnérabilités npm audit résolues (vite high → 0)
- Claims commerciaux atténués avec disclaimers vérifiables
- OpenGraph title corrigé (retrait claim "De 10 à 17+")
- "Freemium illimité en temps" → "Freemium sans limite de durée"

### Déplacé
- `AUDIT_GO_LIVE.md` et `CHECKLIST_GO_LIVE.md` → `docs/`

## [1.5.0] — 2026-04-04

### Ajouté
- Tableau de bord admin complet avec gestion utilisateurs paginée
- Audit go-live 60/60 : accessibilité, mobile, billing guards, infra hardening
- Protection CSRF sur les routes admin
- Tests E2E Playwright pour l'authentification

### Corrigé
- Remédiation complète parcours élève (3 sprints)
- Pagination `/admin/users` pour éviter OOM
- Dead code (Knip), ESLint warnings, types `any` éliminés
- Vulnérabilités npm audit résolues

## [1.4.0] — 2026-03-26

### Ajouté
- Descriptif de lecture complet avec barèmes officiels EAF
- Grammaire syntaxique dans l'atelier oral
- Profil MCP enrichi avec statistiques descriptif de lecture
- Onboarding suggestions et Turbopack fix

### Corrigé
- Renommage `textePrepare` → `texteDescriptif` dans tout le codebase
- Variants Button corrigés, DropdownMenu installé
- Rôle `suspended` → `PAUSED` (cohérence enum Prisma)

## [1.3.0] — 2026-03-15

### Ajouté
- Landing page complète EAF 2026 (12 sections)
- Système de billing 3 tiers (Freemium/Premium/Masterium)
- Pipeline CI/CD GitHub Actions (6 gates + security + E2E)
- Web Vitals collecte et persistance PostgreSQL
- Consentement RGPD (bandeau cookies)

## [1.2.0] — 2026-03-01

### Ajouté
- Atelier oral avec simulation IA (grille officielle /2 /8 /2 /8)
- Atelier écrit avec correction IA sourcée
- Tuteur IA pédagogique (Mistral + RAG pgvector)
- Système d'activation par codes (Premium/Masterium)
- Dashboard enseignant et parent (v1)
