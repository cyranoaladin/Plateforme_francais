import { getDb } from '../lib/db.js'
import { getComplianceRulesMarkdown } from '../lib/policy-gate.js'

// ============================================================
// Ressource : nexus://student/{studentId}/profile
// ============================================================

export async function getStudentProfileResource(studentId: string): Promise<string> {
  const db = getDb()

  const user = await db.user.findUnique({
    where: { id: studentId },
    include: { profile: true },
  })

  if (!user || !user.profile) {
    return `# Profil introuvable\n\nAucun profil trouvé pour l'identifiant : ${studentId}`
  }

  const profile = user.profile
  const eafDate = profile.eafDate ? new Date(profile.eafDate) : null
  const daysUntilEaf = eafDate
    ? Math.max(0, Math.ceil((eafDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const weakSkills = (profile.weakSkills as string[]) ?? []
  const oeuvres = (profile.selectedOeuvres as string[]) ?? []
  const xp = profile.xp ?? 0
  const level = profile.level ?? 1
  const streak = 0

  const subscription = await db.subscription?.findUnique?.({
    where: { userId: studentId },
  }).catch(() => null)

  const plan = subscription?.plan ?? 'FREE'

  const levelNames = ['Apprenti', 'Lecteur', 'Analyste', 'Commentateur', 'Rhétoricien', 'Expert EAF']
  const levelName = levelNames[level - 1] ?? 'Apprenti'

  const skillMapSection = '- SkillMap non encore générée (onboarding en cours)'

  let errorBankDue = 0
  try {
    const rows = await db.$queryRaw<Array<{ due: number }>>`
      SELECT COUNT(*)::int AS due
      FROM "MemoryEvent"
      WHERE "userId" = ${studentId}
      AND "type" = 'revision_due'
    `
    errorBankDue = rows[0]?.due ?? 0
  } catch {
    errorBankDue = 0
  }

  return `# Profil de ${(profile as Record<string, unknown>).displayName as string ?? user.email.split('@')[0]}

**Plan :** ${plan}
**EAF dans :** ${daysUntilEaf !== null ? `${daysUntilEaf} jours (${eafDate?.toLocaleDateString('fr-FR') ?? ''})` : 'Date non renseignée'}
**Niveau :** ${levelName} (XP: ${xp} • Niveau ${level})
**Série en cours :** ${streak} jours 🔥

## Compétences (SkillMap)
${skillMapSection}

## Points de vigilance
${weakSkills.length > 0 ? weakSkills.map((s) => `- ⚠️ ${s}`).join('\n') : '- Aucune faiblesse critique identifiée'}

## Œuvres au programme
${oeuvres.length > 0 ? oeuvres.map((o) => `- 📚 ${o}`).join('\n') : '- Œuvres non renseignées'}

## Révisions en attente (ErrorBank)
${errorBankDue > 0 ? `⚠️ **${errorBankDue} révision(s) due(s) aujourd'hui** — Spaced Repetition` : '✅ Aucune révision en attente'}

---
*Profil généré le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}*`
}

// ============================================================
// Ressource : nexus://corpus/eaf-rules
// ============================================================

export function getEafRulesResource(): string {
  return `# Règles Officielles EAF — Voie Générale 2026

## 1. Structure des Épreuves

### Épreuve Écrite (4 heures — coefficient 5)
Deux sujets au choix portant sur **deux objets d'étude différents** :
- **Commentaire de texte** : analyser un extrait littéraire selon les axes d'étude
- **Dissertation** : développer une réflexion argumentée sur une question littéraire

**Critères d'évaluation écrits :**
- Compréhension et interprétation du texte
- Construction et organisation de la réflexion (plan)
- Qualité de l'expression et de l'argumentation
- Connaissance de l'œuvre et du parcours associé
- Maîtrise de la langue

### Épreuve Orale (20 minutes — coefficient 5)

**Barème officiel 2/8/2/8 (total = 20) :**
| Phase | Durée | Points | Description |
|-------|-------|--------|-------------|
| Lecture à voix haute | ~2 min | 2 pts | Diction, rythme, respect des pauses |
| Explication linéaire | ~10 min | 8 pts | Analyse du texte, procédés, sens |
| Question de grammaire | ~2 min | 2 pts | Analyse grammaticale d'un passage |
| Entretien | ~8 min | 8 pts | Questions sur l'œuvre et le parcours |

**Textes : extraits des œuvres étudiées en classe + textes du parcours associé**

## 2. Objets d'Étude (voie générale)
1. **La poésie du XIXe au XXIe siècle**
2. **La littérature d'idées du XVIe au XVIIIe siècle**
3. **Le roman et le récit du Moyen Âge au XXIe siècle**
4. **Le théâtre du XVIIe au XXIe siècle**

## 3. Méthodes Examinées

### Dissertation
- Introduction : accroche → présentation du sujet → problématique → annonce du plan
- Développement : 3 parties (si possible) avec transitions
- Conclusion : bilan → ouverture

### Commentaire
- Introduction : présentation du texte → problématique → axes d'analyse
- Développement : 2 ou 3 axes avec exemples précis
- Conclusion : bilan de la lecture

### Explication linéaire (oral)
- Introduction : présentation → problématique → annonce du mouvement
- Analyse linéaire : progression du texte, procédés, effets
- Conclusion : bilan → ouverture

## 4. Procédés Littéraires Fondamentaux
- Figures de style : métaphore, comparaison, métonymie, synecdoque, hyperbole, litote, euphémisme, ironie, antiphrase
- Figures de construction : anaphore, chiasme, gradation, parallélisme, accumulation
- Registres : lyrique, épique, comique, tragique, pathétique, satirique, didactique
- Modes énonciatifs : point de vue, focalisation, discours direct/indirect/indirect libre

---
*Source : Bulletin Officiel de l'Éducation Nationale — Éduscol — Voie générale — Session 2026*
*Autorité : A (source officielle)*`
}

// ============================================================
// Ressource : nexus://system/compliance-rules
// ============================================================

export function getComplianceRulesResource(): string {
  return getComplianceRulesMarkdown()
}

// ============================================================
// Index des ressources disponibles
// ============================================================

export const RESOURCES = [
  {
    uri: 'nexus://student/{studentId}/profile',
    name: 'Profil élève',
    description: 'Profil pédagogique complet d\'un élève (SkillMap, progression, ErrorBank)',
    mimeType: 'text/markdown',
  },
  {
    uri: 'nexus://corpus/eaf-rules',
    name: 'Règles officielles EAF',
    description: 'Structure des épreuves, barèmes, méthodes officielles voie générale 2026',
    mimeType: 'text/markdown',
  },
  {
    uri: 'nexus://system/compliance-rules',
    name: 'Règles de compliance',
    description: 'Règles immuables R-AIACT-01, R-FRAUD-01, R-RGPD-01 etc.',
    mimeType: 'text/markdown',
  },
]
