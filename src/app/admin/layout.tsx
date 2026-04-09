import { Suspense } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { AdminShell } from './components/admin-shell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get('x-next-pathname') || '';

  // Login page is public — skip auth and shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect('/admin/login');
  }
  if (auth.user.role !== 'admin') {
    redirect('/dashboard');
  }
  return (
    <Suspense fallback={null}>
      <AdminShell userEmail={auth.user.email}>{children}</AdminShell>
    </Suspense>
  );
}
