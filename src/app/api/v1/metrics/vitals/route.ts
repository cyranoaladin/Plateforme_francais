import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { getRedisClient } from '@/lib/queue/correction-queue';

type VitalName = 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';

const ALLOWED_VITALS = new Set<VitalName>(['LCP', 'FID', 'CLS', 'TTFB', 'INP']);
const REDIS_KEY = 'eaf:vitals:aggregate';

interface VitalAggregate {
  count: number;
  total: number;
  avg: number;
  last: number;
}

type Store = Record<VitalName, VitalAggregate>;

function emptyStore(): Store {
  const empty = { count: 0, total: 0, avg: 0, last: 0 };
  return {
    LCP: { ...empty },
    FID: { ...empty },
    CLS: { ...empty },
    TTFB: { ...empty },
    INP: { ...empty },
  };
}

async function readStore(): Promise<Store> {
  try {
    const redis = getRedisClient();
    const raw = await redis.get(REDIS_KEY);
    return raw ? (JSON.parse(raw) as Store) : emptyStore();
  } catch {
    return emptyStore();
  }
}

async function writeStore(store: Store): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.set(REDIS_KEY, JSON.stringify(store), 'EX', 86400); // TTL 24h
  } catch {
    // fail-open
  }
}

/**
 * POST /api/v1/metrics/vitals
 * Body: { name: VitalName; value: number }
 * Soumet une métrique Web Vital.
 */
export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) return errorResponse!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide.' }, { status: 400 });
  }

  const { name, value } = body as { name?: unknown; value?: unknown };
  if (
    typeof name !== 'string' ||
    !ALLOWED_VITALS.has(name as VitalName) ||
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 60_000
  ) {
    return NextResponse.json({ error: 'Paramètres invalides.' }, { status: 400 });
  }

  const store = await readStore();
  const item = store[name as VitalName];
  item.count += 1;
  item.total += value;
  item.last = value;
  item.avg = Number((item.total / item.count).toFixed(2));
  await writeStore(store);

  return NextResponse.json({ ok: true }, { status: 200 });
}

/**
 * GET /api/v1/metrics/vitals
 * Retourne les agrégats Web Vitals (admin only).
 */
export async function GET() {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) return errorResponse!;

  if (auth.user.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const store = await readStore();
  return NextResponse.json({ vitals: store }, { status: 200 });
}
