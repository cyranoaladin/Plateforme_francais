'use client';

import { useCallback, useEffect, useState } from 'react';
import { NotebookPen, Plus, Trash2, Loader2, BookOpen, Sparkles, FileDown } from 'lucide-react';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

type EntryType = 'citation' | 'note' | 'reaction' | 'resume' | 'lien_culturel';

type CarnetEntry = {
  id: string;
  oeuvre: string;
  auteur: string;
  type: EntryType;
  contenu: string;
  page?: string | null;
  tags: string[];
  createdAt: string;
};

const ENTRY_TYPES: { key: EntryType; label: string; icon: string }[] = [
  { key: 'citation', label: 'Citation', icon: '📖' },
  { key: 'note', label: 'Note', icon: '📝' },
  { key: 'reaction', label: 'Réaction', icon: '💭' },
  { key: 'resume', label: 'Résumé', icon: '📄' },
  { key: 'lien_culturel', label: 'Lien culturel', icon: '🔗' },
];

const OEUVRES = [
  { oeuvre: 'Cahier de Douai', auteur: 'Arthur Rimbaud' },
  { oeuvre: 'La rage de l\'expression', auteur: 'Francis Ponge' },
  { oeuvre: 'Mes forêts', auteur: 'Hélène Dorion' },
  { oeuvre: 'Discours de la servitude volontaire', auteur: 'Étienne de La Boétie' },
  { oeuvre: 'Entretiens sur la pluralité des mondes', auteur: 'Bernard Le Bouyer de Fontenelle' },
  { oeuvre: 'Lettres d\'une Péruvienne', auteur: 'Françoise de Graffigny' },
  { oeuvre: 'Le Menteur', auteur: 'Pierre Corneille' },
  { oeuvre: 'On ne badine pas avec l\'amour', auteur: 'Alfred de Musset' },
  { oeuvre: 'Pour un oui ou pour un non', auteur: 'Nathalie Sarraute' },
  { oeuvre: 'Manon Lescaut', auteur: 'Abbé Prévost' },
  { oeuvre: 'La Peau de chagrin', auteur: 'Honoré de Balzac' },
  { oeuvre: 'Sido suivi de Les Vrilles de la vigne', auteur: 'Colette' },
];

export default function CarnetPage() {
  const [entries, setEntries] = useState<CarnetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(OEUVRES[0].oeuvre);

  // Form state
  const [formType, setFormType] = useState<EntryType>('citation');
  const [formContenu, setFormContenu] = useState('');
  const [formPage, setFormPage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingFiches, setLoadingFiches] = useState(false);
  const [fichesOutput, setFichesOutput] = useState('');

  useEffect(() => {
    fetch('/api/v1/carnet')
      .then((r) => r.json())
      .then((data) => { setEntries(data.entries ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const addEntry = useCallback(async () => {
    if (!formContenu.trim()) return;
    setSubmitting(true);
    const oeuvreData = OEUVRES.find((o) => o.oeuvre === activeTab);
    if (!oeuvreData) { setSubmitting(false); return; }

    try {
      const res = await fetch('/api/v1/carnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfTokenFromDocument() },
        body: JSON.stringify({
          oeuvre: oeuvreData.oeuvre,
          auteur: oeuvreData.auteur,
          type: formType,
          contenu: formContenu.trim(),
          page: formPage.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok && data.entry) {
        setEntries((prev) => [data.entry, ...prev]);
        setFormContenu('');
        setFormPage('');
      }
    } catch { /* handled silently */ }
    setSubmitting(false);
  }, [activeTab, formType, formContenu, formPage]);

  const deleteEntry = useCallback(async (entryId: string) => {
    try {
      await fetch(`/api/v1/carnet/${entryId}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': getCsrfTokenFromDocument() },
      });
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch { /* handled silently */ }
  }, []);

  const filteredEntries = entries.filter((e) => e.oeuvre === activeTab);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
        <NotebookPen className="w-7 h-7 text-indigo-500" /> Carnet de lecture
      </h1>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin">
        {OEUVRES.map((o) => {
          const count = entries.filter((e) => e.oeuvre === o.oeuvre).length;
          return (
            <button
              key={o.oeuvre}
              onClick={() => setActiveTab(o.oeuvre)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${activeTab === o.oeuvre ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-card border-border text-foreground hover:bg-muted/40'}`}
            >
              {o.oeuvre} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Add entry form */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h2 className="font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Ajouter une entrée — {activeTab}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {ENTRY_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setFormType(t.key)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${formType === t.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/20 border-border hover:bg-muted/40'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <textarea
          value={formContenu}
          onChange={(e) => setFormContenu(e.target.value)}
          placeholder="Contenu de votre entrée..."
          rows={3}
          className="w-full rounded-xl border border-border bg-muted/20 p-3 text-sm resize-none"
        />
        <div className="flex gap-3 items-center">
          <input
            value={formPage}
            onChange={(e) => setFormPage(e.target.value)}
            placeholder="Page (opt.)"
            className="w-28 rounded-xl border border-border bg-muted/20 p-2.5 text-sm"
          />
          <button
            onClick={addEntry}
            disabled={submitting || !formContenu.trim()}
            className="flex items-center gap-2 bg-indigo-600 text-white rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50 hover:bg-indigo-700 transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Ajouter
          </button>
        </div>
      </div>

      {/* Entries list */}
      {filteredEntries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Aucune entrée pour cette œuvre. Commencez par ajouter une citation ou une note.</p>
      ) : (
        <div className="space-y-3">
          {ENTRY_TYPES.map((type) => {
            const items = filteredEntries.filter((e) => e.type === type.key);
            if (items.length === 0) return null;
            return (
              <div key={type.key}>
                <h3 className="text-sm font-bold text-foreground mb-2">{type.icon} {type.label} ({items.length})</h3>
                <div className="space-y-2">
                  {items.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground whitespace-pre-wrap">{entry.contenu}</p>
                        {entry.page && <p className="text-xs text-muted-foreground mt-1">p. {entry.page}</p>}
                      </div>
                      <button onClick={() => deleteEntry(entry.id)} className="p-1 text-red-500 hover:text-red-700 transition-colors shrink-0" aria-label="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Actions globales */}
      <div className="flex gap-3 flex-wrap justify-end pt-4 border-t border-border">
        <button
          onClick={async () => {
            setLoadingFiches(true);
            try {
              const res = await fetch('/api/v1/tuteur/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfTokenFromDocument() },
                body: JSON.stringify({
                  message: `Structure en fiches de révision le carnet de lecture suivant pour l'œuvre "${activeTab}" :\n${JSON.stringify(filteredEntries.map((e) => ({ type: e.type, contenu: e.contenu, page: e.page })), null, 2)}`,
                  conversationHistory: [],
                }),
              });
              const data = await res.json();
              setFichesOutput((data.response as string | undefined) ?? '');
            } catch { /* silent */ }
            setLoadingFiches(false);
          }}
          disabled={filteredEntries.length === 0 || loadingFiches}
          className="flex items-center gap-2 bg-indigo-600 text-white rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50 hover:bg-indigo-700 transition-colors"
        >
          {loadingFiches ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Structurer en fiches
        </button>
        <button
          onClick={() => window.print()}
          disabled={filteredEntries.length === 0}
          className="flex items-center gap-2 bg-slate-700 text-white rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50 hover:bg-slate-800 transition-colors"
        >
          <FileDown className="w-4 h-4" /> Exporter PDF
        </button>
      </div>

      {fichesOutput && (
        <div className="bg-card border border-border rounded-2xl p-5 prose prose-sm max-w-none">
          <h3 className="font-bold mb-3">Fiches structurées</h3>
          <pre className="whitespace-pre-wrap text-sm">{fichesOutput}</pre>
        </div>
      )}
    </div>
  );
}
