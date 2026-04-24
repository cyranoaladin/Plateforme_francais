import Link from 'next/link';
import { Camera, ChevronRight, FileText, Loader2, Upload, UploadCloud } from '@/components/ui/icons';
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
    <section
      className="rounded-xl p-6 md:p-7"
      style={{
        background: 'var(--eaf-bg1)',
        border: '1px solid rgba(123, 142, 255, 0.12)',
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'var(--eaf-gold)/10', color: 'var(--eaf-gold)' }}
        >
          <Upload className="h-5 w-5" style={{ color: 'var(--eaf-gold)' }} />
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-gold)]">Étape 2</p>
          <h2
            className="mt-2 text-3xl leading-tight text-[var(--eaf-fg0)]"
            style={{ fontFamily: 'var(--font-heading, Fraunces, serif)', letterSpacing: '-1px' }}
          >
            Déposer ma copie
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--eaf-fg2)]">
            Une photo nette ou un PDF propre suffit. Le studio suit l'upload, puis bascule vers l'analyse sans changer de contexte.
          </p>
        </div>
      </div>

      {isProcessing ? (
        <div
          className="mt-6 rounded-xl border px-6 py-10 text-center"
          style={{
            background: 'var(--eaf-gold)/5',
            borderColor: 'var(--eaf-gold)/20',
          }}
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full shadow-md"
            style={{ background: 'var(--eaf-bg1)' }}
          >
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--eaf-gold)' }} />
          </div>
          <h3 className="text-lg font-semibold text-[var(--eaf-fg0)]">Ta copie est entre de bonnes mains</h3>
          <p className="mt-2 text-sm font-medium" style={{ color: 'var(--eaf-gold)' }}>{processingLabel}</p>
          <p className="mt-3 text-xs text-[var(--eaf-fg3)]">Cela prend généralement entre 30 secondes et 2 minutes.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {/* Dropzone */}
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files?.[0];
              if (file) onSelectFile(file);
            }}
            className={`rounded-xl border-2 border-dashed p-8 text-center transition ${
              epreuve
                ? 'cursor-pointer hover:border-[var(--eaf-indigo)]/40 hover:bg-[var(--eaf-indigo)]/5'
                : 'pointer-events-none opacity-60'
            }`}
            style={{
              borderColor: epreuve ? 'rgba(123, 142, 255, 0.3)' : 'rgba(123, 142, 255, 0.1)',
              background: epreuve ? 'var(--eaf-bg2)' : 'var(--eaf-bg1)',
            }}
            onClick={() => epreuve && onTriggerFileDialog()}
          >
            <UploadCloud className="mx-auto h-12 w-12" style={{ color: 'var(--eaf-fg3)' }} />
            <h3 className="mt-4 text-lg font-semibold text-[var(--eaf-fg0)]">Dépose ta copie ici</h3>
            <p className="mt-2 text-sm text-[var(--eaf-fg3)]">
              PDF, JPG, PNG ou WEBP (Max {Math.round(maxUploadBytes / (1024 * 1024))}MB)
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onTriggerFileDialog();
                }}
                disabled={!epreuve}
                className="min-h-[44px] rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:border-[var(--eaf-indigo)]/30 disabled:opacity-50"
                style={{
                  borderColor: 'rgba(123, 142, 255, 0.2)',
                  background: 'var(--eaf-bg1)',
                  color: 'var(--eaf-fg0)',
                }}
              >
                Choisir un fichier
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onTriggerCameraDialog();
                }}
                disabled={!epreuve}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:border-[var(--eaf-indigo)]/30 disabled:opacity-50"
                style={{
                  borderColor: 'rgba(123, 142, 255, 0.2)',
                  background: 'var(--eaf-bg1)',
                  color: 'var(--eaf-fg0)',
                }}
              >
                <Camera className="h-4 w-4" />
                Photo
              </button>
            </div>
            <input
              aria-label="Sélectionner un fichier de copie"
              data-testid="copy-upload-input"
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
            <div
              className="rounded-xl border p-5"
              style={{
                borderColor: 'rgba(123, 142, 255, 0.12)',
                background: 'var(--eaf-bg2)',
              }}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--eaf-fg0)]">{selectedFile.name}</p>
                  <p className="mt-1 text-xs text-[var(--eaf-fg3)]">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                <Badge
                  size="sm"
                  className="uppercase tracking-[0.14em] border-0"
                  style={{
                    background: 'var(--eaf-indigo)',
                    color: '#050913',
                  }}
                >
                  {selectedFile.type === 'application/pdf' ? 'PDF' : 'Image'}
                </Badge>
              </div>
              {selectedFile.type.startsWith('image/') && previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Aperçu copie"
                  className="mt-4 max-h-72 rounded-lg border object-contain"
                  style={{ borderColor: 'rgba(123, 142, 255, 0.1)' }}
                />
              ) : null}
              {selectedFile.type === 'application/pdf' ? (
                <div
                  className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
                  style={{
                    background: 'var(--eaf-teal)/10',
                    color: 'var(--eaf-teal)',
                  }}
                >
                  <FileText className="h-4 w-4" />
                  PDF prêt à l'envoi
                </div>
              ) : null}
            </div>
          ) : null}

          {isUploading ? (
            <div
              className="rounded-xl border p-5"
              style={{
                background: 'var(--eaf-gold)/5',
                borderColor: 'var(--eaf-gold)/20',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--eaf-gold)' }}>Envoi en cours… {uploadProgress}%</p>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full"
                style={{ background: 'var(--eaf-bg1)' }}
              >
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%`, background: 'var(--eaf-gold)' }}
                />
              </div>
            </div>
          ) : null}

          <Button
            data-testid="start-correction-btn"
            disabled={!epreuve || !selectedFile}
            loading={isUploading}
            onClick={() => void onUpload()}
            icon={<Upload className="h-4 w-4" />}
            size="lg"
            className="rounded-xl font-semibold"
            style={{
              background: 'var(--eaf-teal)',
              color: '#050913',
            }}
          >
            Lancer la correction détaillée
          </Button>
        </div>
      )}

      {copieLink ? (
        <div
          className="mt-6 rounded-xl border px-6 py-8 text-center"
          style={{
            background: 'var(--eaf-teal)/5',
            borderColor: 'var(--eaf-teal)/20',
          }}
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full shadow-md"
            style={{ background: 'var(--eaf-bg1)', color: 'var(--eaf-teal)' }}
          >
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--eaf-fg0)]">Ton rapport de correction est prêt</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[var(--eaf-fg2)]">
            Ouvre-le maintenant, pendant que les points de travail sont encore frais dans ta mémoire.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <Link
              href={`/atelier-ecrit/correction/${copieLink.copieId}?epreuveId=${copieLink.epreuveId}`}
              data-testid="view-report-link"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: 'var(--eaf-teal)',
                color: '#050913',
              }}
            >
              Voir mon rapport
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href={tutorHref}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border px-5 py-2.5 text-sm font-semibold transition hover:border-[var(--eaf-teal)] hover:text-[var(--eaf-teal)]"
              style={{
                borderColor: 'rgba(123, 142, 255, 0.2)',
                background: 'var(--eaf-bg1)',
                color: 'var(--eaf-fg0)',
              }}
            >
              Préparer le retravail avec le guidage
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
