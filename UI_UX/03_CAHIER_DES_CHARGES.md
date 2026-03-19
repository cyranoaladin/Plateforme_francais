# 📋 CAHIER DES CHARGES — PLATEFORME FRANÇAIS

**Document**: Cahier des Charges Complet  
**Date**: 8 mars 2026  
**Projet**: Landing Page + Subscription Landing Page  
**Budget**: 1 sprint (7 jours)  
**Équipe**: 1 Dev (Windsurf) + 1 Designer (Figma)  

---

## 1. CONTEXTE & OBJECTIFS

### Contexte
La Plateforme Français (EAF - Épreuves Anticipées Français) est une solution pédagogique pour la préparation des épreuves de français. Le produit core existe (Next.js 16.1.6, 47 API routes, 938 tests). Nous lançons commercialement avec un modèle de subscription pédagogique.

### Objectifs Primaires
1. **Conversion**: 8-12% des visiteurs landing page → trial signup
2. **Retention**: 25-30% des trial users → paid subscribers (mois 1)
3. **Branding**: Premium, français, pédagogique (pas commercial)
4. **Performance**: Lighthouse > 90, LCP < 1.5s, WCAG AA

### Objectifs Secondaires
- 1,000+ trial users en mois 1
- 250+ paid subscribers en mois 2
- NPS > 40
- Viral coefficient > 1.1 (referral loop)

---

## 2. PÉRIMÈTRE FONCTIONNEL

### Pages à Créer

#### 2.1 Landing Page (`/`)
- Hero section (100vh, animation, social proof)
- Value props (3 colonnes: Tuteur IA, Corrections expertes, Progression)
- How it works (4 étapes timeline)
- Testimonials carousel (4-5 témoignages)
- Pricing tiers (Apprenti / Développement / Maîtrise)
- FAQ accordion (8-10 questions)
- Sticky header + CTA button
- Footer (links, legal, social)

#### 2.2 Pricing Page (`/pricing`)
- Detail tiers (expanded view)
- Feature comparison table
- FAQ specific pricing
- Contact CTA

#### 2.3 Signup Flow (`/signup`)
- Email + password form
- Social login (Google, Apple)
- Email verification
- Onboarding (3 steps)
- First assignment

### Pages à Connecter (Existantes)
- `/login`
- `/atelier-ecrit` (need tier check)
- `/atelier-oral` (need tier check)
- `/tuteur-ia` (need tier check)
- `/dashboard` (need tier display)

### Fonctionnalités Clés
- **Auth**: Signup → Email verification → Dashboard
- **Tier Selection**: Show pricing tiers, allow upgrade
- **Trial Management**: 7-day free trial counter
- **Analytics**: Track conversion funnel (Fathom)
- **Email**: Nurture sequence (7 jours post-signup)

---

## 3. NOMS TIERS (PÉDAGOGIQUES)

### ❌ À Éviter (Commercial)
- Basic / Premium / Pro
- Starter / Standard / Business
- Silver / Gold / Platinum

### ✅ À Utiliser (Pédagogique)

| Tier | Nom | Symbole | Description |
|------|-----|---------|-------------|
| Free | **Apprenti** | 📚 | Débuter votre parcours |
| Premium | **Développement** | 🚀 | Progresser vers l'excellence |
| Pro | **Maîtrise** | 👑 | Atteindre la maîtrise |

---

## 4. ARCHITECTURE TECHNIQUE

### 4.1 Stack
```
Frontend:
  - Next.js 16.1.6
  - React 19
  - TypeScript
  - SCSS modules
  - Framer Motion (animations)
  - Fathom Analytics

Backend (Existant):
  - Next.js API routes
  - Prisma ORM
  - PostgreSQL
  - Redis (cache)
```

### 4.2 Nouvelle Structure
```
src/
├─ app/
│  ├─ page.tsx (landing page)
│  ├─ layout.tsx (header, footer)
│  ├─ pricing/
│  │  └─ page.tsx
│  └─ globals.css
├─ components/
│  ├─ Hero.tsx
│  ├─ ValueProps.tsx
│  ├─ HowItWorks.tsx
│  ├─ Testimonials.tsx
│  ├─ Pricing.tsx
│  ├─ FAQ.tsx
│  ├─ Header.tsx
│  ├─ Footer.tsx
│  └─ styles/
│     ├─ variables.scss
│     └─ *.module.scss
└─ lib/
   └─ analytics.ts
```

### 4.3 API Endpoints Utilisés
- `POST /api/v1/auth/signup` (new user)
- `POST /api/v1/auth/verify-email` (verification)
- `GET /api/v1/user/subscription` (tier check)
- `POST /api/v1/subscription/upgrade` (change tier)

---

## 5. DESIGN SYSTEM

### 5.1 Couleurs
```
PRIMAIRE:
  Bleu Rois (Bourbon): #1a3a8a
  Bleu Foncé: #0f2a5e

ACCENT:
  Or Doré: #d4af37
  Crème Ivoire: #f9f7f4
  Vert Sapin: #2d5e3f
  Rouge Renaissance: #a41f3e

NEUTRAL:
  Charcoal: #2a2a2a
  Gris Perle: #7a7a7a
  Blanc Pur: #ffffff
```

### 5.2 Typographie
```
Display: Playfair Display (serif)
Body: Inter (sans-serif)
Mono: JetBrains Mono (code)

Font sizes:
  H1: 3-4.5rem (clamp)
  H2: 2-2.5rem
  H3: 1.5rem
  Body: 1rem
  Small: 0.875-0.95rem
```

### 5.3 Spacing
```
xs: 4px   | sm: 8px   | md: 16px  | lg: 24px
xl: 32px  | 2xl: 48px | 3xl: 64px
```

### 5.4 Components
- Button (primary, secondary, ghost)
- Card (with hover effects)
- Input (form fields)
- Badge (tier labels)
- Accordion (FAQ)
- Carousel (testimonials)

---

## 6. CONTENU & MESSAGING

### 6.1 Copy Principale

**Hero Headline:**
```
"Maîtrisez le français en 8 semaines"
(sous-titre) "Tuteur IA 24/7 + Corrections d'experts + Progression garantie"
```

**Value Props:**
```
1. Tuteur IA 24/7
   "Feedback immédiat et personnalisé sur vos brouillons"
   Highlight: "Correction en < 30 secondes"

2. Corrections d'experts
   "Vérification par des professeurs certifiés EAF"
   Highlight: "100% des copies vérifiées"

3. Progression garantie
   "Trajectoire pédagogique adaptée à votre niveau"
   Highlight: "+15 points en moyenne"
```

**CTA Copy:**
```
Primary: "Essai gratuit 7 jours" (no credit card)
Secondary: "Voir la démo"
Sticky: "Commencer maintenant"
Pricing: "Essayer [tier_name] gratuitement"
```

### 6.2 Testimonials (Structure)
```
{
  author: "Sarah M.",
  role: "Élève en Terminale",
  score: 18, // EAF score
  message: "J'ai augmenté de 18 points en 6 semaines!",
  avatar: "sarah.jpg"
}
```

### 6.3 FAQ Topics
```
1. Comment fonctionne le tuteur IA?
2. Puis-je annuler mon abonnement?
3. Qu'est-ce qui est inclus dans chaque tier?
4. Combien de corrections AI par mois?
5. Où est la correction par un expert?
6. Est-ce que ça prépare bien à l'EAF?
7. Comment ça marche la période d'essai gratuit?
8. Peut-on upscaler d'un tier à l'autre?
9. Y a-t-il des ressources supplémentaires?
10. Comment contacter le support?
```

---

## 7. SPÉCIFICATIONS DE DESIGN

### 7.1 Hero Section
```
Layout: Full viewport (100vh)
Background: Animated gradient + Video
Content: Centered, max 700px
Overlay: 50% opacity Bourbon blue
Animations: Fade-in-up on load (1s ease-out)
Scroll indicator: Mouse animation at bottom
CTA: Sticky on mobile scroll
```

### 7.2 Pricing Cards
```
Layout: 3-column grid (mobile: 1 col)
Highlight: Développement tier (scale 1.05, gold border)
Badge: "Le plus choisi par les élèves"
Features: Checkmarks + text
Toggle: Annuel/Mensuel (-20% visible)
Savings: "Économisez X€/an" badge
```

### 7.3 Testimonials
```
Layout: Carousel (3 visible desktop, 1 mobile)
Auto-scroll: 4s interval, pause on hover
Dots: Visible, clickable
Avatar: 80px circle, border
Score: Display star rating + numerical score
Responsive: Adjust visible count per breakpoint
```

---

## 8. ACCESSIBILITÉ (WCAG 2.1 AA)

### 8.1 Requirements
- Contrast ratio: 7:1 (especially gold on blue)
- Keyboard navigation: Full site navigable
- Focus indicators: Visible (2px outline)
- Alt text: All images
- ARIA labels: Interactive elements
- Semantic HTML: header, nav, section, article
- Color not only cue: Icons + text
- Form labels: Associated with inputs
- Skip link: "Skip to main content"

### 8.2 Testing
- axe DevTools (Chrome extension)
- NVDA screen reader (Windows)
- Lighthouse audit (Chrome DevTools)
- Manual keyboard test

---

## 9. PERFORMANCE TARGETS

### 9.1 Core Web Vitals
- **LCP** (Largest Contentful Paint): < 1.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### 9.2 Lighthouse
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

### 9.3 Optimizations
- Image: WebP + AVIF with fallback, lazy-load
- CSS: Critical path (hero only), async non-critical
- JS: Code-split by route, minify
- Font: System fonts + async Google Fonts
- Cache: Headers, CDN (Cloudflare)

---

## 10. ANALYTICS & TRACKING

### 10.1 Events (Fathom Analytics)
```
CTA_HERO_TRIAL
CTA_HERO_DEMO
CTA_PRICING_SELECT (tier: 'apprenti' | 'developpement' | 'maitrise')
CTA_PRICING_UPGRADE
CTA_FAQ_EXPAND
CTA_TESTIMONIAL_SCROLL
SCROLL_DEPTH (25%, 50%, 75%, 100%)
TIME_ON_PAGE
FORM_SUBMIT (signup)
FORM_ERROR
```

### 10.2 Conversion Funnel
```
Landing Page View (100%)
  → Hero CTA Click (target: 20%)
    → Signup Page Load (target: 15%)
      → Email Entered (target: 12%)
        → Form Submitted (target: 10%)
          → Email Verified (target: 8%)
            → Select Tier (target: 8%)
              → Trial Active (target: 8%)
                → First Assignment (target: 5%)
                  → Upgrade to Paid (target: 1.5-2%)
```

### 10.3 Daily Metrics
- Unique visitors
- Conversion rate (visitor → trial)
- Trial signups
- Email verification rate
- Tier selection distribution
- Trial → Paid conversion rate
- Bounce rate
- Avg time on page

---

## 11. EMAIL SEQUENCES

### 11.1 Signup Confirmation (Day 0)
```
Subject: "Bienvenue sur Plateforme Français!"
Content:
  - Welcome message
  - Verify email link
  - Quick start guide
  - Link to demo
```

### 11.2 Progress Update (Day 3)
```
Subject: "Vous avez progressé de 12%!"
Content:
  - Personalized progress stats
  - Next assignment
  - Premium feature showcase (soft upsell)
  - Success story from similar user
```

### 11.3 Trial Expiring (Day 5)
```
Subject: "Votre essai gratuit expire bientôt"
Content:
  - Days remaining
  - Choose your plan CTA
  - Feature comparison (Apprenti vs Développement)
  - 20% discount for annual (limited time)
  - Testimonial from premium user
```

### 11.4 Last Chance (Day 7)
```
Subject: "Dernière chance: conservez votre progression"
Content:
  - Time running out (urgent)
  - Data loss warning (lose progress if don't convert)
  - Final tier recommendation
  - Money-back guarantee (30 days)
  - Support contact
```

### 11.5 Abandoned Checkout (Day 1 after expiry)
```
Subject: "Votre progrès vous attend..."
Content:
  - Account status
  - Reactivate trial option
  - Special offer (25% off first month)
  - Why users choose Plateforme Français
  - Contact for help
```

---

## 12. A/B TEST STRATEGY

### Phase 1: CTA Copy (Week 1-2)
```
Variant A: "Essai gratuit 7 jours"
Variant B: "Commencer mon essai gratuit"
Variant C: "Accès gratuit pendant 7 jours"

Metric: Click-through rate, signup rate
Sample: 1,000 visitors per variant
Duration: 2 weeks
Winner: Deploy
```

### Phase 2: Hero Headline (Week 3-4)
```
Variant A: "Maîtrisez le français en 8 semaines"
Variant B: "Préparez-vous efficacement à l'EAF"
Variant C: "Augmentez votre score de français"

Metric: Scroll depth, CTR
Sample: 1,000 visitors per variant
Winner: Deploy
```

### Phase 3: Pricing Layout (Week 5-6)
```
Variant A: Développement highlighted (scale 1.05)
Variant B: Développement with "Best Value" badge only
Variant C: Annual discount prominent at top

Metric: Tier selection rate, conversion to paid
Sample: 500 trial users per variant
Winner: Deploy
```

### Phase 4: Testimonial Slider (Week 7+)
```
Variant A: Auto-scroll 4s
Variant B: Manual dots only
Variant C: Auto-scroll 8s

Metric: Engagement, time on testimonials section
Sample: 2,000 visitors per variant
Winner: Keep or combine
```

---

## 13. RESPONSIVE DESIGN SPECS

### Mobile (< 640px)
- Single column layout
- Hero: 100vh, centered text
- Cards: Stacked, full width
- Pricing: Sticky primary CTA bottom (48px)
- Images: 100% width, responsive
- Font: Slightly smaller (2.5rem → 2rem H1)
- Tap targets: 48px minimum
- Margin: 16-24px instead of 32-48px

### Tablet (640px - 1024px)
- 2-column grids where applicable
- Pricing: 2 cards above, 1 below
- Cards: 2 columns (testimonials, value props)
- Hero: 80vh instead of 100vh
- Font: Scale between mobile & desktop
- Sticky footer: Visible

### Desktop (> 1024px)
- 3-column grids
- Hero: 100vh
- Hover effects: Card scale, icon rotate
- Sticky header: On scroll
- Full font sizes
- Generous spacing (48-64px)

---

## 14. BRANDING GUIDELINES

### 14.1 Visual Identity
- **Essence**: Elegant, French, pedagogical
- **Color**: Bourbon blue + gold accents
- **Typography**: Playfair (luxury) + Inter (clarity)
- **Imagery**: Educational, diversity, success moments
- **Tone**: Confident, encouraging, expert

### 14.2 Logo Usage
- Logo + tagline: Landing page header
- Logo alone: Mobile header
- Favicon: Fleur de lys symbol
- Social: Square avatar (logo + gold circle)

### 14.3 Photography Guidelines
- Real students (diverse, genuine expressions)
- Classroom/study moments (not stock photo-y)
- Success celebrations (progress, achievements)
- Color palette: Warm lighting, French aesthetic
- No cheesy stock photos

### 14.4 Copy Tone
- Formal but warm
- Second person ("Vous", "Your")
- Action-oriented ("Commencer", "Progresser")
- Empowering ("Maîtrise", "Excellence")
- Avoid: Corporate jargon, American colloquialisms

---

## 15. TIMELINE & MILESTONES

### Sprint Week 1
**Mon-Tue**: Design tokens + Hero component
**Wed-Thu**: Value props, How it works, Testimonials
**Fri**: Pricing section, integrate all

### Sprint Week 2
**Mon**: FAQ, Footer, Header (sticky)
**Tue-Wed**: Animations, responsive refinements
**Thu**: Performance optimization, accessibility audit
**Fri**: Launch staging, A/B test setup

### Post-Launch
**Week 2-3**: Monitor analytics, adjust copy/colors
**Week 3-4**: Launch A/B tests (CTA copy)
**Week 5-6**: Scale paid ads based on conversion
**Month 2**: Expand email sequences, add social proof

---

## 16. BUDGET & RESOURCES

### Team
- 1 Frontend Dev (Windsurf)
- 1 Designer (Figma)
- 1 Product Manager (Shark)
- 1 Data Analyst (tracking)

### Tools
- Figma (design)
- Windsurf (coding)
- Fathom Analytics (tracking)
- VPS (Nginx + PM2) (deployment)
- GitHub (version control)
- Hotjar (heatmaps, optional)

### Cost Estimate
```
Design (Figma): 0h (in-house)
Development (Windsurf): 40h sprint
QA/Testing: 8h
Deployment: 4h
Analytics setup: 4h
─────────────────
Total: 56h (~1 week)

Monthly:
  Fathom: $14
  VPS: $20
  Hotjar: $32 (optional)
  ─────────
  Total: $66/month
```

---

## 17. SUCCESS CRITERIA & GO/NO-GO

### Launch Gate (Day 7)
- [ ] Lighthouse > 90 on all metrics
- [ ] WCAG AA compliance (axe zero errors)
- [ ] No TypeScript errors
- [ ] Mobile responsive tested (iPhone, iPad, desktop)
- [ ] All CTAs tracked in analytics
- [ ] Email sequence configured
- [ ] 3 A/B tests scheduled
- [ ] Support contact ready

### KPI Targets (Month 1)
- [ ] 8-12% landing page → trial conversion
- [ ] > 1,000 trial signups
- [ ] 70% email verification rate
- [ ] 40% tier selection completion
- [ ] 25-30% trial → paid conversion (250+ subscribers)
- [ ] NPS > 40
- [ ] Bounce rate < 30%
- [ ] Avg time on page > 2min

### Long-term (Month 3)
- [ ] 3,000+ trial users
- [ ] 750+ paid subscribers
- [ ] $9,000 MRR (at $12/user avg)
- [ ] 35% paid retention (month 1 → month 2)
- [ ] 1.2+ viral coefficient (referrals)

---

## 18. CONTINGENCY & RISKS

### Risks
1. **Performance**: LCP > 1.5s due to video
   → Solution: Lazy-load video, optimize compression

2. **Conversion**: < 5% trial signup rate
   → Solution: A/B test CTA copy, adjust hero headline

3. **Mobile**: Bounce rate > 40% on mobile
   → Solution: Simplify mobile layout, optimize readability

4. **Tier selection**: Users unsure which plan to choose
   → Solution: Add quiz/recommendation engine, add "Best for You" badge

### Escalation
- Technical blockers: Shark (daily standup)
- Design feedback: Product/Design sync (2x weekly)
- Launch delays: Communicate + extend sprint

---

## 19. SIGN-OFF & APPROVAL

**Document Approved By:**
- [ ] Product Manager (Shark)
- [ ] Tech Lead (Windsurf)
- [ ] Designer (Design team)
- [ ] QA Lead (Testing team)

**Date Approved**: ___________
**Version**: 1.0
**Next Review**: Post-launch (Week 2)

---

**Document prepared by**: OpenClaw-Prime  
**Date**: 8 mars 2026  
**Confidentiality**: Internal Use Only
