'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send } from 'lucide-react';
import { apiFetch, isApiError } from '@/lib/api/client';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { StateNotice } from '@/components/ui/state-notice';

const EDITORIAL_HEADING = {
  fontFamily: "var(--font-display)",
};

const SUBJECTS = [
  { value: 'general', label: 'Contact général' },
  { value: 'virement', label: 'Confirmation de virement' },
  { value: 'bug', label: 'Signalement de bug' },
  { value: 'autre', label: 'Autre demande' },
] as const;

export default function ContactPage() {
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState<string>('general');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subjectParam = searchParams.get('subject');
    if (subjectParam && SUBJECTS.some((s) => s.value === subjectParam)) {
      setSubject(subjectParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await apiFetch<{ message: string }>('/api/v1/contact', {
        method: 'POST',
        json: { name, email, subject, message },
      });
      setSuccess(res.message);
      setName('');
      setEmail('');
      setSubject('general');
      setMessage('');
    } catch (err) {
      if (isApiError(err)) {
        setError(err.status === 429
          ? `Trop de messages envoyés. Réessaie dans ${err.retryAfterSec ?? 60}s.`
          : err.message);
      } else {
        setError('Erreur inattendue. Vérifie ta connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-surface-secondary)] text-[var(--text-heading)] [background-image:radial-gradient(circle_at_top_left,rgba(15,118,110,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.74),rgba(244,239,229,1))]">
      <main className="relative mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--bg-surface)]/80 px-5 py-4 shadow-[var(--shadow-md)]">
          <Link href="/" className="flex items-center gap-4">
            <img src="/images/logo_slogan_nexus.png" alt="Nexus Réussite" className="h-11 w-auto object-contain" />
          </Link>
          <Link href="/" className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--c-primary)]">
            Retour accueil
          </Link>
        </header>

        <section className="mt-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Contact</p>
          <h1
            style={EDITORIAL_HEADING}
            className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl"
          >
            Une question, un virement à confirmer, un bug à signaler ?
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
            Remplis le formulaire ci-dessous. Ton message sera traité par l’équipe Nexus Réussite dans les meilleurs délais.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--bg-surface)]/85 p-6 shadow-[var(--shadow-md)] md:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Nom"
              id="contact-name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ton nom"
              size="lg"
            />
            <Input
              label="Email"
              id="contact-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton.email@example.com"
              size="lg"
            />
          </div>

          <Select
            label="Objet"
            id="contact-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            options={SUBJECTS.map((s) => ({ value: s.value, label: s.label }))}
            size="lg"
          />

          <Textarea
            label="Message"
            id="contact-message"
            required
            minLength={10}
            maxLength={2000}
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Décris ta demande ici..."
            size="lg"
          />

          <Button
            type="submit"
            loading={loading}
            icon={!loading ? <Send className="h-4 w-4" /> : undefined}
            size="lg"
            className="w-full sm:w-auto"
          >
            {loading ? 'Envoi en cours...' : 'Envoyer le message'}
          </Button>

          {success ? (
            <StateNotice title="Message envoyé" description={success} variant="success" />
          ) : null}
          {error ? (
            <StateNotice title="Erreur d’envoi" description={error} variant="error" />
          ) : null}
        </form>

        <div className="mt-8 rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Autres moyens de contact</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">WhatsApp</p>
              <a href="https://wa.me/21699192829" target="_blank" rel="noopener noreferrer" className="mt-2 block text-sm font-semibold text-[var(--c-success)] transition-colors hover:underline">
                +216 99 19 28 29
              </a>
            </div>
            <div className="rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Email direct</p>
              <a href="mailto:contact@nexusreussite.academy" className="mt-2 block text-sm font-semibold text-[var(--c-success)] transition-colors hover:underline">
                contact@nexusreussite.academy
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
