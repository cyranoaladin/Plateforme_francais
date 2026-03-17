'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, Loader2, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';
import { StateNotice } from '@/components/ui/state-notice';
import { Badge, Button } from '@/components/ui';

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
  { key: 'litterature_idees', label: "Littérature d’idées" },
  { key: 'theatre', label: 'Théâtre' },
  { key: 'roman', label: 'Roman' },
];

const OEUVRES_PAR_OBJET: Record<ObjetEtude, { oeuvre: string; auteur: string }[]> = {
  poesie: [
    { oeuvre: 'Cahier de Douai', auteur: 'Arthur Rimbaud' },
    { oeuvre: "La rage de l’expression", auteur: 'Francis Ponge' },
    { oeuvre: 'Mes forêts', auteur: 'Hélène Dorion' },
  ],
  litterature_idees: [
    { oeuvre: 'Discours de la servitude volontaire', auteur: 'Étienne de La Boétie' },
    { oeuvre: 'Entretiens sur la pluralité des mondes', auteur: 'Bernard Le Bouyer de Fontenelle' },
    { oeuvre: "Lettres d’une Péruvienne", auteur: 'Françoise de Graffigny' },
  ],
  theatre: [
    { oeuvre: 'Le Menteur', auteur: 'Pierre Corneille' },
    { oeuvre: "On ne badine pas avec l’amour", auteur: 'Alfred de Musset' },
    { oeuvre: 'Pour un oui ou pour un non', auteur: 'Nathalie Sarraute' },
  ],
  roman: [
    { oeuvre: 'Manon Lescaut', auteur: 'Abbé Prévost' },
    { oeuvre: 'La Peau de chagrin', auteur: 'Honoré de Balzac' },
    { oeuvre: 'Sido suivi de Les Vrilles de la vigne', auteur: 'Colette' },
  ],
};

const EDITORIAL_HEADING = {
  fontFamily: "var(--font-display)",
};

function validateDescriptifClient(textes: DescriptifTexte[]): string[] {
  const warnings: string[] = [];
  const total = textes.length;
  if (total < 20) warnings.push(`Total insuffisant : ${total}/20 textes.`);

  const byObjet: Record<string, number> = {};
  const byOeuvre: Record<string, number> = {};
  const byParcours: Record<string, number> = {};

  for (const texte of textes) {
    byObjet[texte.objetEtude] = (byObjet[texte.objetEtude] ?? 0) + 1;
    const key = `${texte.objetEtude}__${texte.oeuvre}`;
    if (texte.typeExtrait === 'extrait_oeuvre') {
      byOeuvre[key] = (byOeuvre[key] ?? 0) + 1;
    } else {
      byParcours[key] = (byParcours[key] ?? 0) + 1;
    }
  }

  for (const objet of OBJETS_ETUDE) {
    const count = byObjet[objet.key] ?? 0;
    if (count < 5) warnings.push(`${objet.label} : ${count}/5 textes.`);
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

  const [formObjet, setFormObjet] = useState<ObjetEtude>('poesie');
  const [formOeuvreIdx, setFormOeuvreIdx] = useState(0);
  const [formType, setFormType] = useState<TypeExtrait>('extrait_oeuvre');
  const [formTitre, setFormTitre] = useState('');
  const [formPremieres, setFormPremieres] = useState('');

  useEffect(() => {
    fetch('/api/v1/student/descriptif')
      .then((response) => response.json())
      .then((data) => {
        setTextes(data.textes ?? []);
        setLoading(false);
      })
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
    setTextes((prev) => prev.filter((texte) => texte.id !== id));
    setSuccessMsg('');
  }, []);

  const saveDescriptif = useCallback(async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const response = await fetch('/api/v1/student/descriptif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfTokenFromDocument() },
        body: JSON.stringify({
          textes: textes.map(({ objetEtude, oeuvre, auteur, typeExtrait, titre, premieresLignes }) => ({
            objetEtude,
            oeuvre,
            auteur,
            typeExtrait,
            titre,
            premieresLignes: premieresLignes ?? undefined,
          })),
        }),
      });
      const data = await response.json();
      setServerWarnings(data.warnings ?? []);
      if (data.ok) setSuccessMsg(`${data.count} textes sauvegardés.`);
    } catch {
      // Silent fail to preserve current behavior.
    }
    setSaving(false);
  }, [textes]);

  const textesParObjet = useMemo(() => {
    const groups: Record<ObjetEtude, DescriptifTexte[]> = {
      poesie: [],
      litterature_idees: [],
      theatre: [],
      roman: [],
    };
    for (const texte of textes) {
      if (groups[texte.objetEtude]) groups[texte.objetEtude].push(texte);
    }
    return groups;
  }, [textes]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-64 max-w-6xl items-center justify-center p-8">
        <StateNotice
          title="Chargement du descriptif"
          description="Les textes déjà saisis, les contrôles de répartition et les règles de couverture sont en cours de lecture."
          variant="loading"
          className="w-full max-w-2xl"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-8">
      <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[var(--navy)] px-6 py-7 text-[var(--surface-parchment)] shadow-[var(--shadow-xl)] md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.22),_transparent_72%)] blur-2xl lg:block" />
        <div className="absolute left-[-5%] top-[-20%] h-44 w-44 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--border-warm)]">
              <ClipboardList className="h-4 w-4" />
              Mon Descriptif de lecture
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-5 max-w-4xl text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
              Le descriptif doit devenir une carte de passage crédible pour l’oral, pas une simple liste remplie à la hâte.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-on-navy-muted)] md:text-base">
              Répartis les textes par objet d’étude, équilibre œuvres et parcours, puis sauvegarde un descriptif cohérent avec le programme officiel et
              réellement pilotable pour l’oral.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className={`rounded-[24px] border px-4 py-4 backdrop-blur-sm ${textes.length >= 20 ? 'border-[var(--border-success-vivid)] bg-[var(--success-bg)] text-[var(--teal)]' : 'border-white/12 bg-white/10 text-white'}`}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${textes.length >= 20 ? 'text-[var(--teal)]' : 'text-[var(--border-warm)]'}`}>Textes</p>
              <p className="mt-2 text-3xl font-semibold">{textes.length}/20</p>
            </div>
            <div className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--border-warm)]">Objets</p>
              <p className="mt-2 text-3xl font-semibold text-white">4</p>
            </div>
            <div className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--border-warm)]">Statut</p>
              <p className="mt-2 text-2xl font-semibold text-white">{clientWarnings.length === 0 ? 'Stable' : 'À compléter'}</p>
            </div>
          </div>
        </div>
      </section>

      {clientWarnings.length > 0 && (
        <div className="rounded-[24px] border border-[var(--border-warning-soft)] bg-[var(--warning-bg)] p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--gold-deep)]">
            <AlertTriangle className="h-4 w-4" /> Règles non satisfaites
          </h3>
          <ul className="space-y-1 text-xs leading-6 text-[var(--gold-contrast)]">
            {clientWarnings.map((warning, index) => <li key={index}>• {warning}</li>)}
          </ul>
        </div>
      )}

      {successMsg && (
        <div className="rounded-[24px] border border-[var(--border-success-vivid)] bg-[var(--success-bg)] p-4 text-sm text-[var(--teal)] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> {successMsg}
        </div>
      )}

      {serverWarnings.length > 0 && (
        <div className="rounded-[24px] border border-[var(--border-warning-soft)] bg-[var(--warning-bg)] p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--gold-deep)]">Avertissements serveur</p>
          <ul className="space-y-1 text-xs leading-6 text-[var(--gold-contrast)]">
            {serverWarnings.map((warning, index) => <li key={index}>• {warning}</li>)}
          </ul>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <section className="rounded-[24px] border border-[var(--border-light)] bg-[linear-gradient(180deg,var(--surface-warm-card-top)_0%,var(--surface-warm-card)_100%)] p-5 shadow-[var(--shadow-lg)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--navy)]/8 text-[var(--navy)]">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--accent-bronze)]">Ajouter un texte</p>
                <h2 style={EDITORIAL_HEADING} className="mt-2 text-3xl leading-tight tracking-[-0.02em] text-[var(--navy)]">
                  Enrichir le descriptif
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <select value={formObjet} onChange={(event) => { setFormObjet(event.target.value as ObjetEtude); setFormOeuvreIdx(0); }} className="w-full rounded-[16px] border border-[var(--border-sand)] bg-white p-3 text-sm text-[var(--navy)] outline-none transition focus:border-[var(--navy)]/18 focus:ring-2 focus:ring-[var(--navy)]/8">
                {OBJETS_ETUDE.map((objet) => <option key={objet.key} value={objet.key}>{objet.label}</option>)}
              </select>
              <select value={formOeuvreIdx} onChange={(event) => setFormOeuvreIdx(Number(event.target.value))} className="w-full rounded-[16px] border border-[var(--border-sand)] bg-white p-3 text-sm text-[var(--navy)] outline-none transition focus:border-[var(--navy)]/18 focus:ring-2 focus:ring-[var(--navy)]/8">
                {OEUVRES_PAR_OBJET[formObjet].map((oeuvre, index) => <option key={index} value={index}>{oeuvre.oeuvre} — {oeuvre.auteur}</option>)}
              </select>
              <select value={formType} onChange={(event) => setFormType(event.target.value as TypeExtrait)} className="w-full rounded-[16px] border border-[var(--border-sand)] bg-white p-3 text-sm text-[var(--navy)] outline-none transition focus:border-[var(--navy)]/18 focus:ring-2 focus:ring-[var(--navy)]/8">
                <option value="extrait_oeuvre">Extrait d'œuvre</option>
                <option value="extrait_parcours">Extrait du parcours</option>
              </select>
              <Button onClick={addTexte} disabled={!formTitre.trim()} icon={<Plus className="h-4 w-4" />} size="md">
                Ajouter
              </Button>
              <input value={formTitre} onChange={(event) => setFormTitre(event.target.value)} placeholder="Titre du texte (ex: Acte I, scène 1)" className="w-full rounded-[16px] border border-[var(--border-sand)] bg-white p-3 text-sm text-[var(--navy)] outline-none transition placeholder:text-[var(--text-placeholder-warm)] focus:border-[var(--navy)]/18 focus:ring-2 focus:ring-[var(--navy)]/8" />
              <input value={formPremieres} onChange={(event) => setFormPremieres(event.target.value)} placeholder="Premières lignes (optionnel)" className="w-full rounded-[16px] border border-[var(--border-sand)] bg-white p-3 text-sm text-[var(--navy)] outline-none transition placeholder:text-[var(--text-placeholder-warm)] focus:border-[var(--navy)]/18 focus:ring-2 focus:ring-[var(--navy)]/8" />
            </div>
          </section>

          <section className="rounded-[24px] border border-[var(--border-success)] bg-[var(--success-bg)] p-5 shadow-[var(--shadow-lg)]">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-[var(--teal)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--navy)]">Règle d’équilibre</p>
                <p className="mt-2 text-sm leading-7 text-[var(--navy-mid)]">
                  Un bon descriptif répartit les textes par objet d’étude, couvre les attendus officiels et évite les trous. Le but n’est pas de
                  remplir une contrainte administrative, mais de rendre l’oral réellement défendable.
                </p>
              </div>
            </div>
          </section>
        </aside>

        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {OBJETS_ETUDE.map((objet) => {
              const count = textesParObjet[objet.key].length;
              return (
                <div key={objet.key} className="rounded-[24px] border border-[var(--border-light)] bg-[linear-gradient(180deg,var(--surface-warm-card-top)_0%,var(--surface-warm-card)_100%)] p-5 shadow-[var(--shadow-md)]">
                  <p className="text-sm font-semibold text-[var(--navy)]">{objet.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-[var(--navy)]">{count}</p>
                  <Badge variant={count >= 5 ? 'success' : 'warning'} size="sm" className="mt-3">
                    {count}/5
                  </Badge>
                </div>
              );
            })}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {OBJETS_ETUDE.map((objet) => {
              const items = textesParObjet[objet.key];
              const count = items.length;
              return (
                <section key={objet.key} className="rounded-[24px] border border-[var(--border-light)] bg-[linear-gradient(180deg,var(--surface-warm-card-top)_0%,var(--surface-warm-card)_100%)] p-5 shadow-[var(--shadow-md)]">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-[var(--navy)]">{objet.label}</h2>
                    <Badge variant={count >= 5 ? 'success' : 'warning'} size="sm">
                      {count}/5
                    </Badge>
                  </div>
                  {count === 0 ? (
                    <p className="mt-4 text-sm text-[var(--text-caption)]">Aucun texte ajouté.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {items.map((texte) => (
                        <article key={texte.id} className="rounded-[22px] border border-[var(--surface-sand)] bg-white p-4 shadow-[var(--shadow-sm)]">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[var(--navy)] truncate">{texte.oeuvre} — {texte.auteur}</p>
                              <p className="mt-1 text-sm font-medium text-[var(--navy-mid)] truncate">{texte.titre}</p>
                              <Badge variant={texte.typeExtrait === 'extrait_oeuvre' ? 'info' : 'default'} size="sm" className={`mt-3 ${texte.typeExtrait !== 'extrait_oeuvre' ? 'bg-[#f4ecfb] text-[var(--accent-violet)] border-[var(--accent-violet)]/20' : ''}`}>
                                {texte.typeExtrait === 'extrait_oeuvre' ? 'Œuvre' : 'Parcours'}
                              </Badge>
                              {texte.premieresLignes ? (
                                <p className="mt-3 text-xs leading-6 text-[var(--text-caption)]">{texte.premieresLignes}</p>
                              ) : null}
                            </div>
                            <Button onClick={() => removeTexte(texte.id)} variant="ghost" size="sm" className="p-2 text-[var(--error-muted)] hover:text-[var(--error-dark)] hover:bg-transparent" aria-label="Supprimer">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </section>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveDescriptif} disabled={saving || textes.length === 0} loading={saving} icon={!saving ? <CheckCircle2 className="h-4 w-4" /> : undefined} size="lg">
          Sauvegarder le descriptif
        </Button>
      </div>
    </div>
  );
}
