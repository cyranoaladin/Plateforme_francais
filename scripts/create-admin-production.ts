#!/usr/bin/env tsx
/**
 * Create production admin account with full permissions
 * Usage: npx tsx scripts/create-admin-production.ts
 */
import { PrismaClient } from '@prisma/client';
import { createPasswordCredentials } from '../src/lib/auth/session';
import { getCurrentAnneeScolaire } from '../src/lib/date/current-school-year';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Creating production admin account...\n');

  const email = 'admin@nexusreussite.academy';
  const password = 'Admin2026!Nexus';

  // Hash password
  const { passwordHash, passwordSalt } = createPasswordCredentials(password);

  // Create or update admin user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'admin',
      passwordHash,
      passwordSalt,
    },
    create: {
      email,
      passwordHash,
      passwordSalt,
      role: 'admin',
    },
  });

  console.log('✅ Admin user created/updated:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role: ${user.role}\n`);

  // Create student profile (required for navigation)
  const profile = await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: {
      displayName: 'Administrateur Système',
      classLevel: 'PREMIERE',
      targetScore: 'EXCELLENCE',
      voie: 'GENERALE',
      anneeScolaire: getCurrentAnneeScolaire(),
      onboardingCompleted: true,
    },
    create: {
      userId: user.id,
      displayName: 'Administrateur Système',
      classLevel: 'PREMIERE',
      targetScore: 'EXCELLENCE',
      voie: 'GENERALE',
      anneeScolaire: getCurrentAnneeScolaire(),
      onboardingCompleted: true,
      preferredObjects: ['POESIE', 'THEATRE', 'ROMAN', 'LITTERATURE_IDEES'],
      weakSkills: [],
      selectedOeuvres: [],
      parcoursProgress: [],
      badges: ['ADMIN_BADGE'],
    },
  });

  console.log('✅ Admin profile created:');
  console.log(`   Display Name: ${profile.displayName}`);
  console.log(`   Level: ${profile.level} (XP: ${profile.xp})\n`);

  // Note: Subscription management will be handled via admin dashboard
  console.log('✅ Admin account has full platform access\n');

  // Display admin capabilities
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 ADMIN CAPABILITIES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('✅ User Management:');
  console.log('   - View all users');
  console.log('   - Edit user roles (ADMIN, ENSEIGNANT, ELEVE)');
  console.log('   - Delete users');
  console.log('   - View user activity and statistics\n');

  console.log('✅ Subscription Management:');
  console.log('   - View all subscriptions');
  console.log('   - Activate/Deactivate subscriptions');
  console.log('   - Change subscription plans (FREE, PRO, MAX)');
  console.log('   - Extend subscription dates');
  console.log('   - Generate activation codes\n');

  console.log('✅ Content Management:');
  console.log('   - Manage official works (œuvres)');
  console.log('   - Upload pedagogical resources');
  console.log('   - Moderate user-generated content');
  console.log('   - Manage RAG knowledge base\n');

  console.log('✅ Analytics & Monitoring:');
  console.log('   - View platform statistics');
  console.log('   - Monitor LLM usage and costs');
  console.log('   - Track user engagement');
  console.log('   - Export reports (CSV, PDF)\n');

  console.log('✅ System Configuration:');
  console.log('   - Manage class codes');
  console.log('   - Configure feature flags');
  console.log('   - View system health');
  console.log('   - Access admin dashboard\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 LOGIN CREDENTIALS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`   URL: https://eaf.nexusreussite.academy`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role: ADMIN\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  IMPORTANT SECURITY NOTES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('   1. Change this password after first login');
  console.log('   2. Enable 2FA if available');
  console.log('   3. Do not share admin credentials');
  console.log('   4. Use strong, unique password');
  console.log('   5. Monitor admin activity logs\n');

  console.log('✅ Admin account ready for production use!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error creating admin account:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
