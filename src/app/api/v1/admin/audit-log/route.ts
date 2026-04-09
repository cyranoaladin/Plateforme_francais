import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';

/**
 * GET /api/v1/admin/audit-log
 * Returns admin audit trail with pagination and filters.
 */
export async function GET(request: Request) {
  const { auth, errorResponse } = await requireUserRole('admin');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '50')));
    const action = searchParams.get('action') ?? undefined;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (action) {
      where.action = action;
    }

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        include: {
          admin: {
            select: { email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        adminEmail: l.admin.email,
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId,
        details: l.details,
        ip: l.ip,
        createdAt: l.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation du journal d\'audit.' },
      { status: 500 },
    );
  }
}
