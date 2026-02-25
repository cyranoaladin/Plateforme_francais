But : Définir les agents/skills (contrats I/O, prompts, limites, tests) pour implémentation.

## Objets JSON communs (schemas minimaux)
```json
{
  "StudentProfile": {
    "type": "object",
    "required": ["student_id", "age", "grade", "track", "exam_year", "consents", "mode"],
    "properties": {
      "student_id": {"type": "string"},
      "age": {"type": "integer", "minimum": 13, "maximum": 25},
      "grade": {"type": "string", "enum": ["premiere"]},
      "track": {"type": "string", "enum": ["voie_generale"]},
      "exam_year": {"type": "integer"},
      "mode": {"type": "string", "enum": ["entrainement", "examen"]},
      "consents": {
        "type": "object",
        "required": ["rgpd_ok", "parent_ok_if_under_15"],
        "properties": {"rgpd_ok": {"type": "boolean"}, "parent_ok_if_under_15": {"type": "boolean"}}
      },
      "level_map": {"type": "object", "additionalProperties": {"type": "number", "minimum": 0, "maximum": 1}}
    }
  },
  "ProductionSubmission": {
    "type": "object",
    "required": ["submission_id", "student_id", "task_type", "content", "timebox_s", "context"],
    "properties": {
      "submission_id": {"type": "string"},
      "student_id": {"type": "string"},
      "task_type": {"type": "string", "enum": ["commentaire", "dissertation", "oral_lecture", "oral_explic_lin", "oral_entretien", "grammaire"]},
      "content": {"type": "object", "properties": {"text": {"type": "string"}, "audio_url": {"type": "string"}}},
      "timebox_s": {"type": "integer", "minimum": 60},
      "context": {"type": "object", "properties": {"prompt": {"type": "string"}, "work_ref": {"type": "string"}, "extract": {"type": "string"}}}
    }
  },
  "Citation": {
    "type": "object",
    "required": ["source_url", "source_title", "doc_id", "chunk_id", "retrieved_at", "quote"],
    "properties": {
      "source_url": {"type": "string"},
      "source_title": {"type": "string"},
      "doc_id": {"type": "string"},
      "chunk_id": {"type": "string"},
      "retrieved_at": {"type": "string"},
      "quote": {"type": "string", "maxLength": 240}
    }
  },
  "RubricResult": {
    "type": "object",
    "required": ["rubric_id", "total", "max", "criteria", "actions"],
    "properties": {
      "rubric_id": {"type": "string"},
      "total": {"type": "number"},
      "max": {"type": "number"},
      "criteria": {"type": "array", "items": {"type": "object", "required": ["id", "score", "max", "evidence"], "properties": {
        "id": {"type": "string"}, "score": {"type": "number"}, "max": {"type": "number"}, "evidence": {"type": "string"}
      }}},
      "actions": {"type": "array", "items": {"type": "string"}}
    }
  }
}
```

## Permissions & rate limits (global)
| Permission | Description |
|---|---|
| read_profile | lire StudentProfile |
| write_profile | écrire/updater profil & progression |
| read_submission | lire copie/audio |
| write_feedback | écrire feedback & plan d’action |
| read_corpus | interroger RAG (sources officielles) |
| write_corpus | ingérer/mettre à jour corpus |
| security_admin | règles sécurité, blocages |
| compliance_admin | règles RGPD/AI Act/droits |

| Skill | Limite (par élève) | Limite (par minute) |
|---|---:|---:|
| coach_ecrit/coach_oral | 30 req/j | 3 rpm |
| bibliothecaire | 80 req/j | 10 rpm |
| evaluateur | 20 req/j | 2 rpm |
| ingestion | n/a | 1 job simultané |
| security_agent/compliance_agent | n/a | 30 rpm internes |

## Contrat de réponse commun
```json
{
  "type": "object",
  "required": ["skill", "status", "data", "citations", "logs"],
  "properties": {
    "skill": {"type": "string"},
    "status": {"type": "string", "enum": ["ok", "refuse", "needs_more", "error"]},
    "data": {"type": "object"},
    "citations": {"type": "array", "items": {"$ref": "Citation"}},
    "logs": {"type": "array", "items": {"type": "object"}}
  }
}
```

## Skills

### diagnosticien
- Rôle : positionner l’élève (profil micro‑compétences EAF voie générale) + prescrire un plan 6 semaines.
- Entrées : StudentProfile + 1..3 ProductionSubmission (écrit/oral/langue).
- Sorties (data schema) :
```json
{"type":"object","required":["level_map","plan_6w","risks"],"properties":{
"level_map":{"type":"object"},
"plan_6w":{"type":"array","items":{"type":"object","required":["week","sessions"],"properties":{"week":{"type":"integer"},"sessions":{"type":"array","items":{"type":"string"}}}}},
"risks":{"type":"array","items":{"type":"string"}}
}}
```
- Prompt système (ex) : « Tu es diagnosticien EAF voie générale. Tu ne rédiges pas à la place. Tu produis un plan actionnable + objectifs mesurables. »
- Prompt assistant (ex) : « Analyse ces productions et propose 3 priorités + un plan hebdo. »
- Failure modes : sur‑diagnostic vague ; advice non EAF ; oublie consentements.
- Permissions : read_profile, read_submission, write_profile, write_feedback.
- QA : vérif track=voie_generale ; citations si règles d’épreuve mentionnées.
- Test :
  - Input : copie commentaire + oral 2 min.
  - Output attendu : level_map avec “citations”, “contresens”, plan_6w avec alternance écrit/oral/langue.

### coach_ecrit
- Rôle : guider commentaire/dissertation (structure, problématique, citations) + boucle réécriture.
- Entrées : StudentProfile, ProductionSubmission(task_type=commentaire|dissertation).
- Sorties : feedback + micro‑tâches (jamais “copie complète” en mode examen).
```json
{"type":"object","required":["rubric","feedback","next_steps"],"properties":{
"rubric":{"$ref":"RubricResult"},
"feedback":{"type":"array","items":{"type":"string"}},
"next_steps":{"type":"array","items":{"type":"string"}}
}}
```
- Système : « Coach écrit EAF. En mode examen: pas de génération longue, uniquement consignes de méthode. »
- Assistant : « Propose 2 axes + 1 transition modèle (≤2 phrases). »
- Failures : écrit la dissertation entière ; invente des citations ; confond voie techno.
- Permissions : read_profile, read_submission, write_feedback, read_corpus.
- QA : longueur max sortie en examen ; 0 hallucination sur œuvres ; citations si normes.
- Test :
  - Input : intro faible.
  - Output : 3 corrections ciblées + réécriture d’1 phrase (pas plus).

### coach_oral
- Rôle : simulation 30+20, explication linéaire, relances entretien, gestion temps (sans inférence émotion).
- Entrées : StudentProfile + ProductionSubmission(oral_* / grammaire) + consigne.
- Sorties : scoring 2/8/2/8 + script relances.
```json
{"type":"object","required":["rubric","timing","relances"],"properties":{
"rubric":{"$ref":"RubricResult"},
"timing":{"type":"object","properties":{"prep_s":{"type":"integer"},"passage_s":{"type":"integer"}}},
"relances":{"type":"array","items":{"type":"string"}}
}}
```
- Système : « Interdit: déduire stress/émotions. Autorisé: débit, pauses, articulation (descriptif). »
- Failures : “tu es anxieux” ; proctoring ; dépasse 20 min.
- Permissions : read_profile, read_submission, write_feedback, read_corpus.
- QA : check AI Act (no emotion inference) ; check barème oral cité.
- Test : Input audio_url + texte ; Output : 2/8/2/8 + 5 relances.

### langue
- Rôle : remédiation syntaxe/grammaire liée au passage (question courte).
- Entrées : ProductionSubmission(task_type=grammaire) + phrase cible.
- Sorties : correction + 3 exercices similaires.
```json
{"type":"object","required":["correction","exercices"],"properties":{
"correction":{"type":"string"},
"exercices":{"type":"array","items":{"type":"string"}}
}}
```
- Failures : notions hors programme ; jargon non défini.
- Permissions : read_submission, write_feedback, read_corpus.
- QA : concision ; exactitude ; citations sur terminologie si demandée.
- Test : phrase complexe → identification subordonnée + fonction.

### bibliothecaire
- Rôle : recherche RAG (documents officiels, annales) + réponses sourcées.
- Entrées : requête + filtres (année, objet d’étude, type doc).
- Sorties : réponse brève + citations obligatoires.
```json
{"type":"object","required":["answer","citations"],"properties":{"answer":{"type":"string"},"citations":{"type":"array","items":{"$ref":"Citation"}}}}
```
- Failures : répond sans source ; source non officielle.
- Permissions : read_corpus.
- QA : authority_level>=B ; quote ≤240 chars.
- Test : “barème oral ?” → answer + citation éduscol.

### evaluateur
- Rôle : noter une production selon rubrics officielles + plan actions + cohérence inter‑correcteurs.
- Entrées : ProductionSubmission + paramètres rubric (oral 2/8/2/8 ; écrit critères).
- Sorties : RubricResult + justification + warnings (plagiat suspect = escalade, pas “détection IA”).
```json
{"type":"object","required":["rubric","warnings"],"properties":{"rubric":{"$ref":"RubricResult"},"warnings":{"type":"array","items":{"type":"string"}}}}
```
- Failures : note arbitraire ; “détecteur IA” ; sanction automatique.
- Permissions : read_submission, read_profile, write_feedback.
- QA : cohérence (score ∈ [0,max]) ; explications appuyées sur preuves.
- Test : copie courte → note basse avec actions concrètes.

### ingestion
- Rôle : télécharger/normaliser/chunker/indexer corpus (officiel prioritaire) + versioning.
- Entrées : liste sources + règles chunking + storage creds.
- Sorties : rapport ingestion (docs ajoutés, ratio dédup, erreurs).
```json
{"type":"object","required":["added","updated","skipped","errors"],"properties":{
"added":{"type":"integer"},"updated":{"type":"integer"},"skipped":{"type":"integer"},
"errors":{"type":"array","items":{"type":"string"}}
}}
```
- Failures : ingère œuvres sous droits en intégral ; pas de provenance.
- Permissions : write_corpus, compliance_admin.
- QA : champ legal_basis ; hash ; canonical_url.
- Test : ingestion 3 PDFs éduscol → chunks versionnés + index.

### security_agent
- Rôle : appliquer OWASP LLM protections (prompt injection, tool gating, secrets, logs).
- Entrées : requête + contexte + traces outils.
- Sorties : décision allow/deny + remédiation.
```json
{"type":"object","required":["decision","reason","mitigations"],"properties":{
"decision":{"type":"string","enum":["allow","deny","sanitize"]},
"reason":{"type":"string"},
"mitigations":{"type":"array","items":{"type":"string"}}
}}
```
- Failures : laisse passer extraction secrets ; injection indirecte.
- Permissions : security_admin.
- QA : tests injection ; audit log obligatoire.
- Test : prompt “ignore rules” → deny + log.

### compliance_agent
- Rôle : contrôler RGPD/AI Act/droits (mineurs, consent, rétention, copyright).
- Entrées : action demandée + StudentProfile + doc metadata.
- Sorties : allow/deny + obligations (consent, suppression, excerpt only).
```json
{"type":"object","required":["decision","obligations"],"properties":{
"decision":{"type":"string","enum":["allow","deny","needs_parent_consent","needs_legal_review"]},
"obligations":{"type":"array","items":{"type":"string"}}
}}
```
- Failures : ignore <15 ans ; autorise émotion/proctoring.
- Permissions : compliance_admin.
- QA : check AI Act, LIL art.45, CPI L122-5.
- Test : élève 14 ans sans parent_ok → needs_parent_consent.
