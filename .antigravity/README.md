But : Indiquer aux devs Antigravity comment utiliser ces fichiers et lancer le MVP.

1) Placer ces fichiers dans : `.antigravity/`  
2) Variables env minimales (exemples) : `LLM_API_KEY`, `EMBEDDINGS_MODEL`, `VECTOR_DB_URL`, `LEXICAL_INDEX_PATH`, `STORAGE_BUCKET`, `AUDIT_LOG_URL`.  
3) Ingestion corpus (officiel d’abord) :
```bash
make ingest   # ou python -m antigravity.ingest ...
make index    # rebuild vector+bm25
```
4) Tests :
```bash
make test          # unit + rules enforcement
make test-rag      # RAGAS + citation checks
make test-security # prompt injection suite
```
5) Déployer MVP (exemples) :
```bash
docker compose up -d
# puis /health, /ingest/status, /ui
```
Hypothèses NON spécifiées (à décider) : budget, région d’hébergement, fournisseur LLM, SSO/éducation, politique exacte de rétention (durées), contact produit/légal.
