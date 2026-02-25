import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import {
  type MemoryStore,
  type StudentProfile,
  type UserRecord,
} from '@/lib/auth/types';

const STORE_PATH = path.join(process.cwd(), '.data', 'memory-store.json');
let writeQueue: Promise<void> = Promise.resolve();

const DEFAULT_PROFILE: StudentProfile = {
  displayName: 'Jean Dupont',
  classLevel: 'Première générale',
  targetScore: '14/20',
  onboardingCompleted: false,
  selectedOeuvres: [],
  parcoursProgress: [],
  badges: [],
  preferredObjects: ['Poésie', 'Roman'],
  weakSkills: ['Problématisation', 'Grammaire'],
};

function nowIso() {
  return new Date().toISOString();
}

function createSeedStore(): MemoryStore {
  const userId = randomUUID();
  const seedUser: UserRecord = {
    id: userId,
    email: 'jean@eaf.local',
    passwordHash:
      '4db1031d8cf562ed644f6ea2bc463a0468d9c29cb253c85c68e77a648910fc467b4b0ca2c811ba063d28fcb128693e74',
    passwordSalt: 'f4621fc0ddf3c8b85d180d5ef4f8f2df',
    role: 'eleve',
    createdAt: nowIso(),
    profile: DEFAULT_PROFILE,
  };

  return {
    users: [seedUser],
    sessions: [],
    events: [],
  };
}

export async function ensureFallbackStoreExists() {
  try {
    await fs.access(STORE_PATH);
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    JSON.parse(raw);
  } catch {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(createSeedStore(), null, 2), 'utf8');
  }
}

export async function readFallbackStore(): Promise<MemoryStore> {
  await ensureFallbackStoreExists();
  const raw = await fs.readFile(STORE_PATH, 'utf8');
  return JSON.parse(raw) as MemoryStore;
}

export async function writeFallbackStore(update: (current: MemoryStore) => MemoryStore) {
  writeQueue = writeQueue.then(async () => {
    const current = await readFallbackStore();
    const next = update(current);
    const tempPath = `${STORE_PATH}.${process.pid}.${randomUUID()}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(next, null, 2), 'utf8');
    await fs.rename(tempPath, STORE_PATH);
  });

  await writeQueue;
}
