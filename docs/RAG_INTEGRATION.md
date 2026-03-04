# Intégration RAG - EAF Platform

## Architecture RAG V3

La plateforme EAF utilise une architecture RAG hybride à 3 niveaux :

### 1. RAG Externe (Principal)
- **URL** : `https://rag-api.nexusreussite.academy`
- **Collection** : `rag_education` (13 661 chunks indexés)
- **Modèle d'embedding** : `nomic-embed-text`
- **Matière** : Français (Première)

### 2. RAG Local Vector (Secondaire)
- PostgreSQL avec pgvector
- Indexation des `OFFICIAL_REFERENCES`

### 3. Recherche Lexicale (Fallback)
- Tokenization française
- Scoring par correspondance titre/tags/contenu

---

## Configuration (.env)

```env
# RAG API externe
RAG_API_URL=https://rag-api.nexusreussite.academy
RAG_API_TOKEN=<token>
RAG_COLLECTION=rag_education
RAG_SECTION=education

# Filtres taxonomiques
RAG_MATIERE=Français
RAG_NIVEAU=Première
RAG_GROUPE=Enseignements communs

# Paramètres de recherche
RAG_TOP_K=10
RAG_RERANK=true
RAG_ALPHA=0.7
RAG_TIMEOUT_MS=30000
```

---

## Pipeline de recherche

```
┌─────────────────┐
│  User Query     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ External RAG    │────►│ 13 661 chunks   │
│ (Primary)       │     │ rag_education   │
└────────┬────────┘     └─────────────────┘
         │
         ▼ (fallback si échec)
┌─────────────────┐     ┌─────────────────┐
│ Local Vector    │────►│ pgvector        │
│ (Secondary)     │     │ embeddings      │
└────────┬────────┘     └─────────────────┘
         │
         ▼ (toujours exécuté)
┌─────────────────┐
│ Lexical Search  │
│ (Always)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ RRF Fusion      │
│ + Metadata      │
│ Reranking       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Final Results   │
│ (top-N)         │
└─────────────────┘
```

---

## Endpoints RAG API

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/health` | GET | Vérification santé API |
| `/search` | POST | Recherche sémantique |
| `/stats/{collection}` | GET | Statistiques collection |
| `/collections` | GET | Liste des collections |

---

## Utilisation dans le code

### Recherche standard (hybride)
```typescript
import { searchOfficialReferences } from '@/lib/rag/search';

const results = await searchOfficialReferences(
  "La Servitude Volontaire de La Boétie",
  5,
  { oeuvre: "La Boétie", parcours: "Pouvoir et liberté" }
);
```

### Recherche externe uniquement
```typescript
import { searchExternalRAGOnly } from '@/lib/rag/search';

const results = await searchExternalRAGOnly(
  "Analyse de La Peau de Chagrin",
  10,
  { niveau: "Première" }
);
```

### Client RAG direct
```typescript
import { externalRAG } from '@/lib/rag/external-client';

// Health check
const health = await externalRAG.health();

// Search with custom params
const response = await externalRAG.search({
  query: "procédés littéraires romantisme",
  topK: 15,
  rerank: true,
  filters: { matiere: "Français", oeuvre: "Balzac" }
});

// Search optimisé Français
const chunks = await externalRAG.searchFrancais(
  "structure dissertation",
  { topK: 10, niveau: "Première" }
);
```

---

## Agents utilisant le RAG

| Agent | Usage RAG | Priorité |
|-------|-----------|----------|
| `tuteur_libre` | Context enrichment | External → Local |
| `avocat_diable` | Source validation | External + MCP |
| `diagnosticien` | Skill assessment | Local only |
| `coach_ecrit` | Method references | External → Local |
| `coach_oral` | Text analysis | External → Local |
| `bibliothecaire` | Document search | External → Local |

---

## Monitoring

### Health check endpoint
```bash
curl https://eaf.nexusreussite.academy/api/v1/rag/health
```

### Logs
Les recherches RAG sont tracées avec les tags :
- `[rag] external_rag_success` - Succès recherche externe
- `[rag] external_rag_error` - Erreur recherche externe
- `[rag] search_complete` - Résultat final avec mode utilisé

---

## Fallback Strategy

1. **External RAG disponible** → Mode `external_hybrid`
   - Fusion RRF : external + local
   
2. **External RAG indisponible, Vector disponible** → Mode `local_hybrid`
   - Fusion RRF : vector + lexical
   
3. **Seulement Lexical** → Mode `lexical_only`
   - Recherche sur `OFFICIAL_REFERENCES`

---

## Performance

- **Timeout** : 30s (configurable via `RAG_TIMEOUT_MS`)
- **Top-K fetch** : 2x le nombre de résultats demandés
- **Reranking** : Activé par défaut
- **Alpha** : 0.7 (balance semantic/keyword)
