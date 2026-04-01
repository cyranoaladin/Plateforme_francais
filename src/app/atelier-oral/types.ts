import { type ExamPersona } from '@/lib/agents/prompts/examiner-persona';

export type OralStep = 'LECTURE' | 'EXPLICATION' | 'GRAMMAIRE' | 'ENTRETIEN';
export type WizardPhase = 'TIRAGE' | 'PREP' | 'PASSAGE' | 'BILAN';
export type OralMode = 'SIMULATION' | 'FREE_PRACTICE';
export type ExaminerProfile = ExamPersona;

export type SessionPayload = {
  sessionId: string;
  texte: string;
  questionGrammaire: string;
  phraseGrammaire?: string;
  oeuvreChoisie?: string;
  instructions: string;
};

export type StepFeedback = {
  feedback: string;
  score: number;
  max: number;
  points_forts: string[];
  axes: string[];
  relance?: string;
  evaluationFailed?: boolean;
};

export type JuryTurn = {
  role: 'jury' | 'eleve';
  content: string;
};

export type BilanResult = {
  note: number;
  maxNote: number;
  mention: string;
  phases: {
    lecture: { note: number; max: number; commentaire: string };
    explication: { note: number; max: number; commentaire: string };
    grammaire: { note: number; max: number; commentaire: string };
    entretien: { note: number; max: number; commentaire: string };
  };
  bilan_global: string;
  conseil_final: string;
  newBadges?: string[];
};
