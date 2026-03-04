# 📝 Titres Intelligents des Ressources EAF

**Date :** 2026-03-01  
**Statut :** ✅ Titres parlants et significatifs implémentés

---

## 🎯 Objectif

Remplacer les noms de fichiers techniques par des **titres compréhensibles** et **descriptifs** pour les utilisateurs.

---

## 📊 Exemples de Transformation

### Annales EAF

| Nom de fichier | Titre affiché |
|----------------|---------------|
| `22-frgean1.pdf` | **2022 - Bac Français Général - Amérique du Nord - Sujet 1** |
| `22-frgeag1.pdf` | **2022 - Bac Français Général - Asie - Sujet 1** |
| `23-frgeme1.pdf` | **2023 - Bac Français Général - Métropole - Sujet 1** |
| `24-frgepo1_v1.pdf` | **2024 - Bac Français Général - Pondichéry - Sujet 1** |
| `25-frgeg11_v1.pdf` | **2025 - Bac Français Général - EG - Sujet 11** |
| `liens_documents.txt` | **Liens vers les Documents EAF** |
| `liens_videos.txt` | **Liens vers les Vidéos EAF** |

**Codification décryptée :**
- `22` = 2022, `23` = 2023, etc.
- `frge` = Français Général, `frte` = Français Technologique
- `ag` = Asie, `an` = Amérique du Nord, `ge` = Métropole, `po` = Pondichéry, `ja` = Japon
- `1`, `2`, `11` = Numéro du sujet

---

### Œuvres Intégrales

| Nom de fichier | Titre affiché |
|----------------|---------------|
| `Discours_de_la_servitude_volontaire_Édition_1922.pdf` | **Discours de la servitude volontaire - La Boétie** |
| `Entretiens_sur_la_pluralité_des_mondes.pdf` | **Entretiens sur la pluralité des mondes - Fontenelle** |
| `La_Peau_de_chagrin_1855.pdf` | **La Peau de chagrin - Balzac** |
| `Le_Menteur_(Corneille,_Marty-Laveaux,_1862).pdf` | **Le Menteur - Corneille** |
| `Lettres_d'une_Péruvienne.pdf` | **Lettres d'une Péruvienne - Françoise de Graffigny** |
| `Manon_Lescaut.pdf` | **Manon Lescaut - Abbé Prévost** |
| `On_ne_badine_pas_avec_l'amour_(1884).pdf` | **On ne badine pas avec l'amour - Musset** |
| `Sido.pdf` | **Sido - Colette** |

---

### Vidéos Pédagogiques

| Nom de fichier | Titre affiché |
|----------------|---------------|
| `⏱️ BALZAC, La Peau de chagrin ⏱️ Résumé en 1 minute.webm` | **BALZAC, La Peau de chagrin - Résumé en 1 minute** |
| `🔎 RIMBAUD, Cahiers de Douai 🔎 « Le Dormeur du Val » (Analyse).mkv` | **RIMBAUD, Cahiers de Douai - Le Dormeur du Val (Analyse)** |
| `📚 MUSSET, On ne badine pas avec l'amour 📜 Résumé-analyse.webm` | **MUSSET, On ne badine pas avec l'amour - Résumé-analyse** |
| `🎧 LA BOÉTIE, Discours de la servitude volontaire 🎧 Podcast.webm` | **LA BOÉTIE, Discours de la servitude volontaire - Podcast** |
| `Bac de français 2026 - La dissertation (1⧸4).webm` | **Bac de français 2026 - La dissertation (1/4)** |

**Nettoyage appliqué :**
- Suppression des emojis (⏱️, 🎧, 📚, 📜, 📣, 🔎, 🗝️, 🧠)
- Normalisation des séparateurs
- Conservation des informations essentielles

---

### Documents Pédagogiques (Eduscol)

| Nom de fichier | Titre affiché |
|----------------|---------------|
| `RA19_Lycee_GT_1_FRA_dissertation_2_1160847.pdf` | **Ressource Eduscol 2019 - GT - La Dissertation** |
| `RA19_Lycee_GT_2-1_FRA_ExplicationLineaire_1160957.pdf` | **Ressource Eduscol 2019 - GT - Explication Linéaire** |
| `RA23_lycee_g_1_francais_balzac_peaudechagrin_oeuvreparcours.pdf` | **Ressource Eduscol 2023 - G - La Peau de Chagrin** |
| `RA24_lycee_gt_1_corneille_menteur_mensongecomedie.pdf` | **Ressource Eduscol 2024 - GT - Le Menteur** |
| `francais-premiere.pdf` | **Programme de Français - Première** |
| `grammaire_cp-6e_web.pdf` | **Grammaire CP - 6ème** |

---

### Rapports de Jury

| Nom de fichier | Titre affiché |
|----------------|---------------|
| `Bilan des EAF 2024__2.pdf` | **Bilan EAF - 2024** |
| `Charte ÉAF - 2025-1.pdf` | **Charte EAF - 2025** |
| `pedagogie.ac-nantes.fr__bilan-eaf-session-2016.pdf` | **Bilan EAF - Académie de Nantes - 2016** |
| `pedagogie.ac-lille.fr__Rapport-EAF-session-2023.pdf` | **Rapport EAF - Académie de Lille - 2023** |

---

## 🔧 Algorithme de Formatage

### Pour les annales
```typescript
// Décodage: YY-fr(g|t)e?(zone)(numéro)
22-frgean1 → 2022 - Bac Français Général - Amérique du Nord - Sujet 1
24-frtege5 → 2024 - Bac Français Technologique - Métropole - Sujet 5
```

### Pour les vidéos
```typescript
// Suppression emojis + normalisation
⏱️ BALZAC, La Peau de chagrin ⏱️ Résumé → BALZAC, La Peau de chagrin - Résumé
```

### Pour les documents Eduscol
```typescript
// Pattern: RA(an)_Lycee_(filiere)_FRA_(sujet)
RA19_Lycee_GT_1_FRA_dissertation → Ressource Eduscol 2019 - GT - La Dissertation
```

### Pour les œuvres
```typescript
// Reconnaissance par motifs
[discours.*servitude] → Discours de la servitude volontaire - La Boétie
[peau.*chagrin] → La Peau de chagrin - Balzac
```

---

## 📁 Fichiers Modifiés

1. **`scripts/scan-ressources.ts`** - Algorithmes de formatage
2. **`src/data/ressources-scan.json`** - Index généré avec titres intelligents
3. **`src/data/ressources.ts`** - Types TypeScript mis à jour
4. **`src/app/bibliotheque/page.tsx`** - Affichage des métadonnées (année, sujet)

---

## ✅ Avantages

### Pour les élèves
- ✅ **Titres compréhensibles** immédiatement
- ✅ **Année visible** pour les annales
- ✅ **Type de ressource** clair (PDF, Vidéo, etc.)
- ✅ **Auteur et œuvre** identifiables

### Pour les enseignants
- ✅ **Recherche facilitée** par année et zone géographique
- ✅ **Organisation logique** par type de document
- ✅ **Références officielles** Eduscol identifiables

### Pour la maintenance
- ✅ **Script automatique** de génération
- ✅ **Extensible** facilement
- ✅ **Fichiers sources** préservés (originalTitle)

---

## 🚀 Utilisation

```bash
# Régénérer l'index avec titres intelligents
npx tsx scripts/scan-ressources.ts

# Les nouveaux titres sont automatiquement disponibles dans la bibliothèque
```

---

## 📈 Statistiques

**553 ressources** avec titres intelligents :
- 29 Annales EAF → Titres décodés avec année, zone, numéro
- 9 Œuvres → Titres littéraires avec auteur
- 322 Vidéos → Titres nettoyés des emojis
- 163 Documents → Titres pédagogiques
- 30 Rapports de jury → Titres institutionnels

---

**La bibliothèque EAF affiche maintenant des titres parlants et significatifs pour toutes les ressources !** 🎉
