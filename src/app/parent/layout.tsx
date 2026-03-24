import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/session';

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect('/login');
  }

  if (auth.user.role === 'parent') {
    return <>{children}</>;
  }

  if (auth.user.role === 'admin') {
    redirect('/admin');
  }

  if (auth.user.role === 'enseignant') {
    redirect('/enseignant');
  }

  redirect('/dashboard');
}
