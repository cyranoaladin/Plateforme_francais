export type StudentProfile = {
  displayName: string;
  classLevel: string;
  targetScore: string;
  anneeScolaire?: string;
  establishment?: string;
  eafDate?: string;
  onboardingCompleted: boolean;
  selectedOeuvres: string[];
  classCode?: string;
  parcoursProgress: string[];
  badges: string[];
  preferredObjects: string[];
  weakSkills: string[];
  oeuvreChoisieEntretien?: string;
  lecturesCursives?: string[];
  isMinor?: boolean;
  parentEmail?: string | null;
  teacherEmail?: string | null;
  cguAcceptedAt?: string;
  cguVersion?: string;
  // RGPD Parental Consent
  parentConsentToken?: string | null;
  parentConsentStatus?: 'pending' | 'granted' | 'refused' | 'withdrawn' | null;
  parentConsentDate?: string | null;
  parentConsentIpHash?: string | null;
};

export type MemoryEventType =
  | 'navigation'
  | 'interaction'
  | 'discussion'
  | 'resource'
  | 'evaluation'
  | 'quiz'
  | 'auth';

export type MemoryEvent = {
  id: string;
  userId: string;
  type: MemoryEventType;
  feature: string;
  path?: string;
  payload?: Record<string, string | number | boolean | string[]>;
  createdAt: string;
};

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  role: 'eleve' | 'enseignant' | 'parent' | 'admin';
  emailVerified: string | null;
  createdAt: string;
  profile: StudentProfile;
};

export type SessionRecord = {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  lastSeenAt: string;
};

export type MemoryStore = {
  users: UserRecord[];
  sessions: SessionRecord[];
  events: MemoryEvent[];
};
