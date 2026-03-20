# 09 - Student Workflows

**Date:** 2026-03-20
**Verdict:** ALL WORKFLOWS VALIDATED

---

## 1. Tuteur Libre

**Test account:** eleve.free@eaf.local

| Field | Value |
|-------|-------|
| Question | "Quels sont les themes principaux du Cahier de Douai de Rimbaud ?" |
| Response quality | Rich pedagogical answer with 3 themes, citations, proper French, RAG references |
| **Status** | **VALIDATED** |

---

## 2. Quiz Generation

**Test account:** eleve.free@eaf.local

**Schema:** `{theme, difficulte: 1|2|3, nbQuestions: 5|10|20}`

| Field | Value |
|-------|-------|
| Parameters | theme=figures_de_style, difficulte=1, nbQuestions=5 |
| Result | 5 well-formed questions with options, bonneReponse index, explications with citations |
| **Status** | **VALIDATED** |

---

## 3. Carnet d'erreurs CRUD

| Operation | Detail | Result |
|-----------|--------|--------|
| CREATE | oeuvre+auteur+type+contenu+tags | 200, entry returned with id |
| LIST | entries returned correctly | 200 |
| DELETE | /carnet/{entryId} | 200 |
| **Status** | | **VALIDATED** |

---

## 4. Atelier Langue

| Field | Value |
|-------|-------|
| Input | Phrase to analyze |
| Output | 2+ exercises with sentence, question, correction, axe |
| Quality | Grammar analysis is accurate and pedagogically relevant |
| **Status** | **VALIDATED** |

---

## 5. Quotas (Free Plan)

| Quota | Limit | Verified |
|-------|-------|----------|
| ORAL_SESSIONS | 1/week | VALIDATED (correctly blocked when exceeded) |
| WRITTEN_CORRECTIONS | 2/month | VALIDATED |
| TUTOR_QUESTIONS | 3/day | VALIDATED |
| OCR_COPIES | 0 (blocked) | VALIDATED |
| QUIZ_PER_DAY | 1/day | VALIDATED |

---

## 6. Billing Status

| User type | Fields | Status |
|-----------|--------|--------|
| Free user | plan=FREE, label=Freemium, priceTnd=0, isActive=false | VALIDATED |
| Premium user | plan=PREMIUM, status=ACTIVE | VALIDATED |
