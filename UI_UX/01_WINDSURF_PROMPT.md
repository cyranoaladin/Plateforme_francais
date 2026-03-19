# 🎯 WINDSURF CODING PROMPT — PLATEFORME FRANÇAIS LANDING PAGE

**From**: Shark (Alaeddine Ben Rhouma)  
**Target**: Plateforme_francais landing page + subscription tiers  
**Scope**: Full-stack implementation (Next.js 16.1.6 + React 19)  
**Timeline**: Sprint 7 days  
**Quality Gate**: Production-ready (WCAG AA, < 1.5s LCP, 8-12% conversion)

---

## 📋 BRIEF EXÉCUTIF

Nous lançons une plateforme de préparation EAF (Épreuves Anticipées Français) avec un modèle de subscription pédagogique. Le produit existe (stack solide, 938 tests, 47 API routes). **L'objectif**: créer une landing page premium avec branding français qui convertit 8-12% des visiteurs en utilisateurs d'essai gratuit, puis 25-30% en abonnés payants.

### Contrainte Clé
**Les noms des tiers doivent être PÉDAGOGIQUES, pas commerciaux.**

Au lieu de "Free / Premium / Pro", utilise un vocabulaire qui résonne avec les élèves et enseignants français, en lien avec la progression pédagogique.

---

## 🎨 NOMS DES TIERS (Vocabulaire Pédagogique)

### Tier 1: "Apprenti" (Free)
- **Concept**: L'élève commence son parcours, découvre la plateforme
- **Symbole**: 📚 "Débuter votre parcours"
- **Features**: 3 corrections/mois, tuteur IA basique, accès communauté
- **CTA**: "Commencer mon parcours"

### Tier 2: "Développement" (Premium) ⭐ HIGHLIGHT
- **Concept**: L'élève progresse activement, consolide ses compétences
- **Symbole**: 🚀 "Progresser vers l'excellence"
- **Features**: Illimité corrections, tuteur IA avancé, analyses vidéo, stats progression, banque examen complète
- **Price**: 12€/mois (annuel) ou 15€/mois
- **CTA**: "Essayer 7 jours gratuit"
- **Badge**: "Le plus choisi par les élèves"

### Tier 3: "Maîtrise" (Pro)
- **Concept**: L'élève vers l'excellence, coaching personnalisé 1-on-1
- **Symbole**: 👑 "Atteindre la maîtrise"
- **Features**: Tout Développement + Coaching 1-on-1 (1h/mois), simulation examen complète, révisions sur mesure IA, support prioritaire
- **Price**: 24€/mois
- **CTA**: "Accéder à la maîtrise"

---

## 🎯 BUSINESS MODEL EXISTANT (À Conserver)

Basé sur le schema Prisma actuel + modèle freemium :

```
User
  ├─ tier: "apprenti" | "developpement" | "maitrise"
  ├─ subscriptionStartDate
  ├─ subscriptionEndDate
  └─ quotaUsedThisMonth

Session (Atelier Écrit/Oral)
  ├─ accessLevel: "free" | "premium" | "pro"
  └─ tierRequired: "apprenti" | "developpement" | "maitrise"

Correction
  ├─ creditCost: 1 (apprenti), 0 (developpement+)
  ├─ feedbackDepth: "basic" | "advanced" | "expert"
  └─ teacherReview: boolean (maitrise only)
```

**À ne PAS changer**:
- Structure de base de données
- Système de quotas/crédits
- Intégrations API existantes
- Routes `/api/v1/*` existantes

---

## 💻 IMPLÉMENTATION ATTENDUE

### 1. STRUCTURE FICHIERS (Ajouter à `src/`)

```
src/
├─ app/
│  ├─ page.tsx (landing page complète)
│  ├─ layout.tsx (header sticky, footer)
│  ├─ globals.css (reset, variables)
│  └─ pricing/
│     └─ page.tsx (pricing detail, si besoin)
│
├─ components/
│  ├─ Hero.tsx
│  ├─ ValueProps.tsx
│  ├─ HowItWorks.tsx
│  ├─ Testimonials.tsx
│  ├─ Pricing.tsx
│  ├─ FAQ.tsx
│  ├─ Header.tsx (sticky nav)
│  ├─ Footer.tsx
│  └─ styles/
│     ├─ hero.module.scss
│     ├─ valueProps.module.scss
│     ├─ pricing.module.scss
│     ├─ components.module.scss
│     └─ variables.scss (couleurs, typo)
│
├─ lib/
│  └─ analytics.ts (Fathom ou Plausible)
│
└─ public/
   └─ assets/
      ├─ hero-bg.webp (hero background)
      └─ testimonials-avatars/
```

### 2. DESIGN TOKENS (Fichier Variables SCSS)

```scss
// src/components/styles/variables.scss

// COULEURS
$color-primary-dark: #1a3a8a;    // Bleu Rois (Bourbon)
$color-primary-light: #0f2a5e;   // Darker Bourbon
$color-accent-gold: #d4af37;     // Or Doré
$color-accent-cream: #f9f7f4;    // Crème Ivoire
$color-accent-green: #2d5e3f;    // Vert Sapin
$color-accent-red: #a41f3e;      // Rouge Renaissance

$color-neutral-dark: #2a2a2a;    // Charcoal
$color-neutral-gray: #7a7a7a;    // Gris Perle
$color-neutral-light: #ffffff;   // Blanc Pur

// TYPOGRAPHIE
$font-display: 'Playfair Display', serif;
$font-body: 'Inter', sans-serif;
$font-code: 'JetBrains Mono', monospace;

$font-size-xs: 0.75rem;
$font-size-sm: 0.875rem;
$font-size-base: 1rem;
$font-size-lg: 1.125rem;
$font-size-xl: 1.5rem;
$font-size-2xl: 2rem;
$font-size-3xl: 3rem;

// SPACING
$space-xs: 4px;
$space-sm: 8px;
$space-md: 16px;
$space-lg: 24px;
$space-xl: 32px;
$space-2xl: 48px;
$space-3xl: 64px;

// BREAKPOINTS
$bp-sm: 640px;
$bp-md: 768px;
$bp-lg: 1024px;
$bp-xl: 1280px;

// SHADOWS
$shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
$shadow-md: 0 8px 24px rgba(0, 0, 0, 0.12);
$shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.15);
$shadow-gold: 0 8px 24px rgba(212, 175, 55, 0.3);

// TRANSITIONS
$transition-fast: 0.15s ease-out;
$transition-base: 0.3s ease;
$transition-slow: 0.6s ease;
```

### 3. COMPONENT API (Props & Exports)

```tsx
// Hero.tsx
interface HeroProps {
  onTrialClick: () => void;
  onDemoClick: () => void;
}

// Pricing.tsx
interface PricingTier {
  id: 'apprenti' | 'developpement' | 'maitrise';
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  cta: string;
  badge?: string;
  highlight?: boolean;
  savings?: string;
}

// Testimonials.tsx
interface Testimonial {
  id: string;
  author: string;
  role: string;
  score: number;
  message: string;
  avatar: string;
}
```

### 4. KEY FEATURES À IMPLÉMENTER

#### A. Hero Section
- [ ] Vidéo/animation de fond (gradient animé + fleur de lys subtle)
- [ ] Copy principale: "Maîtrisez le français en 8 semaines"
- [ ] CTA double: "Essai gratuit" (primary) + "Voir démo" (secondary)
- [ ] Social proof: ⭐ 4.8/5 | 12,450 élèves | 94% réussite
- [ ] Scroll indicator (mouse animation)
- [ ] Responsive 100vh mobile

#### B. Value Props (3 cards)
- [ ] Icons + Hover effects
- [ ] "Tuteur IA 24/7" / "Corrections d'experts" / "Progression garantie"
- [ ] Gradient border on hover
- [ ] Icon scale animation

#### C. Pricing Section
- [ ] 3 tiers: Apprenti / Développement / Maîtrise
- [ ] Toggle annuel/mensuel (-20% savings visible)
- [ ] Highlighted "Développement" tier (scale 1.05, gold border)
- [ ] Feature list avec checkmarks
- [ ] Savings badge on annual plan

#### D. Testimonials Carousel
- [ ] 4-5 témoignages (avatars, noms, scores)
- [ ] Auto-scroll avec pause on hover
- [ ] Dot indicators
- [ ] Responsive (1 col mobile, 3 col desktop)

#### E. FAQ Section
- [ ] Accordion (smooth expand/collapse)
- [ ] 8-10 questions clés
- [ ] Search/filter optional
- [ ] Contact CTA at bottom

#### F. Analytics & Tracking
- [ ] Fathom Analytics (privacy-first)
- [ ] CTA click tracking (hero, pricing, sticky footer)
- [ ] Conversion funnel events
- [ ] Exit intent tracking

### 5. ACCESSIBILITY REQUIREMENTS

- [ ] WCAG 2.1 AA compliance
- [ ] Contrast ratio: 7:1 (gold #d4af37 on #1a3a8a ✓)
- [ ] Keyboard navigation (full)
- [ ] Focus indicators (visible)
- [ ] Alt text on all images
- [ ] Semantic HTML (header, section, article, nav)
- [ ] ARIA labels where needed
- [ ] Mobile: 48px min tap targets

### 6. PERFORMANCE TARGETS

- [ ] LCP < 1.5s (largest contentful paint)
- [ ] CLS < 0.1 (cumulative layout shift)
- [ ] FID < 100ms (first input delay)
- [ ] Images: WebP + AVIF with fallback
- [ ] Code splitting: hero only loads critical CSS
- [ ] Lazy load non-critical images
- [ ] Font optimization: system fonts + Google Fonts (async)

### 7. RESPONSIVE DESIGN

```
Mobile (< 640px):
  - Hero: Full height, centered
  - Cards: Single column
  - Pricing: Sticky primary CTA bottom
  - Pricing toggle: Full width

Tablet (640px - 1024px):
  - Cards: 2 columns
  - Pricing: 2 tiers + 1 below
  - Sticky footer: Visible

Desktop (> 1024px):
  - 3-column grids
  - Sticky header on scroll
  - Hover effects active
```

---

## 📝 IMPLÉMENTATION STEP-BY-STEP

### Phase 1: Setup & Design Tokens (Day 1-2)
1. [ ] Create `/src/components/styles/variables.scss`
2. [ ] Import Google Fonts (Playfair Display, Inter)
3. [ ] Setup Tailwind config (if using) OR pure SCSS
4. [ ] Create `/src/components/styles/components.module.scss` (base styles)

### Phase 2: Core Components (Day 3-5)
1. [ ] Hero.tsx + hero.module.scss
2. [ ] ValueProps.tsx + valueProps.module.scss
3. [ ] Pricing.tsx + pricing.module.scss
4. [ ] Testimonials.tsx + testimonials.module.scss
5. [ ] FAQ.tsx + accordion logic
6. [ ] Header.tsx (sticky nav)
7. [ ] Footer.tsx

### Phase 3: Integration & Polish (Day 6-7)
1. [ ] Assemble all components into `/app/page.tsx`
2. [ ] Add animations (framer-motion or CSS)
3. [ ] Mobile responsiveness testing
4. [ ] Analytics integration (Fathom)
5. [ ] Lighthouse audit (target > 90 performance)
6. [ ] WCAG audit (axe DevTools)
7. [ ] Deploy to staging

### Phase 4: Launch & Optimization (Post-sprint)
1. [ ] A/B test CTA copy (Essai gratuit vs Commencer maintenant)
2. [ ] A/B test colors (gold vs green for secondary CTA)
3. [ ] Heat map analysis (Hotjar or Clarity)
4. [ ] Email sequence setup (post-signup nurture)
5. [ ] Track conversion metrics daily

---

## 🎬 ANIMATIONS & MICRO-INTERACTIONS

### Entrance Animations
```jsx
// Hero content fades in on load
animation: fadeInUp 1s ease-out;

// Cards stagger on scroll
staggerChildren: 0.1,
delayChildren: 0.2,

// Pricing cards scale on hover
scale: 1.05 (Développement tier)
```

### Hover States
```scss
// Cards: Border color change + box shadow
.prop__card:hover {
  border-color: #d4af37;
  box-shadow: 0 12px 40px rgba(26, 58, 138, 0.08);
  
  .prop__icon {
    transform: scale(1.2) rotate(10deg);
  }
}

// Buttons: Color invert + translateY
.btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(212, 175, 55, 0.4);
}
```

### Loading States
```jsx
// Skeleton loaders for testimonials carousel
// Pulse animation for CTA buttons
// Stagger animation for FAQ items
```

---

## 📊 CONVERSION TRACKING

### Events to Track (Analytics)
```js
// Fathom Analytics events
fathom.trackEvent('CTA_HERO_TRIAL', { tier: 'apprenti' });
fathom.trackEvent('CTA_PRICING_SELECT', { tier: 'developpement' });
fathom.trackEvent('CTA_TESTIMONIAL_SCROLL', { position: 3 });
fathom.trackEvent('CTA_FAQ_EXPAND', { question: 'credit-system' });
fathom.trackEvent('SCROLL_DEPTH', { depth: 75 });
```

### Conversion Funnel
```
1. Page Load → Hero visible (100%)
2. Hero CTA click → Trial signup (target: 8-12%)
3. Signup → Email confirmed (target: 70%)
4. Email confirmed → First session (target: 60%)
5. First session → Plan selection (target: 40%)
6. Trial expiring → Paid conversion (target: 25-30%)
```

---

## 📦 DEPENDENCIES TO ADD

```json
{
  "devDependencies": {
    "sass": "^1.69.5"
  },
  "dependencies": {
    "framer-motion": "^10.16.4",
    "react-icons": "^4.12.0",
    "fathom-client": "^3.0.0"
  }
}
```

---

## ✅ DEFINITION OF DONE

- [ ] All components implemented & styled
- [ ] Mobile responsive (tested on iPhone 12, iPad, desktop)
- [ ] Lighthouse score > 90
- [ ] WCAG AA compliance (axe check)
- [ ] All CTAs clickable & tracked
- [ ] Images optimized (WebP, < 100KB each)
- [ ] No console errors
- [ ] Sticky header works on scroll
- [ ] Pricing toggle functional
- [ ] Email signup form connected to backend `/api/v1/auth/signup`
- [ ] A/B test framework ready (feature flags)
- [ ] Git commit with clear message

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Build passes: `npm run build`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Tests pass (if added): `npm run test`
- [ ] Preview link: staging VPS
- [ ] DNS configured: plateforme-francais.com → landing page
- [ ] SSL certificate: Let's Encrypt active
- [ ] CDN configured: Images served via Cloudflare
- [ ] Monitoring active: Sentry for errors

---

## 💬 COMMUNICATION

**Slack notifications** (if integrated):
- Day 2: Design tokens complete → Show sample hero
- Day 5: All components done → Request QA sign-off
- Day 7: Ready for launch → Schedule deployment

**Daily standup**:
- What's done (components shipped)
- Blockers (if any)
- Next steps

---

## 🎯 SUCCESS CRITERIA

✅ **Week 1**: Full landing page live with all components  
✅ **Week 2**: > 100 trial signups from landing page  
✅ **Week 3**: 25+ paid conversions (25-30% of trials)  
✅ **Week 4**: 8-12% landing page conversion rate achieved  
✅ **Month 2**: 1,000+ total trial users, 250+ paid subscribers  

---

## 📞 SUPPORT & QUESTIONS

If you (Windsurf) need:
- Mockups/Figma file → Available in workspace
- Business model details → See `/docs/BUSINESS_MODEL.md`
- Brand guidelines → `/docs/BRAND_GUIDELINES.md`
- API endpoint specs → `/docs/APIS_INTEGRATIONS_COMPLETE.md`

**Owner**: Shark (Alaeddine Ben Rhouma)  
**Escalation**: Signal/Telegram for blockers  
**Repository**: github.com/cyranoaladin/Plateforme_francais

---

## 🎨 FINAL REMINDER: PEDAGOGICAL NAMING

✅ Use: **"Apprenti"** / **"Développement"** / **"Maîtrise"**  
❌ Avoid: **"Basic"** / **"Premium"** / **"Pro"**  

The names must resonate with students' progression journey, not corporate speak. Every copy, button, and email should feel like **advancing through a learning path**, not just "upgrading a plan".

---

**Ready to ship. Let's build something beautiful.** 🇫🇷✨
