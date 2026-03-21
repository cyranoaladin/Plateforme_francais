import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/session';

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthenticatedUser();
  if (!auth || auth.user.role !== 'parent') {
    redirect('/dashboard');
  }
  return <>{children}</>;
}
