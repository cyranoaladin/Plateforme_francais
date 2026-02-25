'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('jean@eaf.local');
  const [password, setPassword] = useState('demo1234');
  const [displayName, setDisplayName] = useState('Jean Dupont');
  const [role, setRole] = useState<'eleve' | 'enseignant' | 'parent'>('eleve');
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
          role: mode === 'register' ? role : undefined,
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
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-lg">
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

          {mode === 'register' && (
            <div>
              <label className="block text-sm text-muted-foreground mb-1" htmlFor="register-role">
                Rôle
              </label>
              <select
                id="register-role"
                value={role}
                onChange={(event) => setRole(event.target.value as 'eleve' | 'enseignant' | 'parent')}
                className="w-full bg-background border border-input rounded-lg px-3 py-2"
              >
                <option value="eleve">Élève</option>
                <option value="enseignant">Enseignant</option>
                <option value="parent">Parent</option>
              </select>
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
            <input
              id="password"
              data-testid="auth-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2"
              required
              minLength={8}
            />
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
  );
}
