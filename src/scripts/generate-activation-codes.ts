#!/usr/bin/env npx tsx
/**
 * CLI script: generate activation codes for EAF plans.
 *
 * Usage:
 *   npx tsx src/scripts/generate-activation-codes.ts --plan PRO --count 10 --duration 30 --batch BATCH_2026_03
 *
 * Output:
 *   - Inserts hashed codes into the ActivationCode table.
 *   - Prints a CSV to stdout with plain-text codes (for printing / delivery).
 *
 * Code format:  NEXUS-{PLAN}-{XXXX}-{XXXX}-{CC}
 *   - PLAN: PRO or MAX
 *   - XXXX: random alphanumeric (uppercase)
 *   - CC: 2-char check digits (first two hex chars of SHA-256 of the code body)
 */

import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

/* ─────────────────── Args parsing ─────────────────── */

function parseArgs(): { plan: string; count: number; duration: number; batch: string } {
  const args = process.argv.slice(2);
  const map = new Map<string, string>();
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const val = args[i + 1];
    if (key && val) map.set(key, val);
  }

  const plan = (map.get('plan') ?? '').toUpperCase();
  if (plan !== 'PREMIUM' && plan !== 'PRO') {
    console.error('❌ --plan must be PRO or MAX');
    process.exit(1);
  }

  const count = Number(map.get('count') ?? 10);
  if (!Number.isInteger(count) || count < 1 || count > 10_000) {
    console.error('❌ --count must be an integer between 1 and 10000');
    process.exit(1);
  }

  const duration = Number(map.get('duration') ?? 30);
  if (!Number.isInteger(duration) || duration < 1) {
    console.error('❌ --duration must be a positive integer (days)');
    process.exit(1);
  }

  const batch = map.get('batch') ?? `BATCH_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}`;

  return { plan, count, duration, batch };
}

/* ─────────────────── Code generation ─────────────────── */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid ambiguity

function randomBlock(length: number): string {
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return result;
}

function checkDigits(body: string): string {
  return crypto.createHash('sha256').update(body).digest('hex').slice(0, 2).toUpperCase();
}

function generateCode(plan: string): string {
  const block1 = randomBlock(4);
  const block2 = randomBlock(4);
  const body = `NEXUS${plan}${block1}${block2}`;
  const cc = checkDigits(body);
  return `NEXUS-${plan}-${block1}-${block2}-${cc}`;
}

function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function hashCode(normalized: string): string {
  const pepper = process.env.BILLING_CODE_PEPPER;
  if (!pepper) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('BILLING_CODE_PEPPER is required in production');
    }
    return crypto.createHash('sha256').update('eaf-dev-only-pepper' + normalized).digest('hex');
  }
  return crypto.createHash('sha256').update(pepper + normalized).digest('hex');
}

/* ─────────────────── Main ─────────────────── */

async function main() {
  const { plan, count, duration, batch } = parseArgs();

  console.error(`\n🔑 Generating ${count} ${plan} codes (${duration} days, batch: ${batch})\n`);

  const prisma = new PrismaClient();

  try {
    const codes: Array<{ plaintext: string; hash: string }> = [];
    const seen = new Set<string>();

    for (let i = 0; i < count; i++) {
      let plaintext: string;
      let normalized: string;
      let hash: string;

      // Ensure uniqueness
      do {
        plaintext = generateCode(plan);
        normalized = normalizeCode(plaintext);
        hash = hashCode(normalized);
      } while (seen.has(hash));

      seen.add(hash);
      codes.push({ plaintext, hash });
    }

    // Bulk insert
    const inserts = codes.map((c) =>
      prisma.activationCode.create({
        data: {
          codeHash: c.hash,
          plan,
          durationDays: duration,
          status: 'CREATED',
          batchId: batch,
        },
      }),
    );

    await prisma.$transaction(inserts);

    // CSV header to stdout
    console.log('code,plan,duration_days,batch');
    for (const c of codes) {
      console.log(`${c.plaintext},${plan},${duration},${batch}`);
    }

    console.error(`\n✅ ${count} codes inserted into DB (batch: ${batch})`);
    console.error('📋 CSV printed to stdout. Redirect to a file: ... > codes.csv\n');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
