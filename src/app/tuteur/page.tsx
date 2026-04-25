'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  Compass,
  MessageSquareQuote,
  Send,
  ShieldCheck,
  Sparkles,
} from '@/components/ui/icons';
import { getCsrfToken } from '@/lib/security/csrf-client';
import { sanitizeLlmText } from '@/lib/ui/sanitize-llm';
import { Badge, Button } from '@/components/ui';
import { StateNotice } from '@/components/ui';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  citations?: { index: number; title: string; source: string }[];
};

const STARTER_PROMPTS = [
  'Donne-moi une méthode courte pour l\'introduction de dissertation.',
  'Comment analyser une métaphore dans un poème de Rimbaud ?',
  'Aide-moi à formuler une problématique sur Manon Lescaut.',
  'Je bloque sur la question de grammaire : comment repartir ?',
];

const OPERATING_RULES = [
  {
    title: 'Réponse cadrée EAF',
    body: 'Le tuteur reste sur la méthode, les œuvres, la grammaire et les attendus réels de l\'épreuve.',
    icon: Compass,
    color: 'indigo' as const,
  },
  {
    title: 'Sources internes',
    body: 'Les réponses s\'appuient sur les références internes mobilisées par la plateforme, pas sur un web ouvert flou.',
    icon: BookOpen,
    color: 'gold' as const,
  },
  {
    title: 'Anti-copie',
    body: 'Le guidage aide à produire mieux. Il ne remplace jamais le travail de l\'élève par une copie livrée clé en main.',
    icon: ShieldCheck,
    color: 'teal' as const,
  },
];

const COLOR_STYLES = {
  indigo: {
    iconBg: 'bg-[var(--eaf-indigo)]/15',
    iconText: 'text-[var(--eaf-indigo)]',
    border: 'border-[var(--eaf-indigo)]/20',
  },
  gold: {
    iconBg: 'bg-[var(--eaf-gold)]/15',
    iconText: 'text-[var(--eaf-gold)]',
    border: 'border-[var(--eaf-gold)]/20',
  },
  teal: {
    iconBg: 'bg-[var(--eaf-teal)]/15',
    iconText: 'text-[var(--eaf-teal)]',
    border: 'border-[var(--eaf-teal)]/20',
  },
};

function TuteurPageContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const history = useMemo(
    () => messages.map((item) => ({ role: item.role, content: item.content })),
    [messages]
  );
  const workId = searchParams.get('workId') ?? searchParams.get('oeuvre') ?? undefined;
  const parcours = searchParams.get('parcours') ?? undefined;
  const sessionId = searchParams.get('sessionId') ?? undefined;

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    const trimmed = message.trim();
    const nextUser: Message = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, nextUser]);
    setInput('');
    setIsSending(true);

    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch('/api/v1/tuteur/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ message: trimmed, conversationHistory: history, workId, parcours, sessionId }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({} as Record<string, unknown>));
        const errMsg = (errBody.error as string) || 'Échec de réponse du guidage.';
        const upgradeHint = errBody.upgradeUrl ? '\n\n→ Découvre les plans sur la page Tarifs pour continuer.' : '';
        throw new Error(errMsg + upgradeHint);
      }

      const payload = (await response.json()) as {
        answer: string;
        citations: { index: number; title: string; source: string }[];
        suggestions: string[];
      };

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: payload.answer, citations: payload.citations },
      ]);
      setSuggestions(payload.suggestions ?? []);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Je rencontre un problème technique. Réessaie dans un instant.' },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  const displaySuggestions = suggestions.length > 0 ? suggestions.slice(0, 3) : STARTER_PROMPTS.slice(0, 3);
  const totalAssistantMessages = messages.filter((message) => message.role === 'assistant').length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      {/* Hero - Gradient bleu-nuit identique à tous les hero cards */}
      <section
        className="relative overflow-hidden rounded-2xl px-6 py-7 md:px-8 md:py-8"
        style={{
          background: 'linear-gradient(135deg, #0d1a35 0%, #111c30 60%, #0f1629 100%)',
          border: '1px solid rgba(123, 142, 255, 0.15)',
        }}
      >
        {/* Glow effects */}
        <div
          className="absolute -right-[5%] top-1/2 hidden h-[60%] w-[30%] -translate-y-1/2 rounded-full blur-3xl lg:block"
          style={{ background: 'radial-gradient(circle at center, rgba(123, 142, 255, 0.15), transparent 70%)' }}
        />
        <div
          className="absolute -left-[3%] -top-[15%] h-36 w-36 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle at center, rgba(255, 181, 71, 0.12), transparent 60%)' }}
        />

        <div className="relative grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em]"
              style={{
                background: 'rgba(123, 142, 255, 0.12)',
                color: 'var(--eaf-indigo)',
              }}
            >
              <MessageSquareQuote className="h-4 w-4" />
              Tuteur Nexus
            </div>
            <h1
              className="text-on-dark-h1 mt-5 max-w-4xl text-4xl leading-tight md:text-[44px]"
              style={{ fontFamily: 'var(--font-heading, Fraunces, serif)', letterSpacing: '-1.5px' }}
            >
              Un espace pour débloquer une vraie difficulté EAF, pas pour récupérer une réponse générique.
            </h1>
            <p className="text-on-dark-body mt-4 max-w-3xl text-sm leading-7 md:text-base">
              Pose une question de méthode, d'œuvre, de grammaire ou d'oral. Nexus reformule, recentre, s'appuie sur ton historique utile
              et propose la prochaine action sans sortir du cadre pédagogique de la plateforme.
            </p>
          </div>

          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Réponses guidées', value: totalAssistantMessages.toString().padStart(2, '0'), color: 'indigo' as const },
              { label: 'Relances visibles', value: displaySuggestions.length.toString().padStart(2, '0'), color: 'gold' as const },
              { label: 'Cadre sécurisé', value: 'EAF', color: 'teal' as const },
            ].map((item) => (
              <div
                key={item.label}
                className="stat-card-dark rounded-xl px-4 py-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <p
                  className="stat-label text-[11px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: `var(--eaf-${item.color})` }}
                >
                  {item.label}
                </p>
                <p className="stat-value mt-2 text-2xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Questions qui marchent */}
          <section
            className="rounded-xl p-5"
            style={{
              background: 'var(--eaf-bg2)',
              border: '1px solid rgba(123, 142, 255, 0.12)',
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-indigo)]">
              Questions qui marchent
            </p>
            <div className="mt-4 space-y-2.5">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  className="group flex w-full items-start justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm leading-6 transition-all duration-200 hover:border-[var(--eaf-indigo)]/30 hover:bg-[var(--eaf-bg3)]/50"
                  style={{
                    borderColor: 'rgba(123, 142, 255, 0.15)',
                    background: 'var(--eaf-bg1)',
                    color: 'var(--eaf-fg1)',
                  }}
                >
                  <span>{prompt}</span>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--eaf-indigo)] transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </section>

          {/* Mode opératoire */}
          <section
            className="rounded-xl p-5"
            style={{
              background: 'var(--eaf-bg2)',
              border: '1px solid rgba(123, 142, 255, 0.12)',
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-indigo)]">
              Mode opératoire
            </p>
            <div className="mt-4 space-y-3">
              {OPERATING_RULES.map((rule) => {
                const Icon = rule.icon;
                const styles = COLOR_STYLES[rule.color];
                return (
                  <div
                    key={rule.title}
                    className="rounded-lg p-4"
                    style={{
                      background: 'var(--eaf-bg1)',
                      border: `1px solid ${styles.border.replace('border-', '')}`.replace(/border-\[(.*?)]/, '$1'),
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconText}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-semibold text-[var(--eaf-fg1)]">{rule.title}</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--eaf-fg2)]">{rule.body}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        {/* Chat Area */}
        <section
          className="overflow-hidden rounded-xl"
          style={{
            background: 'var(--eaf-bg1)',
            border: '1px solid rgba(123, 142, 255, 0.12)',
          }}
        >
          {/* Header */}
          <div
            className="border-b px-5 py-4 md:px-6"
            style={{ borderColor: 'rgba(123, 142, 255, 0.1)', background: 'var(--eaf-bg2)' }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--eaf-indigo)]/10">
                  <img src="/images/logo.png" alt="Nexus" className="h-9 w-9 object-contain" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--eaf-fg0)]">Conversation guidée</h2>
                  <p className="text-sm text-[var(--eaf-fg2)]">Méthode claire, références internes, aucune URL externe.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {displaySuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void sendMessage(suggestion)}
                    className="rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:border-[var(--eaf-indigo)]/30 hover:bg-[var(--eaf-indigo)]/5"
                    style={{
                      borderColor: 'rgba(123, 142, 255, 0.2)',
                      background: 'var(--eaf-bg2)',
                      color: 'var(--eaf-fg1)',
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex min-h-[62vh] flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6" role="log" aria-live="polite">
              {messages.length === 0 ? (
                <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--eaf-indigo)]/8 text-[var(--eaf-indigo)]">
                    <Sparkles className="h-9 w-9" />
                  </div>
                  <h3
                    className="mt-6 text-3xl leading-tight text-[var(--eaf-fg0)]"
                    style={{ fontFamily: 'var(--font-heading, Fraunces, serif)', letterSpacing: '-1px' }}
                  >
                    Commence par le blocage réel du moment.
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--eaf-fg2)] md:text-base">
                    Plus la question est située, plus la réponse devient utile. Exemple : une introduction trop vague,
                    une métaphore mal exploitée, une problématique qui ne tient pas, une question de grammaire mal cadrée.
                  </p>
                  <div className="mt-6 grid w-full max-w-3xl gap-3 md:grid-cols-2">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void sendMessage(prompt)}
                        className="rounded-lg border px-4 py-4 text-left text-sm leading-6 transition-all duration-200 hover:border-[var(--eaf-indigo)]/30 hover:-translate-y-0.5"
                        style={{
                          borderColor: 'rgba(123, 142, 255, 0.15)',
                          background: 'var(--eaf-bg2)',
                          color: 'var(--eaf-fg1)',
                        }}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`flex max-w-[92%] gap-3 md:max-w-[82%] ${message.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      <div
                        className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                          message.role === 'user'
                            ? 'border-[var(--eaf-indigo)]/20 bg-[var(--eaf-indigo)]/10 text-[var(--eaf-indigo)]'
                            : 'border-[var(--eaf-teal)]/20 bg-[var(--eaf-teal)]/10 text-[var(--eaf-teal)]'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <span className="text-sm font-semibold">Toi</span>
                        ) : (
                          <img src="/images/logo.png" alt="" className="h-6 w-6 object-contain" />
                        )}
                      </div>

                      <div
                        className={`rounded-2xl px-4 py-4 md:px-5 ${
                          message.role === 'user'
                            ? 'bg-[var(--eaf-indigo)]/15 text-[var(--eaf-fg0)]'
                            : 'border text-[var(--eaf-fg1)]'
                        }`}
                        style={message.role !== 'user' ? { borderColor: 'rgba(123, 142, 255, 0.12)', background: 'var(--eaf-bg2)' } : {}}
                        role={message.role === 'assistant' ? 'status' : undefined}
                        aria-live={message.role === 'assistant' ? 'polite' : undefined}
                      >
                        <p className="whitespace-pre-line text-sm leading-7">
                          {message.role === 'assistant' ? sanitizeLlmText(message.content) : message.content}
                        </p>

                        {message.role === 'assistant' && message.citations && message.citations.length > 0 && (
                          <div className="mt-4 space-y-2 border-t pt-4" style={{ borderColor: 'rgba(123, 142, 255, 0.1)' }}>
                            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--eaf-gold)]">
                              Citations et points d'appui
                            </p>
                            <div className="grid gap-2">
                              {message.citations.map((citation) => (
                                <div
                                  key={`${citation.index}-${citation.title}`}
                                  className="rounded-lg border px-3 py-3 text-xs leading-6"
                                  style={{
                                    borderColor: 'rgba(123, 142, 255, 0.1)',
                                    background: 'var(--eaf-bg1)',
                                    color: 'var(--eaf-fg2)',
                                  }}
                                >
                                  <span className="font-semibold text-[var(--eaf-indigo)]">
                                    [{citation.index}] {citation.title}
                                  </span>
                                  <span className="block">{citation.source}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isSending && (
                    <div className="mr-auto flex max-w-[82%] gap-3">
                      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--eaf-teal)]/20 bg-[var(--eaf-teal)]/10 text-[var(--eaf-teal)]">
                        <img src="/images/logo.png" alt="" className="h-6 w-6 object-contain" />
                      </div>
                      <div
                        className="rounded-2xl border px-5 py-4"
                        style={{ borderColor: 'rgba(123, 142, 255, 0.1)', background: 'var(--eaf-bg2)' }}
                      >
                        <p className="mb-2 text-xs font-medium text-[var(--eaf-fg3)]">Le tuteur rédige sa réponse...</p>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[var(--eaf-teal)] animate-bounce opacity-60" />
                          <span className="h-2 w-2 rounded-full bg-[var(--eaf-teal)] animate-bounce opacity-60" style={{ animationDelay: '0.15s' }} />
                          <span className="h-2 w-2 rounded-full bg-[var(--eaf-teal)] animate-bounce opacity-60" style={{ animationDelay: '0.3s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div
              className="border-t px-4 py-4 md:px-6 md:py-5"
              style={{ borderColor: 'rgba(123, 142, 255, 0.1)', background: 'var(--eaf-bg2)' }}
            >
              {/* Category badges */}
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                <Badge
                  size="sm"
                  className="border-0"
                  style={{ background: 'var(--eaf-indigo)', color: '#050913' }}
                >
                  Méthode
                </Badge>
                <Badge
                  size="sm"
                  className="border-0"
                  style={{ background: 'var(--eaf-teal)', color: '#050913' }}
                >
                  Œuvres
                </Badge>
                <Badge
                  size="sm"
                  className="border-0"
                  style={{ background: 'var(--eaf-gold)', color: '#050913' }}
                >
                  Grammaire
                </Badge>
                <Badge
                  size="sm"
                  className="border-0"
                  style={{ background: 'var(--eaf-orange)', color: '#050913' }}
                >
                  Oral
                </Badge>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendMessage(input);
                }}
                className="relative"
              >
                <label htmlFor="tuteur-input" className="sr-only">
                  Message au tuteur de parcours
                </label>
                <input
                  id="tuteur-input"
                  className="w-full rounded-xl border px-5 py-4 pr-16 text-sm outline-none transition-all duration-200 placeholder:text-[var(--eaf-fg3)]"
                  style={{
                    borderColor: 'rgba(123, 142, 255, 0.2)',
                    background: 'var(--eaf-bg1)',
                    color: 'var(--eaf-fg0)',
                  }}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Exemple : ma problématique est trop vague, comment la resserrer ?"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isSending}
                  size="md"
                  className="absolute right-2 top-1/2 h-11 w-11 -translate-y-1/2 rounded-xl p-0 disabled:opacity-50"
                  style={{
                    background: 'var(--eaf-orange)',
                    color: '#050913',
                  }}
                  icon={<Send className="h-4 w-4" />}
                  aria-label="Envoyer"
                />
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function TuteurPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl p-4 md:p-8">
          <StateNotice
            title="Préparation du tuteur de parcours"
            description="L'espace de guidage se met en place. Cela ne prend que quelques secondes."
            variant="loading"
            center
            className="mx-auto max-w-xl"
          />
        </div>
      }
    >
      <TuteurPageContent />
    </Suspense>
  );
}
