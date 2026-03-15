import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { getOralCapabilities } from '@/lib/oral/capabilities';

export async function GET() {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const capabilities = await getOralCapabilities();
  return NextResponse.json(capabilities, { status: 200 });
}
