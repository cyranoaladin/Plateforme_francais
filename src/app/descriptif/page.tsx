'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';
import { StateNotice } from '@/components/ui/state-notice';
import { Badge, Button, Input, Select, Surface } from '@/components/ui';

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
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    if (!formTitre.trim()) {
      setSubmitError('Ajoute au minimum un titre de texte avant de l’insérer dans le descriptif.');
      return;
    }
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
    setSubmitError(null);
  }, [formObjet, formOeuvreIdx, formType, formTitre, formPremieres]);

  const removeTexte = useCallback((id: string) => {
    setTextes((prev) => prev.filter((texte) => texte.id !== id));
    setSuccessMsg('');
  }, []);

  const saveDescriptif = useCallback(async () => {
    setSaving(true);
    setSuccessMsg('');
    setSubmitError(null);
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
      setSubmitError('La sauvegarde n’a pas abouti. Réessaie dans quelques instants.');
    }
    setSaving(false);
  }, [textes]);

  const objetOptions = OBJETS_ETUDE.map((objet) => ({ value: objet.key, label: objet.label }));
  const oeuvreOptions = OEUVRES_PAR_OBJET[formObjet].map((oeuvre, index) => ({
    value: String(index),
    label: `${oeuvre.oeuvre} — ${oeuvre.auteur}`,
  }));
  const typeOptions = [
    { value: 'extrait_oeuvre', label: 'Extrait d’œuvre' },
    { value: 'extrait_parcours', label: 'Extrait du parcours' },
  ];

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
      <section className="hero-premium-panel relative overflow-hidden rounded-[24px] px-6 py-7 md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.22),_transparent_72%)] blur-2xl lg:block" />
        <div className="absolute left-[-5%] top-[-20%] h-44 w-44 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div>
            <div className="hero-kicker">
              <ClipboardList className="h-4 w-4" />
              Mon Descriptif de lecture
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-5 max-w-4xl text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
              Le descriptif doit devenir une carte de passage crédible pour l’oral, pas une simple liste remplie à la hâte.
            </h1>
            <p className="hero-body mt-4 max-w-3xl text-sm leading-7 md:text-base">
              Répartis les textes par objet d’étude, équilibre œuvres et parcours, puis sauvegarde un descriptif cohérent avec le programme officiel et
              réellement pilotable pour l’oral.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className={`rounded-[24px] border px-4 py-4 backdrop-blur-sm ${textes.length >= 20 ? 'border-[var(--border-success)] bg-[var(--bg-success)] text-[var(--c-success)]' : 'hero-glass-card text-white'}`}>
              <p className={`ui-stat-label ${textes.length >= 20 ? 'text-[var(--c-success)]' : 'text-[var(--hero-kicker-text)]'}`}>Textes</p>
              <p className="mt-2 text-3xl font-semibold">{textes.length}/20</p>
            </div>
            <div className="hero-glass-card rounded-[24px] px-4 py-4">
              <p className="ui-stat-label text-[var(--hero-kicker-text)]">Objets</p>
              <p className="mt-2 text-3xl font-semibold text-white">4</p>
            </div>
            <div className="hero-glass-card rounded-[24px] px-4 py-4">
              <p className="ui-stat-label text-[var(--hero-kicker-text)]">Statut</p>
              <p className="mt-2 text-2xl font-semibold text-white">{clientWarnings.length === 0 ? 'Stable' : 'À compléter'}</p>
            </div>
          </div>
        </div>
      </section>

      {clientWarnings.length > 0 ? (
        <StateNotice
          title="Règles non satisfaites"
          description={clientWarnings.join(' ')}
          variant="warning"
        />
      ) : null}

      {successMsg ? (
        <StateNotice title="Descriptif enregistré" description={successMsg} variant="success" />
      ) : null}

      {serverWarnings.length > 0 ? (
        <StateNotice
          title="Avertissements serveur"
          description={serverWarnings.join(' ')}
          variant="warning"
        />
      ) : null}

      {submitError ? (
        <StateNotice title="Action impossible" description={submitError} variant="error" />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <Surface tone="default" padding="md">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-primary)]/8 text-[var(--c-primary)]">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <p className="ui-kicker text-[var(--c-reward)]">Ajouter un texte</p>
                <h2 style={EDITORIAL_HEADING} className="mt-2 text-3xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
                  Enrichir le descriptif
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-3" aria-describedby="descriptif-form-help">
              <Select
                id="descriptif-objet"
                label="Objet d’étude"
                value={formObjet}
                onChange={(event) => {
                  setFormObjet(event.target.value as ObjetEtude);
                  setFormOeuvreIdx(0);
                }}
                options={objetOptions}
              />
              <Select
                id="descriptif-oeuvre"
                label="Œuvre"
                value={String(formOeuvreIdx)}
                onChange={(event) => setFormOeuvreIdx(Number(event.target.value))}
                options={oeuvreOptions}
              />
              <Select
                id="descriptif-type"
                label="Type d’extrait"
                value={formType}
                onChange={(event) => setFormType(event.target.value as TypeExtrait)}
                options={typeOptions}
              />
              <Input
                id="descriptif-titre"
                label="Titre du texte"
                value={formTitre}
                onChange={(event) => setFormTitre(event.target.value)}
                placeholder="Ex : Acte I, scène 1"
                error={submitError && !formTitre.trim() ? submitError : undefined}
                autoComplete="off"
              />
              <Input
                id="descriptif-premieres"
                label="Premières lignes"
                value={formPremieres}
                onChange={(event) => setFormPremieres(event.target.value)}
                placeholder="Optionnel"
                hint="Laisse vide si tu ne veux pas enregistrer d’amorce."
                autoComplete="off"
              />
              <p id="descriptif-form-help" className="ui-helper-text">
                Chaque entrée ajoute un texte à la structure officielle. Le titre est obligatoire.
              </p>
              <Button onClick={addTexte} disabled={!formTitre.trim()} icon={<Plus className="h-4 w-4" />} size="md" className="w-full">
                Ajouter ce texte
              </Button>
            </div>
          </Surface>

          <Surface tone="success" padding="md">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-[var(--c-success)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--c-primary)]">Règle d’équilibre</p>
                <p className="mt-2 text-sm leading-7 text-[var(--text-body)]">
                  Un bon descriptif répartit les textes par objet d’étude, couvre les attendus officiels et évite les trous. Le but n’est pas de
                  remplir une contrainte administrative, mais de rendre l’oral réellement défendable.
                </p>
              </div>
            </div>
          </Surface>
        </aside>

        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {OBJETS_ETUDE.map((objet) => {
              const count = textesParObjet[objet.key].length;
              return (
                <Surface key={objet.key} tone="default" padding="md">
                  <p className="text-sm font-semibold text-[var(--c-primary)]">{objet.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-[var(--c-primary)]">{count}</p>
                  <Badge variant={count >= 5 ? 'success' : 'warning'} size="sm" className="mt-3">
                    {count}/5
                  </Badge>
                </Surface>
              );
            })}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {OBJETS_ETUDE.map((objet) => {
              const items = textesParObjet[objet.key];
              const count = items.length;
              return (
                <Surface key={objet.key} tone="default" padding="md">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-[var(--c-primary)]">{objet.label}</h2>
                    <Badge variant={count >= 5 ? 'success' : 'warning'} size="sm">
                      {count}/5
                    </Badge>
                  </div>
                  {count === 0 ? (
                    <p className="mt-4 text-sm text-[var(--text-muted)]">Aucun texte ajouté.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {items.map((texte) => (
                        <article key={texte.id} className="rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-sm)]">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[var(--c-primary)] truncate">{texte.oeuvre} — {texte.auteur}</p>
                              <p className="mt-1 text-sm font-medium text-[var(--text-body)] truncate">{texte.titre}</p>
                              <Badge variant={texte.typeExtrait === 'extrait_oeuvre' ? 'info' : 'default'} size="sm" className={`mt-3 ${texte.typeExtrait !== 'extrait_oeuvre' ? 'bg-[var(--bg-primary)] text-[var(--c-primary)] border-[var(--c-primary)]/20' : ''}`}>
                                {texte.typeExtrait === 'extrait_oeuvre' ? 'Œuvre' : 'Parcours'}
                              </Badge>
                              {texte.premieresLignes ? (
                                <p className="mt-3 text-xs leading-6 text-[var(--text-muted)]">{texte.premieresLignes}</p>
                              ) : null}
                            </div>
                            <Button onClick={() => removeTexte(texte.id)} variant="ghost" size="sm" className="p-2 text-[var(--c-accent-text)] hover:text-[var(--c-accent-text)] hover:bg-transparent" aria-label="Supprimer">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </Surface>
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
