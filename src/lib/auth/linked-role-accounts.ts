import { createHash, randomBytes, randomUUID } from 'crypto';
import type { UserRole } from '@prisma/client';
import { createPasswordCredentials } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { createUser, findUserByEmail } from '@/lib/db/repositories/userRepo';
import { sendLinkedRoleInvitationEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';

type LinkedRole = Extract<UserRole, 'parent' | 'enseignant'>;

type EnsureLinkedRoleAccountInput = {
  email: string;
  role: LinkedRole;
  studentDisplayName: string;
};

export type EnsureLinkedRoleAccountResult =
  | { status: 'created'; userId: string }
  | { status: 'existing'; userId: string }
  | { status: 'role_conflict'; userId: string; existingRole: UserRole };

function buildLinkedProfile(role: LinkedRole, email: string) {
  const localPart = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim() || (role === 'parent' ? 'Parent' : 'Enseignant');
  const displayName = localPart
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');

  return {
    displayName,
    classLevel: role === 'parent' ? 'Suivi parent' : 'Suivi enseignant',
    targetScore: '14/20',
    onboardingCompleted: true,
    selectedOeuvres: [],
    parcoursProgress: [],
    badges: [],
    preferredObjects: [],
    weakSkills: [],
  };
}

async function issuePasswordSetupToken(userId: string): Promise<string> {
  await prisma.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return rawToken;
}

export async function ensureLinkedRoleAccount(
  input: EnsureLinkedRoleAccountInput,
): Promise<EnsureLinkedRoleAccountResult> {
  const email = input.email.trim().toLowerCase();
  const existing = await findUserByEmail(email);

  if (existing) {
    if (existing.role === input.role || existing.role === 'admin') {
      return { status: 'existing', userId: existing.id };
    }

    logger.warn(
      { email, expectedRole: input.role, existingRole: existing.role },
      'linked-role-account.role_conflict',
    );
    return {
      status: 'role_conflict',
      userId: existing.id,
      existingRole: existing.role,
    };
  }

  const userId = randomUUID();
  const credentials = createPasswordCredentials(randomBytes(24).toString('hex'));

  await createUser({
    id: userId,
    email,
    passwordHash: credentials.passwordHash,
    passwordSalt: credentials.passwordSalt,
    role: input.role,
    profile: buildLinkedProfile(input.role, email),
  });

  try {
    const rawToken = await issuePasswordSetupToken(userId);
    await sendLinkedRoleInvitationEmail({
      email,
      role: input.role,
      studentDisplayName: input.studentDisplayName,
      rawToken,
    });
  } catch (error) {
    logger.error(
      { err: error, email, role: input.role, userId },
      'linked-role-account.invitation_failed',
    );
  }

  return { status: 'created', userId };
}
