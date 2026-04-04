import {
  type MemoryStore,
} from '@/lib/auth/types';

function assertFallbackAllowed() {
  throw new Error('FallbackStore désactivé: persistance DB obligatoire.');
}

function createEmptyStore(): MemoryStore {
  return {
    users: [],
    sessions: [],
    events: [],
  };
}

export async function ensureFallbackStoreExists() {
  assertFallbackAllowed();
}

export async function readFallbackStore(): Promise<MemoryStore> {
  assertFallbackAllowed();
  return createEmptyStore();
}

export async function writeFallbackStore(update: (current: MemoryStore) => MemoryStore) {
  void update;
  assertFallbackAllowed();
}
