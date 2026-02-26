export type StudentProfile = {
  displayName: string;
  classLevel: string;
  targetScore: string;
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
