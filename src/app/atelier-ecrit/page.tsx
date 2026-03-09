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
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
};

const PROCESSING_STEPS = ['Lecture de la copie…', 'Analyse littéraire…', 'Rédaction du bilan…'];

const STUDIO_STEPS = [
  {
    index: '01',
    title: 'Générer un sujet crédible',
    body: 'Choisis le format, précise l œuvre ou le thème si besoin, puis lance un sujet blanc exploitable immédiatement.',
  },
  {
    index: '02',
    title: 'Déposer la copie',
    body: 'Ajoute un PDF ou des photos propres. La plateforme suit l upload puis enclenche une lecture detaillee de la copie.',
  },
  {
    index: '03',
    title: 'Récupérer le rapport',
    body: 'Une fois l analyse terminée, tu ouvres le rapport détaillé pour travailler le prochain axe utile.',
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
        reject(new Error('Échec du dépôt de copie.'));
        return;
      }

      try {
        resolve(JSON.parse(xhr.responseText) as CopieCreatePayload);
      } catch {
        reject(new Error('Réponse invalide du serveur.'));
      }
    };

    xhr.onerror = () => reject(new Error('Erreur réseau pendant le dépôt.'));
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
        throw new Error('Impossible de générer un sujet pour le moment.');
      }

      const payload = (await response.json()) as EpreuvePayload;
      setEpreuve(payload);
      setSelectedFile(null);
      setPollingStatus(null);
      setCopieLink(null);
      setUploadProgress(0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur inconnue.');
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
        setError('La correction detaillee a echoue. Vous pouvez relancer avec une nouvelle copie.');
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
      setError(cause instanceof Error ? cause.message : 'Erreur upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const baremeEntries = epreuve ? Object.entries(epreuve.bareme) : [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[#17324d] px-6 py-7 text-[#f7f2ea] shadow-[0_32px_90px_rgba(23,50,77,0.22)] md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.24),_transparent_72%)] blur-2xl lg:block" />
        <div className="absolute left-[-5%] top-[-20%] h-44 w-44 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#d7c4aa]">
              <PenTool className="h-4 w-4" />
              Atelier ecrit
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-5 max-w-4xl text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
              Un studio d entraînement pour produire, déposer et relire comme dans un vrai cycle de travail EAF.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#dfe8f0] md:text-base">
              Génère un sujet blanc, dépose une copie propre et récupère une correction détaillée sans te disperser
              entre dix écrans. L interface suit un seul objectif : te faire passer d une intention floue à un rapport exploitable.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { label: 'Sujet', value: epreuve ? 'Prêt' : 'À générer' },
              { label: 'Copie', value: selectedFile ? 'Chargée' : 'En attente' },
              { label: 'Rapport', value: copieLink ? 'Disponible' : pollingStatus ? 'En analyse' : 'À venir' },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d7c4aa]">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-[24px] border border-[#d9b98f] bg-[#fff5e9] px-5 py-4 text-sm text-[#9a5f25]" role="alert">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {STUDIO_STEPS.map((step, index) => {
          const isActive = index === 0 ? !epreuve : index === 1 ? Boolean(epreuve && !copieLink) : Boolean(copieLink);
          return (
            <article
              key={step.index}
              className={`rounded-[26px] border px-5 py-5 shadow-[0_14px_35px_rgba(23,50,77,0.06)] transition ${isActive ? 'border-[#17324d]/18 bg-white' : 'border-[#e7dac6] bg-[#fbf5ec]'}`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Étape {step.index}</p>
              <h2 className="mt-3 text-lg font-semibold text-[#17324d]">{step.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[#5d7287]">{step.body}</p>
            </article>
          );
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <section className="rounded-[30px] border border-[#e7dac6] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ec_100%)] p-6 shadow-[0_20px_70px_rgba(23,50,77,0.08)] md:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#17324d]/8 text-[#17324d]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Étape 1</p>
                <h2 style={EDITORIAL_HEADING} className="mt-2 text-3xl leading-tight tracking-[-0.02em] text-[#17324d]">
                  Générez un sujet d épreuve blanche.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5d7287]">
                  Le sujet doit être suffisamment cadré pour lancer un vrai travail, mais assez souple pour coller à l œuvre ou au thème que tu veux réactiver.
                </p>
              </div>
            </div>

            {!epreuve ? (
              <div className="mt-6 space-y-5">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label htmlFor="epreuve-type" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-[#7a6858]">
                      Type
                    </label>
                    <select
                      id="epreuve-type"
                      value={type}
                      onChange={(event) => setType(event.target.value as EpreuveType)}
                      className="w-full rounded-[18px] border border-[#dfd1bc] bg-white px-3 py-3 text-sm text-[#17324d] outline-none transition focus:border-[#17324d]/20 focus:ring-2 focus:ring-[#17324d]/8"
                    >
                      <option value="commentaire">Commentaire</option>
                      <option value="dissertation">Dissertation</option>
                      <option value="contraction_essai">Contraction / Essai</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="epreuve-oeuvre" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-[#7a6858]">
                      Oeuvre (optionnel)
                    </label>
                    <input
                      id="epreuve-oeuvre"
                      value={oeuvre}
                      onChange={(event) => setOeuvre(event.target.value)}
                      placeholder="Ex: Sido"
                      className="w-full rounded-[18px] border border-[#dfd1bc] bg-white px-3 py-3 text-sm text-[#17324d] outline-none transition placeholder:text-[#8c95a1] focus:border-[#17324d]/20 focus:ring-2 focus:ring-[#17324d]/8"
                    />
                  </div>
                  <div>
                    <label htmlFor="epreuve-theme" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-[#7a6858]">
                      Thème (optionnel)
                    </label>
                    <input
                      id="epreuve-theme"
                      value={theme}
                      onChange={(event) => setTheme(event.target.value)}
                      placeholder="Ex: la mémoire"
                      className="w-full rounded-[18px] border border-[#dfd1bc] bg-white px-3 py-3 text-sm text-[#17324d] outline-none transition placeholder:text-[#8c95a1] focus:border-[#17324d]/20 focus:ring-2 focus:ring-[#17324d]/8"
                    />
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 rounded-[20px] bg-[#17324d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#244a6d] disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isGenerating ? 'Génération…' : 'Générer mon sujet'}
                </button>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_280px]">
                <div className="rounded-[24px] border border-[#eadbc5] bg-white p-5 shadow-[0_12px_30px_rgba(23,50,77,0.05)]">
                  <p className="text-sm font-semibold text-[#17324d]">{epreuve.sujet}</p>
                  <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#33536f]">{epreuve.texte}</p>
                  <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#5d7287]">{epreuve.consignes}</p>
                </div>
                <div className="rounded-[24px] border border-[#d8e8e3] bg-[#edf7f3] p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0f766e]">Barème</p>
                  <div className="mt-4 space-y-2.5">
                    {baremeEntries.map(([label, points]) => (
                      <div key={label} className="flex items-center justify-between rounded-[18px] border border-[#d3e7e1] bg-white px-3 py-3 text-sm text-[#17324d]">
                        <span className="capitalize">{label.replace(/_/g, ' ')}</span>
                        <span className="font-semibold">{points} pts</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setEpreuve(null)} className="mt-4 text-sm font-medium text-[#0f766e] hover:underline">
                    Changer de sujet
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[30px] border border-[#e7dac6] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ec_100%)] p-6 shadow-[0_20px_70px_rgba(23,50,77,0.08)] md:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0f766e]/8 text-[#0f766e]">
                <Upload className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#0f766e]">Étape 2</p>
                <h2 style={EDITORIAL_HEADING} className="mt-2 text-3xl leading-tight tracking-[-0.02em] text-[#17324d]">
                  Déposer ma copie
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5d7287]">
                  Une photo nette ou un PDF propre suffit. Le studio suit l upload, puis bascule vers l analyse sans changer de contexte.
                </p>
              </div>
            </div>

            {pollingStatus && pollingStatus !== 'done' && !copieLink ? (
              <div className="mt-6 rounded-[26px] border border-[#d8e8e3] bg-[#edf7f3] px-6 py-10 text-center">
                <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#0f766e]" />
                <h3 className="text-lg font-semibold text-[#17324d]">Analyse de la copie en cours...</h3>
                <p className="mt-2 text-sm text-[#52716d]">{PROCESSING_STEPS[processingStepIndex]}</p>
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
                  className={`rounded-[28px] border-2 border-dashed p-8 text-center transition ${epreuve ? 'cursor-pointer border-[#d7e6e1] bg-[#edf7f3]/45 hover:border-[#0f766e]/35 hover:bg-[#edf7f3]' : 'pointer-events-none border-[#eadfce] bg-[#faf4eb] opacity-60'}`}
                  onClick={() => epreuve && fileInputRef.current?.click()}
                >
                  <UploadCloud className="mx-auto h-12 w-12 text-[#7c8792]" />
                  <h3 className="mt-4 text-lg font-semibold text-[#17324d]">Dépose ta copie ici</h3>
                  <p className="mt-2 text-sm text-[#5d7287]">PDF, JPG, PNG ou WEBP (Max 20MB)</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      disabled={!epreuve}
                      className="rounded-[18px] border border-[#dfd1bc] bg-white px-4 py-2.5 text-sm font-medium text-[#17324d] transition hover:border-[#17324d]/18 disabled:opacity-50"
                    >
                      Choisir un fichier
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        mobileInputRef.current?.click();
                      }}
                      disabled={!epreuve}
                      className="inline-flex items-center gap-2 rounded-[18px] border border-[#dfd1bc] bg-white px-4 py-2.5 text-sm font-medium text-[#17324d] transition hover:border-[#17324d]/18 disabled:opacity-50"
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
                  <div className="rounded-[24px] border border-[#eadbc5] bg-white p-5 shadow-[0_12px_30px_rgba(23,50,77,0.05)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#17324d]">{selectedFile.name}</p>
                        <p className="mt-1 text-xs text-[#6d7e8d]">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                      </div>
                      <span className="inline-flex rounded-full bg-[#17324d]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#17324d]">
                        {selectedFile.type === 'application/pdf' ? 'PDF' : 'Image'}
                      </span>
                    </div>
                    {selectedFile.type.startsWith('image/') && previewUrl && (
                      <img src={previewUrl} alt="Aperçu copie" className="mt-4 max-h-72 rounded-[20px] border border-[#eadbc5] object-contain" />
                    )}
                    {selectedFile.type === 'application/pdf' && (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-[18px] bg-[#edf7f3] px-4 py-3 text-sm text-[#0f766e]">
                        <FileText className="h-4 w-4" />
                        PDF prêt à l envoi
                      </div>
                    )}
                  </div>
                )}

                {isUploading && (
                  <div className="rounded-[24px] border border-[#d8e8e3] bg-[#edf7f3] p-5">
                    <p className="text-sm text-[#52716d]">Upload en cours… {uploadProgress}%</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
                      <div className="h-2 rounded-full bg-[#0f766e] transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                <button
                  disabled={!epreuve || !selectedFile || isUploading}
                  onClick={handleUpload}
                  className="inline-flex items-center gap-2 rounded-[20px] bg-[#0f766e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#148b80] disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Lancer la correction détaillée
                </button>
              </div>
            )}

            {copieLink && (
              <div className="mt-6 rounded-[26px] border border-[#d8e8e3] bg-[#edf7f3] px-6 py-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#0f766e] shadow-[0_10px_25px_rgba(15,118,110,0.15)]">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-[#17324d]">Correction terminée !</h3>
                <p className="mt-2 text-sm text-[#52716d]">Le rapport est prêt. Ouvre-le pendant que les points de correction sont encore frais.</p>
                <Link
                  href={`/atelier-ecrit/correction/${copieLink.copieId}?epreuveId=${copieLink.epreuveId}`}
                  className="mt-5 inline-flex items-center gap-2 rounded-[20px] border border-[#0f766e]/18 bg-white px-5 py-3 text-sm font-semibold text-[#0f766e] transition hover:border-[#0f766e]/30 hover:bg-[#f7fffc]"
                >
                  Voir mon rapport
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href={tutorHref}
                  className="mt-3 inline-flex items-center justify-center rounded-[20px] border border-[#d8ccb9] bg-[#fffdfa] px-5 py-3 text-sm font-semibold text-[#17324d] transition hover:border-[#0f766e] hover:text-[#0f766e]"
                >
                  Préparer le retravail avec le guidage
                </Link>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-[#d8e8e3] bg-[#edf7f3] p-5 shadow-[0_18px_55px_rgba(15,118,110,0.08)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#0f766e]">Cadre de travail</p>
            <div className="mt-4 space-y-3">
              {[
                'Utilise un sujet à la fois pour garder une correction lisible.',
                'Privilégie des photos nettes, plates, bien éclairées.',
                'Relis le rapport immédiatement pour transformer le feedback en prochaine action.',
              ].map((item) => (
                <div key={item} className="rounded-[20px] border border-[#d3e7e1] bg-white/88 px-4 py-4 text-sm leading-7 text-[#33536f]">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-[#e7dac6] bg-[#f8f1e7] p-5 shadow-[0_18px_55px_rgba(122,75,36,0.08)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#b87333]/10 text-[#9a6a37]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#17324d]">Pourquoi cette page existe</p>
                <p className="text-xs text-[#7a6858]">Écrire, déposer, corriger, puis retravailler</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#5d7287]">
              Le bon usage de l atelier écrit n est pas de collectionner des sujets. Il sert à produire une copie, lire un retour structuré puis réinjecter ce retour dans la séance suivante.
            </p>
          </section>

          {epreuve && (
            <section className="rounded-[28px] border border-[#e7dac6] bg-white p-5 shadow-[0_18px_55px_rgba(23,50,77,0.06)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Sujet actif</p>
              <p className="mt-3 text-sm font-semibold leading-7 text-[#17324d]">{epreuve.sujet}</p>
              <p className="mt-3 text-sm leading-7 text-[#5d7287]">
                {epreuve.generatedAt ? `Généré le ${new Date(epreuve.generatedAt).toLocaleDateString('fr-FR')}` : 'Sujet prêt à être travaillé.'}
              </p>
              <Link
                href={tutorHref}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#17324d] transition-colors hover:text-[#0f766e]"
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
            className="rounded-[18px] border border-[#d8e8e3] bg-[#edf7f3] px-4 py-3 text-sm font-medium text-[#0f766e] shadow-[0_16px_32px_rgba(15,118,110,0.12)]"
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
