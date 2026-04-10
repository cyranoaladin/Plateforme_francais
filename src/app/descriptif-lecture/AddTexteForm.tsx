'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { OBJETS_ETUDE, type ObjetEtudeId, type TypeTexteId } from '@/data/programme-eaf-2025';

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

const TYPE_OPTIONS = [
  { value: 'EXTRAIT_OEUVRE', label: 'Extrait d\'œuvre' },
  { value: 'EXTRAIT_PARCOURS', label: 'Texte du parcours' },
  { value: 'LECTURE_CURSIVE', label: 'Lecture cursive' },
  { value: 'OEUVRE_CHOISIE_ENTRETIEN', label: 'Œuvre entretien' },
];

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

  const inputStyle = {
    background: 'var(--eaf-bg2)',
    border: '1px solid var(--eaf-border)',
    color: 'var(--eaf-text-primary)',
    fontFamily: 'var(--eaf-font-body)',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const labelStyle = {
    color: 'var(--eaf-text-secondary)',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '6px',
    display: 'block',
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-5"
      style={{ 
        background: 'var(--eaf-bg1)',
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 
            className="text-lg font-bold mb-1"
            style={{ 
              fontFamily: 'var(--eaf-font-display)',
              color: 'var(--eaf-text-primary)'
            }}
          >
            Ajouter un texte
          </h3>
          <p 
            className="text-sm"
            style={{ color: 'var(--eaf-text-secondary)' }}
          >
            Un texte bien renseigné rend l&apos;oral fidèle à tes vraies conditions d&apos;examen.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--eaf-text-tertiary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--eaf-text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--eaf-text-tertiary)'}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label style={labelStyle}>Objet d&apos;étude</label>
          <select
            value={form.objetEtude}
            onChange={(e) => setForm((c) => ({ ...c, objetEtude: e.target.value as ObjetEtudeId }))}
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--eaf-indigo)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(123,142,255,0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--eaf-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {OBJETS_ETUDE.map((objet) => (
              <option key={objet.id} value={objet.id}>{objet.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Type de texte</label>
          <select
            value={form.typeTexte}
            onChange={(e) => setForm((c) => ({ ...c, typeTexte: e.target.value as TypeTexteId }))}
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--eaf-indigo)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(123,142,255,0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--eaf-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label style={labelStyle}>Œuvre — Auteur</label>
          <input
            type="text"
            value={form.oeuvreAuteur}
            onChange={(e) => setForm((c) => ({ ...c, oeuvreAuteur: e.target.value }))}
            placeholder="La Peau de chagrin — Honoré de Balzac"
            required
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--eaf-indigo)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(123,142,255,0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--eaf-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
        <div>
          <label style={labelStyle}>Titre de l&apos;extrait</label>
          <input
            type="text"
            value={form.titreExtrait}
            onChange={(e) => setForm((c) => ({ ...c, titreExtrait: e.target.value }))}
            placeholder="Le talisman"
            required
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--eaf-indigo)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(123,142,255,0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--eaf-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label style={labelStyle}>Incipit</label>
          <input
            type="text"
            value={form.incipit}
            onChange={(e) => setForm((c) => ({ ...c, incipit: e.target.value }))}
            placeholder="Premiers mots du texte"
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--eaf-indigo)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(123,142,255,0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--eaf-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
        <div>
          <label style={labelStyle}>Pages / référence</label>
          <input
            type="text"
            value={form.numeroPagesRef}
            onChange={(e) => setForm((c) => ({ ...c, numeroPagesRef: e.target.value }))}
            placeholder="p. 12-15"
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--eaf-indigo)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(123,142,255,0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--eaf-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      <div 
        className="mt-4 rounded-xl p-4"
        style={{ 
          background: 'var(--eaf-bg2)', 
          border: '1px solid var(--eaf-border)'
        }}
      >
        <p 
          className="text-sm font-semibold mb-2"
          style={{ color: 'var(--eaf-text-primary)' }}
        >
          Repères programme 2025
        </p>
        <p 
          className="text-xs mb-3"
          style={{ color: 'var(--eaf-text-tertiary)' }}
        >
          Parcours possibles : {selectedObjetData.parcours.join(' · ')}
        </p>
        <div className="flex flex-wrap gap-2">
          {selectedObjetData.oeuvres.map((oeuvre) => (
            <button
              key={`${oeuvre.titre}-${oeuvre.auteur}`}
              type="button"
              className="rounded-full px-3 py-1 text-xs transition-all"
              style={{ 
                background: 'var(--eaf-bg1)', 
                border: '1px solid var(--eaf-border)',
                color: 'var(--eaf-text-secondary)'
              }}
              onClick={() => setForm((c) => ({ ...c, oeuvreAuteur: `${oeuvre.titre} — ${oeuvre.auteur}` }))}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--eaf-indigo-border)';
                e.currentTarget.style.color = 'var(--eaf-indigo)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--eaf-border)';
                e.currentTarget.style.color = 'var(--eaf-text-secondary)';
              }}
            >
              {oeuvre.titre} — {oeuvre.auteur}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label style={labelStyle}>Parcours associé</label>
        <input
          type="text"
          value={form.parcourAssocie}
          onChange={(e) => setForm((c) => ({ ...c, parcourAssocie: e.target.value }))}
          placeholder="Émancipations créatrices"
          style={inputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--eaf-indigo)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(123,142,255,0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--eaf-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label style={labelStyle}>Texte intégral ou extrait</label>
          <textarea
            value={form.contenuTexte}
            rows={6}
            onChange={(e) => setForm((c) => ({ ...c, contenuTexte: e.target.value }))}
            placeholder="Colle le texte si tu veux éviter l'étape d'upload."
            style={{
              ...inputStyle,
              resize: 'vertical',
              minHeight: '120px',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--eaf-indigo)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(123,142,255,0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--eaf-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
        <div>
          <label style={labelStyle}>Notes personnelles</label>
          <textarea
            value={form.notesPersonnelles}
            rows={4}
            onChange={(e) => setForm((c) => ({ ...c, notesPersonnelles: e.target.value }))}
            placeholder="Ce que tu veux retenir, dire à l'entretien, ou revoir."
            style={{
              ...inputStyle,
              resize: 'vertical',
              minHeight: '80px',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--eaf-indigo)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(123,142,255,0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--eaf-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {error ? (
        <p 
          className="mt-4 text-sm"
          style={{ color: 'var(--eaf-orange)' }}
        >
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--eaf-border)' }}>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg text-[14px] font-medium transition-all"
          style={{ 
            background: 'transparent',
            border: '1px solid var(--eaf-border)',
            color: 'var(--eaf-text-secondary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--eaf-indigo-border)';
            e.currentTarget.style.color = 'var(--eaf-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--eaf-border)';
            e.currentTarget.style.color = 'var(--eaf-text-secondary)';
          }}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-lg text-[14px] font-semibold text-white transition-all disabled:opacity-60"
          style={{ background: 'var(--eaf-orange)' }}
          onMouseEnter={(e) => {
            if (!saving) {
              e.currentTarget.style.background = 'var(--eaf-orange-hover)';
              e.currentTarget.style.boxShadow = '0 6px 25px var(--eaf-orange-glow)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--eaf-orange)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {saving ? 'Enregistrement...' : 'Ajouter au descriptif'}
        </button>
      </div>
    </form>
  );
}
