import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { parseJsonBody } from '@/lib/validation/request';
import { z } from 'zod';
import crypto from 'crypto';
import { hashCode } from '@/lib/billing/redeem';

const generateCodeSchema = z.object({
  plan: z.enum(['PREMIUM', 'PRO', 'MAX']),
  durationDays: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
  batchId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const { auth, errorResponse } = await requireUserRole('admin');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  try {
    const codes = await prisma.activationCode.findMany({
      select: {
        id: true,
        codeHash: true,
        plan: true,
        durationDays: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        redeemedAt: true,
        redeemedByUserId: true,
        batchId: true,
        notes: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ codes }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des codes.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { auth, errorResponse } = await requireUserRole('admin');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const rl = await checkRateLimit({ request, key: `admin:activation-codes:${auth.user.id}`, limit: 20, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
  }

  const parsed = await parseJsonBody(request, generateCodeSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const { plan, durationDays, expiresAt, batchId, notes } = parsed.data;

  // Générer un code unique lisible (format: EAF-XXXX-XXXX-XXXX)
  const code = `EAF${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  const codeHash = hashCode(code);

  try {
    const activationCode = await prisma.activationCode.create({
      data: {
        codeHash,
        plan,
        durationDays: durationDays || (plan === 'MAX' ? 36500 : 30), // 100 ans pour MAX
        status: 'CREATED',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        batchId,
        notes,
      },
    });

    return NextResponse.json({ 
      code: {
        ...activationCode,
        plainCode: code, // Retourner le code en clair une seule fois
      }
    }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la création du code.' },
      { status: 500 }
    );
  }
}
