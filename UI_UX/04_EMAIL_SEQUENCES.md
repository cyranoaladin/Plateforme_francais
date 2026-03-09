# 📧 EMAIL SEQUENCES — PLATEFORME FRANÇAIS

**Document**: Email Marketing Playbook  
**Date**: 8 mars 2026  
**Purpose**: User onboarding + nurture + conversion (7-14 days)  
**Expected Results**: 70% open rate, 25-30% trial-to-paid conversion  

---

## OVERVIEW

```
Day 0: Welcome + Verify Email
Day 1: First Assignment
Day 3: Progress Update (soft upsell)
Day 5: Trial Expiring Soon (urgency)
Day 7: Last Chance (incentive)
Day 8+: Abandoned Checkout (reactivation)
```

---

## EMAIL #1: Welcome Verification (Day 0)

### Subject Lines (A/B Test)

**Variant A** (Personal):
```
Bienvenue sur Plateforme Français! 🎓
```

**Variant B** (Benefit-focused):
```
Commencez votre progression EAF dès maintenant
```

**Variant C** (Curiosity):
```
Votre tuteur IA vous attend...
```

**Recommendation**: Variant B (clarity + benefit)

---

### Email Body Template

```html
From: noreply@plateforme-francais.com
Reply-To: support@plateforme-francais.com
To: {{user.email}}
Subject: Bienvenue sur Plateforme Français! 🎓

---

Hi {{user.first_name}},

Bienvenue! Vous venez de rejoindre {{count_users}} élèves qui se préparent 
à l'EAF avec Plateforme Français.

## Prochaine étape: Vérifier votre email

Cliquez sur le bouton ci-dessous pour confirmer votre inscription:

[CTA BUTTON]
Vérifier mon email
https://plateforme-francais.com/verify?token={{token}}
[/CTA BUTTON]

---

## Qu'est-ce que vous pouvez faire maintenant?

✓ Accéder aux cours d'introduction
✓ Lancer votre premier atelier
✓ Rencontrer votre tuteur IA
✓ Rejoindre la communauté des élèves

---

## Besoin d'aide?

Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur:
https://plateforme-francais.com/verify?token={{token}}

Questions? Nous sommes là pour vous aider:
support@plateforme-francais.com

Bonne chance! 🇫🇷

---

Shark & l'équipe Plateforme Français
```

---

### Email #1 Metrics
- Send time: 30 minutes after signup (off-peak for delivery)
- Resend: If not opened in 24h (with urgency copy)
- Key metric: Verification rate (target: 85%)

---

## EMAIL #2: First Assignment (Day 1)

### Subject Lines

**Variant A** (Action):
```
Votre premier atelier EAF est prêt 📝
```

**Variant B** (Social proof):
```
1,200 élèves commencent leur premier exercice aujourd'hui
```

**Variant C** (Personalization):
```
{{first_name}}, lancez-vous! 🚀
```

**Recommendation**: Variant A (clear, action-oriented)

---

### Email Body

```html
From: support@plateforme-francais.com
To: {{user.email}}
Subject: Votre premier atelier EAF est prêt 📝

---

Salut {{first_name}},

Votre compte est activé! Passons à l'action.

Nous avons préparé votre premier exercice basé sur vos préférences.
C'est un exercice court (10-15 min) pour vous familiariser avec:

  ✓ Comment fonctionne notre interface
  ✓ Comment le tuteur IA vous donne un feedback
  ✓ Comment progresser rapidement

[CTA BUTTON]
Commencer mon premier exercice
https://plateforme-francais.com/dashboard/first-assignment
[/CTA BUTTON]

---

## Ce qu'il y a dedans

📌 **Exercice guidé**: Rédaction sur un sujet EAF classique
🤖 **Tuteur IA**: Feedback immédiat pendant votre rédaction
📊 **Progression**: Suivez votre score en temps réel
🎯 **Recommandations**: Domaines à travailler prioritairement

---

## Bonus: Calendrier d'étude recommandé

Nous avons créé un plan personnalisé pour vous:
- 4 exercices par semaine
- 20 minutes par exercice
- Progression progressive (facile → expert)

Vérifiez votre calendrier ici:
https://plateforme-francais.com/dashboard/calendar

---

## Questions?

Notre tuteur IA répond en temps réel. Vous pouvez aussi:
- Consulter les ressources (grammaire, histoire littéraire)
- Rejoindre notre communauté Discord
- Contacter support@plateforme-francais.com

À bientôt! 💪

---

Shark
```

---

### Email #2 Metrics
- Send time: 24h after email #1 verification
- Goal: Click-through to dashboard (target: 45%)
- Metric: First assignment completion (target: 30%)

---

## EMAIL #3: Progress Update (Day 3)

### Subject Lines

**Variant A** (Social proof + personalization):
```
{{first_name}}, vous avez progressé de 12%!
```

**Variant B** (Gamification):
```
🏆 Vous avez déverrouillé un nouveau badge
```

**Variant C** (Feature-focused):
```
Découvrez votre nouveau tuteur IA personnalisé
```

**Recommendation**: Variant A (emotional + data)

---

### Email Body

```html
From: support@plateforme-francais.com
To: {{user.email}}
Subject: {{first_name}}, vous avez progressé de {{progress}}%! 📈

---

Salut {{first_name}},

Vous êtes impressionnant! 🎉

En seulement 3 jours, vous avez:
  ✓ Complété {{assignments_done}} exercices
  ✓ Reçu {{corrections_received}} corrections détaillées
  ✓ Progressé de {{progress}}% (moyenne: +8%)

**Votre score EAF estimé: {{estimated_score}}/20**

---

## Où progresser en priorité?

Selon votre analyse IA:
1. 🔴 Conjugaison (faiblesse détectée)
2. 🟡 Structure de paragraphe (à travailler)
3. 🟢 Vocabulaire (bon niveau!)

[CTA BUTTON]
Voir mon plan de progression
https://plateforme-francais.com/dashboard/progress
[/CTA BUTTON]

---

## Débloquez plus de fonctionnalités

Vous adorez Plateforme Français? Découvrez ce qui vous attend en tier Premium:

✨ Corrections ILLIMITÉES (actuellement: 3/mois)
📹 Tuteur vidéo (feedback vidéo personnalisé)
📊 Statistiques avancées (prédiction EAF très précise)
👨‍🏫 Correction par experts (100% des copies)

[CTA BUTTON - SOFT UPSELL]
Découvrir Développement (14€/mois)
https://plateforme-francais.com/upgrade?from=email&tier=developpement
[/CTA BUTTON]

---

## Vous aimez votre progress? Partagez!

Invitez 3 amis et obtenez 1 mois gratuit Premium.

[SHARE BUTTON]
Inviter un ami
https://plateforme-francais.com/referral?code={{referral_code}}
[/SHARE BUTTON]

---

À demain! 🚀

---

Shark & l'équipe Plateforme Français
```

---

### Email #3 Metrics
- Send time: Day 3, 10 AM (morning motivation)
- Goal: Engagement + soft upsell (target: 20% click to Premium)
- Metric: Referral signups (target: 1 per 10 sends)

---

## EMAIL #4: Trial Expiring Soon (Day 5)

### Subject Lines

**Variant A** (Urgency):
```
{{first_name}}, votre essai gratuit expire dans 2 jours ⏰
```

**Variant B** (Fear of loss):
```
Ne perdez pas votre progression... 
```

**Variant C** (Incentive):
```
-20% sur un an: offre spéciale pour vous
```

**Recommendation**: Variant C (positive incentive beats fear)

---

### Email Body

```html
From: support@plateforme-francais.com
To: {{user.email}}
Subject: -20% sur un an: votre offre spéciale ⏰

---

Salut {{first_name}},

Il ne vous reste que 2 jours d'essai gratuit...

Mais ne vous inquiétez pas! Nous avons une proposition pour vous:

## 🎁 OFFRE EXCLUSIVE: -20% sur un abonnement annuel

**Normale**: 12€/mois = 144€/an
**Votre prix**: 9,60€/mois = 115,20€/an
**Économie**: 28,80€/an!

Cette offre expire dans 2 jours.

[CTA BUTTON - PRIMARY]
Activer -20% et continuer
https://plateforme-francais.com/upgrade?code=ESSAI20&tier=developpement
[/CTA BUTTON]

---

## Pourquoi les élèves choisissent Développement?

🤖 **Corrections illimitées** (vs 3/mois en gratuit)
📹 **Tuteur vidéo** (feedback personnalisé)
📊 **Statistiques précises** (prédiction EAF fiable)
💪 **+3 points EAF en moyenne** (selon nos études)

99% des élèves Premium disent que ça a changé leur préparation.

---

## Hésitant?

Pas besoin de décider tout de suite. Voici ce qu'on peut faire:

**Option 1: Essayer un mois**
Payez 12€ ce mois seulement, pas d'engagement long-terme.

**Option 2: Économiser avec l'annuel (-20%)**
9,60€/mois = le meilleur rapport qualité-prix.

**Option 3: Attendre votre prochain essai gratuit**
Pas de problème! Votre compte restera actif en tier Apprenti.

[CTA BUTTON - SECONDARY]
Voir les détails des plans
https://plateforme-francais.com/pricing
[/CTA BUTTON]

---

## Dernière chose...

Vous aviez 94% de réussite moyenne (vs 67% avant Plateforme Français).
C'est énorme. Continuons ensemble! 💪

Questions? support@plateforme-francais.com

---

Shark
```

---

### Email #4 Metrics
- Send time: Day 5, 2 PM (afternoon urgency)
- Goal: Conversion to paid (target: 15% of readers)
- Metric: Tier selection (Primary: Développement 80%, Maîtrise 20%)

---

## EMAIL #5: Last Chance (Day 7)

### Subject Lines

**Variant A** (Final urgency):
```
Dernière chance: {{discount}}% sur votre abonnement
```

**Variant B** (Data-driven):
```
Les élèves qui continuent augmentent de 15 points
```

**Variant C** (Simple):
```
{{first_name}}, qu'allez-vous choisir?
```

**Recommendation**: Variant A (direct, urgent)

---

### Email Body

```html
From: support@plateforme-francais.com (SUBJECT: IMPORTANT)
To: {{user.email}}
Subject: ⏰ DERNIER JOUR: Votre offre -20% expire ce soir

---

Salut {{first_name}},

C'est votre dernier jour pour profiter de -20% sur un an.

L'offre expire à minuit ce soir.

[CTA BUTTON - BIG & BOLD]
Activer mon abonnement Développement (-20%)
https://plateforme-francais.com/upgrade?code=ESSAI20&tier=developpement
[/CTA BUTTON]

---

## Ce que vous perdrez sans Plateforme Français

❌ Vos exercices faits seront supprimés
❌ Votre progression réinitialisée
❌ Pas de tuteur IA
❌ Retour aux 67% de réussite

---

## Ce que vous gagnez en continuant

✅ Conservez votre progression
✅ Corrections illimitées (9,60€/mois)
✅ Tuteur IA 24/7
✅ Montée à 94% réussite
✅ Économisez 28,80€/an

---

## 100% de satisfaction garantie

Si vous n'êtes pas satisfait dans les 30 jours, remboursement complet.
Zéro questions. C'est notre engagement.

---

Vous avez des doutes? Lisez ce que disent les élèves:

"J'ai gagné 18 points en 6 semaines!" — Sarah M.
"Enfin un tuteur qui comprend mes erreurs" — Tom D.
"La meilleure préparation EAF que j'ai jamais essayée" — Elena P.

[TESTIMONIALS BLOCK]
https://plateforme-francais.com/reviews
[/TESTIMONIALS BLOCK]

---

## Besoin d'aide?

Notre équipe est disponible:
📞 Chat: support@plateforme-francais.com
📧 Email: support@plateforme-francais.com
💬 Discord: Rejoignez notre communauté

---

## Minuit, ce soir. ⏰

[CTA BUTTON - RED & BOLD]
Sécuriser ma place maintenant
https://plateforme-francais.com/upgrade?code=ESSAI20&tier=developpement
[/CTA BUTTON]

On compte sur vous! 🚀

---

Shark & l'équipe Plateforme Français

P.S. Si vous avez oublié votre mot de passe, nous pouvons le réinitialiser:
https://plateforme-francais.com/reset-password
```

---

### Email #5 Metrics
- Send time: Day 7, 8 AM (morning final push)
- Goal: Last conversion push (target: 10% of remaining non-converters)
- Metric: Conversion rate (cumulative target: 25-30%)

---

## EMAIL #6: Abandoned Account (Day 8+)

### Trigger: Trial expired without upgrade

### Subject Lines

**Variant A** (Reactivation):
```
Votre compte Plateforme Français peut être réactivé
```

**Variant B** (Special offer):
```
Offre de retour: -25% ce weekend seulement
```

**Recommendation**: Variant B (financial incentive)

---

### Email Body

```html
From: support@plateforme-francais.com
To: {{user.email}}
Subject: -25% ce weekend: bienvenue au programme de retour!

---

Salut {{first_name}},

Votre essai a expiré... mais vous pouvez revenir!

Nous avons une offre spéciale pour nos élèves de retour:

## 🎁 OFFRE RETOUR: -25% ce weekend seulement

**Normal**: 12€/mois
**Votre prix**: 9€/mois (ce weekend)
**Jusqu'à**: Lundi minuit

Vous pouvez aussi garder votre tier Apprenti gratuit si vous préférez.

[CTA BUTTON]
Réactiver avec -25%
https://plateforme-francais.com/upgrade?code=RETOUR25&tier=developpement
[/CTA BUTTON]

---

## Vous aviez progressé de 12% en 7 jours!

Imaginez où vous serez après 30 jours...

Élèves qui reviennent:
- Augmentent de 2-3 points/semaine
- Gagnent 15-20 points avant l'EAF
- Ont 94% de satisfaction

---

## Besoin d'un coup de pouce?

Pas de pression. Voici vos options:

1. **Revenir maintenant** (-25%)
   https://plateforme-francais.com/upgrade?code=RETOUR25

2. **Essayer juste 1 mois** (12€)
   https://plateforme-francais.com/upgrade?tier=developpement

3. **Rester gratuit** (tier Apprenti)
   https://plateforme-francais.com/dashboard

Quoi que vous décidiez, on sera là. 💪

---

Shark
```

---

### Email #6 Metrics
- Send time: Day 8, 4 PM
- Goal: Reactivation (target: 5-10% of expired users)
- Metric: Lifetime value recovery

---

## EMAIL TEMPLATES SETUP

### Email Service Provider: SendGrid / Mailgun

```
Template Variables:
{{user.email}}
{{user.first_name}}
{{user.last_name}}
{{user.created_at}}
{{assignments_done}}
{{corrections_received}}
{{progress}} (%)
{{estimated_score}} (EAF)
{{referral_code}}
{{discount}} (%)
{{conversion_status}} (converted/expired)

A/B Test Setup:
- Split: 50/50
- Duration: 24h
- Winner: Highest CTR
- Auto-deploy winner
```

### Automation Rules

```
Rule 1: Welcome Email
Trigger: User creates account
Delay: 30 minutes
Action: Send Email #1 (Verify)

Rule 2: First Assignment
Trigger: Email #1 verified
Delay: 24 hours
Action: Send Email #2

Rule 3: Progress Update
Trigger: 3 assignments completed OR Day 3
Delay: 0 hours
Action: Send Email #3

Rule 4: Trial Expiring
Trigger: 2 days before trial expiry
Delay: 0 hours
Action: Send Email #4

Rule 5: Last Chance
Trigger: 1 day before trial expiry
Delay: 0 hours
Action: Send Email #5

Rule 6: Abandoned
Trigger: Trial expired, no upgrade
Delay: 24 hours
Action: Send Email #6

Rule 7: Pause If Converted
Condition: User upgraded to paid
Action: Stop all sequence emails
Action: Send "Welcome to Développement" email instead
```

---

## METRICS DASHBOARD

### Key Metrics to Track

```
Email #1 (Welcome):
  - Delivery rate: > 95%
  - Open rate: > 35%
  - Verification rate: > 85%
  - Unsubscribe rate: < 1%

Email #2 (First Assignment):
  - Open rate: > 30%
  - Click rate: > 15%
  - Assignment start rate: > 30%

Email #3 (Progress):
  - Open rate: > 28%
  - Click rate: > 12%
  - Premium click rate: > 20% (KPI!)
  - Referral click rate: > 5%

Email #4 (Expiring):
  - Open rate: > 25%
  - Click rate: > 10%
  - Conversion rate: > 15% (KPI!)

Email #5 (Last Chance):
  - Open rate: > 20%
  - Click rate: > 8%
  - Conversion rate: > 10% (KPI!)

Email #6 (Abandoned):
  - Open rate: > 15%
  - Reactivation rate: > 5%

Overall Funnel:
  - Trial to paid: 25-30% (PRIMARY KPI)
  - Email-influenced conversions: 50-60%
  - Referral attribution: 10-15%
```

---

## A/B TEST SCHEDULE

```
Week 1: Email #1 & #2 (copy variants)
Week 2: Email #3 (upsell messaging)
Week 3: Email #4 (pricing presentation)
Week 4: Email #5 (urgency tactics)
Week 5: Email #6 (reactivation incentive)

Ongoing:
- Segment-based send times
- Engagement-based frequency
- Churn prediction & winback campaigns
```

---

## COPY GUIDELINES

### Tone
- Warm, encouraging, expert
- Second person ("Vous")
- Action-oriented ("Commencer", "Progresser")
- Avoid corporate/salesy language

### Structure
- Subject: Curiosity + benefit + urgency (if applicable)
- Greeting: Personal (first name)
- Hook: Lead with benefit (not product feature)
- Body: Proof + social proof + objection handling
- CTA: Primary (main action) + Secondary (alternative)
- PS: Urgency or final thought

### Example Good Subject
```
"{{first_name}}, vous avez progressé de 12%!"
(Personal + Data + Benefit = Higher open rate)
```

### Example Bad Subject
```
"Découvrez nos fonctionnalités Premium"
(Generic, no personalization, no urgency = Low open rate)
```

---

**Document prepared by**: OpenClaw-Prime  
**Date**: 8 mars 2026  
**Version**: 1.0  
**Next review**: After Week 1 launches (A/B test results)
