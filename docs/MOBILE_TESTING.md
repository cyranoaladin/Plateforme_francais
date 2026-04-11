# Tests Mobile Responsive — Nexus Réussite

## 📱 Stratégie de test mobile

**Mobile = Découverte + Conversion · PC = Utilisation réelle**

La landing page mobile est conçue pour la conversion (inscription), pas pour l'utilisation des ateliers. Les tests valident cette stratégie.

---

## 🧪 Suite de tests créée

### 1. Tests E2E — Landing Mobile Responsive
**Fichier:** `tests/e2e/landing-mobile-responsive.spec.ts`

Couverture par device (iPhone SE, iPhone 14, Galaxy S20):
- ✅ Navbar mobile (hamburger, CTA "Gratuit")
- ✅ Menu mobile (overlay, liens, note PC)
- ✅ Hero (titre 36px, banner PC, carte démo masquée < 480px)
- ✅ Stats (scroll horizontal avec snap)
- ✅ Méthode (stack vertical, ligne connexion)
- ✅ Ateliers (tabs scrollables)
- ✅ Comparaison (4 différences clés simplifiées)
- ✅ Témoignages (carousel swipe)
- ✅ Dashboard (toggle Élève/Parent, 3 KPIs)
- ✅ Pricing (cards empilées, Premium en tête)
- ✅ FAQ (accordion, question mobile spécifique)
- ✅ Footer CTA (note PC visible)
- ✅ MobilePcBanner (apparition à 60% scroll)
- ✅ Performance (LCP < 2.5s, pas de CLS)

### 2. Tests E2E — Workflow Mobile Conversion
**Fichier:** `tests/e2e/workflows/07-landing-mobile-conversion.spec.ts`

Parcours utilisateur complet:
- Découverte → Compréhension PC → Inscription
- Menu mobile navigation complète
- Banner sticky interaction
- Message PC à 3 endroits
- Performance metrics (LCP, CLS)

### 3. Tests E2E — Accessibilité Mobile
**Fichier:** `tests/e2e/mobile-accessibility.spec.ts`

WCAG 2.1 AA compliance:
- Touch targets ≥ 44×44px
- Contraste suffisant
- Navigation clavier
- Screen reader support
- Headings hiérarchiques
- Labels formulaires
- Zoom 200% support
- `prefers-reduced-motion`
- Safe areas (notch)

### 4. Tests E2E — Visual Regression
**Fichier:** `tests/e2e/mobile-visual-regression.spec.ts`

Screenshots sur:
- iPhone SE (375×667)
- iPhone 14 (390×844)
- iPhone 14 Pro Max (430×932)
- Pixel 7 (412×915)

Sections capturées:
- Hero, Stats, Ateliers, Pricing
- Menu ouvert, Dashboard toggle
- Banner sticky visible

### 5. Tests Unitaires — Composants Mobile
**Fichier:** `tests/unit/components/landing/mobile-responsive.test.tsx`

Couverture composants:
- `StickyNav` — menu hamburger, overlay
- `MobilePcBanner` — logique scroll 60%
- `MethodSteps` — 3 étapes, stack vertical
- `FAQSection` — question mobile, accordion
- `DashboardToggle` — toggle Élève/Parent
- `SocialProofStrip` — 98%, étoiles
- `ComparisonTable` — différences ChatGPT/Nexus
- `WorkshopTabs` — 4 onglets, changement
- `Footer` — liens essentiels
- `FooterCTA` — CTA final, note PC
- `Hero` — titre, CTA, trust badges

---

## 🚀 Exécution des tests

### Tests unitaires
```bash
# Tous les tests unitaires
npm test

# Tests landing mobile uniquement
npm test -- tests/unit/components/landing/mobile-responsive.test.tsx
```

### Tests E2E
```bash
# Nécessite: base de données PostgreSQL en cours d'exécution

# Tous les tests E2E
npm run test:e2e

# Tests landing mobile uniquement
npx playwright test tests/e2e/landing-mobile-responsive.spec.ts

# Workflow mobile conversion
npx playwright test tests/e2e/workflows/07-landing-mobile-conversion.spec.ts

# Accessibilité mobile
npx playwright test tests/e2e/mobile-accessibility.spec.ts

# Avec UI
npx playwright test --ui
```

### Tests spécifiques à un device
```bash
# iPhone 14 uniquement
npx playwright test --project="Mobile Safari"

# Pixel 5 uniquement
npx playwright test --project="Mobile Chrome"
```

---

## 📊 Configuration Playwright

**Fichier:** `playwright.config.ts`

Devices configurés:
- `chromium` — Desktop (default)
- `Mobile Chrome` — Pixel 5
- `Mobile Safari` — iPhone 14
- `iPhone SE` — 375×667
- `iPad` — Tablette

---

## ✅ Checklist validation mobile

### Layout
- [ ] Pas de scroll horizontal (overflow-x: hidden)
- [ ] Grille CSS adaptative (flex/grid avec breakpoints)
- [ ] Images responsives (max-width: 100%)
- [ ] Typography lisible (font-size ≥ 16px pour inputs)

### Navigation
- [ ] Menu hamburger sur < 1024px
- [ ] Swipe gestures sur carousels
- [ ] Touch targets ≥ 44×44px
- [ ] Retour haut de page accessible

### Performance
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] Pas de layout shift au chargement
- [ ] Images lazy-loadées sauf LCP

### Accessibilité
- [ ] Focus visible
- [ ] Contraste WCAG AA
- [ ] Alt text sur images
- [ ] ARIA labels sur boutons icônes

### Messages PC (stratégie clé)
- [ ] Menu mobile: note "ordinateur requis"
- [ ] Hero: banner 🖥️ visible
- [ ] Footer CTA: note finale
- [ ] Banner sticky: apparaît à 60% scroll

---

## 🐛 Erreurs courantes et solutions

| Erreur | Solution |
|--------|----------|
| `Touch target too small` | Augmenter padding à 12px minimum |
| `Horizontal scroll` | Vérifier `max-width: 100%` sur images, `overflow-x: hidden` sur body |
| `Text too small` | Utiliser `font-size: 16px` minimum pour inputs (évite zoom iOS) |
| `CLS too high` | Dimensions fixes sur images, éviter injection contenu post-render |
| `Menu not opening` | Vérifier z-index, backdrop-filter support |

---

## 🔧 Maintenance

### Ajouter un nouveau device
```typescript
// playwright.config.ts
{
  name: 'Samsung Galaxy',
  use: { ...devices['Galaxy S9+'] },
  testMatch: /landing-mobile/,
}
```

### Ajouter un test E2E
```typescript
// tests/e2e/landing-mobile-responsive.spec.ts
test('Ma nouvelle feature mobile', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('mon-selecteur')).toBeVisible();
});
```

### Mettre à jour les snapshots
```bash
npx playwright test --update-snapshots
```

---

## 📈 Couverture

| Type | Fichiers | Tests |
|------|----------|-------|
| E2E Mobile | 4 | ~50 |
| Unit Composants | 1 | 30+ |
| Total | 5 | 80+ |

---

**Dernière mise à jour:** Avril 2026
**Responsable:** Kimi Code CLI
