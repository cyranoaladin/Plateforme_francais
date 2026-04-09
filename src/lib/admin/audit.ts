import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export type AuditAction =
  | 'user.create'
  | 'user.suspend'
  | 'user.reset-password'
  | 'user.reset-onboarding'
  | 'user.plan-change'
  | 'session.revoke'
  | 'code.generate'
  | 'code.revoke'
  | 'payment.manual'
  | 'payment.confirm';

/**
 * Log an admin action to the audit trail.
 * Fire-and-forget — never blocks the calling request.
 */
export function logAdminAction(params: {
  adminId: string;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ip?: string;
}): void {
  prisma.adminAuditLog
    .create({
      data: {
        adminId: params.adminId,
        action: params.action,
        targetType: params.targetType ?? null,
        targetId: params.targetId ?? null,
        details: params.details ? (params.details as Prisma.InputJsonValue) : Prisma.JsonNull,
        ip: params.ip ?? null,
      },
    })
    .catch((err) => {
      logger.warn({ err, ...params }, 'audit.log.failed');
    });
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') ?? undefined;
}
