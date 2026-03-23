import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/session';

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect('/login');
  }
  if (auth.user.role !== 'enseignant' && auth.user.role !== 'admin') {
    redirect('/dashboard');
  }
  return <>{children}</>;
}
