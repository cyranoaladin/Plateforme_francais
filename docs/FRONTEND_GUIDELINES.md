# Guidelines Frontend — Nexus Réussite EAF

Guide de développement frontend pour maintenir la cohérence du design system.

---

## 🎨 Design System

### Tokens CSS (Source de vérité)

Tous les styles doivent utiliser les tokens définis dans `src/styles/tokens.css`.

#### Couleurs disponibles

```css
/* Primaires (Indigo) */
var(--c-primary)           /* Boutons principaux */
var(--c-primary-hover)     /* Hover */
var(--c-primary-subtle)    /* Fonds légers */

/* Accent (Corail) */
var(--c-accent)            /* Erreurs, alertes */
var(--c-accent-hover)      /* Hover */
var(--c-accent-subtle)     /* Fonds d'erreur */

/* Succès (Émeraude) */
var(--c-success)           /* Validation, oral */
var(--c-success-subtle)    /* Fonds de succès */

/* Récompense (Ambre) */
var(--c-reward)            /* Gamification, streaks */
var(--c-reward-subtle)     /* Fonds dorés */

/* Textes */
var(--text-heading)        /* Titres */
var(--text-body)           /* Corps de texte */
var(--text-secondary)      /* Texte secondaire */
var(--text-muted)          /* Texte atténué, placeholders */
var(--text-on-primary)     /* Texte sur fond primaire */

/* Arrière-plans */
var(--bg-page)             /* Fond de page */
var(--bg-surface)          /* Cartes, inputs */
var(--bg-surface-secondary) /* Fonds secondaires */

/* Bordures */
var(--border-default)      /* Bordures standard */
var(--border-strong)       /* Bordures accentuées */
```

#### Rayons (Border Radius)

```css
var(--radius-sm)   /* 6px  — Petits éléments */
var(--radius-md)   /* 10px — Boutons, inputs */
var(--radius-lg)   /* 14px — Cartes */
var(--radius-xl)   /* 18px — Modales, panels */
var(--radius-pill) /* 100px — Badges, pills */
```

**❌ Ne jamais utiliser:**
```tsx
// Valeurs arbitraires non standardisées
<div className="rounded-[24px]">  
<div className="rounded-[18px]">
```

**✅ Toujours utiliser:**
```tsx
<div className="rounded-[var(--radius-lg)]">
<div className="rounded-[var(--radius-xl)]">
```

#### Ombres

```css
var(--shadow-sm)  /* Subtile */
var(--shadow-md)  /* Standard */
var(--shadow-focus) /* Focus ring */
```

---

## 🧩 Composants UI

### Import de `cn()`

**❌ Ne jamais redéfinir:**
```tsx
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}
```

**✅ Toujours importer:**
```tsx
import { cn } from '@/lib/utils';
```

### Création d'un nouveau composant UI

1. **Utiliser les composants existants comme modèle:**
   ```bash
   cp src/components/ui/button.tsx src/components/ui/mon-composant.tsx
   ```

2. **Structure obligatoire:**
   ```tsx
   'use client';  // Si nécessaire
   
   import * as React from 'react';
   import { cn } from '@/lib/utils';
   
   // Maps de styles
   const variantStyles = { ... };
   const sizeStyles = { ... };
   
   // Types
   export type MonComposantVariant = keyof typeof variantStyles;
   
   // Interface
   export interface MonComposantProps {
     variant?: MonComposantVariant;
     // ...
   }
   
   // Composant avec forwardRef
   const MonComposant = React.forwardRef<...>(...);
   MonComposant.displayName = 'MonComposant';
   
   export { MonComposant };
   ```

3. **Props standard à inclure:**
   - `className?: string` — Pour la personnalisation externe
   - `variant?: Variant` — Pour les variations visuelles
   - `size?: Size` — Pour les tailles (si applicable)

---

## 📱 Responsive Design

### Approche Mobile-First

**✅ Correct:**
```tsx
<div className="p-4 md:p-6 lg:p-8">  {/* Mobile d'abord */}
<div className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
```

**❌ Incorrect:**
```tsx
<div className="lg:p-8 p-4">  {/* Desktop d'abord */}
```

### Breakpoints

| Breakpoint | Min-width | Usage |
|------------|-----------|-------|
| `sm:` | 640px | Tablettes petites |
| `md:` | 768px | Tablettes |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Grands écrans |

### Patterns courants

```tsx
// Conteneur responsive
<div className="mx-auto max-w-7xl px-4 md:px-8">

// Grille adaptative
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

// Flex direction
<div className="flex flex-col gap-4 sm:flex-row sm:items-center">

// Texte adaptatif
<h1 className="text-2xl sm:text-3xl lg:text-4xl">
```

---

## ♿ Accessibilité

### Focus Visible

Tous les éléments interactifs doivent avoir un style de focus visible:

```tsx
<button className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-primary)] focus-visible:ring-offset-2">
```

### Touch Targets (Mobile)

Les cibles tactiles doivent faire au moins 44×44px:

```tsx
// Déjà configuré dans globals.css via @media (pointer: coarse)
<button className="min-h-11 min-w-11">  {/* 44px */}
```

### Réduction de mouvement

```tsx
// Respecte prefers-reduced-motion (déjà dans globals.css)
.animate-pulse  /* Éviter ou utiliser avec précaution */
```

## Couleurs de texte selon le fond

### FOND DARK-NAVY

- H1 : `#FFFFFF` ou classe `.text-on-dark-h1`
- Sous-titres : `rgba(255,255,255,0.72)` ou `.text-on-dark-body`
- Labels : `rgba(255,255,255,0.50)` ou `.text-on-dark-label`
- Muted : `rgba(255,255,255,0.35)` ou `.text-on-dark-muted`

### JAMAIS sur fond dark

- `var(--eaf-text-primary)` = noir light-mode
- `var(--eaf-text-secondary)` = gris light-mode
- `var(--eaf-text-tertiary)`
- `var(--eaf-border)` pour les ghost buttons
- `var(--eaf-orange)` pour les H1/H2

### --eaf-orange = CTAs et alertes UNIQUEMENT

Jamais pour les titres. Toujours pour les boutons, badges d'alerte, icônes.

---

## 🎯 Bonnes Pratiques

### Imports

```tsx
// ✅ Ordonnés: externes → internes absolus → internes relatifs
import * as React from 'react';                    // React
import { Loader2 } from 'lucide-react';             // Librairies
import { cn } from '@/lib/utils';                   // Alias @/
import { Card } from '@/components/ui';             // Composants UI
import { MonHook } from '@/hooks/monHook';          // Hooks
import { MonUtil } from './utils';                  // Relatif
```

### Classes Tailwind

```tsx
// ✅ Ordonné: Layout → Apparence → Interactivité → État
<button className={cn(
  // Layout
  'flex items-center justify-center gap-2',
  // Apparence  
  'rounded-[var(--radius-md)] bg-[var(--c-primary)] text-white',
  // Interactivité
  'transition-all duration-[var(--transition-normal)]',
  // État
  'hover:bg-[var(--c-primary-hover)] disabled:opacity-50',
  className  // Personnalisation externe en dernier
)}>
```

### Typographie

```tsx
// ✅ Utiliser les font variables
<h1 className="font-display">     /* Playfair Display */
<p className="font-serif">        /* Merriweather */
<code className="font-mono">      /* JetBrains Mono */
<span className="font-sans">      /* Inter (défaut) */
```

---

## 🧪 Tests Visuels

### Checklist avant commit

- [ ] Le composant fonctionne en dark mode
- [ ] Les contrastes respectent WCAG AA (4.5:1 minimum)
- [ ] Les touch targets sont ≥44px sur mobile
- [ ] Le focus est visible sur tous les éléments interactifs
- [ ] Aucune valeur arbitraire (`rounded-[24px]`, `shadow-[0_8px_...]`)
- [ ] `cn()` est importé depuis `@/lib/utils`

### Commandes de vérification

```bash
# Vérifier les doublons cn()
grep -r "function cn(" src/components --include="*.tsx"

# Compter les valeurs arbitraires
grep -r "rounded-\[" src --include="*.tsx" | wc -l

# Trouver les couleurs Tailwind directes
grep -r "text-slate-\|bg-slate-" src --include="*.tsx"
```

---

## 📚 Ressources

- [Design Tokens](/src/styles/tokens.css)
- [Styles Globaux](/src/app/globals.css)
- [Composants UI](/src/components/ui/)
- [Audit Frontend](/docs/AUDIT_FRONTEND.md)

---

*Dernière mise à jour: 10 avril 2026*
