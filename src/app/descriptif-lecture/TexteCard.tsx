'use client';

import { useState } from 'react';
import { Upload, Trash2, FileText, NotebookPen, ChevronDown, ChevronUp } from '@/components/ui/icons';

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
  const [uploadFeedback, setUploadFeedback] = useState<{ ocrExtracted: boolean; charCount?: number } | null>(null);

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

      const data = await response.json().catch(() => ({}));
      if (data.ocrExtracted) {
        const charCount = data.texte?.contenuTexte?.length ?? 0;
        setUploadFeedback({ ocrExtracted: true, charCount });
      } else {
        setUploadFeedback({ ocrExtracted: false });
      }

      await onRefresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload impossible.');
    } finally {
      setUploading(false);
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
    resize: 'vertical' as const,
    minHeight: '120px',
  };

  return (
    <div 
      className="rounded-xl p-4 transition-all"
      style={{ 
        background: 'var(--eaf-bg2)', 
        border: '1px solid var(--eaf-border)'
      }}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <p 
            className="truncate text-base font-semibold"
            style={{ color: 'var(--eaf-text-primary)' }}
          >
            {texte.titreExtrait}
          </p>
          <p 
            className="text-sm mt-0.5"
            style={{ color: 'var(--eaf-text-secondary)' }}
          >
            {texte.oeuvreAuteur}
          </p>
          {texte.numeroPagesRef ? (
            <p 
              className="mt-1 text-xs"
              style={{ color: 'var(--eaf-text-tertiary)' }}
            >
              {texte.numeroPagesRef}
            </p>
          ) : null}
          {texte.incipit ? (
            <p 
              className="mt-2 text-sm italic"
              style={{ color: 'var(--eaf-text-tertiary)' }}
            >
              « {texte.incipit} »
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {texte.fichierPath ? (
            <span 
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ 
                background: 'var(--eaf-teal-dim)', 
                border: '1px solid var(--eaf-teal-border)',
                color: 'var(--eaf-teal)'
              }}
            >
              <FileText className="h-3.5 w-3.5" />
              Fichier lié
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-2 rounded-lg text-xs font-medium transition-colors"
            style={{ 
              background: 'var(--eaf-bg3)',
              color: 'var(--eaf-text-secondary)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--eaf-text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--eaf-text-secondary)'}
          >
            {expanded ? (
              <span className="flex items-center gap-1"><ChevronUp className="h-4 w-4" /> Réduire</span>
            ) : (
              <span className="flex items-center gap-1"><ChevronDown className="h-4 w-4" /> Ouvrir</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => void onDelete()}
            aria-label="Supprimer ce texte"
            className="p-2 rounded-lg transition-colors"
            style={{ 
              background: 'var(--eaf-bg3)',
              color: 'var(--eaf-text-tertiary)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--eaf-text-tertiary)'}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded ? (
        <div 
          className="mt-4 space-y-4 pt-4"
          style={{ borderTop: '1px solid var(--eaf-border)' }}
        >
          {/* Upload section */}
          <div 
            className="rounded-xl p-4"
            style={{ 
              background: 'var(--eaf-bg1)', 
              border: '1px dashed var(--eaf-border)'
            }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p 
                  className="text-sm font-semibold"
                  style={{ color: 'var(--eaf-text-primary)' }}
                >
                  Téléverser le texte étudié
                </p>
                <p 
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--eaf-text-tertiary)' }}
                >
                  PDF, JPEG, PNG ou WEBP. OCR automatique si disponible.
                </p>
              </div>
              <label 
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all"
                style={{ background: 'var(--eaf-indigo)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--eaf-indigo-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--eaf-indigo)';
                }}
              >
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
            {uploadFeedback ? (
              <p 
                className="mt-3 text-sm"
                style={{ 
                  color: uploadFeedback.ocrExtracted ? 'var(--eaf-teal)' : 'var(--eaf-orange)'
                }}
              >
                {uploadFeedback.ocrExtracted
                  ? `Texte extrait par OCR (${uploadFeedback.charCount ?? 0} caractères). Vérifie et corrige si besoin.`
                  : 'Fichier uploadé mais le texte n\'a pas pu être extrait. Colle-le manuellement ci-dessous.'}
              </p>
            ) : null}
          </div>

          {/* Texte textarea */}
          <div>
            <label 
              className="text-[13px] font-medium mb-2 block"
              style={{ color: 'var(--eaf-text-secondary)' }}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Texte de l&apos;extrait
              </span>
            </label>
            <textarea
              defaultValue={texte.contenuTexte ?? ''}
              rows={7}
              placeholder="Colle le texte intégral si tu ne téléverses pas de document."
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--eaf-indigo)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(123,142,255,0.15)';
              }}
              onBlur={(e) => {
                void patchTexte({ contenuTexte: e.target.value }, 'texte');
                e.currentTarget.style.borderColor = 'var(--eaf-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {savingText ? (
              <p className="mt-1 text-xs" style={{ color: 'var(--eaf-text-tertiary)' }}>Sauvegarde...</p>
            ) : (
              <p className="mt-1 text-xs" style={{ color: 'var(--eaf-text-tertiary)' }}>
                Colle le texte intégral si tu ne téléverses pas de document.
              </p>
            )}
          </div>

          {/* Notes textarea */}
          <div>
            <label 
              className="text-[13px] font-medium mb-2 block"
              style={{ color: 'var(--eaf-text-secondary)' }}
            >
              <span className="flex items-center gap-2">
                <NotebookPen className="h-4 w-4" />
                Mes notes personnelles
              </span>
            </label>
            <textarea
              defaultValue={texte.notesPersonnelles ?? ''}
              rows={4}
              placeholder="Utilise cet espace pour l'entretien : ce que tu veux dire, ce que tu aimes, ce que tu veux retenir."
              style={{ ...inputStyle, minHeight: '80px' }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--eaf-indigo)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(123,142,255,0.15)';
              }}
              onBlur={(e) => {
                void patchTexte({ notesPersonnelles: e.target.value }, 'notes');
                e.currentTarget.style.borderColor = 'var(--eaf-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {savingNotes ? (
              <p className="mt-1 text-xs" style={{ color: 'var(--eaf-text-tertiary)' }}>Sauvegarde...</p>
            ) : (
              <p className="mt-1 text-xs" style={{ color: 'var(--eaf-text-tertiary)' }}>
                Utilise cet espace pour l&apos;entretien : ce que tu veux dire, ce que tu aimes, ce que tu veux retenir.
              </p>
            )}
          </div>

          {error ? (
            <p className="text-sm" style={{ color: 'var(--eaf-orange)' }}>{error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
