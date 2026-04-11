# Politique RBAC (Role-Based Access Control)

## H6 DOCUMENTATION: Privilege Escalation Admin

### Comportement actuel

La fonction `requireUserRole(role)` dans `src/lib/auth/guard.ts` autorise **automatiquement** les utilisateurs avec le rôle `admin` à accéder aux routes protégées par n'importe quel rôle spécifique.

```typescript
// src/lib/auth/guard.ts ligne 23
if (userRole !== role && userRole !== 'admin') {
  return { errorResponse: ... }
}
```

Cela signifie qu'un admin peut accéder à :
- `/enseignant/*` (routes enseignant)
- `/parent/*` (routes parent)
- `/api/v1/enseignant/*` (API enseignant)

### Justification métier

C'est intentionnel pour permettre :
1. **Support client** : Un admin peut voir ce qu'un enseignant voit sans se connecter avec son compte
2. **Debugging** : Facilite le diagnostique des problèmes spécifiques aux rôles
3. **Impersonation future** : Prépare l'implémentation de la fonctionnalité "se connecter en tant que"

### Quand utiliser quoi

| Fonction | Utilisation | Admin autorisé ? |
|----------|-------------|------------------|
| `requireUserRole('enseignant')` | Routes métier standard | ✅ Oui |
| `requireExactUserRole('enseignant')` | Actions sensibles (ex: export données) | ❌ Non |

### Routes utilisant requireExactUserRole

Les routes suivantes nécessitent le rôle EXACT et bloquent même les admins :
- Aucune actuellement - à ajouter pour les actions sensibles si nécessaire

### Recommandation

Pour les actions sensibles (export de données personnelles, modification de notes, etc.), utiliser `requireExactUserRole` pour empêcher qu'un admin effectue involontairement des actions au nom d'un autre utilisateur.

```typescript
// Exemple: Export de données d'un élève
const { auth } = await requireExactUserRole('enseignant');
// Seuls les vrais enseignants peuvent exporter, pas les admins
```
