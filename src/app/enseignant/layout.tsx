import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/session';

export default async function EnseignantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect('/login?redirect=/enseignant');
  }

  // Seuls les enseignants peuvent accéder à cette zone
  if (auth.user.role !== 'enseignant') {
    // Rediriger vers le dashboard approprié selon le rôle
    if (auth.user.role === 'admin') {
      redirect('/admin');
    }
    if (auth.user.role === 'parent') {
      redirect('/parent');
    }
    // Élève ou tout autre rôle -> dashboard
    redirect('/dashboard');
  }

  return <>{children}</>;
}
