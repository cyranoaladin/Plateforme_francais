'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('jean@eaf.local');
  const [password, setPassword] = useState('demo1234');
  const [displayName, setDisplayName] = useState('Jean Dupont');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const endpoint = mode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          displayName,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Erreur d’authentification.');
      }

      router.push('/');
      router.refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Erreur inattendue.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="w-full max-w-md space-y-6">
        {/* Logo centré au-dessus du formulaire */}
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/images/logo_nexus_reussite.png"
            alt="Nexus Réussite"
            width={72}
            height={72}
            className="w-16 h-16 object-contain"
            priority
          />
          <Image
            src="/images/logo_slogan_nexus.png"
            alt="Nexus Réussite — Prépare ton EAF"
            width={220}
            height={60}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>

      <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-foreground mb-2">Connexion EAF Premium</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Connectez-vous pour récupérer votre parcours, vos résultats et vos ressources.
        </p>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm ${mode === 'login' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm ${mode === 'register' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
          >
            Inscription
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm text-muted-foreground mb-1" htmlFor="displayName">
                Nom affiché
              </label>
              <input
                id="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full bg-background border border-input rounded-lg px-3 py-2"
              />
            </div>
          )}


          <div>
            <label className="block text-sm text-muted-foreground mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              data-testid="auth-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1" htmlFor="password">
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="password"
                data-testid="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-error text-sm">{error}</p>}

          <button
            data-testid="auth-submit"
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold disabled:opacity-70"
          >
            {isSubmitting ? 'Chargement...' : mode === 'login' ? 'Se connecter' : "Créer le compte"}
          </button>
        </form>

        <p className="text-xs text-muted-foreground mt-6">
          Compte de démonstration: <span className="font-semibold">jean@eaf.local</span> /{' '}
          <span className="font-semibold">demo1234</span>
        </p>
      </div>
      </div>
    </div>
  );
}
