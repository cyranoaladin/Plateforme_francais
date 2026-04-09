import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { EmailVerificationBanner } from '@/components/ui/EmailVerificationBanner';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthenticatedUser();
  if (!auth?.user) {
    redirect('/login');
  }

  if (auth.user.role === 'eleve') {
    // C1: Enforce onboarding completion server-side
    if (!auth.user.profile?.onboardingCompleted) {
      redirect('/onboarding');
    }
    return (
      <>
        <EmailVerificationBanner emailVerified={!!auth.user.emailVerified} />
        {children}
      </>
    );
  }

  if (auth.user.role === 'admin') {
    redirect('/admin');
  }

  if (auth.user.role === 'parent') {
    redirect('/parent');
  }

  if (auth.user.role === 'enseignant') {
    redirect('/enseignant');
  }

  redirect('/login');
}
