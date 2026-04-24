import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/session';

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect('/login?redirect=/parent');
  }

  // Seuls les parents peuvent accéder à cette zone
  if (auth.user.role !== 'parent') {
    // Rediriger vers le dashboard approprié selon le rôle
    if (auth.user.role === 'admin') {
      redirect('/admin');
    }
    if (auth.user.role === 'enseignant') {
      redirect('/enseignant');
    }
    // Élève ou tout autre rôle -> dashboard
    redirect('/dashboard');
  }

  return <>{children}</>;
}
