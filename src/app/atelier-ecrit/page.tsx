'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { Loader2, Upload, Camera, FileText, Sparkles, UploadCloud, ChevronRight } from 'lucide-react';
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

const PROCESSING_STEPS = ['Lecture de la copie…', 'Analyse littéraire…', 'Rédaction du bilan…'];

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
        setError('La correction IA a échoué. Vous pouvez relancer avec une nouvelle copie.');
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

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-primary" /> Atelier Écrit IA
        </h1>
        <p className="text-muted-foreground mt-2">Générez un sujet, déposez votre copie (photo/PDF) et obtenez une correction détaillée.</p>
      </header>

      {error && <div className="p-4 rounded-xl border border-error/30 bg-error/10 text-error text-sm" role="alert">{error}</div>}

      {/* ─── Step 1: Generate Subject ─── */}
      <section className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
          <h2 className="text-lg font-bold text-foreground">Générer un sujet d&apos;épreuve blanche</h2>
        </div>

        {!epreuve ? (
          <>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="epreuve-type" className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Type</label>
                <select id="epreuve-type" value={type} onChange={(event) => setType(event.target.value as EpreuveType)} className="w-full border border-border rounded-xl bg-muted/30 px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none">
                  <option value="commentaire">Commentaire</option>
                  <option value="dissertation">Dissertation</option>
                  <option value="contraction_essai">Contraction / Essai</option>
                </select>
              </div>
              <div>
                <label htmlFor="epreuve-oeuvre" className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Oeuvre (optionnel)</label>
                <input id="epreuve-oeuvre" value={oeuvre} onChange={(event) => setOeuvre(event.target.value)} placeholder="Ex: Sido" className="w-full border border-border rounded-xl bg-muted/30 px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>
              <div>
                <label htmlFor="epreuve-theme" className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Thème (optionnel)</label>
                <input id="epreuve-theme" value={theme} onChange={(event) => setTheme(event.target.value)} placeholder="Ex: la mémoire" className="w-full border border-border rounded-xl bg-muted/30 px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>
            </div>
            <button onClick={handleGenerate} disabled={isGenerating} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-md inline-flex items-center gap-2">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGenerating ? 'Génération…' : 'Générer mon sujet'}
            </button>
          </>
        ) : (
          <div className="animate-in slide-in-from-right-8 duration-300">
            <div className="bg-muted/20 rounded-2xl border border-border p-5 space-y-3">
              <p className="font-bold text-foreground">{epreuve.sujet}</p>
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{epreuve.texte}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{epreuve.consignes}</p>
            </div>
            <button onClick={() => setEpreuve(null)} className="mt-3 text-sm text-primary hover:underline font-medium">Changer de sujet</button>
          </div>
        )}
      </section>

      {/* ─── Step 2: Upload Copy ─── */}
      <section className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${epreuve ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</div>
          <h2 className={`text-lg font-bold ${epreuve ? 'text-foreground' : 'text-muted-foreground'}`}>Déposer ma copie</h2>
        </div>

        {/* Analyzing state */}
        {pollingStatus && pollingStatus !== 'done' && !copieLink && (
          <div className="text-center py-12 animate-in fade-in duration-300">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-5" />
            <h3 className="text-lg font-bold text-foreground mb-2">Analyse IA en cours...</h3>
            <p className="text-sm text-muted-foreground">{PROCESSING_STEPS[processingStepIndex]}</p>
          </div>
        )}

        {/* Upload zone */}
        {!pollingStatus && (
          <>
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0];
                if (file) setSelectedFile(file);
              }}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer ${
                epreuve ? 'border-border hover:border-primary/40 hover:bg-muted/20' : 'border-border/50 opacity-50 pointer-events-none'
              }`}
              onClick={() => epreuve && fileInputRef.current?.click()}
            >
              <UploadCloud className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-bold text-foreground mb-2">Dépose ta copie ici</h3>
              <p className="text-sm text-muted-foreground">PDF, JPG, PNG ou WEBP (Max 20MB)</p>
              <div className="mt-5 flex gap-3 justify-center">
                <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} disabled={!epreuve} className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50">
                  Choisir un fichier
                </button>
                <button onClick={(e) => { e.stopPropagation(); mobileInputRef.current?.click(); }} disabled={!epreuve} className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Photo
                </button>
              </div>
              <input aria-label="Sélectionner un fichier de copie" ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
              <input aria-label="Prendre une photo de copie" ref={mobileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
            </div>

            {selectedFile && (
              <div className="rounded-2xl border border-border p-4 bg-muted/20 animate-in fade-in duration-300">
                <p className="text-sm font-semibold text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                {selectedFile.type.startsWith('image/') && previewUrl && (
                  <img src={previewUrl} alt="Aperçu copie" className="mt-3 max-h-52 rounded-xl border border-border mx-auto" />
                )}
                {selectedFile.type === 'application/pdf' && (
                  <div className="mt-3 flex items-center justify-center text-muted-foreground gap-2">
                    <FileText className="w-5 h-5" /> PDF prêt à l&apos;envoi
                  </div>
                )}
              </div>
            )}

            {isUploading && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Upload en cours… {uploadProgress}%</p>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <button disabled={!epreuve || !selectedFile || isUploading} onClick={handleUpload} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-md inline-flex items-center gap-2">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Lancer la correction IA
            </button>
          </>
        )}

        {/* Result link */}
        {copieLink && (
          <div className="animate-in slide-in-from-bottom-8 duration-500 text-center py-6">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-3">Correction terminée !</h3>
            <Link href={`/atelier-ecrit/correction/${copieLink.copieId}?epreuveId=${copieLink.epreuveId}`}
              className="inline-flex px-6 py-3 rounded-xl bg-success/15 text-success border border-success/30 font-bold items-center gap-2 hover:bg-success/20 transition-colors"
            >
              Voir mon rapport <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      <div className="fixed bottom-24 md:bottom-6 right-6 z-50 space-y-2">
        {badgeToasts.map((badge) => (
          <div key={badge} className="rounded-xl border border-success/30 bg-success/10 px-4 py-2.5 text-sm shadow-lg font-medium" role="status" aria-live="polite">
            Badge débloqué : {badge}
          </div>
        ))}
      </div>
    </div>
  );
}
