import { type CopieProgressEventRecord, type CopieRecord, type EpreuveRecord } from '@/lib/epreuves/types';

type EpreuvesStore = {
  epreuves: EpreuveRecord[];
  copies: CopieRecord[];
  progressEvents: CopieProgressEventRecord[];
};

function assertFallbackAllowed() {
  throw new Error('Epreuves fallback store désactivé: persistance DB obligatoire.');
}

export async function readEpreuvesFallbackStore(): Promise<EpreuvesStore> {
  assertFallbackAllowed();
  return { epreuves: [], copies: [], progressEvents: [] };
}

export async function writeEpreuvesFallbackStore(update: (store: EpreuvesStore) => EpreuvesStore) {
  void update;
  assertFallbackAllowed();
}
