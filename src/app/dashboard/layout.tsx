import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/session';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect('/login');
  }

  if (auth.user.role === 'admin' || auth.user.role === 'eleve') {
    return <>{children}</>;
  }

  if (auth.user.role === 'parent') {
    redirect('/parent');
  }

  if (auth.user.role === 'enseignant') {
    redirect('/enseignant');
  }

  redirect('/login');
}
