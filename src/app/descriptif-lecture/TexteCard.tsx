'use client';

import { useState } from 'react';
import { Upload, Trash2, FileText, NotebookPen } from 'lucide-react';
import { Button, Textarea } from '@/components/ui';

type TexteDescriptif = {
  id: string;
  oeuvreAuteur: string;
  titreExtrait: string;
  incipit?: string | null;
  contenuTexte?: string | null;
  fichierPath?: string | null;
  notesPersonnelles?: string | null;
  numeroPagesRef?: string | null;
};

type TexteCardProps = {
  texte: TexteDescriptif;
  onDelete: () => Promise<void>;
  onRefresh: () => Promise<void>;
};

export function TexteCard({ texte, onDelete, onRefresh }: TexteCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingText, setSavingText] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patchTexte(payload: Record<string, unknown>, kind: 'texte' | 'notes') {
    if (kind === 'texte') setSavingText(true);
    if (kind === 'notes') setSavingNotes(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/student/descriptif-lecture/${texte.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Erreur de sauvegarde.' }));
        throw new Error(String(data.error ?? 'Erreur de sauvegarde.'));
      }
      await onRefresh();
    } catch (patchError) {
      setError(patchError instanceof Error ? patchError.message : 'Erreur de sauvegarde.');
    } finally {
      if (kind === 'texte') setSavingText(false);
      if (kind === 'notes') setSavingNotes(false);
    }
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/v1/student/descriptif-lecture/${texte.id}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Upload impossible.' }));
        throw new Error(String(data.error ?? 'Upload impossible.'));
      }

      await onRefresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload impossible.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-sm)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-[var(--text-heading)]">
            {texte.titreExtrait}
          </p>
          <p className="text-sm text-[var(--text-muted)]">{texte.oeuvreAuteur}</p>
          {texte.numeroPagesRef ? (
            <p className="mt-1 text-xs text-[var(--text-muted)]">{texte.numeroPagesRef}</p>
          ) : null}
          {texte.incipit ? (
            <p className="mt-2 text-sm italic text-[var(--text-muted)]">
              « {texte.incipit} »
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {texte.fichierPath ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <FileText className="h-3.5 w-3.5" />
              Fichier lié
            </span>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => setExpanded((value) => !value)}>
            {expanded ? 'Réduire' : 'Ouvrir'}
          </Button>
          <Button variant="danger" size="sm" onClick={() => void onDelete()}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded ? (
        <div className="mt-4 space-y-4 border-t border-[var(--border-subtle)] pt-4">
          <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-heading)]">
                  Téléverser le texte étudié
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  PDF, JPEG, PNG ou WEBP. OCR automatique si disponible.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] bg-[var(--c-primary)] px-4 py-2 text-sm font-medium text-[var(--text-on-primary)]">
                <Upload className="h-4 w-4" />
                {uploading ? 'Envoi...' : 'Choisir un fichier'}
                <input
                  className="hidden"
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleUpload(file);
                    }
                    event.currentTarget.value = '';
                  }}
                />
              </label>
            </div>
          </div>

          <Textarea
            label="Texte de l'extrait"
            defaultValue={texte.contenuTexte ?? ''}
            rows={7}
            hint={savingText ? 'Sauvegarde...' : 'Colle le texte intégral si tu ne téléverses pas de document.'}
            onBlur={(event) => void patchTexte({ contenuTexte: event.target.value }, 'texte')}
          />

          <Textarea
            label="Mes notes personnelles"
            defaultValue={texte.notesPersonnelles ?? ''}
            rows={4}
            icon={<NotebookPen className="h-4 w-4" />}
            hint={savingNotes ? 'Sauvegarde...' : "Utilise cet espace pour l'entretien : ce que tu veux dire, ce que tu aimes, ce que tu veux retenir."}
            onBlur={(event) => void patchTexte({ notesPersonnelles: event.target.value }, 'notes')}
          />

          {error ? (
            <p className="text-sm text-[var(--error)]">{error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
