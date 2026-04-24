import { describe, it, expect } from 'vitest';
import { oralPrep30Skill, type OralPrep30Output } from '@/lib/llm/skills/oral-prep30';

describe('oral-prep30 skill', () => {
  describe('schema', () => {
    it('valide une sortie correcte avec les 3 blocs', () => {
      const valid: OralPrep30Output = {
        texte_tire: 'Spleen (LXXVIII) \u2014 Baudelaire',
        bloc_1: {
          titre: 'Lecture et ancrage',
          duree: 'T+0 \u2192 T+10 min',
          taches: [
            'Lire le texte deux fois en silence',
            'Identifier le genre : po\u00e8me lyrique, mouvement : symbolisme',
            'D\u00e9limiter 3 strophes comme 3 mouvements',
            'Formuler une probl\u00e9matique provisoire',
          ],
        },
        bloc_2: {
          titre: 'Rep\u00e9rages actifs',
          duree: 'T+10 \u2192 T+20 min',
          taches: [
            "Rep\u00e9rer les m\u00e9taphores fil\u00e9es de l'enfermement (v.1-4)",
            "Identifier l'anaphore \"Quand\u2026\" et son effet d'accumulation",
            'Pr\u00e9parer la question de grammaire sur le subjonctif v.12',
            '3 citations m\u00e9morisables s\u00e9lectionn\u00e9es',
          ],
        },
        bloc_3: {
          titre: 'Mise au propre et m\u00e9morisation',
          duree: 'T+20 \u2192 T+30 min',
          taches: [
            'Finaliser la probl\u00e9matique et les 2 axes du plan lin\u00e9aire',
            'Relire les 3 citations \u00e0 voix haute',
            'Anticiper une question sur Les Fleurs du Mal',
          ],
        },
        pistes_plan: [
          'Piste 1 : La prison int\u00e9rieure \u2014 Comment Baudelaire traduit-il l\'enfermement psychologique par des images spatiales ?',
          'Piste 2 : L\'accumulation comme technique \u2014 En quoi la syntaxe longue amplifie-t-elle le sentiment de d\u00e9sespoir ?',
        ],
        procedes_cles: [
          "M\u00e9taphore fil\u00e9e de l'enfermement (v.1-4)",
          "Anaphore \"Quand\u2026\" \u2014 effet d'accumulation",
          'Champ lexical de la mort et de l\'obscurit\u00e9',
        ],
      };

      const result = oralPrep30Skill.outputSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejette une sortie sans texte_tire', () => {
      const invalid = {
        bloc_1: { titre: 'Lecture', duree: 'T+0 \u2192 T+10 min', taches: ['Lire'] },
        bloc_2: { titre: 'Rep\u00e9rages', duree: 'T+10 \u2192 T+20 min', taches: ['Proc\u00e9d\u00e9s'] },
        bloc_3: { titre: 'Mise au propre', duree: 'T+20 \u2192 T+30 min', taches: ['Relire'] },
        pistes_plan: ['Piste 1 : axe \u2014 question ?', 'Piste 2 : axe \u2014 question ?'],
        procedes_cles: ['M\u00e9taphore', 'Anaphore'],
      };

      const result = oralPrep30Skill.outputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejette un bloc sans taches', () => {
      const invalid = {
        texte_tire: 'Extrait \u2014 Auteur',
        bloc_1: { titre: 'Lecture', duree: 'T+0 \u2192 T+10 min', taches: [] },
        bloc_2: { titre: 'Rep\u00e9rages', duree: 'T+10 \u2192 T+20 min', taches: ['Proc\u00e9d\u00e9s'] },
        bloc_3: { titre: 'Mise au propre', duree: 'T+20 \u2192 T+30 min', taches: ['Relire'] },
        pistes_plan: ['Piste 1 : axe \u2014 question ?', 'Piste 2 : axe \u2014 question ?'],
        procedes_cles: ['M\u00e9taphore', 'Anaphore'],
      };

      const result = oralPrep30Skill.outputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejette pistes_plan avec plus de 5 \u00e9l\u00e9ments', () => {
      const tooMany = {
        texte_tire: 'Extrait \u2014 Auteur',
        bloc_1: { titre: 'L', duree: 'T+0', taches: ['t1'] },
        bloc_2: { titre: 'R', duree: 'T+10', taches: ['t2'] },
        bloc_3: { titre: 'M', duree: 'T+20', taches: ['t3'] },
        pistes_plan: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'],
        procedes_cles: ['proc1', 'proc2'],
      };

      const result = oralPrep30Skill.outputSchema.safeParse(tooMany);
      expect(result.success).toBe(false);
    });

    it('rejette procedes_cles vide', () => {
      const invalid = {
        texte_tire: 'Extrait \u2014 Auteur',
        bloc_1: { titre: 'L', duree: 'T+0', taches: ['t1'] },
        bloc_2: { titre: 'R', duree: 'T+10', taches: ['t2'] },
        bloc_3: { titre: 'M', duree: 'T+20', taches: ['t3'] },
        pistes_plan: ['p1', 'p2'],
        procedes_cles: [],
      };

      const result = oralPrep30Skill.outputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('fallback', () => {
    it('le fallback valide le schema', () => {
      const result = oralPrep30Skill.outputSchema.safeParse(oralPrep30Skill.fallback);
      expect(result.success).toBe(true);
    });

    it('le fallback contient les 3 blocs avec des taches non vides', () => {
      const fb = oralPrep30Skill.fallback;
      expect(fb.bloc_1.taches.length).toBeGreaterThan(0);
      expect(fb.bloc_2.taches.length).toBeGreaterThan(0);
      expect(fb.bloc_3.taches.length).toBeGreaterThan(0);
    });

    it('le fallback a un champ texte_tire non vide', () => {
      expect(oralPrep30Skill.fallback.texte_tire.length).toBeGreaterThan(0);
    });
  });

  describe('prompt', () => {
    it('mentionne les 3 blocs de 10 minutes', () => {
      expect(oralPrep30Skill.prompt).toContain('T+0 \u00e0 T+10 min');
      expect(oralPrep30Skill.prompt).toContain('T+10 \u00e0 T+20 min');
      expect(oralPrep30Skill.prompt).toContain('T+20 \u00e0 T+30 min');
    });

    it('mentionne le TEXTE TIR\u00c9 comme ancre', () => {
      expect(oralPrep30Skill.prompt).toContain('TEXTE TIR\u00c9');
    });

    it('contient la clause ANTI-TRICHE', () => {
      expect(oralPrep30Skill.prompt).toContain('ANTI-TRICHE');
    });

    it('impose le format JSON strict avec les 3 blocs', () => {
      expect(oralPrep30Skill.prompt).toContain('bloc_1');
      expect(oralPrep30Skill.prompt).toContain('bloc_2');
      expect(oralPrep30Skill.prompt).toContain('bloc_3');
    });
  });
});
