'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Shield,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { apiFetch, isApiError } from '@/lib/api/client';
import { track } from '@/components/analytics/events';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';
type LoginRole = 'eleve' | 'parent' | 'enseignant';

type ProfilePayload = {
  onboardingCompleted?: boolean;
  displayName?: string;
};

const WHATSAPP_RESET_LINK = `${process.env.NEXT_PUBLIC_WHATSAPP_LINK ?? 'https://wa.me/21699192829'}?text=${encodeURIComponent('Bonjour, je souhaite réinitialiser mon mot de passe Nexus EAF.')}`;

const TRUST_POINTS = ['Inscription gratuite', 'Premiers ateliers sans payer', 'Prêt en 3 minutes'];

const PROOF_CARDS = [
  {
    icon: BookOpen,
    title: 'TON PARCOURS, TES ŒUVRES',
    body: 'Chaque séance part de tes textes au programme. Tu travailles l\'écrit, l\'oral et la langue dans un ordre qui a du sens pour toi.',
    bgColor: 'rgba(123,142,255,0.15)',
  },
  {
    icon: ShieldCheck,
    title: 'MÉTHODE ET SOURCES OFFICIELLES',
    body: 'Corpus du BO, rapports de jury, barèmes EAF : tout est traçable. Un cadre que tes parents et tes profs peuvent vérifier.',
    bgColor: 'rgba(26,213,160,0.12)',
  },
  {
    icon: Users,
    title: 'COMMENCE TOUT DE SUITE',
    body: 'Crée ton compte en 2 minutes, configure tes œuvres, et lance la première séance. Tu choisis un plan payant seulement si tu en as besoin.',
    bgColor: 'rgba(255,107,53,0.12)',
  },
];

const LOGIN_COPY = {
  proofBody: 'Écrit, oral, grammaire, corpus officiel : tout est réuni pour t\'aider à progresser méthodiquement. Essaie gratuitement, explore les ateliers, et passe à un plan supérieur seulement quand tu en as besoin.',
  onboardingNotice: 'L\'inscription prend environ trois minutes. Si tu as déjà un compte, connecte-toi pour retrouver ton parcours là où tu l\'as laissé.',
  minorNotice: 'J\'ai moins de 15 ans. Un consentement parental est nécessaire.',
  helpBody: `Vérifie ton email et ton mot de passe. En cas d'erreur persistante, rafraîchis la page ou utilise « Mot de passe oublié ». Tu peux aussi nous contacter sur WhatsApp au ${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '+216 99 19 28 29'}.`,
  resetHelpLead: 'Besoin d\'aide ?',
  parentLoginHint: 'Connecte-toi avec l\'email que ton enfant a renseigné. Lors de la première connexion, utilise le lien reçu par email ou « mot de passe oublié » pour définir ton mot de passe.',
  teacherLoginHint: 'Connecte-toi avec ton email professionnel. Lors de la première connexion, utilise le lien reçu par email ou « mot de passe oublié » pour définir ton mot de passe.',
} as const;

const PASSWORD_RULES = [
  { test: (v: string) => v.length >= 8, label: '8 caractères minimum' },
  { test: (v: string) => /[a-z]/.test(v), label: 'Une minuscule' },
  { test: (v: string) => /[A-Z]/.test(v), label: 'Une majuscule' },
  { test: (v: string) => /[0-9]/.test(v), label: 'Un chiffre' },
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
    <div 
      className="flex items-start gap-3 rounded-[var(--eaf-radius-lg)] border border-[var(--eaf-orange-border)] bg-[var(--eaf-orange-dim)] p-4 text-sm" 
      style={{ color: 'var(--eaf-orange)' }}
      role="status"
    >
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
  showRules,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
  testId?: string;
  autoComplete?: string;
  showRules?: boolean;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label 
        className="mb-[6px] block text-[13px] font-medium" 
        style={{ color: 'var(--eaf-text-secondary)' }}
        htmlFor={id}
      >
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
          className="w-full rounded-[10px] border px-4 py-3 pr-11 text-[14px] outline-none transition-all duration-200"
          style={{ 
            background: 'var(--eaf-bg2)', 
            borderColor: 'var(--eaf-border)',
            color: 'var(--eaf-text-primary)',
            fontFamily: 'var(--eaf-font-body)'
          }}
          placeholder="••••••••"
          required
          minLength={8}
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors"
          style={{ color: 'var(--eaf-text-tertiary)' }}
          aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showRules && value.length > 0 && (
        <ul className="mt-2 space-y-1">
          {PASSWORD_RULES.map((rule) => {
            const pass = rule.test(value);
            return (
              <li key={rule.label} className="flex items-center gap-2 text-xs">
                {pass ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--eaf-teal)' }} />
                ) : (
                  <div className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: 'var(--eaf-border)' }} />
                )}
                <span style={{ color: pass ? 'var(--eaf-teal)' : 'var(--eaf-text-tertiary)' }}>
                  {rule.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ProofPanel() {
  return (
    <div 
      className="relative flex h-full flex-col justify-between overflow-hidden rounded-[var(--eaf-radius-xl)] p-[52px_40px]"
      style={{ 
        background: 'linear-gradient(160deg, #0d1829 0%, #0b1120 60%, #111c30 100%)',
      }}
    >
      {/* Decorative orbs */}
      <div 
        className="pointer-events-none absolute -left-20 -top-20 h-[400px] w-[400px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(123,142,255,0.08) 0%, transparent 70%)' }}
      />
      <div 
        className="pointer-events-none absolute -right-16 bottom-16 h-[300px] w-[300px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.05) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Navbar mini */}
        <div className="flex items-center gap-2 mb-16">
          <div 
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white text-xs font-bold"
            style={{ background: 'var(--eaf-gradient-indigo-deep)' }}
          >
            N
          </div>
          <span className="text-[15px] font-semibold" style={{ color: 'var(--eaf-text-primary)' }}>
            Nexus Réussite
          </span>
          <span style={{ color: 'var(--eaf-text-tertiary)' }}>/</span>
          <Link href="/" className="text-[13px] no-underline transition-colors hover:text-[var(--eaf-text-primary)]" style={{ color: 'var(--eaf-text-secondary)' }}>
            Retour accueil
          </Link>
          <span className="mx-2" style={{ color: 'var(--eaf-text-tertiary)' }}>·</span>
          <Link href="/#plans" className="text-[13px] no-underline transition-colors hover:text-[var(--eaf-text-primary)]" style={{ color: 'var(--eaf-text-secondary)' }}>
            Voir les tarifs
          </Link>
          <div className="ml-auto">
            <Link 
              href="/login?mode=register"
              className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-all"
              style={{ background: 'var(--eaf-orange)' }}
            >
              Démarrer gratuitement
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Headline */}
        <h1 
          className="max-w-[380px] text-[44px] font-bold leading-[1.10] tracking-[-1.8px] mb-5"
          style={{ 
            fontFamily: 'var(--eaf-font-display)',
            color: 'var(--eaf-text-primary)'
          }}
        >
          Ton espace de préparation au Bac de Français commence ici.
        </h1>

        <p 
          className="max-w-[380px] text-[15px] leading-[1.7] mb-9"
          style={{ color: 'var(--eaf-text-secondary)' }}
        >
          {LOGIN_COPY.proofBody}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-10">
          {TRUST_POINTS.map((point) => (
            <span 
              key={point}
              className="rounded-full px-3.5 py-1.5 text-xs font-medium"
              style={{ 
                background: 'var(--eaf-bg2)', 
                border: '1px solid var(--eaf-border)',
                color: 'var(--eaf-text-secondary)'
              }}
            >
              {point}
            </span>
          ))}
        </div>

        {/* Feature cards */}
        <div className="mt-auto flex flex-col gap-3">
          {PROOF_CARDS.map((card) => (
            <div 
              key={card.title}
              className="flex items-start gap-3.5 rounded-[14px] p-4"
              style={{ 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid var(--eaf-border)'
              }}
            >
              <div 
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: card.bgColor }}
              >
                <card.icon className="h-4 w-4" style={{ color: 'var(--eaf-text-primary)' }} />
              </div>
              <div>
                <h3 
                  className="text-[13px] font-semibold uppercase tracking-wide mb-1"
                  style={{ color: 'var(--eaf-text-primary)' }}
                >
                  {card.title}
                </h3>
                <p 
                  className="text-xs leading-[1.5]"
                  style={{ color: 'var(--eaf-text-tertiary)' }}
                >
                  {card.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Note bottom */}
        <div 
          className="mt-5 pt-5 text-xs border-t"
          style={{ borderColor: 'var(--eaf-border)', color: 'var(--eaf-text-tertiary)' }}
        >
          • L&apos;inscription prend environ trois minutes. Si tu as déjà un compte, connecte-toi à droite.
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
  const [isMinor, setIsMinor] = useState(false);
  const [parentEmail, setParentEmail] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loginRole, setLoginRole] = useState<LoginRole>('eleve');
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
    if (reason === 'session_expired') {
      setError('Ta session a expiré ou a été fermée car ton compte a été utilisé sur un autre appareil. Reconnecte-toi pour continuer.');
    }
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      setSuccessMessage('Ton adresse email a été vérifiée avec succès. Tu peux te connecter.');
    }
    const deleted = searchParams.get('deleted');
    if (deleted === '1') {
      setSuccessMessage('Ton compte et toutes tes données ont été supprimés. Tu peux créer un nouveau compte si tu le souhaites.');
    }
    const errorParam = searchParams.get('error');
    if (errorParam === 'token-expired') {
      setError('Le lien de vérification a expiré ou est invalide. Connecte-toi et demande un nouveau lien depuis ton profil.');
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
        setError('Tu dois accepter les conditions d\'utilisation.');
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
        setSuccessMessage(`Si un compte existe pour cet email, un lien de réinitialisation a été envoyé. Si tu ne reçois rien sous 5 minutes, contacte-nous via WhatsApp au ${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '+216 99 19 28 29'} pour une réinitialisation manuelle.`);
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
                acceptedCgu: acceptTerms,
                cguVersion: '2026-03',
                isMinor,
                ...(parentEmail ? { parentEmail } : {}),
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

  const subtitle = mode === 'login'
    ? 'Retrouve ton parcours, tes ateliers et ta progression exactement là où tu les as laissés.'
    : mode === 'register'
    ? 'Gratuit pour commencer. Choisis tes œuvres, lance ton premier atelier et progresse à ton rythme.'
    : mode === 'forgot'
    ? 'Entre ton email pour recevoir un lien de réinitialisation.'
    : 'Choisis un nouveau mot de passe sécurisé.';

  return (
    <div className="w-full max-w-[420px]">
      <div 
        className="rounded-[24px] p-10"
        style={{ 
          background: 'var(--eaf-bg1)', 
          border: '1px solid var(--eaf-border)'
        }}
      >
        {/* Badge */}
        <div 
          className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
          style={{ 
            background: 'var(--eaf-indigo-dim)', 
            border: '1px solid var(--eaf-indigo-border)',
            color: 'var(--eaf-indigo)'
          }}
        >
          <Shield className="h-3 w-3" />
          {mode === 'login' ? 'Accès sécurisé' : 'Inscription gratuite'}
        </div>

        {/* Title */}
        <h2 
          className="text-[28px] font-bold tracking-[-1px] mb-2"
          style={{ 
            fontFamily: 'var(--eaf-font-display)',
            color: 'var(--eaf-text-primary)'
          }}
        >
          {title}
        </h2>
        <p 
          className="text-[14px] mb-6"
          style={{ color: 'var(--eaf-text-secondary)' }}
        >
          {subtitle}
        </p>

        {/* Pills reassurance */}
        <div className="flex flex-wrap gap-2 mb-7">
          {(mode === 'register'
            ? ['Gratuit pour commencer', 'Prêt en 3 minutes', 'Accès immédiat']
            : ['Connexion sécurisée', 'Session protégée', 'Reprise immédiate']
          ).map((item) => (
            <span 
              key={item} 
              className="rounded-full px-2.5 py-1 text-[11px]"
              style={{ 
                background: 'var(--eaf-bg2)', 
                border: '1px solid var(--eaf-border)',
                color: 'var(--eaf-text-tertiary)'
              }}
            >
              {item}
            </span>
          ))}
        </div>

        {/* Tabs */}
        <div 
          className="flex gap-1 rounded-[10px] p-1 mb-6"
          style={{ background: 'var(--eaf-bg2)', border: '1px solid var(--eaf-border)' }}
        >
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="flex-1 rounded-[7px] px-4 py-2 text-[14px] font-medium transition-all"
            style={{ 
              background: mode === 'login' ? 'var(--eaf-bg3)' : 'transparent',
              border: mode === 'login' ? '1px solid var(--eaf-border)' : '1px solid transparent',
              color: mode === 'login' ? 'var(--eaf-text-primary)' : 'var(--eaf-text-secondary)'
            }}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className="flex-1 rounded-[7px] px-4 py-2 text-[14px] font-medium transition-all"
            style={{ 
              background: mode === 'register' ? 'var(--eaf-bg3)' : 'transparent',
              border: mode === 'register' ? '1px solid var(--eaf-border)' : '1px solid transparent',
              color: mode === 'register' ? 'var(--eaf-text-primary)' : 'var(--eaf-text-secondary)'
            }}
          >
            Créer un compte
          </button>
        </div>

        {/* Role selector - login mode only */}
        {mode === 'login' && (
          <div className="mb-6">
            <p 
              className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: 'var(--eaf-text-tertiary)' }}
            >
              Je me connecte en tant que
            </p>
            <div className="flex gap-2">
              {([
                { value: 'eleve' as const, label: 'Élève', icon: GraduationCap },
                { value: 'parent' as const, label: 'Parent', icon: Users },
                { value: 'enseignant' as const, label: 'Enseignant', icon: ShieldCheck },
              ]).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLoginRole(value)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all"
                  style={{
                    background: loginRole === value ? 'var(--eaf-teal-dim)' : 'var(--eaf-bg2)',
                    border: `1px solid ${loginRole === value ? 'var(--eaf-teal-border)' : 'var(--eaf-border)'}`,
                    color: loginRole === value ? 'var(--eaf-teal)' : 'var(--eaf-text-secondary)'
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
            {loginRole === 'parent' && (
              <p className="mt-2 text-[11px] leading-5" style={{ color: 'var(--eaf-text-tertiary)' }}>
                {LOGIN_COPY.parentLoginHint}
              </p>
            )}
            {loginRole === 'enseignant' && (
              <p className="mt-2 text-[11px] leading-5" style={{ color: 'var(--eaf-text-tertiary)' }}>
                {LOGIN_COPY.teacherLoginHint}
              </p>
            )}
          </div>
        )}

        {rateLimitSec !== null && rateLimitSec > 0 ? (
          <div className="mb-5">
            <RateLimitNotice retryAfterSec={rateLimitSec} />
          </div>
        ) : null}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {mode !== 'reset' && (
            <div>
              <label 
                className="mb-[6px] block text-[13px] font-medium" 
                style={{ color: 'var(--eaf-text-secondary)' }}
                htmlFor="email"
              >
                Email
              </label>
              <input
                id="email"
                data-testid="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[10px] border px-4 py-3 text-[14px] outline-none transition-all duration-200"
                style={{ 
                  background: 'var(--eaf-bg2)', 
                  borderColor: 'var(--eaf-border)',
                  color: 'var(--eaf-text-primary)',
                  fontFamily: 'var(--eaf-font-body)'
                }}
                placeholder="prenom@exemple.fr"
                required
                autoComplete="email"
              />
            </div>
          )}

          {mode !== 'forgot' && (
            <PasswordField 
              id="password" 
              value={password} 
              onChange={setPassword} 
              label={mode === 'reset' ? 'Nouveau mot de passe' : 'Mot de passe'} 
              testId="auth-password" 
              autoComplete={mode === 'register' || mode === 'reset' ? 'new-password' : 'current-password'} 
              showRules={mode === 'register' || mode === 'reset'} 
            />
          )}

          {mode === 'reset' && (
            <PasswordField 
              id="confirmPassword" 
              value={confirmPassword} 
              onChange={setConfirmPassword} 
              label="Confirmer le nouveau mot de passe" 
              autoComplete="new-password" 
            />
          )}

          {mode === 'register' ? (
            <>
              <PasswordField 
                id="confirmPassword" 
                value={confirmPassword} 
                onChange={setConfirmPassword} 
                label="Confirmer le mot de passe" 
                autoComplete="new-password" 
              />

              <div 
                className="rounded-[var(--eaf-radius-lg)] p-4"
                style={{ background: 'var(--eaf-bg2)', border: '1px solid var(--eaf-border)' }}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 accent-[var(--eaf-indigo)]"
                  />
                  <span className="text-xs leading-6" style={{ color: 'var(--eaf-text-secondary)' }}>
                    J&apos;accepte les <Link href="/cgu" target="_blank" className="font-semibold underline-offset-2 hover:underline" style={{ color: 'var(--eaf-indigo)' }}>Conditions d&apos;utilisation</Link> et la <Link href="/politique-de-confidentialite" target="_blank" className="font-semibold underline-offset-2 hover:underline" style={{ color: 'var(--eaf-indigo)' }}>Politique de confidentialité</Link>.
                  </span>
                </label>

                <label className="mt-3 flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMinor}
                    onChange={(e) => setIsMinor(e.target.checked)}
                    className="mt-1 accent-[var(--eaf-indigo)]"
                  />
                  <span className="text-xs leading-6" style={{ color: 'var(--eaf-text-secondary)' }}>
                    {LOGIN_COPY.minorNotice}
                  </span>
                </label>
              </div>

              {isMinor && (
                <div 
                  className="rounded-[var(--eaf-radius-lg)] p-4 space-y-4"
                  style={{ background: 'var(--eaf-bg2)', border: '1px solid var(--eaf-border)' }}
                >
                  <p 
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--eaf-indigo)' }}
                  >
                    Consentement parental
                  </p>
                  <p className="text-xs leading-5" style={{ color: 'var(--eaf-text-tertiary)' }}>
                    Un email sera envoyé à ton parent pour confirmer ton inscription. Obligatoire pour les moins de 15 ans.
                  </p>
                  <div>
                    <label 
                      className="mb-1 block text-[13px] font-medium" 
                      style={{ color: 'var(--eaf-text-secondary)' }}
                      htmlFor="parentEmail"
                    >
                      Email du parent
                    </label>
                    <input
                      id="parentEmail"
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      className="w-full rounded-[10px] border px-4 py-3 text-[14px] outline-none transition-all"
                      style={{ 
                        background: 'var(--eaf-bg3)', 
                        borderColor: 'var(--eaf-border)',
                        color: 'var(--eaf-text-primary)'
                      }}
                      placeholder="parent@email.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
              )}

              {!isMinor && (
                <div>
                  <label 
                    className="mb-1 block text-[13px] font-medium" 
                    style={{ color: 'var(--eaf-text-secondary)' }}
                    htmlFor="parentEmail"
                  >
                    Email du parent <span className="text-xs font-normal" style={{ color: 'var(--eaf-text-tertiary)' }}>(facultatif)</span>
                  </label>
                  <input
                    id="parentEmail"
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    className="w-full rounded-[10px] border px-4 py-3 text-[14px] outline-none transition-all"
                    style={{ 
                      background: 'var(--eaf-bg2)', 
                      borderColor: 'var(--eaf-border)',
                      color: 'var(--eaf-text-primary)'
                    }}
                    placeholder="parent@email.com"
                    autoComplete="email"
                  />
                </div>
              )}
            </>
          ) : null}

          {successMessage ? (
            <p 
              className="rounded-[var(--eaf-radius-lg)] border p-4 text-sm"
              role="status"
              style={{ 
                background: 'var(--eaf-teal-dim)', 
                borderColor: 'var(--eaf-teal-border)',
                color: 'var(--eaf-teal)'
              }}
            >
              {successMessage}
            </p>
          ) : null}

          {error ? (
            <p 
              className="rounded-[var(--eaf-radius-lg)] border p-4 text-sm"
              role="alert" 
              aria-live="assertive"
              style={{ 
                background: 'var(--eaf-orange-dim)', 
                borderColor: 'var(--eaf-orange-border)',
                color: 'var(--eaf-orange)'
              }}
            >
              {error}
            </p>
          ) : null}

          <button
            data-testid="auth-submit"
            type="submit"
            disabled={isSubmitting || (rateLimitSec !== null && rateLimitSec > 0)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[11px] px-5 py-3.5 text-[15px] font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
            style={{ 
              background: 'var(--eaf-orange)',
              boxShadow: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--eaf-orange-hover)';
              e.currentTarget.style.boxShadow = '0 6px 25px var(--eaf-orange-glow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--eaf-orange)';
              e.currentTarget.style.boxShadow = 'none';
            }}
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
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => router.push('/login?mode=forgot')}
              className="block w-full text-center text-[13px] transition-colors hover:underline"
              style={{ color: 'var(--eaf-indigo)' }}
            >
              Mot de passe oublié ?
            </button>
            <div 
              className="rounded-[10px] p-4 cursor-pointer transition-all"
              style={{ background: 'var(--eaf-bg2)', border: '1px solid var(--eaf-border)' }}
              onClick={() => setShowHelp((prev) => !prev)}
            >
              <p 
                className="text-[13px] font-medium"
                style={{ color: 'var(--eaf-text-secondary)' }}
              >
                Problème de connexion ?
              </p>
              {showHelp ? (
                <p className="mt-3 text-sm leading-6" style={{ color: 'var(--eaf-text-tertiary)' }}>
                  {LOGIN_COPY.helpBody}
                </p>
              ) : null}
            </div>
          </div>
        ) : mode === 'forgot' || mode === 'reset' ? (
          <div className="mt-5 space-y-3 text-center">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-sm transition-colors hover:underline"
              style={{ color: 'var(--eaf-indigo)' }}
            >
              Retour à la connexion
            </button>
            <div 
              className="rounded-[10px] p-4"
              style={{ background: 'var(--eaf-bg2)', border: '1px solid var(--eaf-border)' }}
            >
              <p className="text-sm leading-6" style={{ color: 'var(--eaf-text-secondary)' }}>
                {LOGIN_COPY.resetHelpLead}{' '}
                <a
                  href={WHATSAPP_RESET_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold transition-colors hover:underline"
                  style={{ color: 'var(--eaf-indigo)' }}
                >
                  Contacte-nous sur WhatsApp
                </a>
                {' '}pour une réinitialisation rapide.
              </p>
            </div>
          </div>
        ) : (
          <div 
            className="mt-5 rounded-[10px] p-4"
            style={{ background: 'var(--eaf-bg2)', border: '1px solid var(--eaf-border)' }}
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--eaf-teal)' }} />
              <p className="text-sm leading-6" style={{ color: 'var(--eaf-text-secondary)' }}>
                Après inscription, tu configures tes œuvres et ton niveau en quelques minutes, puis tu accèdes directement à tes premiers ateliers.
              </p>
            </div>
          </div>
        )}

        {/* Footer links */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 pt-5 text-xs" style={{ borderTop: '1px solid var(--eaf-border)' }}>
          <Link href="/" className="transition-colors hover:text-[var(--eaf-text-primary)]" style={{ color: 'var(--eaf-text-tertiary)' }}>
            Accueil
          </Link>
          <span style={{ color: 'var(--eaf-text-tertiary)' }}>–</span>
          <Link href="/#plans" className="transition-colors hover:text-[var(--eaf-text-primary)]" style={{ color: 'var(--eaf-text-tertiary)' }}>
            Tarifs
          </Link>
          <span style={{ color: 'var(--eaf-text-tertiary)' }}>–</span>
          <Link href="/mentions-legales" className="transition-colors hover:text-[var(--eaf-text-primary)]" style={{ color: 'var(--eaf-text-tertiary)' }}>
            Mentions légales
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div 
      className="min-h-screen"
      style={{ background: 'var(--eaf-bg0)' }}
    >
      <div 
        className="grid min-h-screen"
        style={{ gridTemplateColumns: '1fr 1fr' }}
      >
        {/* Left column - Brand panel */}
        <div className="hidden lg:block">
          <ProofPanel />
        </div>

        {/* Right column - Auth form */}
        <div 
          className="flex items-center justify-center px-6 py-12"
          style={{ background: 'var(--eaf-bg0)' }}
        >
          <Suspense
            fallback={
              <div 
                className="flex w-full max-w-[420px] items-center justify-center rounded-[24px] p-8 min-h-[420px]"
                style={{ background: 'var(--eaf-bg1)', border: '1px solid var(--eaf-border)' }}
              >
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--eaf-text-tertiary)' }} />
              </div>
            }
          >
            <AuthCard />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
