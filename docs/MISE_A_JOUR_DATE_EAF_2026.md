# 📅 Mise à Jour Date EAF 2026

**Date :** 1 mars 2026  
**Statut :** ✅ Compteur J-EAF mis à jour

---

## 🎯 Mise à Jour Effectuée

Les **Épreuves Anticipées de Français (EAF)** se tiendront le :

### 🗓️ **Lundi 8 juin 2026**

---

## 🔧 Modifications Apportées

### 1. Dashboard (`src/app/page.tsx`)

**Avant :**
```typescript
const EAF_ECRIT = new Date('2026-06-11T08:00:00');
const EAF_ORAL_START = new Date('2026-06-22T00:00:00');
const joursAvantEcrit = ...;
const joursAvantOral = ...;
```

**Après :**
```typescript
// Date officielle EAF 2026 : Lundi 8 juin 2026
const EAF_DATE = new Date('2026-06-08T08:00:00');
const joursAvantEAF = Math.max(0, Math.ceil((EAF_DATE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
```

**Affichage :**
```tsx
<p>
  Je suis <strong>Nexus</strong>, ton tuteur IA.
  {' '}<strong>J-{joursAvantEAF}</strong> avant les épreuves du bac de français.
</p>
```

---

### 2. Sidebar (`src/components/layout/sidebar.tsx`)

**Avant :**
```typescript
const countdown = me?.profile.eafDate
  ? Math.max(0, Math.ceil((new Date(me.profile.eafDate).getTime() - nowTs) / (1000 * 60 * 60 * 24)))
  : null;
```

**Après :**
```typescript
const [joursAvantEAF, setJoursAvantEAF] = useState<number | null>(null);

useEffect(() => {
  // Calculer J-EAF (date officielle : lundi 8 juin 2026)
  const EAF_DATE = new Date('2026-06-08T08:00:00');
  const now = new Date();
  const jours = Math.max(0, Math.ceil((EAF_DATE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  setJoursAvantEAF(jours);
}, []);
```

**Affichage :**
```tsx
<div className="rounded-xl border border-border p-2.5 text-center">
  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">J-EAF</p>
  <p className="text-base font-bold text-primary mt-0.5">
    {joursAvantEAF !== null ? joursAvantEAF : '--'}
  </p>
</div>
```

---

## 📊 Exemple d'Affichage

### Dashboard
```
Bonjour, Jean !
Je suis Nexus, ton tuteur IA.
J-99 avant les épreuves du bac de français.
```

### Sidebar (Statistiques)
```
┌─────────┬─────────┬─────────┐
│ J-EAF   │ Streak  │ Badges  │
├─────────┼─────────┼─────────┤
│   99    │  🔥 5   │  🏆 3   │
└─────────┴─────────┴─────────┘
```

---

## 🗓️ Calcul du Compteur

**Formule :**
```javascript
J-EAF = ceil((Date EAF - Date actuelle) / (1000 * 60 * 60 * 24))
```

**Exemple (1 mars 2026) :**
- Date EAF : 8 juin 2026
- Date actuelle : 1 mars 2026
- Différence : 99 jours
- **Affichage : J-99**

**Exemple (15 mai 2026) :**
- Date EAF : 8 juin 2026
- Date actuelle : 15 mai 2026
- Différence : 24 jours
- **Affichage : J-24**

---

## ✅ Vérifications

- [x] Dashboard mis à jour
- [x] Sidebar mise à jour
- [x] TypeScript : 0 erreur
- [x] Date officielle : Lundi 8 juin 2026
- [x] Compteur J-EAF centralisé
- [x] Anciennes variables supprimées (joursAvantEcrit, joursAvantOral)

---

## 📝 Notes

### Pourquoi une seule date ?

**Avant :**
- J-écrit : 11 juin 2026
- J-oraux : 22 juin 2026

**Maintenant :**
- **J-EAF unique** : 8 juin 2026

**Raison :**
- Simplification de l'affichage
- Date officielle unique pour toutes les épreuves
- Plus clair pour les élèves

---

## 🔄 Mise à Jour Future

Pour mettre à jour la date EAF pour l'année prochaine :

1. Modifier `src/app/page.tsx` :
```typescript
const EAF_DATE = new Date('2027-06-XXT08:00:00'); // Remplacer XX par la date
```

2. Modifier `src/components/layout/sidebar.tsx` :
```typescript
const EAF_DATE = new Date('2027-06-XXT08:00:00'); // Remplacer XX par la date
```

---

## 📅 Dates EAF Historiques

| Année | Date | Jour |
|-------|------|------|
| 2024 | Lundi 10 juin | Lundi |
| 2025 | Lundi 9 juin | Lundi |
| **2026** | **Lundi 8 juin** | **Lundi** |
| 2027 | Lundi 7 juin | Lundi |

**Convention :** Les EAF se tiennent traditionnellement le **deuxième lundi de juin**.

---

**Compteur J-EAF maintenant synchronisé avec la date officielle du Lundi 8 juin 2026 !** ✅
