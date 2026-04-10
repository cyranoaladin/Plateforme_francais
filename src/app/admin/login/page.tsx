'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { apiFetch, isApiError } from '@/lib/api/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiFetch<{ ok: boolean; role: string }>('/api/v1/auth/login', {
        method: 'POST',
        json: { email: email.trim().toLowerCase(), password },
        redirectOnUnauthorized: false,
      });

      if (data.role !== 'admin') {
        setError('Ce portail est reserve aux administrateurs.');
        setLoading(false);
        return;
      }

      router.push('/admin');
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message);
      } else {
        setError('Erreur de connexion. Veuillez reessayer.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--bg-surface-secondary)] mb-4">
            <Shield className="w-8 h-8 text-[var(--c-accent)]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-heading)]">
            Administration
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Nexus Reussite EAF — Portail admin
          </p>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="mb-6 flex items-start gap-2 rounded-lg bg-[var(--bg-accent-subtle,#fef2f2)] border border-[var(--border-accent,#fecaca)] p-3 text-sm text-[var(--text-accent,#dc2626)]">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-[var(--text-heading)] mb-1.5">
                Email administrateur
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-heading)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)] focus:border-transparent transition"
                placeholder="admin@nexusreussite.academy"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-[var(--text-heading)] mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-heading)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)] focus:border-transparent transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-heading)] transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white bg-[var(--c-accent)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--text-secondary)] mt-6">
          Acces restreint. Toute tentative non autorisee est enregistree.
        </p>
      </div>
    </div>
  );
}
