'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertTriangle, Loader2, Send } from 'lucide-react';
import { apiFetch, isApiError } from '@/lib/api/client';

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
    <div className="min-h-screen bg-[var(--surface-cream)] text-slate-900 [background-image:radial-gradient(circle_at_top_left,rgba(15,118,110,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.74),rgba(244,239,229,1))]">
      <main className="relative mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-[24px] border border-[var(--border-strong)] bg-white/80 px-5 py-4 shadow-[var(--shadow-md)]">
          <Link href="/" className="flex items-center gap-4">
            <img src="/images/logo_slogan_nexus.png" alt="Nexus Réussite" className="h-11 w-auto object-contain" />
          </Link>
          <Link href="/" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:text-[var(--navy)]">
            Retour accueil
          </Link>
        </header>

        <section className="mt-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--teal)]">Contact</p>
          <h1
            style={EDITORIAL_HEADING}
            className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--navy)] sm:text-5xl"
          >
            Une question, un virement à confirmer, un bug à signaler ?
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
            Remplis le formulaire ci-dessous. Ton message sera traité par l'équipe Nexus Réussite dans les meilleurs délais.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-[24px] border border-[var(--border-strong)] bg-white/85 p-6 shadow-[var(--shadow-md)] md:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-name" className="block text-sm font-semibold text-[var(--navy)]">Nom</label>
              <input
                id="contact-name"
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-paper)] px-4 py-3 text-sm text-[var(--navy)] outline-none transition focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20"
                placeholder="Ton nom"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-semibold text-[var(--navy)]">Email</label>
              <input
                id="contact-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-paper)] px-4 py-3 text-sm text-[var(--navy)] outline-none transition focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20"
                placeholder="ton.email@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact-subject" className="block text-sm font-semibold text-[var(--navy)]">Objet</label>
            <select
              id="contact-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-paper)] px-4 py-3 text-sm text-[var(--navy)] outline-none transition focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20"
            >
              {SUBJECTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="contact-message" className="block text-sm font-semibold text-[var(--navy)]">Message</label>
            <textarea
              id="contact-message"
              required
              minLength={10}
              maxLength={2000}
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-2 w-full resize-y rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-paper)] px-4 py-3 text-sm text-[var(--navy)] outline-none transition focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20"
              placeholder="Décris ta demande ici..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--navy)] px-5 py-3.5 text-sm font-bold text-[#f7f2ea] transition-all hover:-translate-y-0.5 hover:bg-[#0f2740] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? 'Envoi en cours...' : 'Envoyer le message'}
          </button>

          {success ? (
            <div className="flex items-start gap-3 rounded-[22px] border border-[#9cccaf] bg-[#eef8f0] p-4 text-sm text-[#25543d]" role="status">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          ) : null}
          {error ? (
            <div className="flex items-start gap-3 rounded-[22px] border border-[#b65050]/25 bg-[var(--error-bg)] p-4 text-sm text-[#8f2d2d]" role="alert">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </form>

        <div className="mt-8 rounded-[24px] border border-[var(--border-strong)] bg-[var(--surface-warm)] p-5 text-sm leading-7 text-slate-600">
          <p className="font-semibold text-[var(--navy)]">Autres moyens de contact</p>
          <ul className="mt-2 space-y-1">
            <li>WhatsApp : <a href="https://wa.me/21699192829" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#25d366] underline">+216 99 19 28 29</a></li>
            <li>Email direct : contact@nexusreussite.academy</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
