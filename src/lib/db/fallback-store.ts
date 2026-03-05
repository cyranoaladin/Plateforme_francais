import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import {
  type MemoryStore,
} from '@/lib/auth/types';

const STORE_PATH = path.join(process.cwd(), '.data', 'memory-store.json');
let writeQueue: Promise<void> = Promise.resolve();

function createEmptyStore(): MemoryStore {
  return {
    users: [],
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
    await fs.writeFile(STORE_PATH, JSON.stringify(createEmptyStore(), null, 2), 'utf8');
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
