'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, ShieldCheck, BookOpen, Ban, AlertTriangle } from 'lucide-react';
import { apiFetch, isApiError } from '@/lib/api/client';
import { track } from '@/components/analytics/events';

/* ─────────────────── Types ─────────────────── */

type AuthMode = 'login' | 'register';

type ProfilePayload = {
  onboardingCompleted?: boolean;
  displayName?: string;
};

/* ─────────────────── Rate-limit countdown ─────────────────── */

function RateLimitNotice({ retryAfterSec }: { retryAfterSec: number }) {
  const [remaining, setRemaining] = useState(retryAfterSec);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => setRemaining((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  if (remaining <= 0) return null;

  return (
    <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning flex items-start gap-2" role="status">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>Trop de tentatives. Réessaie dans <strong>{remaining}s</strong>.</span>
    </div>
  );
}

/* ─────────────────── Password field with toggle ─────────────────── */

function PasswordField({
  id,
  value,
  onChange,
  label,
  testId,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
  testId?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          id={id}
          data-testid={testId}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-background border border-input rounded-xl px-3 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
          required
          minLength={8}
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────── Proof panel (left side desktop) ─────────────────── */

function ProofPanel() {
  return (
    <div className="hidden lg:flex lg:col-span-5 flex-col justify-center p-10 bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-800 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />

      <div className="relative z-10 space-y-8">
        <img src="/images/logo_slogan_nexus.png" alt="Nexus Réussite" className="h-14 w-auto object-contain brightness-0 invert opacity-90" />

        <h2 className="text-2xl font-bold leading-tight">
          Prépare l&apos;EAF avec méthode,<br />pas au hasard.
        </h2>

        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0 text-violet-200" />
            <span className="text-sm text-violet-100 leading-relaxed">
              <strong className="text-white">Coaching actif</strong> — L&apos;IA te fait travailler, elle ne fait pas à ta place.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 mt-0.5 shrink-0 text-violet-200" />
            <span className="text-sm text-violet-100 leading-relaxed">
              <strong className="text-white">Sources vérifiables</strong> — Citations BO / Eduscol / œuvres au programme.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Ban className="w-5 h-5 mt-0.5 shrink-0 text-violet-200" />
            <span className="text-sm text-violet-100 leading-relaxed">
              <strong className="text-white">Anti-copier-coller</strong> — Refus pédagogique + alternative constructive.
            </span>
          </li>
        </ul>

        <p className="text-xs text-violet-200/80 border-t border-white/10 pt-4">
          Connexion sécurisée. Protection CSRF. Limitation des tentatives.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────── Auth Card (tabs + forms) ─────────────────── */

function AuthCard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isMinor, setIsMinor] = useState(false);
  const [parentEmail, setParentEmail] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [rateLimitSec, setRateLimitSec] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setMode('register');
    }
  }, [searchParams]);

  useEffect(() => {
    track({ name: 'page_view', props: { path: '/login' } });
  }, []);

  const switchMode = useCallback((m: AuthMode) => {
    setMode(m);
    setError(null);
    setRateLimitSec(null);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setRateLimitSec(null);

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        return;
      }
      if (!acceptTerms) {
        setError('Tu dois accepter les conditions d\'utilisation.');
        return;
      }
    }

    setIsSubmitting(true);
    track({ name: 'auth_submit', props: { mode } });

    try {
      const endpoint = mode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register';
      await apiFetch(endpoint, {
        method: 'POST',
        json: {
          email,
          password,
          ...(mode === 'register' ? { displayName } : {}),
        },
      });

      track({ name: 'auth_success', props: { mode } });

      if (mode === 'register') {
        router.push('/onboarding');
        router.refresh();
        return;
      }

      // Post-login gating: check onboarding status
      try {
        const profile = await apiFetch<ProfilePayload>('/api/v1/student/profile');
        if (!profile.onboardingCompleted) {
          router.push('/onboarding');
        } else {
          router.push('/');
        }
      } catch {
        router.push('/');
      }
      router.refresh();
    } catch (err) {
      if (isApiError(err)) {
        track({ name: 'auth_error', props: { mode, status: err.status, code: err.code } });

        if (err.status === 429) {
          const sec = err.retryAfterSec ?? 60;
          setRateLimitSec(sec);
          track({ name: 'rate_limited', props: { mode, retryAfterSec: sec } });
          return;
        }
        if (err.status === 403) {
          setError('Sécurité : rafraîchis la page puis réessaie.');
          return;
        }
        setError(err.message);
      } else {
        setError('Erreur inattendue. Vérifie ta connexion.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo mobile only */}
      <div className="flex justify-center mb-6 lg:hidden">
        <img src="/images/logo_slogan_nexus.png" alt="Nexus Réussite" className="h-16 w-auto object-contain" />
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-lg">
        <h1 className="text-xl font-bold text-foreground mb-1 text-center">
          {mode === 'login' ? 'Connexion' : 'Créer un compte'}
        </h1>
        <p className="text-muted-foreground text-xs mb-5 text-center">
          Accès sécurisé. {mode === 'register' && 'L\'onboarding prend ~3 minutes.'}
        </p>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-5 p-1 bg-muted rounded-xl">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'register' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Créer un compte
          </button>
        </div>

        {/* Rate limit notice */}
        {rateLimitSec !== null && rateLimitSec > 0 && (
          <div className="mb-4">
            <RateLimitNotice retryAfterSec={rateLimitSec} />
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="displayName">
                Nom affiché
              </label>
              <input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                placeholder="Ton prénom"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="email">Email</label>
            <input
              id="email"
              data-testid="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
              required
            />
          </div>

          <PasswordField id="password" value={password} onChange={setPassword} label="Mot de passe" testId="auth-password" />

          {mode === 'register' && (
            <>
              <PasswordField id="confirmPassword" value={confirmPassword} onChange={setConfirmPassword} label="Confirmer le mot de passe" />

              {/* Terms */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 accent-violet-600"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  J&apos;accepte les <span className="underline">Conditions d&apos;utilisation</span> et la <span className="underline">Politique de confidentialité</span>.
                </span>
              </label>

              {/* Minor checkbox */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMinor}
                  onChange={(e) => setIsMinor(e.target.checked)}
                  className="mt-1 accent-violet-600"
                />
                <span className="text-xs text-muted-foreground">J&apos;ai moins de 15 ans</span>
              </label>

              {isMinor && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="parentEmail">
                    Email du parent / responsable légal
                  </label>
                  <input
                    id="parentEmail"
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    placeholder="parent@email.com"
                    required={isMinor}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Consentement parental requis pour les moins de 15 ans (RGPD).</p>
                </div>
              )}
            </>
          )}

          {error && (
            <p className="text-error text-sm rounded-xl border border-error/30 bg-error/10 p-3" role="alert">{error}</p>
          )}

          <button
            data-testid="auth-submit"
            type="submit"
            disabled={isSubmitting || (rateLimitSec !== null && rateLimitSec > 0)}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white rounded-xl py-2.5 font-bold text-sm hover:bg-violet-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {mode === 'login' ? 'Connexion\u2026' : 'Création\u2026'}</>
            ) : (
              mode === 'login' ? 'Se connecter' : 'Créer mon compte'
            )}
          </button>
        </form>

        {/* Help link (login only) */}
        {mode === 'login' && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowHelp((prev) => !prev)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Problème de connexion ?
            </button>
            {showHelp && (
              <p className="text-xs text-muted-foreground mt-2 p-3 bg-muted/30 rounded-xl border border-border leading-relaxed">
                Vérifie ton email et ton mot de passe. Si tu vois une erreur de sécurité, rafraîchis la page et réessaie. Le mot de passe doit faire au moins 8 caractères.
              </p>
            )}
          </div>
        )}

        {/* Footer links */}
        <div className="mt-5 pt-4 border-t border-border flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <Link href="/bienvenue" className="hover:text-foreground transition-colors">Accueil</Link>
          <span>·</span>
          <Link href="/pricing" className="hover:text-foreground transition-colors">Tarifs</Link>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Page (with Suspense for useSearchParams) ─────────────────── */

export default function LoginPage() {
  return (
    <div className="min-h-dvh flex items-stretch bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="grid w-full lg:grid-cols-12">
        <ProofPanel />
        <div className="col-span-12 lg:col-span-7 flex items-center justify-center p-6">
          <Suspense fallback={
            <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-lg flex items-center justify-center min-h-[400px]">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          }>
            <AuthCard />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
