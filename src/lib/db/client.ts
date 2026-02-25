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

let availabilityCache: boolean | null = null;

export async function isDatabaseAvailable(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    availabilityCache = false;
    return false;
  }

  if (availabilityCache !== null) {
    return availabilityCache;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    availabilityCache = true;
    return true;
  } catch {
    availabilityCache = false;
    return false;
  }
}

export function resetDatabaseAvailabilityCache() {
  availabilityCache = null;
}
