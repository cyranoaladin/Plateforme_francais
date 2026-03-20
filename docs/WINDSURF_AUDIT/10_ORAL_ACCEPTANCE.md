# 10 - Oral Acceptance (4/4 Phases)

**Date:** 2026-03-20
**Test account:** eleve.pro@eaf.local (PREMIUM plan)
**Verdict:** ORAL 4/4 VALIDATED

---

## Full Session Walkthrough

### 1. Descriptif saved

4 textes (3 poesie + 1 roman), oeuvreChoisie = Cahier de Douai.

### 2. Session started

sessionId generated, questionGrammaire auto-generated, instructions given.

### 3. Phase LECTURE (1/2)

Feedback on fluidity and prosody, concrete improvement suggestions with resource references.

### 4. Phase EXPLICATION (3/8)

Identified strengths (theme recognition) and weaknesses (lack of structure, missing citations), 5 specific axes.

### 5. Phase GRAMMAIRE (0.5/2)

Corrected grammatical analysis, pointed out confusion between participe present and participe passe.

### 6. Phase ENTRETIEN (2/8)

Detected confusion about oeuvre choisie (student spoke about Cahier de Douai but profile says Discours de la servitude volontaire), relance question posed.

### 7. Session ended

| Field | Value |
|-------|-------|
| Note finale | 6.5/20 |
| Mention | Insuffisant |
| Extras | Bilan global, conseil final, badge "Oral simule termine" awarded |

---

## Verification Checklist

| # | Check | Result |
|---|-------|--------|
| 1 | Descriptif saved | OK |
| 2 | Session started | OK |
| 3 | Phase LECTURE scored | 1/2 |
| 4 | Phase EXPLICATION scored | 3/8 |
| 5 | Phase GRAMMAIRE scored | 0.5/2 |
| 6 | Phase ENTRETIEN scored | 2/8 |
| 7 | Session ended with note + mention + badge | OK |
| 8 | Score coherence: 1+3+0.5+2 = 6.5/20 | OK |
| 9 | JSON structure valid at each phase (feedback, score, max, points_forts, axes) | OK |
| 10 | No 0/8 silent fallback (all phases returned real scores) | OK |
| 11 | RAG references in feedback (multiple resource references cited) | OK |

---

## Edge Cases

| Scenario | Expected | Actual | Status |
|----------|----------|--------|--------|
| Free user quota exceeded | Blocked with message | "Tu as atteint la limite incluse pour l'oral (1 sessions par semaine, plan Freemium)" | VALIDATED |
| Missing descriptif | Blocked with message | "Descriptif incomplet: 3 textes minimum requis" | VALIDATED |
