But : Décrire le pipeline RAG + orchestration agentique + QA/ops (MVP → prod).

## Ingestion (sources → chunks → index)
Sources (officiel d’abord) : éduscol EAF, programmes, BO œuvres, annales éduscol, CNIL, Eur‑Lex AI Act, Légifrance CPI/LIL, OWASP, NIST, arXiv RAG (Lewis et al. 2020).  
Règles chunking : structure (titres), 800–1200 tokens, overlap 80–120, conserver `page`, `section_path`, `quote_span`. Dédup : hash PDF + canonical_url ; version : `published_at` + `ingested_at`.

### Schéma metadata (minimum)
`{doc_id, canonical_url, source_org, authority_level(A-D), doc_type, published_at, ingested_at, year_scope, license, legal_basis, locale, page, section_path, hash}`

```mermaid
flowchart LR
  A[Fetch URLs] --> B[Normalize (PDF->text+pages)]
  B --> C[Chunking + metadata + legal_basis]
  C --> D[Dedup/version]
  D --> E[Embeddings]
  D --> F[Lexical index BM25]
  E --> G[(Vector DB)]
  F --> H[(Search index)]
  G --> I[Retriever+Reranker]
  H --> I
```

### Commandes/pseudo-scripts
```bash
# 1) Récupération (exemples)
mkdir -p corpus/raw corpus/normalized
curl -L "https://eduscol.education.fr/document/52932/download" -o corpus/raw/eaf_definition.pdf
curl -L "https://eur-lex.europa.eu/eli/reg/2024/1689/oj?locale=fr" -o corpus/raw/ai_act.html

# 2) Lancer ingestion
python -m antigravity.ingest --input corpus/raw --out corpus/normalized --year_scope 2025-2026
python -m antigravity.index  --normalized corpus/normalized --rebuild
```

```python
# 3) Snippet (LlamaIndex-like, pseudo)
from antigravity.rag import load_docs, chunk_docs, embed, upsert_pgvector, build_bm25
docs = load_docs("corpus/normalized")
chunks = chunk_docs(docs, size=1000, overlap=100)
vectors = embed(chunks, model_env="EMBEDDINGS_MODEL")
upsert_pgvector(vectors, db_url=os.environ["VECTOR_DB_URL"])
build_bm25(chunks, out_dir="index/bm25")
```

## Retrieval & reranking
- Query router : {normatif, méthode, exercice, œuvre}.  
- Filters : `authority_level<=B` pour claims d’épreuve ; `year_scope` obligatoire.  
- Rerank top‑50 → top‑8 ; génération uniquement à partir de top‑8 + citations.

## Orchestration (parcours)
```mermaid
sequenceDiagram
  participant U as Élève
  participant O as Orchestrateur
  participant C as compliance_agent
  participant D as diagnosticien
  participant W as coach_ecrit
  participant R as coach_oral
  participant B as bibliothecaire
  participant E as evaluateur

  U->>O: Onboarding + consentements
  O->>C: Validate (age/consent/track)
  C-->>O: allow/deny
  U->>O: Diagnostic submissions
  O->>D: Profile + plan 6w
  D-->>O: level_map + plan
  U->>O: Soumission écrit
  O->>W: Feedback loop
  W-->>O: next_steps
  O->>E: Scoring rubric
  E-->>O: RubricResult
  U->>O: Simulation oral
  O->>R: 30+20 + 2/8/2/8
  R-->>O: rubric + relances
  U->>O: Question règle/barème
  O->>B: RAG answer + citations
```

## QA / sécurité / monitoring
- Tests RAG : RAGAS sur Q/A normatives + méthode (score seuil), + tests “citation obligatoire”. (RAGAS : https://arxiv.org/abs/2309.15217)  
- Red‑teaming : prompt injection (OWASP), data exfiltration, tool abuse ; blocage automatique + alertes.  
- Hallucination detection : si claim normatif sans citation → refuse (R-CITE-01).  
- Observabilité : métriques `citation_rate`, `deny_rate_rules`, `avg_latency`, `retrieval_hit@k`, `exam_mode_block_count`.  
- Backups : snapshot quotidien (vector+bm25+metadata), rollback “blue/green index”.  
- CI/CD : sur PR “corpus_updates/*” → run ingest dry‑run + tests non‑régression + publication index.

```mermaid
gantt
  title Mise à jour annuelle programme/corpus
  dateFormat  YYYY-MM-DD
  section Veille BO/Eduscol
  Scan hebdo URLs officielles :a1, 2026-03-01, 365d
  section Update
  Ingestion nouvelle version :a2, 2026-07-15, 7d
  Re-embeddings + reindex :a3, after a2, 5d
  Tests non-régression :a4, after a3, 3d
  Bascule index (blue/green) :a5, after a4, 1d
```
