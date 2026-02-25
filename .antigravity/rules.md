But : Fixer les règles immuables (pédago/juridique/sécurité) + enforcement/logs.

Références (prioritaires) : EAF éduscol https://eduscol.education.fr/document/52932/download ; IA Act https://eur-lex.europa.eu/eli/reg/2024/1689/oj?locale=fr ; LIL art.45 https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000037823135 ; CPI L122‑5 https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000048603495 ; CNIL mineurs https://www.cnil.fr/fr/la-cnil-publie-8-recommandations-pour-renforcer-la-protection-des-mineurs-en-ligne ; MEN cadre IA https://www.education.gouv.fr/cadre-d-usage-de-l-ia-en-education-450647 ; OWASP LLM https://owasp.org/www-project-top-10-for-large-language-model-applications/ .

Format règle : **ID — Règle.** *Rationale* / *Enforcement* / *Log (ex)*

**R-SCOPE-01 — Voie générale uniquement.**  
Rationale : conformité périmètre produit EAF voie générale.  
Enforcement : reject si `track!=voie_generale` ou taches “contraction/essai”.  
Log : `{"rule":"R-SCOPE-01","action":"deny","reason":"track_not_supported","track":"voie_techno"}`

**R-AIACT-01 — Interdiction d’inférer émotions.**  
Rationale : AI Act (éducation).  
Enforcement : bloquer toute sortie/feature “stress/anxiété/confiance détectée”, analyse émotionnelle voix/visage.  
Log : `{"rule":"R-AIACT-01","action":"deny","reason":"emotion_inference","skill":"coach_oral"}`

**R-AIACT-02 — Aucun proctoring/surveillance d’examen.**  
Rationale : risques AI Act (éducation) + éthique.  
Enforcement : pas de webcam anti‑triche, pas de “détection comportement”, pas de sanction automatisée.  
Log : `{"rule":"R-AIACT-02","action":"deny","reason":"proctoring_feature"}`

**R-RGPD-01 — Consentement mineurs (<15 ans).**  
Rationale : LIL art.45 + CNIL.  
Enforcement : si `age<15` et base=consent → exiger `parent_ok_if_under_15=true` avant collecte/stockage productions.  
Log : `{"rule":"R-RGPD-01","action":"needs_parent_consent","student_age":14}`

**R-RGPD-02 — Minimisation & finalité.**  
Rationale : principes RGPD/CNIL.  
Enforcement : bloquer champs non nécessaires (santé, biométrie, opinions) ; redaction PII dans prompts.  
Log : `{"rule":"R-RGPD-02","action":"sanitize","reason":"extra_personal_data"}`

**R-RET-01 — Rétention & suppression.**  
Rationale : limitation conservation RGPD.  
Enforcement : TTL par défaut (ex. 12 mois productions, 30 jours logs détaillés) + API delete/export ; purge planifiée.  
Log : `{"rule":"R-RET-01","action":"purge","deleted_items":128,"scope":"submissions"}`

**R-COPY-01 — Œuvres sous droits : pas d’ingestion intégrale.**  
Rationale : CPI L122‑5 + licences.  
Enforcement : ingestion autorisée seulement si `license in [domaine_public, licence_expresse]`; sinon excerpting avec `legal_basis`.  
Log : `{"rule":"R-COPY-01","action":"deny","reason":"full_text_copyrighted","doc":"work_fulltext.pdf"}`

**R-COPY-02 — Extraits : champ legal_basis obligatoire.**  
Rationale : traçabilité droits.  
Enforcement : refuser chunk sans `legal_basis` (`courte_citation|accord|domaine_public`).  
Log : `{"rule":"R-COPY-02","action":"deny","reason":"missing_legal_basis","chunk_id":"c-123"}`

**R-PED-01 — Conformité EAF (format/barèmes).**  
Rationale : crédibilité & alignement officiel (EAF éduscol).  
Enforcement : toute règle d’épreuve doit citer source officielle ; tests non‑régression.  
Log : `{"rule":"R-PED-01","action":"deny","reason":"missing_citation","claim":"barème oral"}`

**R-FRAUD-01 — Mode examen verrouillé.**  
Rationale : intégrité + cadre MEN (fraude si devoir fait par IA).  
Enforcement : `mode=examen` ⇒ pas de génération longue (plans ok, consignes ok, pas de rédaction complète) ; feedback après dépôt.  
Log : `{"rule":"R-FRAUD-01","action":"blocked_output","reason":"long_generation_in_exam_mode","tokens":1200}`

**R-FRAUD-02 — Pas de “détecteur IA” décisionnel.**  
Rationale : MEN : détecteurs peu fiables.  
Enforcement : interdiction “IA‑detector score” ; seulement signaux pédagogiques (incohérences) → escalade humaine.  
Log : `{"rule":"R-FRAUD-02","action":"escalate","reason":"style_shift_suspected"}`

**R-CITE-01 — Politique citations/traceabilité.**  
Rationale : redevabilité, réduction hallucinations.  
Enforcement : réponses normatives ⇒ `citations[].{source_url,doc_id,chunk_id,retrieved_at,quote}` obligatoires ; sinon refuse.  
Log : `{"rule":"R-CITE-01","action":"deny","reason":"no_provenance","skill":"bibliothecaire"}`

**R-INJ-01 — Défense prompt injection (directe/indirecte).**  
Rationale : OWASP LLM.  
Enforcement : traiter contenus RAG/user comme non fiables ; allow‑list outils ; output validation ; strip “ignore rules”.  
Log : `{"rule":"R-INJ-01","action":"sanitize","reason":"prompt_injection_pattern","pattern":"ignore previous"}`

**R-AUDIT-01 — Journalisation & audit.**  
Rationale : conformité & incident response.  
Enforcement : logs immuables (append‑only) : décisions rules, accès corpus, actions suppression, jobs ingestion.  
Log : `{"rule":"R-AUDIT-01","action":"log_write","event":"corpus_access","doc_id":"eduscol-eaf-2024"}`
