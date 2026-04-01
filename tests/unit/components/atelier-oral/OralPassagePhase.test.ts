import { createElement, type AnchorHTMLAttributes } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { OralPassagePhase } from '@/app/atelier-oral/components/OralPassagePhase';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) =>
    createElement('a', { href, ...props }, children),
}));

describe('OralPassagePhase', () => {
  it("affiche un avertissement distinct quand l'évaluation automatique échoue", () => {
    const html = renderToString(
      createElement(OralPassagePhase, {
        session: {
          texte: 'Un extrait test.',
          questionGrammaire: 'Analysez la négation.',
          phraseGrammaire: 'Je ne sais pas.',
          oeuvreChoisie: 'Manon Lescaut',
          instructions: '',
          sessionId: 'session-1',
        },
        currentStep: 'LECTURE',
        currentStepIndex: 0,
        steps: ['LECTURE', 'EXPLICATION', 'GRAMMAIRE', 'ENTRETIEN'],
        stepLabels: {
          LECTURE: 'Lecture /2',
          EXPLICATION: 'Explication /8',
          GRAMMAIRE: 'Grammaire /2',
          ENTRETIEN: 'Entretien /8',
        },
        stepGuidance: {
          LECTURE: { title: 'Lecture expressive', body: 'Travaille le rythme.' },
          EXPLICATION: { title: 'Explication', body: 'Travaille la structure.' },
          GRAMMAIRE: { title: 'Grammaire', body: 'Travaille la syntaxe.' },
          ENTRETIEN: { title: 'Entretien', body: 'Travaille le dialogue.' },
        },
        passageRemaining: 1200,
        phaseRemaining: 110,
        isSimulation: true,
        isMicOn: false,
        transcript: 'Réponse test',
        setTranscript: () => {},
        toggleMic: async () => {},
        submitStep: async () => {},
        isLoading: false,
        useServerVoice: false,
        aggregated: { totalScore: 0, totalMax: 2 },
        feedbacks: {
          LECTURE: {
            feedback: 'Évaluation automatique indisponible.',
            score: 0,
            max: 2,
            points_forts: [],
            axes: ['Réessayer plus tard'],
            evaluationFailed: true,
          },
          EXPLICATION: undefined,
          GRAMMAIRE: undefined,
          ENTRETIEN: undefined,
        },
        examinerProfile: 'NEUTRE',
        setExaminerProfile: () => {},
        juryTurns: [],
        juryContainerRef: { current: null },
        isJuryLoading: false,
        askExaminerFollowUp: async () => {},
        oralTutorHref: '/tuteur',
      }),
    );

    expect(html).toContain('Évaluation indisponible');
    expect(html).toContain('score non comptabilisé');
  });
});
