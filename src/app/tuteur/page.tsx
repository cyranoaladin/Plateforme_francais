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
} from 'lucide-react';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  citations?: { index: number; title: string; source: string }[];
};

const EDITORIAL_HEADING = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
};

const STARTER_PROMPTS = [
  'Donne-moi une méthode courte pour l introduction de dissertation.',
  'Comment analyser une métaphore dans un poème de Rimbaud ?',
  'Aide-moi à formuler une problématique sur Manon Lescaut.',
  'Je bloque sur la question de grammaire : comment repartir ?',
];

const OPERATING_RULES = [
  {
    title: 'Réponse cadrée EAF',
    body: 'Le tuteur reste sur la méthode, les œuvres, la grammaire et les attendus réels de l épreuve.',
    icon: Compass,
  },
  {
    title: 'Sources internes',
    body: 'Les réponses s appuient sur les références internes mobilisées par la plateforme, pas sur un web ouvert flou.',
    icon: BookOpen,
  },
  {
    title: 'Anti-copie',
    body: 'Le guidage aide à produire mieux. Il ne remplace jamais le travail de l élève par une copie livrée clé en main.',
    icon: ShieldCheck,
  },
];

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
    [messages],
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
      const response = await fetch('/api/v1/tuteur/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfTokenFromDocument(),
        },
        body: JSON.stringify({ message: trimmed, conversationHistory: history, workId, parcours, sessionId }),
      });

      if (!response.ok) {
        throw new Error('Échec de réponse du guidage.');
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
      <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#17324d] px-6 py-7 text-[#f6efe4] shadow-[0_28px_90px_rgba(23,50,77,0.22)] md:px-8 md:py-8">
        <div className="absolute inset-y-0 right-[-8%] hidden w-[36%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.24),_transparent_72%)] blur-2xl lg:block" />
        <div className="absolute left-[-4%] top-[-24%] h-40 w-40 rounded-full bg-[rgba(216,163,99,0.15)] blur-3xl" />

        <div className="relative grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#d7c4aa]">
              <MessageSquareQuote className="h-4 w-4" />
              Tuteur Nexus
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-5 max-w-4xl text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl">
              Un espace pour débloquer une vraie difficulté EAF, pas pour récupérer une réponse générique.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#dfe8f0] md:text-base">
              Pose une question de méthode, d œuvre, de grammaire ou d oral. Nexus reformule, recentre, s appuie sur ton historique utile
              et propose la prochaine action sans sortir du cadre pedagogique de la plateforme.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { label: 'Réponses guidées', value: totalAssistantMessages.toString().padStart(2, '0') },
              { label: 'Relances visibles', value: displaySuggestions.length.toString().padStart(2, '0') },
              { label: 'Cadre sécurisé', value: 'EAF' },
            ].map((item) => (
              <div key={item.label} className="rounded-[26px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d7c4aa]">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-[28px] border border-[#e8dcc8] bg-[#f8f1e7] p-5 shadow-[0_18px_55px_rgba(122,75,36,0.08)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Questions qui marchent</p>
            <div className="mt-4 space-y-2.5">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  className="flex w-full items-start justify-between gap-3 rounded-[20px] border border-[#eadbc5] bg-white/80 px-4 py-3 text-left text-sm leading-6 text-[#17324d] transition hover:border-[#17324d]/22 hover:bg-white"
                >
                  <span>{prompt}</span>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#9a6a37]" />
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-[#d7e6e1] bg-[#edf7f3] p-5 shadow-[0_18px_55px_rgba(15,118,110,0.08)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#0f766e]">Mode opératoire</p>
            <div className="mt-4 space-y-3">
              {OPERATING_RULES.map((rule) => {
                const Icon = rule.icon;
                return (
                  <div key={rule.title} className="rounded-[22px] border border-[#d0e8df] bg-white/85 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0f766e]/10 text-[#0f766e]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-semibold text-[#17324d]">{rule.title}</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#33536f]">{rule.body}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        <section className="overflow-hidden rounded-[30px] border border-[#e6dccb] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ec_100%)] shadow-[0_20px_70px_rgba(23,50,77,0.10)]">
          <div className="border-b border-[#efe3d2] bg-white/85 px-5 py-4 md:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#17324d]/10">
                  <img src="/images/logo.png" alt="Nexus" className="h-9 w-9 object-contain" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#17324d]">Conversation guidée</h2>
                  <p className="text-sm text-[#5d7287]">Méthode claire, références internes, aucune URL externe.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {displaySuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void sendMessage(suggestion)}
                    className="rounded-full border border-[#dfd1bc] bg-[#fffaf4] px-3 py-1.5 text-xs font-medium text-[#17324d] transition hover:border-[#17324d]/22 hover:bg-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex min-h-[62vh] flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6" role="log" aria-live="polite">
              {messages.length === 0 ? (
                <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#17324d]/8 text-[#17324d]">
                    <Sparkles className="h-9 w-9" />
                  </div>
                  <h3 style={EDITORIAL_HEADING} className="mt-6 text-3xl leading-tight tracking-[-0.02em] text-[#17324d]">
                    Commence par le blocage réel du moment.
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-[#5d7287] md:text-base">
                    Plus la question est située, plus la réponse devient utile. Exemple : une introduction trop vague,
                    une métaphore mal exploitée, une problématique qui ne tient pas, une question de grammaire mal cadrée.
                  </p>
                  <div className="mt-6 grid w-full max-w-3xl gap-3 md:grid-cols-2">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void sendMessage(prompt)}
                        className="rounded-[22px] border border-[#e7dac6] bg-white px-4 py-4 text-left text-sm leading-6 text-[#17324d] shadow-[0_12px_30px_rgba(23,50,77,0.05)] transition hover:border-[#17324d]/22 hover:-translate-y-0.5"
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
                        className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${message.role === 'user' ? 'border-[#17324d]/18 bg-[#17324d] text-white' : 'border-[#d9e7e1] bg-[#edf7f3] text-[#0f766e]'}`}
                      >
                        {message.role === 'user' ? (
                          <span className="text-sm font-semibold">Vous</span>
                        ) : (
                          <img src="/images/logo.png" alt="" className="h-6 w-6 object-contain" />
                        )}
                      </div>

                      <div
                        className={`rounded-[26px] px-4 py-4 shadow-[0_12px_30px_rgba(23,50,77,0.06)] md:px-5 ${message.role === 'user' ? 'bg-[#17324d] text-white' : 'border border-[#e7dac6] bg-white text-[#17324d]'}`}
                        role={message.role === 'assistant' ? 'status' : undefined}
                        aria-live={message.role === 'assistant' ? 'polite' : undefined}
                      >
                        <p className="whitespace-pre-line text-sm leading-7">{message.content}</p>

                        {message.role === 'assistant' && message.citations && message.citations.length > 0 && (
                          <div className="mt-4 space-y-2 border-t border-[#efe4d4] pt-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9a6a37]">Citations et points d appui</p>
                            <div className="grid gap-2">
                              {message.citations.map((citation) => (
                                <div key={`${citation.index}-${citation.title}`} className="rounded-[18px] border border-[#efe3d2] bg-[#fbf5ec] px-3 py-3 text-xs leading-6 text-[#33536f]">
                                  <span className="font-semibold text-[#17324d]">[{citation.index}] {citation.title}</span>
                                  <span className="block text-[#7a6858]">{citation.source}</span>
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
                      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#d9e7e1] bg-[#edf7f3] text-[#0f766e]">
                        <img src="/images/logo.png" alt="" className="h-6 w-6 object-contain" />
                      </div>
                      <div className="rounded-[26px] border border-[#e7dac6] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(23,50,77,0.06)]">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#0f766e]/40 animate-bounce" />
                          <span className="h-2.5 w-2.5 rounded-full bg-[#0f766e]/40 animate-bounce" style={{ animationDelay: '0.12s' }} />
                          <span className="h-2.5 w-2.5 rounded-full bg-[#0f766e]/40 animate-bounce" style={{ animationDelay: '0.24s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-[#efe3d2] bg-white/90 px-4 py-4 md:px-6 md:py-5">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[#6f7f8f]">
                <span className="rounded-full bg-[#17324d]/7 px-3 py-1 font-medium text-[#17324d]">Méthode</span>
                <span className="rounded-full bg-[#0f766e]/7 px-3 py-1 font-medium text-[#0f766e]">Œuvres</span>
                <span className="rounded-full bg-[#b87333]/10 px-3 py-1 font-medium text-[#9a6a37]">Grammaire</span>
                <span className="rounded-full bg-[#6b587d]/8 px-3 py-1 font-medium text-[#6b587d]">Oral</span>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendMessage(input);
                }}
                className="relative"
              >
                <label htmlFor="tuteur-input" className="sr-only">Message au tuteur de parcours</label>
                <input
                  id="tuteur-input"
                  className="w-full rounded-[24px] border border-[#dfd1bc] bg-[#fffaf4] px-5 py-4 pr-16 text-sm text-[#17324d] shadow-[0_12px_24px_rgba(23,50,77,0.05)] outline-none transition placeholder:text-[#8b95a1] focus:border-[#17324d]/24 focus:bg-white focus:ring-2 focus:ring-[#17324d]/10"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Exemple : ma problématique est trop vague, comment la resserrer ?"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isSending}
                  className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl bg-[#17324d] text-white transition hover:bg-[#224464] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
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
    <Suspense fallback={<div className="mx-auto w-full max-w-7xl p-4 md:p-8" />}>
      <TuteurPageContent />
    </Suspense>
  );
}
