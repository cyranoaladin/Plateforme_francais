'use client';

import { useMemo, useState } from 'react';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { OBJETS_ETUDE, TYPE_TEXTE_OPTIONS, type ObjetEtudeId, type TypeTexteId } from '@/data/programme-eaf-2025';

type AddTexteFormProps = {
  selectedObjet: ObjetEtudeId;
  onSaved: () => Promise<void>;
  onCancel: () => void;
};

type FormState = {
  objetEtude: ObjetEtudeId;
  typeTexte: TypeTexteId;
  oeuvreAuteur: string;
  titreExtrait: string;
  incipit: string;
  numeroPagesRef: string;
  contenuTexte: string;
  parcourAssocie: string;
  notesPersonnelles: string;
};

const DEFAULT_TYPE: TypeTexteId = 'EXTRAIT_OEUVRE';

export function AddTexteForm({ selectedObjet, onSaved, onCancel }: AddTexteFormProps) {
  const [form, setForm] = useState<FormState>({
    objetEtude: selectedObjet,
    typeTexte: DEFAULT_TYPE,
    oeuvreAuteur: '',
    titreExtrait: '',
    incipit: '',
    numeroPagesRef: '',
    contenuTexte: '',
    parcourAssocie: '',
    notesPersonnelles: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedObjetData = useMemo(
    () => OBJETS_ETUDE.find((objet) => objet.id === form.objetEtude) ?? OBJETS_ETUDE[0],
    [form.objetEtude],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/student/descriptif-lecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          incipit: form.incipit || undefined,
          numeroPagesRef: form.numeroPagesRef || undefined,
          contenuTexte: form.contenuTexte || undefined,
          parcourAssocie: form.parcourAssocie || undefined,
          notesPersonnelles: form.notesPersonnelles || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Impossible d'ajouter ce texte." }));
        throw new Error(String(data.error ?? "Impossible d'ajouter ce texte."));
      }

      await onSaved();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erreur inattendue.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-md)]"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-heading)]">Ajouter un texte</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Un texte bien renseigné rend l’oral fidèle à tes vraies conditions d’examen.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Fermer
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="Objet d'étude"
          value={form.objetEtude}
          onChange={(event) => setForm((current) => ({ ...current, objetEtude: event.target.value as ObjetEtudeId }))}
          options={OBJETS_ETUDE.map((objet) => ({ value: objet.id, label: objet.label }))}
        />
        <Select
          label="Type de texte"
          value={form.typeTexte}
          onChange={(event) => setForm((current) => ({ ...current, typeTexte: event.target.value as TypeTexteId }))}
          options={TYPE_TEXTE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Input
          label="Œuvre — Auteur"
          value={form.oeuvreAuteur}
          onChange={(event) => setForm((current) => ({ ...current, oeuvreAuteur: event.target.value }))}
          placeholder="La Peau de chagrin — Honoré de Balzac"
          required
        />
        <Input
          label="Titre de l'extrait"
          value={form.titreExtrait}
          onChange={(event) => setForm((current) => ({ ...current, titreExtrait: event.target.value }))}
          placeholder="Le talisman"
          required
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Input
          label="Incipit"
          value={form.incipit}
          onChange={(event) => setForm((current) => ({ ...current, incipit: event.target.value }))}
          placeholder="Premiers mots du texte"
        />
        <Input
          label="Pages / référence"
          value={form.numeroPagesRef}
          onChange={(event) => setForm((current) => ({ ...current, numeroPagesRef: event.target.value }))}
          placeholder="p. 12-15"
        />
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4">
        <p className="text-sm font-medium text-[var(--text-heading)]">Repères programme 2025</p>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Parcours possibles : {selectedObjetData.parcours.join(' · ')}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedObjetData.oeuvres.map((oeuvre) => (
            <button
              key={`${oeuvre.titre}-${oeuvre.auteur}`}
              type="button"
              className="rounded-full border border-[var(--border-strong)] px-3 py-1 text-xs text-[var(--text-body)]"
              onClick={() => setForm((current) => ({ ...current, oeuvreAuteur: `${oeuvre.titre} — ${oeuvre.auteur}` }))}
            >
              {oeuvre.titre} — {oeuvre.auteur}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Input
          label="Parcours associé"
          value={form.parcourAssocie}
          onChange={(event) => setForm((current) => ({ ...current, parcourAssocie: event.target.value }))}
          placeholder="Émancipations créatrices"
        />
      </div>

      <div className="mt-4 grid gap-4">
        <Textarea
          label="Texte intégral ou extrait"
          value={form.contenuTexte}
          rows={6}
          onChange={(event) => setForm((current) => ({ ...current, contenuTexte: event.target.value }))}
          placeholder="Colle le texte si tu veux éviter l'étape d'upload."
        />
        <Textarea
          label="Notes personnelles"
          value={form.notesPersonnelles}
          rows={4}
          onChange={(event) => setForm((current) => ({ ...current, notesPersonnelles: event.target.value }))}
          placeholder="Ce que tu veux retenir, dire à l'entretien, ou revoir."
        />
      </div>

      {error ? (
        <p className="mt-4 text-sm text-[var(--error)]">{error}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={saving}>
          Ajouter au descriptif
        </Button>
      </div>
    </form>
  );
}
