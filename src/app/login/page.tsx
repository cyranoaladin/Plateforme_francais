'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { apiFetch, isApiError } from '@/lib/api/client';
import { track } from '@/components/analytics/events';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

type ProfilePayload = {
  onboardingCompleted?: boolean;
  displayName?: string;
};

const EDITORIAL_HEADING = {
  fontFamily: "var(--font-display)",
};

const TRUST_POINTS = [
  'Inscription gratuite',
  'Premiers ateliers sans payer',
  'Prêt en 3 minutes',
];

const PROOF_CARDS = [
  {
    icon: BookOpen,
    title: 'Ton parcours, tes œuvres',
    body: 'Chaque séance part de tes textes au programme. Tu travailles l\u2019écrit, l\u2019oral et la langue dans un ordre qui a du sens pour toi.',
  },
  {
    icon: ShieldCheck,
    title: 'Méthode et sources officielles',
    body: 'Corpus du BO, rapports de jury, barèmes EAF : tout est traçable. Un cadre que tes parents et tes profs peuvent vérifier.',
  },
  {
    icon: Users,
    title: 'Commence tout de suite',
    body: 'Crée ton compte en 2 minutes, configure tes œuvres, et lance ta première séance. Tu choisis un plan payant seulement si tu en as besoin.',
  },
];

function RateLimitNotice({ retryAfterSec }: { retryAfterSec: number }) {
  const [remaining, setRemaining] = useState(retryAfterSec);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => setRemaining((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  if (remaining <= 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-xl)] border border-[var(--error-muted)]/25 bg-[var(--error-bg)] p-4 text-sm text-[var(--error-dark)]" role="status">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        Trop de tentatives. Réessaie dans <strong>{remaining}s</strong>.
      </span>
    </div>
  );
}

function PasswordField({
  id,
  value,
  onChange,
  label,
  testId,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
  testId?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[var(--navy)]" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          data-testid={testId}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete ?? 'current-password'}
          className="w-full rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--surface-paper)] px-4 py-3 pr-11 text-sm text-[var(--navy)] outline-none transition focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20"
          required
          minLength={8}
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--navy)]"
          aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function ProofPanel() {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-white/10 bg-[var(--navy)] p-6 text-[var(--surface-parchment)] shadow-[var(--shadow-xl)] lg:h-full lg:p-8">
      <div className="absolute -right-10 top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -left-8 bottom-12 h-28 w-28 rounded-full bg-[var(--gold-muted)]/18 blur-2xl" />

      <div className="relative z-10">
        <img src="/images/logo_slogan_nexus.png" alt="Nexus Réussite" className="h-12 w-auto object-contain brightness-0 invert" />

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--border-warm)]">
          <BadgeCheck className="h-4 w-4" />
          Espace élève Nexus Réussite
        </div>

        <h1 style={EDITORIAL_HEADING} className="mt-6 max-w-xl text-4xl leading-tight tracking-[-0.03em] text-white sm:text-5xl">
          Ton espace de préparation au Bac de Français commence ici.
        </h1>

        <p className="mt-5 max-w-xl text-base leading-8 text-slate-200">
          Écrit, oral, grammaire, corpus officiel : tout est réuni pour t{'’'}aider à progresser méthodiquement. Essaie gratuitement, explore les ateliers, et passe à un plan supérieur seulement quand tu es prêt.
        </p>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {TRUST_POINTS.map((point) => (
            <span key={point} className="rounded-full border border-white/12 bg-white/8 px-3.5 py-1.5 text-xs font-semibold text-slate-100">
              {point}
            </span>
          ))}
        </div>

        <div className="mt-8 grid gap-3">
          {PROOF_CARDS.map((card) => (
            <article key={card.title} className="rounded-[var(--radius-xl)] border border-white/10 bg-white/8 p-4">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--surface-cream)] text-[var(--navy)]">
                  <card.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{card.body}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-[var(--radius-xl)] bg-[var(--navy-dark)] p-4">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--border-warm)]" />
            <p className="text-sm leading-6 text-slate-200">
              L{'’'}inscription prend environ trois minutes. Si tu as déjà un compte, connecte-toi pour retrouver ton parcours là où tu l{'’'}as laissé.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [resetToken, setResetToken] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [rateLimitSec, setRateLimitSec] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    const tokenParam = searchParams.get('token');
    const reason = searchParams.get('reason');
    if (modeParam === 'register') {
      setMode('register');
    } else if (modeParam === 'forgot') {
      setMode('forgot');
    } else if (modeParam === 'reset' && tokenParam) {
      setMode('reset');
      setResetToken(tokenParam);
    }
    // 18C: Show message when session was evicted (anti-sharing).
    if (reason === 'session_expired') {
      setError('Ta session a expiré ou a été fermée car ton compte a été utilisé sur un autre appareil. Reconnecte-toi pour continuer.');
    }
  }, [searchParams]);

  useEffect(() => {
    track({ name: 'page_view', props: { path: '/login' } });
  }, []);

  const switchMode = useCallback((nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setRateLimitSec(null);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setRateLimitSec(null);

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        return;
      }
      if (!acceptTerms) {
        setError('Tu dois accepter les conditions d\u2019utilisation.');
        return;
      }
    }

    if (mode === 'reset' && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);
    track({ name: 'auth_submit', props: { mode } });

    try {
      if (mode === 'forgot') {
        await apiFetch('/api/v1/auth/forgot-password', {
          method: 'POST',
          json: { email },
        });
        setSuccessMessage('Si un compte existe pour cet email, un lien de réinitialisation a été envoyé. Si tu ne reçois rien sous 5 minutes, contacte-nous via WhatsApp au +216 99 19 28 29 pour une réinitialisation manuelle.');
        setIsSubmitting(false);
        return;
      }

      if (mode === 'reset') {
        await apiFetch('/api/v1/auth/reset-password', {
          method: 'POST',
          json: { token: resetToken, password },
        });
        setSuccessMessage('Mot de passe réinitialisé avec succès. Tu peux maintenant te connecter.');
        setTimeout(() => router.push('/login'), 2000);
        setIsSubmitting(false);
        return;
      }

      const endpoint = mode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register';
      const loginResponse = await apiFetch<{ ok: boolean; role?: string }>(endpoint, {
        method: 'POST',
        json: {
          email,
          password,
          ...(mode === 'register'
            ? {
                displayName,
                acceptedCgu: acceptTerms,
                cguVersion: '2026-03',
                isMinor,
                ...(isMinor && parentEmail ? { parentEmail } : {}),
              }
            : {}),
        },
      });

      track({ name: 'auth_success', props: { mode } });

      if (mode === 'register') {
        router.push('/onboarding');
        router.refresh();
        return;
      }

      // Role-based routing after login
      const role = loginResponse.role ?? 'eleve';
      const ROLE_HOME: Record<string, string> = {
        admin: '/admin',
        enseignant: '/enseignant',
        parent: '/parent',
      };

      if (ROLE_HOME[role]) {
        router.push(ROLE_HOME[role]);
        router.refresh();
        return;
      }

      // Élève: check onboarding, then redirect
      const rawRedirect = searchParams.get('redirect') || '/dashboard';
      const redirectTo = (rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')) ? rawRedirect : '/dashboard';
      try {
        const profile = await apiFetch<ProfilePayload>('/api/v1/student/profile');
        if (!profile.onboardingCompleted) {
          router.push('/onboarding');
        } else {
          router.push(redirectTo);
        }
      } catch {
        router.push(redirectTo);
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

  const title = mode === 'login'
    ? 'Connexion à ton espace EAF'
    : mode === 'register'
    ? 'Créer ton espace EAF'
    : mode === 'forgot'
    ? 'Mot de passe oublié'
    : 'Nouveau mot de passe';
  const subtitle =
    mode === 'login'
      ? 'Retrouve ton parcours, tes ateliers et ta progression exactement là où tu les as laissés.'
      : mode === 'register'
      ? 'Gratuit pour commencer. Choisis tes œuvres, lance ton premier atelier et progresse à ton rythme.'
      : mode === 'forgot'
      ? 'Entre ton email pour recevoir un lien de réinitialisation.'
      : 'Choisis un nouveau mot de passe sécurisé.';

  return (
    <div className="w-full max-w-xl">
      <div className="rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--card)]/88 p-6 shadow-[var(--shadow-xl)] sm:p-8 lg:p-9">
        <div className="flex flex-col gap-4 border-b border-[var(--border-light)] pb-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-warm)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--navy)]">
            {mode === 'login' ? 'Accès sécurisé' : 'Inscription gratuite'}
          </div>
          <div>
            <h2 style={EDITORIAL_HEADING} className="text-4xl leading-tight tracking-[-0.03em] text-[var(--navy)] sm:text-5xl">
              {title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {(mode === 'register'
              ? ['Gratuit pour commencer', 'Prêt en 3 minutes', 'Accès immédiat aux ateliers']
              : ['Connexion sécurisée', 'Session protégée', 'Reprise immédiate']
            ).map((item) => (
              <span key={item} className="rounded-full border border-[var(--border-strong)] bg-[var(--card)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-body)]">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 flex gap-1.5 rounded-[var(--radius-lg)] bg-[var(--surface-warm-accent)] p-1">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`min-h-[44px] flex-1 rounded-[var(--radius-lg)] px-4 py-3 text-sm font-bold transition-colors ${
              mode === 'login' ? 'bg-[var(--card)] text-[var(--navy)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--navy)]'
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`min-h-[44px] flex-1 rounded-[var(--radius-lg)] px-4 py-3 text-sm font-bold transition-colors ${
              mode === 'register' ? 'bg-[var(--card)] text-[var(--navy)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--navy)]'
            }`}
          >
            Créer un compte
          </button>
        </div>

        {rateLimitSec !== null && rateLimitSec > 0 ? <div className="mt-5"><RateLimitNotice retryAfterSec={rateLimitSec} /></div> : null}

        <form ref={formRef} onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === 'register' ? (
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--navy)]" htmlFor="displayName">
                Prénom ou nom affiché
              </label>
              <input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--surface-paper)] px-4 py-3 text-sm text-[var(--navy)] outline-none transition focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20"
                placeholder="Ton prénom"
              />
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--navy)]" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              data-testid="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--surface-paper)] px-4 py-3 text-sm text-[var(--navy)] outline-none transition focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20"
              required
              autoComplete="email"
              placeholder="prenom@exemple.fr"
            />
          </div>

          {mode !== 'forgot' && <PasswordField id="password" value={password} onChange={setPassword} label="Mot de passe" testId="auth-password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />}

          {mode === 'reset' && <PasswordField id="confirmPassword" value={confirmPassword} onChange={setConfirmPassword} label="Confirmer le mot de passe" autoComplete="new-password" />}

          {mode === 'register' ? (
            <>
              <PasswordField id="confirmPassword" value={confirmPassword} onChange={setConfirmPassword} label="Confirmer le mot de passe" autoComplete="new-password" />

              <div className="rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--surface-warm)] p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 accent-[var(--navy)]"
                  />
                  <span className="text-xs leading-6 text-[var(--text-secondary)]">
                    J’accepte les <Link href="/cgu" target="_blank" className="font-semibold text-[var(--teal)] underline-offset-2 hover:underline">Conditions d’utilisation</Link> et la <Link href="/politique-de-confidentialite" target="_blank" className="font-semibold text-[var(--teal)] underline-offset-2 hover:underline">Politique de confidentialité</Link>.
                  </span>
                </label>

                <label className="mt-3 flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMinor}
                    onChange={(e) => setIsMinor(e.target.checked)}
                    className="mt-1 accent-[var(--navy)]"
                  />
                  <span className="text-xs leading-6 text-[var(--text-secondary)]">
                    J{'’'}ai moins de 15 ans. Un consentement parental est nécessaire.
                  </span>
                </label>
              </div>

              {isMinor ? (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--navy)]" htmlFor="parentEmail">
                    Email du parent / responsable légal
                  </label>
                  <input
                    id="parentEmail"
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    className="w-full rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--surface-paper)] px-4 py-3 text-sm text-[var(--navy)] outline-none transition focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20"
                    placeholder="parent@email.com"
                    required={isMinor}
                  />
                  <p className="mt-2 text-xs leading-6 text-[var(--text-muted)]">
                    Ce champ est requis pour les moins de 15 ans dans le cadre RGPD.
                  </p>
                </div>
              ) : null}
            </>
          ) : null}

          {successMessage ? (
            <p className="rounded-[var(--radius-xl)] border border-[var(--teal)]/25 bg-[var(--success-bg)] p-4 text-sm text-[var(--teal)]" role="status">
              {successMessage}
            </p>
          ) : null}

          {error ? (
            <p className="rounded-[var(--radius-xl)] border border-[var(--error-muted)]/25 bg-[var(--error-bg)] p-4 text-sm text-[var(--error-dark)]" role="alert">
              {error}
            </p>
          ) : null}

          <button
            data-testid="auth-submit"
            type="submit"
            disabled={isSubmitting || (rateLimitSec !== null && rateLimitSec > 0)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--navy)] px-5 py-3.5 text-sm font-bold text-[var(--surface-parchment)] transition-all hover:-translate-y-0.5 hover:bg-[var(--navy-dark)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === 'login' ? 'Connexion...' : mode === 'forgot' ? 'Envoi...' : mode === 'reset' ? 'Réinitialisation...' : 'Création...'}
              </>
            ) : mode === 'login' ? (
              'Se connecter'
            ) : mode === 'forgot' ? (
              'Envoyer le lien'
            ) : mode === 'reset' ? (
              'Réinitialiser le mot de passe'
            ) : (
              'Créer mon compte'
            )}
          </button>
        </form>

        {mode === 'login' ? (
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => router.push('/login?mode=forgot')}
              className="w-full min-h-[44px] text-center text-sm text-[var(--teal)] hover:underline"
            >
              Mot de passe oublié ?
            </button>
            <div className="rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--surface-paper)] p-4">
              <button
                type="button"
                onClick={() => setShowHelp((prev) => !prev)}
                className="text-sm font-semibold text-[var(--navy)] underline-offset-4 transition-colors hover:underline"
              >
                Problème de connexion ?
              </button>
              {showHelp ? (
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                  Vérifie ton email et ton mot de passe. En cas d{'’'}erreur persistante, rafraîchis la page ou utilise « Mot de passe oublié ». Tu peux aussi nous contacter sur WhatsApp au +216 99 19 28 29.
                </p>
              ) : null}
            </div>
          </div>
        ) : mode === 'forgot' || mode === 'reset' ? (
          <div className="mt-5 space-y-3 text-center">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-sm text-[var(--teal)] hover:underline"
            >
              Retour à la connexion
            </button>
            <div className="rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--surface-paper)] p-4">
              <p className="text-sm leading-7 text-[var(--text-secondary)]">
                Besoin d{'’'}aide ?{' '}
                <a
                  href="https://wa.me/21699192829?text=Bonjour%2C%20je%20souhaite%20r%C3%A9initialiser%20mon%20mot%20de%20passe%20Nexus%20EAF."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[var(--teal)] hover:underline"
                >
                  Contacte-nous sur WhatsApp
                </a>
                {' '}pour une réinitialisation rapide.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--surface-paper)] p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--teal)]" />
              <p className="text-sm leading-7 text-[var(--text-secondary)]">
                Après inscription, tu configures tes œuvres et ton niveau en quelques minutes, puis tu accèdes directement à tes premiers ateliers.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 border-t border-[var(--border-light)] pt-5 text-xs font-semibold text-[var(--text-muted)]">
          <Link href="/" className="transition-colors hover:text-[var(--navy)]">
            Accueil
          </Link>
          <span>·</span>
          <Link href="/#plans" className="transition-colors hover:text-[var(--navy)]">
            Tarifs
          </Link>
          <span>·</span>
          <Link href="/#faq" className="transition-colors hover:text-[var(--navy)]">
            FAQ
          </Link>
          <span>·</span>
          <Link href="/mentions-legales" className="transition-colors hover:text-[var(--navy)]">
            Mentions légales
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-[var(--surface-cream)] text-[var(--text-heading)] [background-image:radial-gradient(circle_at_top_left,rgba(15,118,110,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(184,115,51,0.16),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.74),rgba(244,239,229,1))]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_center_top,rgba(255,255,255,0.9),transparent_65%)]" />
      <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-[var(--teal)]/10 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-[32rem] h-72 w-72 rounded-full bg-[var(--gold-muted)]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-5 rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--card)]/80 px-5 py-4 shadow-[0_16px_45px_rgba(23,50,77,0.06)] sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-4">
            <img src="/images/logo_slogan_nexus.png" alt="Nexus Réussite" className="h-11 w-auto object-contain" />
            <div className="hidden md:flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-warm)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--navy)]">
              <span className="h-2 w-2 rounded-full bg-[var(--teal)]" />
              Espace sécurisé
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[var(--text-secondary)]">
            <Link href="/" className="rounded-full px-4 py-2 transition-colors hover:text-[var(--navy)]">
              Retour accueil
            </Link>
            <Link href="/#plans" className="rounded-full px-4 py-2 transition-colors hover:text-[var(--navy)]">
              Voir les tarifs
            </Link>
            <Link
              href="/login?mode=register"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--navy)] px-5 py-2.5 text-[var(--surface-parchment)] transition-all hover:-translate-y-0.5 hover:bg-[var(--navy-dark)]"
            >
              Démarrer gratuitement
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
          <ProofPanel />
          <div className="flex items-center justify-center">
            <Suspense
              fallback={
                <div className="flex w-full max-w-xl items-center justify-center rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--card)]/88 p-8 shadow-[var(--shadow-xl)] min-h-[420px]">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
                </div>
              }
            >
              <AuthCard />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
