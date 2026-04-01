import Link from 'next/link';
import { Camera, ChevronRight, FileText, Loader2, Upload, UploadCloud } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { type CopieLink, type EpreuvePayload } from '../types';

type Props = {
  epreuve: EpreuvePayload | null;
  selectedFile: File | null;
  previewUrl: string | null;
  uploadProgress: number;
  isUploading: boolean;
  pollingStatus: string | null;
  processingLabel: string;
  copieLink: CopieLink | null;
  tutorHref: string;
  maxUploadBytes?: number;
  onSelectFile: (file: File | null) => void;
  onTriggerFileDialog: () => void;
  onTriggerCameraDialog: () => void;
  onUpload: () => Promise<void>;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  mobileInputRef?: React.RefObject<HTMLInputElement | null>;
};

export function EcritCopyUploader({
  epreuve,
  selectedFile,
  previewUrl,
  uploadProgress,
  isUploading,
  pollingStatus,
  processingLabel,
  copieLink,
  tutorHref,
  maxUploadBytes = 15 * 1024 * 1024,
  onSelectFile,
  onTriggerFileDialog,
  onTriggerCameraDialog,
  onUpload,
  fileInputRef,
  mobileInputRef,
}: Props) {
  const isProcessing = Boolean(pollingStatus && pollingStatus !== 'done' && !copieLink);

  return (
    <section className="rounded-[24px] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface)_100%)] p-6 shadow-[var(--shadow-md)] md:p-7">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-success)]/8 text-[var(--c-success)]">
          <Upload className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-success)]">Étape 2</p>
          <h2 className="font-display mt-2 text-3xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
            Déposer ma copie
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
            Une photo nette ou un PDF propre suffit. Le studio suit l&apos;upload, puis bascule vers l&apos;analyse sans changer de contexte.
          </p>
        </div>
      </div>

      {isProcessing ? (
        <div className="mt-6 rounded-[24px] border border-[var(--border-success)] bg-[var(--bg-success)] px-6 py-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--c-success)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--c-primary)]">Ta copie est entre de bonnes mains</h3>
          <p className="mt-2 text-sm font-medium text-[var(--text-success-on-subtle)]">{processingLabel}</p>
          <p className="mt-3 text-xs text-[var(--text-muted)]">Cela prend généralement entre 30 secondes et 2 minutes.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files?.[0];
              if (file) onSelectFile(file);
            }}
            className={`rounded-[24px] border-2 border-dashed p-8 text-center transition ${epreuve ? 'cursor-pointer border-[var(--border-success)] bg-[var(--bg-success)]/45 hover:border-[var(--c-success)]/35 hover:bg-[var(--bg-success)]' : 'pointer-events-none border-[var(--border-default)] bg-[var(--bg-surface)] opacity-60'}`}
            onClick={() => epreuve && onTriggerFileDialog()}
          >
            <UploadCloud className="mx-auto h-12 w-12 text-[var(--text-icon)]" />
            <h3 className="mt-4 text-lg font-semibold text-[var(--c-primary)]">Dépose ta copie ici</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              PDF, JPG, PNG ou WEBP (Max {Math.round(maxUploadBytes / (1024 * 1024))}MB)
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onTriggerFileDialog();
                }}
                disabled={!epreuve}
                className="min-h-[44px] rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-medium text-[var(--c-primary)] transition hover:border-[var(--c-primary)]/18 disabled:opacity-50"
              >
                Choisir un fichier
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onTriggerCameraDialog();
                }}
                disabled={!epreuve}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-medium text-[var(--c-primary)] transition hover:border-[var(--c-primary)]/18 disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
                Photo
              </button>
            </div>
            <input
              aria-label="Sélectionner un fichier de copie"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(event) => onSelectFile(event.target.files?.[0] ?? null)}
            />
            <input
              aria-label="Prendre une photo de copie"
              ref={mobileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => onSelectFile(event.target.files?.[0] ?? null)}
            />
          </div>

          {selectedFile ? (
            <div className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-sm)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--c-primary)]">{selectedFile.name}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                <Badge variant="navy" size="sm" className="uppercase tracking-[0.14em]">
                  {selectedFile.type === 'application/pdf' ? 'PDF' : 'Image'}
                </Badge>
              </div>
              {selectedFile.type.startsWith('image/') && previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Aperçu copie"
                  className="mt-4 max-h-72 rounded-[16px] border border-[var(--border-default)] object-contain"
                />
              ) : null}
              {selectedFile.type === 'application/pdf' ? (
                <div className="mt-4 inline-flex items-center gap-2 rounded-[16px] bg-[var(--bg-success)] px-4 py-3 text-sm text-[var(--c-success)]">
                  <FileText className="h-4 w-4" />
                  PDF prêt à l&apos;envoi
                </div>
              ) : null}
            </div>
          ) : null}

          {isUploading ? (
            <div className="rounded-[24px] border border-[var(--border-success)] bg-[var(--bg-success)] p-5">
              <p className="text-sm text-[var(--text-success-on-subtle)]">Envoi en cours… {uploadProgress}%</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-surface)]/80">
                <div className="h-2 rounded-full bg-[var(--c-success)] transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          ) : null}

          <Button
            disabled={!epreuve || !selectedFile}
            loading={isUploading}
            onClick={() => void onUpload()}
            icon={<Upload className="h-4 w-4" />}
            size="lg"
            className="rounded-[16px] bg-[var(--c-success)] font-semibold hover:bg-[var(--c-success)]"
          >
            Lancer la correction détaillée
          </Button>
        </div>
      )}

      {copieLink ? (
        <div className="mt-6 rounded-[24px] border border-[var(--border-success)] bg-[var(--bg-success)] px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-surface)] text-[var(--c-success)] shadow-[var(--shadow-md)]">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--c-primary)]">Ton rapport de correction est prêt</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[var(--text-success-on-subtle)]">
            Ouvre-le maintenant, pendant que les points de travail sont encore frais dans ta mémoire.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <Link
              href={`/atelier-ecrit/correction/${copieLink.copieId}?epreuveId=${copieLink.epreuveId}`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--c-success)] px-6 py-3 text-sm font-bold text-[var(--text-on-primary)] transition hover:bg-[var(--color-emerald-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-success)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-success)]"
            >
              Voir mon rapport
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href={tutorHref}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--c-primary)] transition hover:border-[var(--c-success)] hover:text-[var(--c-success)]"
            >
              Préparer le retravail avec le guidage
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
