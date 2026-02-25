#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════
# Nexus Réussite EAF — One-command dev setup (P0-8)
# Usage: npm run setup
# Expected time: < 10 min
# ════════════════════════════════════════════════════════════
set -euo pipefail

echo "🚀 Nexus Réussite EAF — Setup"

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm ci

if [ -d "packages/mcp-server" ]; then
  echo "📦 Installing MCP server dependencies..."
  cd packages/mcp-server && npm ci && cd ../..
fi

# 2. Generate .env.local from .env.example if missing
if [ ! -f ".env.local" ]; then
  echo "📝 Generating .env.local from .env.example..."
  cp .env.example .env.local
  echo "   ⚠️  Edit .env.local with your actual credentials before running the app."
else
  echo "✅ .env.local already exists."
fi

# 3. Prisma validate + generate
echo "🗃️  Prisma validate..."
npx prisma validate

echo "🗃️  Prisma generate..."
npx prisma generate

# 4. Database migration (dev mode)
echo "🗃️  Running database migrations..."
npx prisma migrate dev --skip-generate 2>/dev/null || echo "   ⚠️  Migration skipped (DB may not be running). Start PostgreSQL and re-run."

# 5. Seed official works
echo "📚 Seeding OfficialWorks 2025-2026..."
npx tsx prisma/seed-official-works.ts 2>/dev/null || echo "   ⚠️  Seed skipped (DB may not be running)."

# 6. Generate next-env.d.ts
echo "📄 Generating next-env.d.ts..."
printf '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n\n// NOTE: This file should not be edited\n// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.\n' > next-env.d.ts

# 7. Verify
echo ""
echo "✅ Setup complete!"
echo "   → Edit .env.local with your credentials"
echo "   → Start PostgreSQL + Redis"
echo "   → Run: npm run dev"
echo ""
