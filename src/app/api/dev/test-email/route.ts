import { NextResponse, type NextRequest } from 'next/server';
import { sendWelcomeEmail, sendSubscriptionConfirmationEmail } from '@/lib/email/service';

/**
 * GET /api/dev/test-email?type=welcome|subscription
 * Dev-only endpoint to preview and test email sending.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const testEmail = process.env.DEV_TEST_EMAIL;
  if (!testEmail) {
    return NextResponse.json(
      { error: 'DEV_TEST_EMAIL non configuré dans .env' },
      { status: 400 },
    );
  }

  const type = request.nextUrl.searchParams.get('type') ?? 'welcome';

  if (type === 'welcome') {
    const result = await sendWelcomeEmail({
      firstName: 'Camille',
      email: testEmail,
    });
    return NextResponse.json({ type: 'welcome', result });
  }

  if (type === 'subscription') {
    const result = await sendSubscriptionConfirmationEmail({
      user: { firstName: 'Camille', email: testEmail },
      plan: 'PREMIUM',
      transactionId: 'TEST-TXN-001',
      startDate: new Date(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    return NextResponse.json({ type: 'subscription', result });
  }

  return NextResponse.json(
    { error: 'Type invalide. Utilise ?type=welcome ou ?type=subscription' },
    { status: 400 },
  );
}
