import { NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';

export async function parseJsonBody<T>(request: Request, schema: ZodType<T>) {
  try {
    const payload = (await request.json()) as unknown;
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
