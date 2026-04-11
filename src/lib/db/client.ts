import { PrismaClient } from '@prisma/client';

declare global {
  var __eafPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__eafPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__eafPrisma = prisma;
}

// C1 FIX: Cache avec TTL de 30 secondes pour éviter blackout silencieux
const AVAILABILITY_CACHE_TTL_MS = 30_000;
let availabilityCache: boolean | null = null;
let availabilityCacheAt: number = 0;

export async function isDatabaseAvailable(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    availabilityCache = false;
    availabilityCacheAt = Date.now();
    return false;
  }

  const now = Date.now();
  if (availabilityCache !== null && (now - availabilityCacheAt) < AVAILABILITY_CACHE_TTL_MS) {
    return availabilityCache;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    availabilityCache = true;
    availabilityCacheAt = now;
    return true;
  } catch {
    availabilityCache = false;
    availabilityCacheAt = now;
    return false;
  }
}

export async function assertDatabaseAvailable(message = 'Base de données indisponible.'): Promise<void> {
  if (!await isDatabaseAvailable()) {
    throw new Error(message);
  }
}

export function resetDatabaseAvailabilityCache() {
  availabilityCache = null;
}
