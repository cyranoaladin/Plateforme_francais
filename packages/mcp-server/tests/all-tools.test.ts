import { describe, expect, it } from 'vitest'
import { getProgramme2026 } from '../src/tools/all-tools'

describe('getProgramme2026', () => {
  it('retourne les 12 oeuvres officielles 2025-2026 pour la voie generale', async () => {
    const result = await getProgramme2026({ objet_etude: 'tous' })
    const titres = result.oeuvres.map((oeuvre: { titre: string }) => oeuvre.titre)

    expect(titres).toEqual(expect.arrayContaining([
      'Cahier de Douai',
      "La rage de l'expression",
      'Mes forêts',
      'Discours de la servitude volontaire',
      'Entretiens sur la pluralité des mondes',
      "Lettres d'une Péruvienne",
      'Le Menteur',
      'On ne badine pas avec l’amour',
      'Pour un oui ou pour un non',
      'Manon Lescaut',
      'La Peau de chagrin',
      'Sido & Les Vrilles de la vigne',
    ]))
    expect(result.oeuvres).toHaveLength(12)
  })
})
