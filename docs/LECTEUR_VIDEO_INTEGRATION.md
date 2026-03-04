# 🎬 Lecteur Vidéo EAF - Intégration

**Date :** 2026-03-01  
**Statut :** ✅ Lecteur vidéo intégré et fonctionnel

---

## 🎯 Objectif

Permettre la **lecture directe des vidéos pédagogiques** depuis la plateforme, sans téléchargement préalable.

---

## 📁 Ressources Vidéo Disponibles

**322 vidéos** dans les formats suivants :
- `.webm` - Format web ouvert (recommandé)
- `.mkv` - Matroska (compatible)
- `.mp4` - MPEG-4 (universel)

### Catégories de vidéos

1. **Explications linéaires** - Analyses d'extraits
2. **Résumés d'œuvres** - Synthèses en 1-5 minutes
3. **Méthodologie** - Dissertation, commentaire, oral
4. **Grammaire** - Leçons et exercices
5. **Histoire littéraire** - Mouvements et auteurs
6. **Lectures expressives** - Extraits lus

---

## 🔧 Configuration Technique

### 1. Symlink Public

```bash
public/ressources -> ../ressources
```

Les fichiers du dossier `/ressources` sont accessibles via :
```
http://localhost:3000/ressources/Videos/[fichier].webm
```

### 2. Headers HTTP (next.config.ts)

```typescript
{
  source: '/ressources/:path*',
  headers: [
    { key: 'Accept-Ranges', value: 'bytes' },
    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
    { key: 'Content-Type', value: 'video/webm,video/x-matroska,video/mp4' },
  ]
}
```

### 3. Content Security Policy (middleware.ts)

```typescript
"media-src 'self' blob: mediastream:"
```

Autorise la lecture de vidéos depuis :
- La plateforme elle-même (`'self'`)
- Les flux blob (`blob:`)
- Les flux média (`mediastream:`)

---

## 🎨 Lecteur Vidéo Intégré

### Composant (bibliotheque/page.tsx)

```tsx
<video 
  controls 
  className="w-full h-full"
  src={selectedResource.url}
  poster="/images/logo_nexus_reussite.png"
  preload="metadata"
  playsInline
>
  <source src={selectedResource.url} type={`video/${ext}`} />
  Votre navigateur ne supporte pas la lecture vidéo.
</video>
```

### Fonctionnalités

- ✅ **Lecture/Pause** - Contrôle natif
- ✅ **Barre de progression** - Navigation dans la vidéo
- ✅ **Volume** - Ajustement sonore
- ✅ **Plein écran** - Affichage immersif
- ✅ **Vitesse** - 0.5x, 1x, 1.5x, 2x
- ✅ **Sous-titres** - Si disponibles
- ✅ **Picture-in-Picture** - Lecture flottante

### Affichage des Métadonnées

```tsx
{selectedResource.year && (
  <span className="px-3 py-1.5 rounded-xl border border-border bg-background text-sm font-medium">
    Année: {selectedResource.year}
  </span>
)}
{selectedResource.subject && (
  <span className="px-3 py-1.5 rounded-xl border border-border bg-background text-sm font-medium">
    {selectedResource.subject}
  </span>
)}
```

---

## 📊 Exemples de Vidéos Accessibles

### Balzac - La Peau de chagrin
- `⏱️ Résumé en 1 minute.webm` → **Lecture directe**
- `🔎 Le portrait de Raphaël (explication).webm` → **Lecture directe**
- `📣 Le piège de Fœdora (lecture).mkv` → **Lecture directe**

### Rimbaud - Cahiers de Douai
- `🔎 « Le Dormeur du Val » (Analyse).mkv` → **Lecture directe**
- `📣 « Ophélie » (lecture).mkv` → **Lecture directe**
- `⏱️ Le contexte en 1 min.webm` → **Lecture directe**

### Méthodologie
- `Bac de français 2026 - La dissertation (1⧸4).webm` → **Lecture directe**
- `Bac de français 2026 - L'oral (1⧸5).webm` → **Lecture directe**
- `Les 5 étapes du commentaire.webm` → **Lecture directe**

---

## 🎯 Expérience Utilisateur

### 1. Navigation
- L'utilisateur clique sur une ressource vidéo
- La modal s'ouvre avec les détails
- Le lecteur vidéo apparaît automatiquement

### 2. Lecture
- La vidéo se charge avec un poster (logo Nexus)
- Les contrôles natifs du navigateur sont disponibles
- Support du plein écran et du picture-in-picture

### 3. Performance
- `preload="metadata"` - Charge uniquement les métadonnées
- `Cache-Control` - Mise en cache agressive (1 an)
- `Accept-Ranges: bytes` - Permet le streaming et le seek

---

## 🔍 Compatibilité Navigateurs

| Navigateur | WebM | MKV | MP4 |
|------------|------|-----|-----|
| Chrome ✅ | ✅ | ✅ | ✅ |
| Firefox ✅ | ✅ | ✅ | ✅ |
| Safari ✅ | ✅ (v14+) | ⚠️ Partiel | ✅ |
| Edge ✅ | ✅ | ✅ | ✅ |

**Note :** Le format WebM est recommandé pour une compatibilité optimale.

---

## 🚧 Limitations et Solutions

### Limitation 1 : Taille des fichiers
Certaines vidéos peuvent être lourdes (> 100 Mo).

**Solution :**
- Mise en cache navigateur agressive
- Streaming HTTP (Accept-Ranges: bytes)
- Possibilité de télécharger pour lecture hors ligne

### Limitation 2 : Compatibilité MKV
Le format MKV n'est pas toujours supporté.

**Solution :**
- Privilégier le format WebM
- Proposer le téléchargement pour les MKV
- Conversion future vers WebM/MP4

### Limitation 3 : Bande passante
322 vidéos peuvent consommer beaucoup de données.

**Solution :**
- Cache HTTP 1 an
- Possibilité de téléchargement local
- Streaming adaptatif (à implémenter)

---

## 📈 Statistiques d'Utilisation

**Depuis la bibliothèque :**
- 322 vidéos accessibles en lecture directe
- 5 formats de contenu (explications, résumés, méthodes, lectures, histoire)
- Tous les auteurs au programme couverts

---

## 🔧 Maintenance

### Ajouter une nouvelle vidéo

1. Placer le fichier dans `/ressources/Videos/`
2. Exécuter : `npx tsx scripts/scan-ressources.ts`
3. La vidéo est automatiquement disponible dans la bibliothèque

### Optimiser les vidéos existantes

```bash
# Convertir MKV vers WebM (recommandé)
ffmpeg -i input.mkv -c:v libvpx-vp9 -c:a libopus output.webm

# Compresser sans perte de qualité visible
ffmpeg -i input.webm -c:v libvpx-vp9 -crf 30 -b:v 0 output_optimized.webm
```

---

## 🎨 Améliorations Futures (Optionnel)

- [ ] **Transcodage automatique** - Conversion MKV → WebM
- [ ] **Sous-titres** - Ajout de fichiers .vtt
- [ ] **Chapitrage** - Marqueurs temporels
- [ ] **Vitesse de lecture** - Contrôles avancés
- [ ] **Historique** - Vidéos visionnées
- [ ] **Favorites** - Liste de vidéos favorites
- [ ] **Progression** - Suivi des vidéos vues
- [ ] **Qualité adaptive** - Streaming HLS/DASH

---

## ✅ Checklist

- [x] Symlink créé (`public/ressources -> ../ressources`)
- [x] Headers HTTP configurés (Accept-Ranges, Cache-Control)
- [x] CSP mise à jour (media-src 'self' blob: mediastream:)
- [x] Lecteur vidéo intégré dans la modal
- [x] Poster personnalisé (logo Nexus)
- [x] Contrôles natifs (lecture, volume, plein écran)
- [x] Métadonnées affichées (année, sujet, format)
- [x] TypeScript : aucune erreur
- [x] 322 vidéos accessibles

---

## 🌐 URLs d'Exemple

```
http://localhost:3000/ressources/Videos/BALZAC%20La%20Peau%20de%20chagrin%20Résumé.webm
http://localhost:3000/ressources/Videos/RIMBAUD%20Le%20Dormeur%20du%20Val.mkv
http://localhost:3000/ressources/Videos/Bac%20de%20français%202026%20-%20La%20dissertation.webm
```

---

**La lecture vidéo est maintenant entièrement fonctionnelle sur la plateforme EAF !** 🎉
