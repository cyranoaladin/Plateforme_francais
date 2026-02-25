'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, BrainCircuit, Sparkles } from 'lucide-react';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  citations?: { index: number; title: string; source: string; url: string }[];
};

const STORAGE_KEY = 'eaf_tuteur_history';

export default function TuteurPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Message[];
      setMessages(parsed);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const history = useMemo(
    () => messages.map((item) => ({ role: item.role, content: item.content })),
    [messages],
  );

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    const nextUser: Message = { role: 'user', content: message.trim() };
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
        body: JSON.stringify({ message, conversationHistory: history }),
      });

      if (!response.ok) {
        throw new Error('Échec de réponse du tuteur IA.');
      }

      const payload = (await response.json()) as {
        answer: string;
        citations: { index: number; title: string; source: string; url: string }[];
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-2rem)] p-4 md:p-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* ─── Chat Container ─── */}
      <div className="flex-1 flex flex-col bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
        {/* Chat header */}
        <div className="bg-card border-b border-border p-4 flex items-center gap-3 shrink-0">
          <div className="w-11 h-11 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center shrink-0">
            <BrainCircuit className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg leading-tight">Nexus</h3>
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" /> En ligne &middot; RAG Corpus 2026
            </p>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5" role="log" aria-live="polite">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">Bienvenue !</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Pose tes questions de méthode, d&apos;oeuvres ou de grammaire. Je cite toujours mes sources.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 shrink-0 flex items-center justify-center mt-1">
                  <BrainCircuit className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={`p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-md'
                    : 'bg-muted/50 border border-border text-foreground rounded-tl-sm shadow-sm'
                }`}
                role={message.role === 'assistant' ? 'status' : undefined}
                aria-live={message.role === 'assistant' ? 'polite' : undefined}
              >
                <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                {message.role === 'assistant' && message.citations && message.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                    {message.citations.map((citation) => (
                      <div key={`${citation.index}-${citation.url}`} className="text-xs text-muted-foreground">
                        [{citation.index}] {citation.title} &middot; <a href={citation.url} target="_blank" rel="noreferrer" className="underline text-primary hover:text-primary/80">source</a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isSending && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 shrink-0 flex items-center justify-center mt-1">
                <BrainCircuit className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted/50 border border-border rounded-2xl rounded-tl-sm p-4 shadow-sm flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2 shrink-0">
            {suggestions.slice(0, 3).map((suggestion) => (
              <button key={suggestion} onClick={() => void sendMessage(suggestion)}
                className="px-3 py-1.5 rounded-full border border-border text-xs font-medium bg-background hover:bg-muted hover:border-primary/30 transition-colors truncate max-w-[200px]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="p-3 md:p-4 bg-card border-t border-border shrink-0">
          <form onSubmit={(e) => { e.preventDefault(); void sendMessage(input); }} className="relative flex items-center">
            <label htmlFor="tuteur-input" className="sr-only">Message au tuteur IA</label>
            <input
              id="tuteur-input"
              className="w-full pl-5 pr-14 py-3.5 rounded-full border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm placeholder:text-muted-foreground text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pose ta question..."
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="absolute right-2 p-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
