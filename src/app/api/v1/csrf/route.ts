import { NextResponse } from 'next/server';
import { ensureCsrfCookie, CSRF_COOKIE } from '@/lib/security/csrf';
import { cookies } from 'next/headers';

export async function GET() {
  const response = NextResponse.json(
    { csrfToken: 'pending' },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
  await ensureCsrfCookie(response);

  // Read back the token that was set
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get(CSRF_COOKIE)?.value ?? response.cookies.get(CSRF_COOKIE)?.value ?? '';

  return NextResponse.json(
    { csrfToken },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Set-Cookie': response.headers.get('Set-Cookie') ?? '',
      },
    },
  );
}
