'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookOpen, FileWarning, Plus } from 'lucide-react';
import { AddTexteForm } from './AddTexteForm';
import { TexteCard } from './TexteCard';
import { Badge, Button } from '@/components/ui';
import { DESCRIPTIF_REGLEMENTAIRE, OBJETS_ETUDE, type ObjetEtudeId } from '@/data/programme-eaf-2025';

type TexteDescriptif = {
  id: string;
  objetEtude: ObjetEtudeId;
  typeTexte: 'EXTRAIT_OEUVRE' | 'EXTRAIT_PARCOURS' | 'LECTURE_CURSIVE' | 'OEUVRE_CHOISIE_ENTRETIEN';
  oeuvreAuteur: string;
  titreExtrait: string;
  incipit?: string | null;
  numeroPagesRef?: string | null;
  contenuTexte?: string | null;
  fichierPath?: string | null;
  position: number;
  notesPersonnelles?: string | null;
};

type ConformiteObjet = {
  objetEtude: ObjetEtudeId;
  conforme: boolean;
  manquant: string[];
};

type ApiResponse = {
  textes: TexteDescriptif[];
  total: number;
  conformite: ConformiteObjet[];
  estCompletReglementairement: boolean;
};

const TYPE_SECTIONS: Array<{
  type: TexteDescriptif['typeTexte'];
  label: string;
  requis: string;
}> = [
  { type: 'EXTRAIT_OEUVRE', label: "Extraits de l'œuvre", requis: '2 minimum' },
  { type: 'EXTRAIT_PARCOURS', label: 'Textes du parcours associé', requis: '1 minimum' },
  { type: 'LECTURE_CURSIVE', label: 'Lectures cursives', requis: '1 minimum' },
  { type: 'OEUVRE_CHOISIE_ENTRETIEN', label: "Œuvre choisie pour l'entretien", requis: 'Optionnel' },
];

export default function DescriptifLecturePage() {
  const searchParams = useSearchParams();
  const isFromOnboarding = searchParams.get('onboarding') === 'true';
  const [textes, setTextes] = useState<TexteDescriptif[]>([]);
  const [conformite, setConformite] = useState<ConformiteObjet[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedObjet, setSelectedObjet] = useState<ObjetEtudeId>('POESIE');
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchDescriptif() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/student/descriptif-lecture');
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Chargement impossible.' }));
        throw new Error(String(data.error ?? 'Chargement impossible.'));
      }
      const data = (await response.json()) as ApiResponse;
      setTextes(data.textes);
      setConformite(data.conformite);
      setTotal(data.total);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchDescriptif();
  }, []);

  const totalMissing = Math.max(0, DESCRIPTIF_REGLEMENTAIRE.totalTextesMinimum - total);
  const selectedConformite = useMemo(
    () => conformite.find((item) => item.objetEtude === selectedObjet) ?? null,
    [conformite, selectedObjet],
  );

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Supprimer ce texte du descriptif ?');
    if (!confirmed) return;

    setError(null);
    setMessage(null);

    const response = await fetch(`/api/v1/student/descriptif-lecture/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Suppression impossible.' }));
      setError(String(data.error ?? 'Suppression impossible.'));
      return;
    }

    setMessage('Texte supprimé.');
    await fetchDescriptif();
  }

  const textesObjet = textes.filter((texte) => texte.objetEtude === selectedObjet);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-md)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--bg-surface-secondary)] px-3 py-1 text-xs font-medium text-[var(--text-muted)]">
              <BookOpen className="h-4 w-4" />
              Oral EAF conforme au descriptif réel
            </div>
            <h1 className="text-3xl font-semibold text-[var(--text-heading)]">Mon descriptif de lecture</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">
              Tu saisis ici les textes réellement étudiés en classe. L’atelier oral doit tirer
              dans cette liste, comme l’examinateur le jour de l’épreuve.
            </p>
          </div>

          <div className="min-w-[280px] rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-4">
            <p className="text-sm font-medium text-[var(--text-heading)]">Conformité réglementaire</p>
            <div className="mt-3 flex items-end gap-3">
              <span className="text-4xl font-semibold text-[var(--c-primary)]">{total}</span>
              <div className="pb-1">
                <p className="text-sm text-[var(--text-body)]">textes enregistrés</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Minimum réglementaire : {DESCRIPTIF_REGLEMENTAIRE.totalTextesMinimum}
                </p>
              </div>
            </div>
            <div className="mt-4">
              {totalMissing === 0 ? (
                <Badge variant="success">Seuil réglementaire atteint</Badge>
              ) : (
                <Badge variant="warning">{totalMissing} texte(s) encore attendus</Badge>
              )}
            </div>
          </div>
        </div>

        {message ? (
          <p className="mt-4 text-sm text-emerald-700">{message}</p>
        ) : null}
        {error ? (
          <p className="mt-4 text-sm text-[var(--error)]">{error}</p>
        ) : null}
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {OBJETS_ETUDE.map((objet) => {
          const state = conformite.find((item) => item.objetEtude === objet.id);
          const active = selectedObjet === objet.id;
          return (
            <button
              key={objet.id}
              type="button"
              onClick={() => setSelectedObjet(objet.id)}
              className={[
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors',
                active
                  ? 'border-[var(--c-primary)] bg-[var(--c-primary)] text-[var(--text-on-primary)]'
                  : 'border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-body)]',
              ].join(' ')}
            >
              <span>{objet.icone}</span>
              <span>{objet.label}</span>
              <span>{state?.conforme ? '✓' : '⚠'}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-sm)]">
            {isFromOnboarding && (
              <div className="mb-4 rounded-2xl border border-[var(--c-primary)]/20 bg-[var(--c-primary)]/5 p-4">
                <h3 className="font-semibold text-[var(--c-primary)] mb-2">
                  🎉 Bienvenue ! Complète ton descriptif de lecture
                </h3>
                <p className="text-sm text-[var(--text-body)]">
                  Pour que l'atelier oral simule les vraies conditions de l'épreuve, saisis ici les textes étudiés en classe avec ton enseignant.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-heading)]">
                  {OBJETS_ETUDE.find((objet) => objet.id === selectedObjet)?.label}
                </h2>
                <p className={`mt-2 text-sm ${selectedConformite?.conforme ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {selectedConformite?.conforme
                    ? 'Objet d\u2019étude conforme au programme.'
                    : `Il manque : ${selectedConformite?.manquant?.join(', ') ?? 'compléter cet objet d\u2019étude'}.`}
                </p>
              </div>
              <Button onClick={() => setShowAddForm((value) => !value)} icon={<Plus className="h-4 w-4" />}>
                {showAddForm ? 'Masquer le formulaire' : 'Ajouter un texte'}
              </Button>
            </div>

            {showAddForm ? (
              <div className="mt-5">
                <AddTexteForm
                  selectedObjet={selectedObjet}
                  onSaved={async () => {
                    setMessage('Texte ajouté au descriptif.');
                    setShowAddForm(false);
                    await fetchDescriptif();
                  }}
                  onCancel={() => setShowAddForm(false)}
                />
              </div>
            ) : null}
          </div>

          {TYPE_SECTIONS.map((section) => {
            const items = textesObjet.filter((texte) => texte.typeTexte === section.type);
            return (
              <section
                key={section.type}
                className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-sm)]"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-heading)]">{section.label}</h3>
                    <p className="text-sm text-[var(--text-muted)]">{section.requis}</p>
                  </div>
                  <Badge variant={items.length > 0 ? 'info' : 'default'}>
                    {items.length} texte(s)
                  </Badge>
                </div>

                {items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-5 text-sm text-[var(--text-muted)]">
                    Aucun texte pour cette catégorie.{' '}
                    <button type="button" onClick={() => setShowAddForm(true)} className="font-medium text-[var(--c-primary)] underline underline-offset-2">
                      Ajouter un {section.label.toLowerCase().replace(/s$/, '')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((texte) => (
                      <TexteCard
                        key={texte.id}
                        texte={texte}
                        onDelete={async () => handleDelete(texte.id)}
                        onRefresh={fetchDescriptif}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-sm)]">
            <p className="text-sm font-semibold text-[var(--text-heading)]">Œuvres du programme 2025</p>
            <div className="mt-4 space-y-2">
              {(OBJETS_ETUDE.find((objet) => objet.id === selectedObjet)?.oeuvres ?? []).map((oeuvre) => (
                <div
                  key={`${oeuvre.titre}-${oeuvre.auteur}`}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-3"
                >
                  <p className="text-sm font-medium text-[var(--text-heading)]">{oeuvre.titre}</p>
                  <p className="text-xs text-[var(--text-muted)]">{oeuvre.auteur}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-[var(--shadow-sm)]">
            <div className="flex items-start gap-3">
              <FileWarning className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Rappel réglementaire</p>
                <p className="mt-2 text-sm leading-6 text-amber-800">
                  L’examinateur interroge à partir du descriptif transmis à l’avance. Si ton descriptif
                  est vide ou incomplet, la simulation sera moins fidèle à l’épreuve réelle.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {loading ? (
        <div className="mt-8 text-sm text-[var(--text-muted)]">Chargement du descriptif…</div>
      ) : null}
    </div>
  );
}
