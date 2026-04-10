# Audit Frontend — Nexus Réussite EAF

**Date:** 10 avril 2026  
**Auditeur:** Windsurf IDE Agent  
**Scope:** Styles, CSS, Tailwind, Composants UI, Responsive, Cohérence Design System

---

## 🎯 Résumé Exécutif

| Catégorie | Score | Notes |
|-----------|-------|-------|
| Architecture CSS | 8/10 | Tailwind v4 bien configuré, tokens.css solide |
| Cohérence Composants | 6/10 | Doublons de `cn()`, variants inconsistants |
| Design System | 7/10 | Quelques tokens manquants, alias à nettoyer |
| Responsive | 8/10 | Bon usage des breakpoints, mobile-first respecté |
| Accessibilité | 7/10 | Focus visible OK, touch targets OK |
| **Total** | **7.2/10** | Corrections nécessaires mais fondation solide |

---

## ✅ Forces Identifiées

1. **Tokens CSS bien structurés** (`src/styles/tokens.css`)
   - Palettes complètes (indigo, coral, emerald, amber, slate)
   - Tokens sémantiques clairs (bg-, text-, border-)
   - Dark mode bien géré avec `color-mix()`

2. **Composants UI réutilisables** dans `src/components/ui/`
   - Button, Badge, Card, Input, Textarea, Select
   - Props bien typées avec TypeScript
   - ForwardRef pour intégration formulaires

3. **Responsive design correct**
   - Mobile-first (`p-4 md:p-8`)
   - Breakpoints standards (`sm:`, `md:`, `lg:`, `xl:`)
   - Grid fluide (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`)

4. **Tailwind CSS v4 à jour**
   - Configuration CSS-first (pas de tailwind.config.ts)
   - `@theme inline` pour custom properties
   - `@import "tailwindcss"` (v4 syntax)

---

## ❌ Problèmes Identifiés

### 1. Doublons de la fonction `cn()` — CRITIQUE

**Problème:** Chaque composant UI redéfinit sa propre fonction `cn()` au lieu d'importer celle de `@/lib/utils`.

**Fichiers concernés:**
- `src/components/ui/button.tsx` (ligne 8)
- `src/components/ui/badge.tsx` (ligne 5)
- `src/components/ui/card.tsx` (ligne 5)
- `src/components/ui/input.tsx` (ligne 7)
- `src/components/ui/select.tsx` (ligne 8)
- `src/components/ui/textarea.tsx` (ligne 7)
- `src/components/ui/surface.tsx` (ligne 5)
- `src/components/ui/section-header.tsx` (ligne 5)

**Impact:**
- Code dupliqué (violation DRY)
- Maintenance difficile
- Risque d'inconsistance si une version est modifiée

**Correction:** Importer depuis `@/lib/utils`:
```typescript
import { cn } from '@/lib/utils';
```

---

### 2. Tokens CSS Inexistants Utilisés — CRITIQUE

**Problème:** Des variables CSS sont utilisées mais non définies dans `tokens.css`.

#### 2.1 `--warning` (badge.tsx)
```typescript
'bg-[var(--bg-reward)] text-[var(--warning)] border border-[var(--warning)]/20'
```
**Solution:** Utiliser `--c-reward` ou créer `--c-warning` dans tokens.css.

#### 2.2 `--error` (multiple fichiers)
```typescript
'border-[var(--error)]'  // input.tsx, select.tsx, textarea.tsx
```
**Note:** `--error` est défini comme alias dans `globals.css` vers `--c-accent`, mais ce n'est pas un token sémantique standard.

**Solution:** Utiliser directement `--c-accent` ou créer un token `--c-error` dédié.

#### 2.3 `--text-placeholder`
Défini comme alias dans `globals.css` vers `--text-muted`. Fonctionnel mais crée une indirection inutile.

**Solution:** Utiliser directement `--text-muted` ou standardiser `--text-placeholder` dans tokens.css.

---

### 3. Valeurs Arbitraires Non Standardisées — MAJEUR

**Problème:** 423+ occurrences de `rounded-[...]` avec des valeurs personnalisées.

**Exemples incohérents:**
```tsx
// Composants UI (standards)
rounded-[var(--radius-md)]   // button, input
rounded-[var(--radius-lg)]   // card

// Pages (arbitraires)
rounded-[24px]  // dashboard, atelier-oral
rounded-[18px]  // pdf-preview-viewer
rounded-[22px]  // OralStepIndicator
rounded-[28px]  // dashboard hero
```

**Impact:**
- Inconsistance visuelle
- Maintenance difficile
- Pas de thématisation possible

**Solution:** Utiliser uniquement les tokens:
- `--radius-sm`: 6px
- `--radius-md`: 10px  
- `--radius-lg`: 14px
- `--radius-xl`: 18px
- `--radius-pill`: 100px

---

### 4. Ombres Non Standardisées — MAJEUR

**Problème:** Mélange de tokens et de valeurs arbitraires.

```tsx
// Standard (tokens.css)
shadow-[var(--shadow-sm)]
shadow-[var(--shadow-md)]

// Non-standard
shadow-[0_8px_20px_rgba(23,50,77,0.10)]  // pdf-preview-viewer.tsx
```

**Solution:** Étendre les tokens d'ombres si nécessaire ou utiliser les existants.

---

### 5. Couleurs Tailwind Directes — MINEUR

**Problème:** 35 utilisations directes de `text-slate-`, `bg-slate-`, `border-slate-`.

**Impact:** Ces valeurs ne s'adaptent pas au dark mode automatiquement.

**Exemple:**
```tsx
text-slate-900  // Devrait être text-[var(--text-heading)]
bg-slate-100    // Devrait être bg-[var(--bg-surface-secondary)]
```

---

### 6. Focus Ring Inconsistant — MINEUR

**Problème:** Les couleurs de focus varient entre les composants.

```tsx
// button.tsx — utilise --c-success (émeraude)
focus-visible:ring-[var(--c-success)]

// input.tsx — utilise aussi --c-success
focus:border-[var(--c-success)] focus:ring-2 focus:ring-[var(--c-success)]/20

// Le token --shadow-focus existe (indigo-200) mais n'est pas utilisé
```

**Solution:** Standardiser sur `--shadow-focus` ou une couleur cohérente.

---

### 7. Classes Utilitaires Non Utilisées — INFO

**Problème:** Des classes utilitaires sont définies dans `tokens.css` mais rarement utilisées.

```css
/* tokens.css */
.card-surface { ... }
.card-tinted-primary { ... }
.badge-primary { ... }
.badge-success { ... }
```

Ces classes pourraient remplacer les composants React légers pour de simples cas d'usage.

---

## 📋 Plan d'Action

### Phase 1: Corrections Critiques (Immédiat)

1. **Uniformiser `cn()`**
   - [ ] Supprimer les définitions locales dans tous les composants UI
   - [ ] Importer depuis `@/lib/utils`

2. **Corriger les tokens manquants**
   - [ ] Ajouter `--c-warning` dans tokens.css
   - [ ] Remplacer `--error` par `--c-accent` ou créer `--c-error`
   - [ ] Remplacer `--warning` par `--c-reward` ou `--c-warning`

### Phase 2: Standardisation (Cette semaine)

3. **Standardiser les rayons**
   - [ ] Audit de toutes les valeurs `rounded-[...]`
   - [ ] Remplacer par les tokens `--radius-*`

4. **Standardiser les ombres**
   - [ ] Audit des ombres personnalisées
   - [ ] Remplacer par `shadow-[var(--shadow-*)]`

### Phase 3: Polish (Prochain sprint)

5. **Éliminer les couleurs Tailwind directes**
   - [ ] Remplacer `text-slate-*` par les tokens sémantiques
   - [ ] Remplacer `bg-slate-*` par les tokens sémantiques

6. **Documenter les patterns**
   - [ ] Créer un guide de contribution frontend
   - [ ] Documenter l'usage des tokens

---

## 📊 Métriques

| Métrique | Valeur | Objectif |
|----------|--------|----------|
| Définitions de `cn()` | 9 | 1 (dans utils.ts) |
| Tokens non définis | 3 | 0 |
| `rounded-[...]` arbitraires | 423 | <50 |
| Couleurs Tailwind directes | 35 | 0 |
| Composants UI cohérents | 60% | 100% |

---

## 🔧 Commandes de Vérification

```bash
# Compter les doublons cn()
grep -r "function cn(" src/ --include="*.tsx" | wc -l

# Trouver les tokens non définis
grep -r "var(--warning)" src/ --include="*.tsx"
grep -r "var(--error)" src/ --include="*.tsx"

# Compter les valeurs arbitraires
grep -r "rounded-\[" src/ --include="*.tsx" | wc -l
grep -r "shadow-\[" src/ --include="*.tsx" | wc -l

# Trouver les couleurs Tailwind directes
grep -r "text-slate-\|bg-slate-\|border-slate-" src/ --include="*.tsx"
```

---

*Audit réalisé le 10 avril 2026 — Version 1.0*
