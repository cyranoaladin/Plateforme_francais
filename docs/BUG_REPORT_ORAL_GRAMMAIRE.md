# BUG REPORT - Atelier Oral : Score 0/2 Grammaire

**Date** : 19 mars 2026, 09:04 UTC+1  
**Sévérité** : 🔴 **CRITIQUE**  
**Impact** : Atelier oral inutilisable (phase grammaire retourne toujours 0/2)

---

## SYMPTÔMES

### Comportement observé
```
Retour de séance
Retour sur la réponse
0/2
Évaluation indisponible.

Axes à reprendre
Revoir les 3 axes du programme : syntaxe complexe, relations logiques, système verbal.

Correction attendue
« Si j'avais su » est à l'indicatif plus-que-parfait. Dans ce système hypothétique, 
il exprime une condition irréelle dans le passé.
```

### Erreurs console
```
api/v1/auth/login:1  Failed to load resource: the server responded with a status of 401 ()

4c05ba2391120ade.js:1 The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
```

### Logs serveur
```json
{
  "level": 50,
  "time": 1773900847798,
  "pid": 1623661,
  "hostname": "korrigo",
  "skill": "grammaire_ciblee",
  "userId": "a1fec6ea-d5e8-4239-9ca3-3bc4d7d03a06",
  "error": {
    "_errors": [],
    "feedback": {"_errors": ["Required"]},
    "score": {"_errors": ["Required"]},
    "max": {"_errors": ["Invalid literal value, expected 2"]},
    "points_forts": {"_errors": ["Required"]},
    "axes": {"_errors": ["Required"]}
  },
  "rawOutput": "{\"error\":\"MODEL_NOT_FOUND\",\"message\":\"Modele Ollama indisponible.\"}",
  "msg": "[llm] schema_validation_failure"
}
```

---

## CAUSE RACINE

### Problème 1 : Aucune clé API LLM en production

**Vérification** :
```bash
ssh root@88.99.254.59 'grep -E "MISTRAL_API_KEY|GEMINI_API_KEY|OPENAI_API_KEY" /opt/eaf_platform/.env'
# Résultat : AUCUNE SORTIE
```

**Conséquence** :
1. Le skill `grammaire_ciblee` est configuré pour utiliser le tier `standard` (Mistral)
2. Sans `MISTRAL_API_KEY`, le router bascule sur Ollama (local)
3. Ollama n'est pas installé/démarré en production
4. Le skill retourne le fallback avec score 0/2

**Code concerné** :
```typescript
// src/lib/llm/router.ts:80
const SKILL_ROUTING: Record<string, MistralTier> = {
  // ...
  grammaire_ciblee: 'standard',  // Nécessite Mistral
  // ...
};

// src/lib/llm/skills/oral-grammaire-ciblee.ts:41-47
fallback: {
  feedback: 'Évaluation indisponible.',
  score: 0,
  max: 2,
  points_forts: [],
  axes: ['Revoir les 3 axes du programme : syntaxe complexe, relations logiques, système verbal.'],
}
```

### Problème 2 : Erreurs de graphiques (width -1)

Les graphiques Recharts ne s'affichent pas car le conteneur parent a une largeur/hauteur invalide (-1).

**Cause probable** :
- Composant monté avant que le DOM soit prêt
- Container parent sans dimensions CSS définies
- Hydratation React incomplète

### Problème 3 : Erreur 401 sur /api/v1/auth/login

Session expirée ou cookie invalide. L'utilisateur doit se reconnecter.

---

## SOLUTIONS

### Solution 1 : Configurer MISTRAL_API_KEY (RECOMMANDÉ)

**Avantages** :
- ✅ Solution officielle (tier standard = Mistral)
- ✅ Meilleure qualité d'évaluation
- ✅ Latence optimale
- ✅ Coût maîtrisé (ministral-8b pour micro, mistral-small pour standard)

**Action** :
```bash
# 1. Ajouter la clé en production
ssh root@88.99.254.59 'echo "MISTRAL_API_KEY=***REDACTED***" >> /opt/eaf_platform/.env'

# 2. Activer le router LLM
ssh root@88.99.254.59 'echo "LLM_ROUTER_ENABLED=true" >> /opt/eaf_platform/.env'

# 3. Activer le fallback multi-provider (optionnel mais recommandé)
ssh root@88.99.254.59 'echo "LLM_MULTI_PROVIDER_FALLBACK=true" >> /opt/eaf_platform/.env'

# 4. Redémarrer Next.js
ssh root@88.99.254.59 'pm2 restart eaf-nextjs'
```

**Coût estimé** :
- Skill `grammaire_ciblee` : tier `standard` = `mistral-small-latest`
- ~200 tokens input + ~150 tokens output par évaluation
- ~0.001 TND par évaluation
- Budget mensuel : ~10 TND pour 10 000 évaluations

### Solution 2 : Configurer GEMINI_API_KEY (Alternative)

**Avantages** :
- ✅ Gratuit jusqu'à 1500 requêtes/jour
- ✅ Bonne qualité
- ✅ Fallback automatique si Mistral échoue

**Action** :
```bash
ssh root@88.99.254.59 'echo "GEMINI_API_KEY=<votre_clé>" >> /opt/eaf_platform/.env'
ssh root@88.99.254.59 'echo "LLM_MULTI_PROVIDER_FALLBACK=true" >> /opt/eaf_platform/.env'
ssh root@88.99.254.59 'pm2 restart eaf-nextjs'
```

### Solution 3 : Configurer OPENAI_API_KEY (Alternative)

**Avantages** :
- ✅ Excellente qualité
- ✅ Fallback automatique

**Inconvénients** :
- ❌ Plus coûteux que Mistral
- ❌ ~0.003 TND par évaluation

**Action** :
```bash
ssh root@88.99.254.59 'echo "OPENAI_API_KEY=<votre_clé>" >> /opt/eaf_platform/.env'
ssh root@88.99.254.59 'echo "LLM_MULTI_PROVIDER_FALLBACK=true" >> /opt/eaf_platform/.env'
ssh root@88.99.254.59 'pm2 restart eaf-nextjs'
```

### Solution 4 : Installer Ollama (Non recommandé)

**Inconvénients** :
- ❌ Nécessite GPU ou CPU puissant
- ❌ Latence élevée (5-15s par évaluation)
- ❌ Consommation mémoire importante (8-16 GB)
- ❌ Complexité opérationnelle

---

## FIX GRAPHIQUES

### Problème
```
The width(-1) and height(-1) of chart should be greater than 0
```

### Solution
```typescript
// Ajouter dans le composant parent du graphique
<div style={{ width: '100%', minHeight: '300px' }}>
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      {/* ... */}
    </BarChart>
  </ResponsiveContainer>
</div>
```

Ou utiliser `useEffect` pour attendre le montage :
```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) return <div>Chargement...</div>;

return <ResponsiveContainer>...</ResponsiveContainer>;
```

---

## FIX ERREUR 401

### Problème
```
api/v1/auth/login:1  Failed to load resource: the server responded with a status of 401 ()
```

### Solution
L'utilisateur doit se reconnecter. Session expirée.

**Amélioration possible** :
```typescript
// Rediriger automatiquement vers /login si 401
if (error.status === 401) {
  window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
}
```

---

## PLAN D'ACTION IMMÉDIAT

### Priorité 1 - CRITIQUE (15 min)
1. ✅ Diagnostiquer le problème (FAIT)
2. ⏳ Configurer `MISTRAL_API_KEY` en production
3. ⏳ Activer `LLM_ROUTER_ENABLED=true`
4. ⏳ Activer `LLM_MULTI_PROVIDER_FALLBACK=true`
5. ⏳ Redémarrer `pm2 restart eaf-nextjs`
6. ⏳ Tester l'atelier oral complet

### Priorité 2 - Important (1h)
1. ⏳ Fixer les erreurs de graphiques
2. ⏳ Améliorer la gestion des erreurs 401
3. ⏳ Ajouter monitoring LLM (coûts, latence, erreurs)

### Priorité 3 - Amélioration (4h)
1. ⏳ Configurer alertes budget LLM
2. ⏳ Ajouter fallback Gemini (gratuit)
3. ⏳ Documenter les coûts LLM par skill
4. ⏳ Créer dashboard monitoring LLM

---

## VÉRIFICATION POST-FIX

### Checklist
- [ ] `MISTRAL_API_KEY` présente en production
- [ ] `LLM_ROUTER_ENABLED=true`
- [ ] `LLM_MULTI_PROVIDER_FALLBACK=true`
- [ ] PM2 redémarré
- [ ] Atelier oral testé : phase grammaire retourne score > 0
- [ ] Graphiques s'affichent correctement
- [ ] Pas d'erreur 401 après reconnexion

### Test de validation
```bash
# 1. Vérifier les variables
ssh root@88.99.254.59 'grep -E "MISTRAL_API_KEY|LLM_ROUTER_ENABLED|LLM_MULTI_PROVIDER_FALLBACK" /opt/eaf_platform/.env'

# 2. Vérifier les logs
ssh root@88.99.254.59 'pm2 logs eaf-nextjs --lines 50 --nostream' | grep -E "grammaire_ciblee|llm.route"

# 3. Tester l'API
curl -X POST https://eaf.nexusreussite.academy/api/v1/oral/session/[id]/interact \
  -H "Cookie: eaf_session=..." \
  -H "Content-Type: application/json" \
  -d '{"transcript":"Si j avais su est au plus-que-parfait","phase":"GRAMMAIRE"}'
```

---

## IMPACT

### Avant le fix
- ❌ Atelier oral inutilisable (phase grammaire toujours 0/2)
- ❌ Expérience utilisateur dégradée
- ❌ Perte de confiance dans la plateforme
- ❌ Impossibilité d'évaluer la grammaire

### Après le fix
- ✅ Atelier oral 100% fonctionnel
- ✅ Évaluation grammaire précise et pédagogique
- ✅ Feedback constructif pour l'élève
- ✅ Score cohérent avec la réponse

---

## PRÉVENTION

### Monitoring à mettre en place
1. **Alertes LLM** : Notifier si tous les providers échouent
2. **Budget alerts** : Notifier si coût quotidien > 50 TND
3. **Latency monitoring** : Notifier si latence > 10s
4. **Error rate** : Notifier si taux d'erreur > 5%

### Variables d'environnement obligatoires
Ajouter à `scripts/check-env.js` :
```javascript
if (isProduction) {
  required.push('MISTRAL_API_KEY');
  // Ou au moins une des trois :
  // MISTRAL_API_KEY || GEMINI_API_KEY || OPENAI_API_KEY
}
```

---

**Responsable** : Windsurf Cascade  
**Status** : 🔴 EN ATTENTE DE FIX  
**ETA** : 15 minutes après configuration des clés API
