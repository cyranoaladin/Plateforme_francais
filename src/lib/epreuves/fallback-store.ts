import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { type CopieRecord, type EpreuveRecord } from '@/lib/epreuves/types';

type EpreuvesStore = {
  epreuves: EpreuveRecord[];
  copies: CopieRecord[];
};

const STORE_PATH = path.join(process.cwd(), '.data', 'epreuves-store.json');
let writeQueue: Promise<void> = Promise.resolve();

async function ensureStoreExists() {
  try {
    await fs.access(STORE_PATH);
    JSON.parse(await fs.readFile(STORE_PATH, 'utf8'));
  } catch {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify({ epreuves: [], copies: [] }, null, 2), 'utf8');
  }
}

export async function readEpreuvesFallbackStore(): Promise<EpreuvesStore> {
  await ensureStoreExists();
  return JSON.parse(await fs.readFile(STORE_PATH, 'utf8')) as EpreuvesStore;
}

export async function writeEpreuvesFallbackStore(update: (store: EpreuvesStore) => EpreuvesStore) {
  writeQueue = writeQueue.then(async () => {
    const current = await readEpreuvesFallbackStore();
    const next = update(current);
    const tempPath = `${STORE_PATH}.${process.pid}.${randomUUID()}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(next, null, 2), 'utf8');
    await fs.rename(tempPath, STORE_PATH);
  });

  await writeQueue;
}
