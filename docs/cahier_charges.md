

# Cahier des charges – Plateforme IA premium de préparation à l’EAF (Première voie générale)

## 1) Contexte, objectifs, périmètre

### 1.1 Contexte officiel (session 2026)

* **Épreuve anticipée de français – écrit** : **jeudi 11 juin 2026**, 8h–12h (France métropolitaine, Réunion, Mayotte). ([Ministère de l'Education nationale][1])
* **Épreuve orale** : organisée par les académies **à partir du lundi 22 juin 2026**. ([info.gouv.fr][2])
* **Centres ouverts à l’étranger** : organisation encadrée par une note de service dédiée (calendriers spécifiques). ([Ministère de l'Education nationale][3])
* **Coefficients et durées (voie générale)** : Français écrit **coef 5 / 4h**, Français oral **coef 5 / 20 min**, avec préparation **30 min**. ([éduscol][4])

### 1.2 Périmètre produit (non négociable)

* **Voie générale uniquement** (pas de contraction/essai techno).
* Couverture : **écrit** (commentaire OU dissertation), **oral** (lecture + explication linéaire + grammaire + entretien), **langue**, **œuvres & parcours**, **méthodologie**, **culture / lectures cursives**.
* Le produit doit fonctionner en **autonomie** (sans professeur), tout en restant **compatible** avec un usage établissement (enseignant/administration).

### 1.3 Objectifs (mesurables)

Le premium se prouve par indicateurs :

* **Progression “skill map”** (5 axes minimum : écrit / oral / langue / œuvres / méthode).
* **Réduction des erreurs récurrentes** (banque d’erreurs + spaced repetition).
* **Meilleure conformité au format** (temps, structure, barème).
* **Zéro hallucination normative** (toute affirmation réglementaire sourcée, sinon refus).
* **Zéro dérive conformité** : aucune inférence émotionnelle, pas de proctoring. ([EUR-Lex][5])

---

## 2) Référentiels officiels à intégrer (RAG “autorité A”)

### 2.1 Programme national d’œuvres – session 2026 (voie générale)

Le programme national applicable à la **session 2026** (liste “œuvres + parcours”) doit être ingéré comme **source A**, versionnée. ([Ministère de l'Education nationale][6])
Extraits structurants (voie générale, session 2026) :

* Théâtre renouvelé : Corneille *Le Menteur* ; Musset *On ne badine pas avec l’amour* ; Sarraute *Pour un oui ou pour un non*. ([Ministère de l'Education nationale][6])
* Poésie maintenue : Rimbaud (*Cahier de Douai* – 22 poèmes) ; Ponge ; Dorion. ([Ministère de l'Education nationale][6])
* Littérature d’idées maintenue : Rabelais (*Gargantua*) ; La Bruyère (*Les Caractères*, livres V à X) ; Olympe de Gouges (*Déclaration…*). ([Ministère de l'Education nationale][6])
* Roman/récit maintenu : Prévost (*Manon Lescaut*), Balzac (*La Peau de chagrin*), Colette (*Sido / Les Vrilles de la vigne*). ([Ministère de l'Education nationale][6])

> Exigence premium : la plateforme doit aussi gérer les versions futures (session 2027, 2028…) pour éviter toute obsolescence et pour l’AEFE multi-cohortes. Exemple : BO 2024/2025/2026-2027 sont des versions distinctes. ([Ministère de l'Education nationale][6])

### 2.2 Format oral et barème (source A/B robuste)

Le produit doit connaître (et faire appliquer) la structure :

* 12 minutes : lecture (2) + explication linéaire (8) + grammaire (2)
* 8 minutes : entretien (8)
  Ce cadre est documenté dans des ressources institutionnelles académiques (source B) et doit être traité comme “normatif d’usage” dans la plateforme. ([Académie de Paris][7])

---

## 3) Contraintes juridiques et éthiques (garde-fous obligatoires)

### 3.1 AI Act – interdiction émotion en éducation

Il est interdit d’utiliser un système visant à **détecter / inférer l’état émotionnel** d’un élève en contexte éducatif (sauf exceptions médicales/sécurité). ([EUR-Lex][5])
**Implication** : aucune sortie “stress”, “anxiété”, “attention”, “motivation détectée”, ni analyse émotionnelle de la voix.

### 3.2 Mineurs – consentement (France) : seuil 15 ans

Pour l’offre directe de services, un mineur peut consentir seul **à partir de 15 ans** ; en-dessous, consentement conjoint mineur + autorité parentale. ([Légifrance][8])
**Implication** : flux d’onboarding + stockage consentements + preuves + refus 403 si incohérent.

### 3.3 Droit d’auteur

* Aucune ingestion intégrale d’œuvres sous droits (Dorion, Sarraute, Ponge… selon éditions).
* Ingestion privilégiée : **domaine public** (Wikisource / Gutenberg) + **métadonnées + extraits courts** + analyses.

---

## 4) Architecture produit premium : modules, parcours, UX

### 4.1 Modules (UI) – obligatoires

1. **Onboarding diagnostique (15–25 min)**
2. **Dashboard “plan de progrès”**
3. **Atelier Écrit** (commentaire/dissertation)
4. **Atelier Oral** (prépa + simulation + jury)
5. **Atelier Langue** (grammaire + lexique + syntaxe)
6. **Bibliothèque** (RAG + ResourceCards multimodales)
7. **Dépôt de productions** (texte + PDF scan + audio/transcript)
8. **Cahier d’erreurs** (banque + révisions planifiées)
9. **Simulateur Bac** (timeboxing officiel, mode examen)
10. **Espace administratif** (gestion corpus, ressources, cohortes)

### 4.2 Parcours différenciés (UX premium)

L’élève choisit un “mode de progression” (modifiable) :

* **Difficulté** : micro-tâches + très guidé + feedback très directif.
* **Objectif 14+** : exigences élevées, nuance, procédés, problématisation.
* **Fort mais désorganisé** : structure, plan, transitions, gestion du temps.
* **Oral prioritaire** : entraînement oral intensif + JurySim.

---

## 5) Modèle pédagogique premium : micro-objectifs, rubriques, progression

### 5.1 “Skill Map” (5 axes minimum)

* Écrit : problématique, plan, analyse procédés, citations, transitions, conclusion.
* Oral : lecture expressive, mouvements, justesse procédés, réponses entretien.
* Langue : phrase complexe, interrogation, négation, relatives, conjonctives, concordance, connecteurs.
* Œuvres/parcours : repères, thèmes, citations clés, comparaisons, lectures cursives.
* Méthode : gestion du temps, brouillon, relecture, orthographe, stratégie.

Chaque compétence = score (0–1) + preuves (exemples d’erreurs).

### 5.2 Rubrics (barèmes internes) – exigence premium

Chaque feedback doit être **multi-couches** :

1. **Note estimée / niveau** (indicatif) + barème par critères
2. **Top 5 actions** (priorisées, concrètes)
3. **Remédiation** : exercices ciblés + re-test
4. **Ressources** : 1 vidéo/podcast + 1 fiche + 1 exercice, tous justifiés
5. **Preuves** : citations RAG sur points normatifs / notions

---

## 6) Pipelines agentiques (cœur premium)

### 6.1 Agents (contrats stricts)

* **PolicyGate** (pré + post) : conformité (mineurs, AI Act, mode examen, anti-injection).
* **Router** : classe l’intention (méthode / entraînement / correction / œuvre / langue / administratif).
* **RAG Librarian** : retrieval hybride + citations + refus hors corpus.
* **StudentModeler** : met à jour skill map + banque d’erreurs.
* **Planner** : plan 6–10 semaines + séances 10/25/60 min, adaptatives.
* **Coach_Écrit** : guidage (sans écrire à la place en mode examen).
* **Coach_Oral** : simulation + grille + questions adaptatives.
* **Coach_Langue** : exercices + corrections + répétition espacée.
* **Correcteur_PDF** : OCR, segmentation, annotation, bilan.
* **JurySim** : entretien oral réaliste (questions + relances + contradiction).

### 6.2 Quatre pipelines fermés (non négociables)

1. **Diagnostic initial** → skill map → plan semaine
2. **Séance quotidienne 10–20 min** → feedback → banque d’erreurs → re-test
3. **Dépôt production (PDF/texte/audio)** → correction rubricée → plan remédiation 14 jours
4. **Simulation bac** (timeboxing officiel) → refus mode examen si demande de rédaction complète → bilan

---

## 7) RAG premium : ingestion sémantique, cartographie, multimodal

### 7.1 Stratification A/B/C/D (gouvernance)

* A : BOEN, Éduscol, textes officiels.
* B : ressources académiques, sujets, annales, rapports.
* C : conformité (AI Act, CNIL, OWASP).
* D : Weblettres, podcasts, vidéos (qualité variable) — jamais normatif.

### 7.2 Registry d’ingestion (contrat)

Un `registry.yaml` (ou table) doit contenir :

* url, type, authority_level, licence, base légale, session_year, programme_version, juridiction (métropole / centres étrangers), fréquence d’update, parser.

### 7.3 Chunking “structurel” (pas naïf)

* BO / notes : découpe **par section + page** (citations fiables).
* Méthodo : découpe **procédurale** (étapes + exemples).
* Œuvres domaine public : scènes/chapitres (repères).
* Grammaire : notions isolées + exemples + exercices.

### 7.4 Métadonnées obligatoires (pour filtrage)

`#Session2026 #ObjetEtude_Theatre #Oeuvre_LeMenteur #Parcours_MensongeEtComedie #Epreuve_Oral_Entretien #Niveau_PremiereGenerale`

* `jurisdiction`, `authority_level`, `year_scope`, `license`, `legal_basis`.

### 7.5 Multimédia (ResourceCards)

Toute ressource externe (vidéo/podcast) = carte structurée :

* type, durée, niveau, objectifs, prérequis, consigne d’usage (“après écoute, fais X”), résumé, lien.
* pas de transcript complet sans licence claire.

### 7.6 Gestion des contradictions / versions

* corpus versionné (`corpus_version`)
* priorité au document **le plus récent** de niveau A
* alertes “œuvre sortie du programme” / “session incorrecte”

---

## 8) Modèle de données (Prisma) – extension premium

### 8.1 Nouvelles tables (minimum)

* `student_skills` : skill_id, axis, micro_skill, score, evidence_json
* `error_bank` : error_id, category, example, correction, due_dates (J+2/J+7/J+21)
* `study_plan` : sessions planifiées, durée, objectifs, ressources
* `resources` : ResourceCards multimodales
* `work_catalog` : œuvres/parcours versionnés par session
* `rubrics` : versions de grilles internes
* `pdf_assets` : stockage des dépôts + OCR output + annotations

---

## 9) APIs (contrats Zod) – premium

### 9.1 Endpoints “élève”

* `POST /api/v2/onboarding/diagnostic`
* `GET /api/v2/dashboard`
* `GET /api/v2/plan/week`
* `POST /api/v2/sessions/start` (séance guidée)
* `POST /api/v2/submissions` (texte/pdf/audio)
* `GET /api/v2/submissions/:id/feedback`
* `GET /api/v2/errors` + `POST /api/v2/errors/:id/resolve`
* `POST /api/v2/ask` (RAG + citations)
* `POST /api/v2/oral/simulate` (JurySim)

### 9.2 Endpoints “admin”

* `POST /api/admin/registry/sources`
* `POST /api/admin/ingest/run`
* `POST /api/admin/resources`
* `GET /api/admin/metrics/pedago`

---

## 10) Sécurité, conformité, robustesse (exigences premium)

* OWASP LLM01 : injection tests systématiques
* rate limiting, audit log, request_id, privacy-by-design
* séparation “mode entraînement” vs “mode examen”
* refus 403 explicites (jamais 500 sur policy deny)
* redaction rules : pas de copie complète fournie en mode examen

---

## 11) Observabilité & KPI pédagogiques

### 11.1 KPI techniques

* `citation_rate`, `deny_rate`, `llm_latency`, `retrieval_hit@k`, `5xx_rate`

### 11.2 KPI pédagogiques

* progression skill map
* taux d’erreurs résolues à J+7
* temps pour produire une problématique acceptable
* score moyen simulation oral sur 3 semaines

---

## 12) Plan de livraison (premium, incrémental)

### V3.0 (4–6 semaines) — “Parcours + progression”

* onboarding diagnostic + skill map + plan
* banque d’erreurs + répétition espacée
* ResourceCards + prescriptions

### V3.1 (4–6 semaines) — “PDF premium”

* OCR/annotation/rubric complète
* bilan 14 jours automatique

### V3.2 (4–6 semaines) — “Oral premium”

* JurySim complet + grille + relances adaptatives
* entraînement chronométré

---

## 13) Critères d’acceptation “premium” (GO)

1. L’élève suit un parcours 2 semaines → progression mesurable sur ≥ 2 axes.
2. Toute info normative est sourcée A, sinon refus.
3. Dépôt PDF → feedback rubricé + plan remédiation + ressources justifiées.
4. Simulation oral → grille + questions adaptatives + axes de progrès.
5. Conformité : aucune inférence émotionnelle. ([EUR-Lex][5])

---

# Annexes – Références officielles minimales à ingérer

* Calendrier examens 2026 (écrit EAF 11 juin 2026, oral à partir du 22 juin). ([Ministère de l'Education nationale][1])
* Centres ouverts à l’étranger (note de service). ([Ministère de l'Education nationale][3])
* Coefficients/durées des épreuves anticipées de français. ([éduscol][4])
* Programme national d’œuvres (session 2026, voie générale). ([Ministère de l'Education nationale][6])
* AI Act – interdiction émotion en éducation. ([EUR-Lex][5])
* LIL art. 45 – consentement mineurs 15 ans. ([Légifrance][8])

---


