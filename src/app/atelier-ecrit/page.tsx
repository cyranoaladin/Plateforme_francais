'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

// Force dynamic rendering - this page uses client-only hooks
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
import {
  Camera,
  ChevronRight,
  FileText,
  Loader2,
  PenTool,
  ShieldCheck,
  Sparkles,
  Upload,
  UploadCloud,
} from 'lucide-react';
import { buildTuteurHref } from '@/lib/navigation/tuteur-link';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';
import { Badge, Button, Input } from '@/components/ui';
import { StateNotice } from '@/components/ui/state-notice';

type EpreuveType = 'commentaire' | 'dissertation' | 'contraction_essai';

type EpreuvePayload = {
  epreuveId: string;
  sujet: string;
  texte: string;
  consignes: string;
  bareme: Record<string, number>;
  generatedAt: string;
};

type CopieCreatePayload = {
  copieId: string;
  status: 'pending';
  newBadges?: string[];
};

const EDITORIAL_HEADING = {
  fontFamily: "var(--font-display)",
};

const PROCESSING_STEPS = ['Lecture attentive de ta copie...', 'Analyse des points de méthode et de contenu...', 'Rédaction de ton bilan personnalisé...'];

const STUDIO_STEPS = [
  {
    index: '01',
    title: 'Générer un sujet crédible',
    body: 'Choisis le format, précise l\u2019œuvre ou le thème si besoin, puis lance un sujet blanc exploitable immédiatement.',
  },
  {
    index: '02',
    title: 'Déposer la copie',
    body: 'Ajoute un PDF ou des photos propres. La plateforme suit l\u2019upload puis enclenche une lecture détaillée de la copie.',
  },
  {
    index: '03',
    title: 'Récupérer le rapport',
    body: 'Une fois l\u2019analyse terminée, tu ouvres le rapport détaillé pour travailler le prochain axe utile.',
  },
];

function uploadCopieWithProgress(input: {
  epreuveId: string;
  file: File;
  csrf: string;
  onProgress: (value: number) => void;
}): Promise<CopieCreatePayload> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', input.file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/v1/epreuves/${input.epreuveId}/copie`);
    xhr.setRequestHeader('X-CSRF-Token', input.csrf);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        input.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error('Le dépôt de la copie n\'a pas abouti. Vérifie le format du fichier et réessaie.'));
        return;
      }

      try {
        resolve(JSON.parse(xhr.responseText) as CopieCreatePayload);
      } catch {
        reject(new Error('La réponse du serveur n\'a pas pu être lue. Réessaie dans un instant.'));
      }
    };

    xhr.onerror = () => reject(new Error('La connexion a été interrompue pendant le dépôt. Vérifie ta connexion et réessaie.'));
    xhr.send(formData);
  });
}

export default function AtelierEcritPage() {
  const [type, setType] = useState<EpreuveType>('commentaire');
  const [oeuvre, setOeuvre] = useState('');

  const [theme, setTheme] = useState('');
  const [epreuve, setEpreuve] = useState<EpreuvePayload | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);
  const [processingStepIndex, setProcessingStepIndex] = useState(0);
  const [copieLink, setCopieLink] = useState<{ copieId: string; epreuveId: string } | null>(null);
  const [badgeToasts, setBadgeToasts] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);

  const previewUrl = useMemo(() => {
    if (!selectedFile) {
      return null;
    }
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  const tutorHref = useMemo(
    () =>
      buildTuteurHref({
        workId: oeuvre || null,
        parcours: theme || null,
      }),
    [oeuvre, theme],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/v1/epreuves/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfTokenFromDocument(),
        },
        body: JSON.stringify({ type, oeuvre: oeuvre || undefined, theme: theme || undefined }),
      });

      if (!response.ok) {
        throw new Error('La génération du sujet n\'a pas abouti. Réessaie dans quelques instants.');
      }

      const payload = (await response.json()) as EpreuvePayload;
      setEpreuve(payload);
      setSelectedFile(null);
      setPollingStatus(null);
      setCopieLink(null);
      setUploadProgress(0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Un problème inattendu est survenu. Réessaie.');
    } finally {
      setIsGenerating(false);
    }
  };

  const pollCorrection = (input: { epreuveId: string; copieId: string }) => {
    setPollingStatus('pending');

    const stepTimer = setInterval(() => {
      setProcessingStepIndex((prev) => (prev + 1) % PROCESSING_STEPS.length);
    }, 2000);

    const polling = setInterval(async () => {
      const response = await fetch(`/api/v1/epreuves/${input.epreuveId}/copie/${input.copieId}`);
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { status: string };
      setPollingStatus(payload.status);

      if (payload.status === 'done') {
        clearInterval(polling);
        clearInterval(stepTimer);
        setCopieLink({ copieId: input.copieId, epreuveId: input.epreuveId });
      }

      if (payload.status === 'error') {
        clearInterval(polling);
        clearInterval(stepTimer);
        setError('L\'analyse de ta copie n\'a pas pu aboutir cette fois. Tu peux déposer à nouveau ta copie ou en soumettre une autre.');
      }
    }, 3000);
  };

  const handleUpload = async () => {
    if (!epreuve || !selectedFile) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const created = await uploadCopieWithProgress({
        epreuveId: epreuve.epreuveId,
        file: selectedFile,
        csrf: getCsrfTokenFromDocument(),
        onProgress: setUploadProgress,
      });

      if (created.newBadges && created.newBadges.length > 0) {
        setBadgeToasts(created.newBadges);
        setTimeout(() => setBadgeToasts([]), 4500);
      }

      pollCorrection({
        epreuveId: epreuve.epreuveId,
        copieId: created.copieId,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Le dépôt de la copie a rencontré un problème. Vérifie ta connexion et réessaie.');
    } finally {
      setIsUploading(false);
    }
  };

  const baremeEntries = epreuve ? Object.entries(epreuve.bareme) : [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[var(--navy)] px-6 py-7 text-[var(--surface-parchment)] shadow-[var(--shadow-xl)] md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.24),_transparent_72%)] blur-2xl lg:block" />
        <div className="absolute left-[-5%] top-[-20%] h-44 w-44 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--border-warm)]">
              <PenTool className="h-4 w-4" />
              Atelier écrit
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-5 max-w-4xl text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
              Un studio d\u2019entraînement pour produire, déposer et relire comme dans un vrai cycle de travail EAF.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-on-navy-muted)] md:text-base">
              Génère un sujet blanc, dépose une copie propre et récupère une correction détaillée sans te disperser
              entre dix écrans. L\u2019interface suit un seul objectif : te faire passer d\u2019une intention floue à un rapport exploitable.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { label: 'Sujet', value: epreuve ? 'Prêt' : 'À générer' },
              { label: 'Copie', value: selectedFile ? 'Chargée' : 'En attente' },
              { label: 'Rapport', value: copieLink ? 'Disponible' : pollingStatus ? 'En analyse' : 'À venir' },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--border-warm)]">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <StateNotice
          title="Un souci est survenu"
          description={error}
          variant="warning"
          icon={PenTool}
        />
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {STUDIO_STEPS.map((step, index) => {
          const isActive = index === 0 ? !epreuve : index === 1 ? Boolean(epreuve && !copieLink) : Boolean(copieLink);
          return (
            <article
              key={step.index}
              className={`rounded-[24px] border px-5 py-5 shadow-[var(--shadow-sm)] transition ${isActive ? 'border-[var(--navy)]/18 bg-[var(--card)]' : 'border-[var(--border-light)] bg-[var(--surface-warm-card)]'}`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--accent-bronze)]">Étape {step.index}</p>
              <h2 className="mt-3 text-lg font-semibold text-[var(--navy)]">{step.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{step.body}</p>
            </article>
          );
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <section className="rounded-[24px] border border-[var(--border-light)] bg-[linear-gradient(180deg,var(--surface-warm-card-top)_0%,var(--surface-warm-card)_100%)] p-6 shadow-[var(--shadow-lg)] md:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--navy)]/8 text-[var(--navy)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--accent-bronze)]">Étape 1</p>
                <h2 style={EDITORIAL_HEADING} className="mt-2 text-3xl leading-tight tracking-[-0.02em] text-[var(--navy)]">
                  Génère un sujet d{'\u2019'}épreuve blanche.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                  Le sujet doit être suffisamment cadré pour lancer un vrai travail, mais assez souple pour coller à l\u2019œuvre ou au thème que tu veux réactiver.
                </p>
              </div>
            </div>

            {!epreuve ? (
              <div className="mt-6 space-y-5">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label htmlFor="epreuve-type" className="mb-1.5 block text-sm font-medium text-[var(--text-body)]">
                      Type
                    </label>
                    <select
                      id="epreuve-type"
                      value={type}
                      onChange={(event) => setType(event.target.value as EpreuveType)}
                      className="w-full appearance-none rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface-paper)] px-3 py-3 text-sm text-[var(--navy)] outline-none transition-all duration-[var(--transition-base)] focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20"
                    >
                      <option value="commentaire">Commentaire</option>
                      <option value="dissertation">Dissertation</option>
                      <option value="contraction_essai">Contraction / Essai</option>
                    </select>
                  </div>
                  <Input
                    label={'\u0152uvre (optionnel)'}
                    id="epreuve-oeuvre"
                    value={oeuvre}
                    onChange={(event) => setOeuvre(event.target.value)}
                    placeholder="Ex: Sido"
                    size="md"
                  />
                  <Input
                    label="Th\u00e8me (optionnel)"
                    id="epreuve-theme"
                    value={theme}
                    onChange={(event) => setTheme(event.target.value)}
                    placeholder="Ex: la m\u00e9moire"
                    size="md"
                  />
                </div>
                <Button
                  onClick={handleGenerate}
                  loading={isGenerating}
                  icon={<Sparkles className="h-4 w-4" />}
                  size="lg"
                  className="rounded-[16px] font-semibold"
                >
                  {isGenerating ? 'Génération…' : 'Générer mon sujet'}
                </Button>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_280px]">
                <div className="rounded-[24px] border border-[var(--surface-sand)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
                  <p className="text-sm font-semibold text-[var(--navy)]">{epreuve.sujet}</p>
                  <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[var(--navy-mid)]">{epreuve.texte}</p>
                  <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[var(--text-secondary)]">{epreuve.consignes}</p>
                </div>
                <div className="rounded-[24px] border border-[var(--border-success)] bg-[var(--success-bg)] p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--teal)]">Barème</p>
                  <div className="mt-4 space-y-2.5">
                    {baremeEntries.map(([label, points]) => (
                      <div key={label} className="flex items-center justify-between rounded-[16px] border border-[var(--border-success-soft)] bg-[var(--card)] px-3 py-3 text-sm text-[var(--navy)]">
                        <span className="capitalize">{label.replace(/_/g, ' ')}</span>
                        <span className="font-semibold">{points} pts</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setEpreuve(null)} className="mt-4 min-h-[44px] text-sm font-medium text-[var(--teal)] hover:underline">
                    Changer de sujet
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[24px] border border-[var(--border-light)] bg-[linear-gradient(180deg,var(--surface-warm-card-top)_0%,var(--surface-warm-card)_100%)] p-6 shadow-[var(--shadow-lg)] md:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--teal)]/8 text-[var(--teal)]">
                <Upload className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--teal)]">Étape 2</p>
                <h2 style={EDITORIAL_HEADING} className="mt-2 text-3xl leading-tight tracking-[-0.02em] text-[var(--navy)]">
                  Déposer ma copie
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                  Une photo nette ou un PDF propre suffit. Le studio suit l\u2019upload, puis bascule vers l\u2019analyse sans changer de contexte.
                </p>
              </div>
            </div>

            {pollingStatus && pollingStatus !== 'done' && !copieLink ? (
              <div className="mt-6 rounded-[24px] border border-[var(--border-success)] bg-[var(--success-bg)] px-6 py-10 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--card)] shadow-[var(--shadow-sm)]">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--navy)]">Ta copie est entre de bonnes mains</h3>
                <p className="mt-2 text-sm font-medium text-[var(--success-text)]">{PROCESSING_STEPS[processingStepIndex]}</p>
                <p className="mt-3 text-xs text-[var(--text-caption)]">Cela prend généralement entre 30 secondes et 2 minutes.</p>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                <div
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const file = event.dataTransfer.files?.[0];
                    if (file) setSelectedFile(file);
                  }}
                  className={`rounded-[24px] border-2 border-dashed p-8 text-center transition ${epreuve ? 'cursor-pointer border-[var(--border-success)] bg-[var(--success-bg)]/45 hover:border-[var(--teal)]/35 hover:bg-[var(--success-bg)]' : 'pointer-events-none border-[var(--border-warm-mid)] bg-[var(--surface-warm-card)] opacity-60'}`}
                  onClick={() => epreuve && fileInputRef.current?.click()}
                >
                  <UploadCloud className="mx-auto h-12 w-12 text-[var(--text-icon)]" />
                  <h3 className="mt-4 text-lg font-semibold text-[var(--navy)]">Dépose ta copie ici</h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">PDF, JPG, PNG ou WEBP (Max 20MB)</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      disabled={!epreuve}
                      className="min-h-[44px] rounded-[16px] border border-[var(--border-sand)] bg-[var(--card)] px-4 py-2.5 text-sm font-medium text-[var(--navy)] transition hover:border-[var(--navy)]/18 disabled:opacity-50"
                    >
                      Choisir un fichier
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        mobileInputRef.current?.click();
                      }}
                      disabled={!epreuve}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-[16px] border border-[var(--border-sand)] bg-[var(--card)] px-4 py-2.5 text-sm font-medium text-[var(--navy)] transition hover:border-[var(--navy)]/18 disabled:opacity-50"
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
                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  />
                  <input
                    aria-label="Prendre une photo de copie"
                    ref={mobileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  />
                </div>

                {selectedFile && (
                  <div className="rounded-[24px] border border-[var(--surface-sand)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--navy)]">{selectedFile.name}</p>
                        <p className="mt-1 text-xs text-[var(--text-caption)]">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                      </div>
                      <Badge variant="navy" size="sm" className="uppercase tracking-[0.14em]">
                        {selectedFile.type === 'application/pdf' ? 'PDF' : 'Image'}
                      </Badge>
                    </div>
                    {selectedFile.type.startsWith('image/') && previewUrl && (
                      <img src={previewUrl} alt="Aperçu copie" className="mt-4 max-h-72 rounded-[16px] border border-[var(--surface-sand)] object-contain" />
                    )}
                    {selectedFile.type === 'application/pdf' && (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-[16px] bg-[var(--success-bg)] px-4 py-3 text-sm text-[var(--teal)]">
                        <FileText className="h-4 w-4" />
                        PDF prêt à l\u2019envoi
                      </div>
                    )}
                  </div>
                )}

                {isUploading && (
                  <div className="rounded-[24px] border border-[var(--border-success)] bg-[var(--success-bg)] p-5">
                    <p className="text-sm text-[var(--success-text)]">Upload en cours… {uploadProgress}%</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--card)]/80">
                      <div className="h-2 rounded-full bg-[var(--teal)] transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                <Button
                  disabled={!epreuve || !selectedFile}
                  loading={isUploading}
                  onClick={handleUpload}
                  icon={<Upload className="h-4 w-4" />}
                  size="lg"
                  className="rounded-[16px] bg-[var(--teal)] font-semibold hover:bg-[var(--teal-hover)]"
                >
                  Lancer la correction détaillée
                </Button>
              </div>
            )}

            {copieLink && (
              <div className="mt-6 rounded-[24px] border border-[var(--border-success)] bg-[var(--success-bg)] px-6 py-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--card)] text-[var(--teal)] shadow-[var(--shadow-md)]">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--navy)]">Ton rapport de correction est prêt</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[var(--success-text)]">Ouvre-le maintenant, pendant que les points de travail sont encore frais dans ta mémoire.</p>
                <div className="mt-6 flex flex-col items-center gap-3">
                  <Link
                    href={`/atelier-ecrit/correction/${copieLink.copieId}?epreuveId=${copieLink.epreuveId}`}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--teal)] px-6 py-3 text-sm font-bold text-white transition hover:bg-[var(--teal-light)]"
                  >
                    Voir mon rapport
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={tutorHref}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--card)] px-5 py-2.5 text-sm font-semibold text-[var(--navy)] transition hover:border-[var(--teal)] hover:text-[var(--teal)]"
                  >
                    Préparer le retravail avec le guidage
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[24px] border border-[var(--border-success)] bg-[var(--success-bg)] p-5 shadow-[var(--shadow-md)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--teal)]">Cadre de travail</p>
            <div className="mt-4 space-y-3">
              {[
                'Utilise un sujet à la fois pour garder une correction lisible.',
                'Privilégie des photos nettes, plates, bien éclairées.',
                'Relis le rapport immédiatement pour transformer les conseils en prochaine action.',
              ].map((item) => (
                <div key={item} className="rounded-[16px] border border-[var(--border-success-soft)] bg-[var(--card)]/88 px-4 py-4 text-sm leading-7 text-[var(--navy-mid)]">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-[var(--border-light)] bg-[var(--surface-warm-section)] p-5 shadow-[var(--shadow-md)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--gold-muted)]/10 text-[var(--accent-bronze)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--navy)]">Pourquoi cette page existe</p>
                <p className="text-xs text-[var(--text-warm)]">Écrire, déposer, corriger, puis retravailler</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
              Le bon usage de l\u2019atelier écrit n\u2019est pas de collectionner des sujets. Il sert à produire une copie, lire un retour structuré puis réinjecter ce retour dans la séance suivante.
            </p>
          </section>

          {epreuve && (
            <section className="rounded-[24px] border border-[var(--border-light)] bg-[var(--card)] p-5 shadow-[var(--shadow-md)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--accent-bronze)]">Sujet actif</p>
              <p className="mt-3 text-sm font-semibold leading-7 text-[var(--navy)]">{epreuve.sujet}</p>
              <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                {epreuve.generatedAt ? `Généré le ${new Date(epreuve.generatedAt).toLocaleDateString('fr-FR')}` : 'Sujet prêt à être travaillé.'}
              </p>
              <Link
                href={tutorHref}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--navy)] transition-colors hover:text-[var(--teal)]"
              >
                Questionner le sujet avec le guidage
              </Link>
            </section>
          )}
        </aside>
      </div>

      <div className="fixed bottom-24 right-6 z-50 space-y-2 md:bottom-6">
        {badgeToasts.map((badge) => (
          <div
            key={badge}
            className="rounded-[16px] border border-[var(--border-success)] bg-[var(--success-bg)] px-4 py-3 text-sm font-medium text-[var(--teal)] shadow-[var(--shadow-md)]"
            role="status"
            aria-live="polite"
          >
            Badge débloqué : {badge}
          </div>
        ))}
      </div>
    </div>
  );
}
