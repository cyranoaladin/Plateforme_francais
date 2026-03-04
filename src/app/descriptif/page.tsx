'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, Plus, Trash2, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

type ObjetEtude = 'poesie' | 'roman' | 'theatre' | 'litterature_idees';
type TypeExtrait = 'extrait_oeuvre' | 'extrait_parcours';

type DescriptifTexte = {
  id: string;
  objetEtude: ObjetEtude;
  oeuvre: string;
  auteur: string;
  typeExtrait: TypeExtrait;
  titre: string;
  premieresLignes?: string | null;
};

const OBJETS_ETUDE: { key: ObjetEtude; label: string }[] = [
  { key: 'poesie', label: 'Poésie' },
  { key: 'litterature_idees', label: 'Littérature d\'idées' },
  { key: 'theatre', label: 'Théâtre' },
  { key: 'roman', label: 'Roman' },
];

const OEUVRES_PAR_OBJET: Record<ObjetEtude, { oeuvre: string; auteur: string }[]> = {
  poesie: [
    { oeuvre: 'Cahier de Douai', auteur: 'Arthur Rimbaud' },
    { oeuvre: 'La rage de l\'expression', auteur: 'Francis Ponge' },
    { oeuvre: 'Mes forêts', auteur: 'Hélène Dorion' },
  ],
  litterature_idees: [
    { oeuvre: 'Discours de la servitude volontaire', auteur: 'Étienne de La Boétie' },
    { oeuvre: 'Entretiens sur la pluralité des mondes', auteur: 'Bernard Le Bouyer de Fontenelle' },
    { oeuvre: 'Lettres d\'une Péruvienne', auteur: 'Françoise de Graffigny' },
  ],
  theatre: [
    { oeuvre: 'Le Menteur', auteur: 'Pierre Corneille' },
    { oeuvre: 'On ne badine pas avec l\'amour', auteur: 'Alfred de Musset' },
    { oeuvre: 'Pour un oui ou pour un non', auteur: 'Nathalie Sarraute' },
  ],
  roman: [
    { oeuvre: 'Manon Lescaut', auteur: 'Abbé Prévost' },
    { oeuvre: 'La Peau de chagrin', auteur: 'Honoré de Balzac' },
    { oeuvre: 'Sido suivi de Les Vrilles de la vigne', auteur: 'Colette' },
  ],
};

function validateDescriptifClient(textes: DescriptifTexte[]): string[] {
  const warnings: string[] = [];
  const total = textes.length;
  if (total < 20) warnings.push(`Total insuffisant : ${total}/20 textes.`);

  const byObjet: Record<string, number> = {};
  const byOeuvre: Record<string, number> = {};
  const byParcours: Record<string, number> = {};

  for (const t of textes) {
    byObjet[t.objetEtude] = (byObjet[t.objetEtude] ?? 0) + 1;
    const key = `${t.objetEtude}__${t.oeuvre}`;
    if (t.typeExtrait === 'extrait_oeuvre') {
      byOeuvre[key] = (byOeuvre[key] ?? 0) + 1;
    } else {
      byParcours[key] = (byParcours[key] ?? 0) + 1;
    }
  }

  for (const obj of OBJETS_ETUDE) {
    const count = byObjet[obj.key] ?? 0;
    if (count < 5) warnings.push(`${obj.label} : ${count}/5 textes.`);
  }
  for (const [key, count] of Object.entries(byOeuvre)) {
    if (count < 3) warnings.push(`Œuvre "${key.split('__')[1]}" : ${count}/3 extraits.`);
  }
  for (const [key, count] of Object.entries(byParcours)) {
    if (count < 2) warnings.push(`Parcours "${key.split('__')[1]}" : ${count}/2 extraits.`);
  }

  return warnings;
}

export default function DescriptifPage() {
  const [textes, setTextes] = useState<DescriptifTexte[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverWarnings, setServerWarnings] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [formObjet, setFormObjet] = useState<ObjetEtude>('poesie');
  const [formOeuvreIdx, setFormOeuvreIdx] = useState(0);
  const [formType, setFormType] = useState<TypeExtrait>('extrait_oeuvre');
  const [formTitre, setFormTitre] = useState('');
  const [formPremieres, setFormPremieres] = useState('');

  useEffect(() => {
    fetch('/api/v1/student/descriptif')
      .then((r) => r.json())
      .then((data) => { setTextes(data.textes ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const clientWarnings = useMemo(() => validateDescriptifClient(textes), [textes]);

  const addTexte = useCallback(() => {
    if (!formTitre.trim()) return;
    const oeuvreData = OEUVRES_PAR_OBJET[formObjet][formOeuvreIdx];
    if (!oeuvreData) return;
    const newTexte: DescriptifTexte = {
      id: `local-${Date.now()}`,
      objetEtude: formObjet,
      oeuvre: oeuvreData.oeuvre,
      auteur: oeuvreData.auteur,
      typeExtrait: formType,
      titre: formTitre.trim(),
      premieresLignes: formPremieres.trim() || null,
    };
    setTextes((prev) => [...prev, newTexte]);
    setFormTitre('');
    setFormPremieres('');
    setSuccessMsg('');
  }, [formObjet, formOeuvreIdx, formType, formTitre, formPremieres]);

  const removeTexte = useCallback((id: string) => {
    setTextes((prev) => prev.filter((t) => t.id !== id));
    setSuccessMsg('');
  }, []);

  const saveDescriptif = useCallback(async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await fetch('/api/v1/student/descriptif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfTokenFromDocument() },
        body: JSON.stringify({
          textes: textes.map(({ objetEtude, oeuvre, auteur, typeExtrait, titre, premieresLignes }) => ({
            objetEtude, oeuvre, auteur, typeExtrait, titre, premieresLignes: premieresLignes ?? undefined,
          })),
        }),
      });
      const data = await res.json();
      setServerWarnings(data.warnings ?? []);
      if (data.ok) setSuccessMsg(`${data.count} textes sauvegardés.`);
    } catch { /* handled silently */ }
    setSaving(false);
  }, [textes]);

  const textesParObjet = useMemo(() => {
    const groups: Record<ObjetEtude, DescriptifTexte[]> = {
      poesie: [], litterature_idees: [], theatre: [], roman: [],
    };
    for (const t of textes) {
      if (groups[t.objetEtude]) groups[t.objetEtude].push(t);
    }
    return groups;
  }, [textes]);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <ClipboardList className="w-7 h-7 text-indigo-500" /> Mon Descriptif de lecture
        </h1>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${textes.length >= 20 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'}`}>
            {textes.length}/20 textes
          </span>
        </div>
      </div>

      {/* Warnings */}
      {clientWarnings.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <h3 className="font-bold text-amber-700 dark:text-amber-400 text-sm mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Règles non satisfaites
          </h3>
          <ul className="text-xs text-amber-600 dark:text-amber-300 space-y-1">
            {clientWarnings.map((w, i) => <li key={i}>• {w}</li>)}
          </ul>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {serverWarnings.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">Avertissements serveur :</p>
          <ul className="text-xs text-amber-600 dark:text-amber-300 space-y-1">
            {serverWarnings.map((w, i) => <li key={i}>• {w}</li>)}
          </ul>
        </div>
      )}

      {/* Add form */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-foreground">Ajouter un texte</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={formObjet} onChange={(e) => { setFormObjet(e.target.value as ObjetEtude); setFormOeuvreIdx(0); }} className="rounded-xl border border-border bg-muted/20 p-2.5 text-sm">
            {OBJETS_ETUDE.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          <select value={formOeuvreIdx} onChange={(e) => setFormOeuvreIdx(Number(e.target.value))} className="rounded-xl border border-border bg-muted/20 p-2.5 text-sm">
            {OEUVRES_PAR_OBJET[formObjet].map((o, i) => <option key={i} value={i}>{o.oeuvre} — {o.auteur}</option>)}
          </select>
          <select value={formType} onChange={(e) => setFormType(e.target.value as TypeExtrait)} className="rounded-xl border border-border bg-muted/20 p-2.5 text-sm">
            <option value="extrait_oeuvre">Extrait d&apos;œuvre</option>
            <option value="extrait_parcours">Extrait du parcours</option>
          </select>
          <button onClick={addTexte} disabled={!formTitre.trim()} className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
        <input value={formTitre} onChange={(e) => setFormTitre(e.target.value)} placeholder="Titre du texte (ex: Acte III, scène 5)" className="w-full rounded-xl border border-border bg-muted/20 p-2.5 text-sm" />
        <input value={formPremieres} onChange={(e) => setFormPremieres(e.target.value)} placeholder="Premières lignes (optionnel)" className="w-full rounded-xl border border-border bg-muted/20 p-2.5 text-sm" />
      </div>

      {/* Textes by objet d'étude */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {OBJETS_ETUDE.map((obj) => {
          const items = textesParObjet[obj.key];
          const count = items.length;
          return (
            <div key={obj.key} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground">{obj.label}</h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${count >= 5 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'}`}>
                  {count}/5
                </span>
              </div>
              {count === 0 ? (
                <p className="text-xs text-muted-foreground">Aucun texte ajouté.</p>
              ) : (
                <div className="space-y-2">
                  {items.map((t) => (
                    <div key={t.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/20 border border-border">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{t.oeuvre} — {t.auteur}</p>
                        <p className="text-xs text-muted-foreground truncate">{t.titre}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.typeExtrait === 'extrait_oeuvre' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400'}`}>
                          {t.typeExtrait === 'extrait_oeuvre' ? 'Œuvre' : 'Parcours'}
                        </span>
                      </div>
                      <button onClick={() => removeTexte(t.id)} className="p-1 text-red-500 hover:text-red-700 transition-colors shrink-0" aria-label="Supprimer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button onClick={saveDescriptif} disabled={saving || textes.length === 0} className="flex items-center gap-2 bg-indigo-600 text-white rounded-xl px-6 py-3 font-bold text-sm disabled:opacity-50 hover:bg-indigo-700 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Sauvegarder le descriptif
        </button>
      </div>
    </div>
  );
}
