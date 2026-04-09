'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  Users,
  Key,
  CreditCard,
  LogOut,
  Shield,
  Menu,
  X,
  Monitor,
  Activity,
  FileText,
} from 'lucide-react';
import { useState } from 'react';
import { type AdminDashboardTab } from '@/lib/admin/dashboard-tab-data';

const NAV_ITEMS: { id: AdminDashboardTab; label: string; icon: typeof BarChart3 }[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'sessions', label: 'Sessions', icon: Monitor },
  { id: 'activity', label: 'Activite', icon: Activity },
  { id: 'codes', label: 'Codes d\'activation', icon: Key },
  { id: 'payments', label: 'Paiements', icon: CreditCard },
  { id: 'audit', label: 'Journal d\'audit', icon: FileText },
];

export function AdminShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Don't render shell on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const currentTab = searchParams.get('tab') as AdminDashboardTab | null;

  async function handleLogout() {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      // Best-effort
    }
    router.push('/admin/login');
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[var(--bg-surface)] border-r border-[var(--border-primary)] flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--border-primary)]">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--bg-surface-secondary)]">
            <Shield className="w-5 h-5 text-[var(--c-accent)]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-heading)] truncate">Administration</p>
            <p className="text-xs text-[var(--text-secondary)] truncate">{userEmail}</p>
          </div>
          <button
            type="button"
            className="ml-auto lg:hidden text-[var(--text-secondary)]"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = currentTab === item.id || (!currentTab && item.id === 'overview');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  router.push(`/admin?tab=${item.id}`);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--bg-surface-secondary)] text-[var(--c-accent)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-surface-secondary)]'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-[var(--border-primary)]">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-accent,#dc2626)] hover:bg-[var(--bg-accent-subtle,#fef2f2)] transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Deconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-surface)]">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-heading)]"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-[var(--text-heading)]">Administration</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
