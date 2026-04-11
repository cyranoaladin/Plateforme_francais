import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { sendMetaCapiEvent } from '@/lib/tracking/meta-capi';

const BASE_URL =
  process.env.APP_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'https://eaf.nexusreussite.academy';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=token-expired', BASE_URL));
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken: tokenHash,
      emailVerifyExpiry: { gt: new Date() },
    },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.redirect(new URL('/login?error=token-expired', BASE_URL));
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerifyToken: null,
      emailVerifyExpiry: null,
    },
  });

  logger.info({ userId: user.id }, 'auth.verify_email.success');

  // Meta CAPI — CompleteRegistration event (non-blocking)
  void sendMetaCapiEvent({
    eventName: 'CompleteRegistration',
    email: user.email,
    clientIp: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
    userAgent: request.headers.get('user-agent') ?? undefined,
    sourceUrl: `${process.env.APP_URL ?? 'https://eaf.nexusreussite.academy'}/register`,
    eventId: `complete-registration-${user.id}`,
  });

  return NextResponse.redirect(new URL('/login?verified=true', BASE_URL));
}
