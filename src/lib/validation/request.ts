import { NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';

function containsNullByte(value: unknown): boolean {
  if (typeof value === 'string') return value.includes('\u0000');
  if (Array.isArray(value)) return value.some(containsNullByte);
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some(containsNullByte);
  }
  return false;
}

export async function parseJsonBody<T>(request: Request, schema: ZodType<T>) {
  try {
    const payload = (await request.json()) as unknown;

    if (containsNullByte(payload)) {
      return {
        success: false as const,
        response: NextResponse.json(
          {
            error: 'Payload invalide.',
            details: ['Caractère NUL non autorisé.'],
          },
          { status: 400 },
        ),
      };
    }

    return {
      success: true as const,
      data: schema.parse(payload),
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false as const,
        response: NextResponse.json(
          {
            error: 'Payload invalide.',
            details: error.issues.map((issue) => issue.message),
          },
          { status: 400 },
        ),
      };
    }

    return {
      success: false as const,
      response: NextResponse.json({ error: 'Payload JSON invalide.' }, { status: 400 }),
    };
  }
}
