'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, Lock } from 'lucide-react';

export function PremiumSignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSubmitted(true);
    setLoading(false);

    // Reset form after 3 seconds
    setTimeout(() => {
      setEmail('');
      setPassword('');
      setSubmitted(false);
    }, 3000);
  };

  return (
    <section
      id="signup"
      className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-indigo-50/20 px-4 py-20 sm:px-6 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-2xl">
        {/* Section Header */}
        <div className="mb-10 text-center sm:mb-12">
          <h2 className="text-balance font-playfair text-3xl leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Commencez votre essai gratuit
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            Accès complet pendant 14 jours. Aucune carte bancaire requise.
          </p>
        </div>

        {/* Signup Card */}
        <Card
          variant="default"
          padding="lg"
          className="border border-slate-200/60 bg-gradient-to-br from-white to-indigo-50/20 shadow-lg sm:p-10"
        >
          {submitted ? (
            <div className="text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <svg
                  className="h-6 w-6 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-playfair text-xl font-700 text-slate-900">
                C'est confirmé !
              </h3>
              <p className="text-slate-600">
                Un email de confirmation a été envoyé à <strong>{email}</strong>.
                Vérifiez votre boîte de réception et cliquez sur le lien pour
                commencer.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <Input
                  label="Adresse email"
                  type="email"
                  placeholder="vous@exemple.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  icon={<Mail className="h-4 w-4" />}
                  size="lg"
                />
              </div>

              {/* Password Input */}
              <div>
                <Input
                  label="Mot de passe"
                  type="password"
                  placeholder="Au moins 8 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  icon={<Lock className="h-4 w-4" />}
                  size="lg"
                />
              </div>

              {/* Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 transition-colors focus:ring-indigo-500"
                />
                <label htmlFor="terms" className="text-sm text-slate-600">
                  J'accepte les{' '}
                  <a href="#" className="font-medium text-indigo-600 hover:text-indigo-700">
                    conditions d'utilisation
                  </a>{' '}
                  et la{' '}
                  <a href="#" className="font-medium text-indigo-600 hover:text-indigo-700">
                    politique de confidentialité
                  </a>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                variant="gold"
                size="lg"
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Création du compte...' : 'Créer mon compte'}
              </Button>

              {/* Footer Text */}
              <p className="text-center text-xs text-slate-500">
                Avez-vous déjà un compte?{' '}
                <a href="#login" className="font-medium text-indigo-600 hover:text-indigo-700">
                  Connectez-vous
                </a>
              </p>
            </form>
          )}
        </Card>
      </div>
    </section>
  );
}
