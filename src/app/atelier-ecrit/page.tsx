'use client';

import Link from 'next/link';
import { ChevronRight, PenTool, ShieldCheck } from '@/components/ui/icons';
import { StateNotice } from '@/components/ui';
import { sanitizeLlmText } from '@/lib/ui/sanitize-llm';
import { EcritCorrectionProgress } from './components/EcritCorrectionProgress';
import { EcritCopyUploader } from './components/EcritCopyUploader';
import { EcritEpreuveSelector } from './components/EcritEpreuveSelector';
import { useEcritSession } from './hooks/useEcritSession';

export default function AtelierEcritPage() {
  const session = useEcritSession();

  // Helper pour déterminer les couleurs des stats
  const getStatColor = (label: string, value: string) => {
    if (value === 'Prêt' || value === 'Chargée' || value === 'Disponible') {
      if (label === 'Sujet') return 'var(--eaf-teal)';
      if (label === 'Copie') return 'var(--eaf-gold)';
      if (label === 'Rapport') return 'var(--eaf-orange)';
    }
    return 'var(--eaf-fg3)';
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      {/* Hero - Gradient bleu-nuit */}
      <section
        className="relative overflow-hidden rounded-2xl px-6 py-7 md:px-8 md:py-8 lg:px-10 lg:py-10"
        style={{
          background: 'linear-gradient(135deg, #0d1a35 0%, #111c30 60%, #0f1629 100%)',
          border: '1px solid rgba(123, 142, 255, 0.15)',
        }}
      >
        {/* Glow effects */}
        <div
          className="absolute -right-[5%] top-1/2 hidden h-[60%] w-[30%] -translate-y-1/2 rounded-full blur-3xl lg:block"
          style={{ background: 'radial-gradient(circle at center, rgba(26, 213, 160, 0.12), transparent 70%)' }}
        />
        <div
          className="absolute -left-[3%] -top-[15%] h-36 w-36 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle at center, rgba(255, 181, 71, 0.12), transparent 60%)' }}
        />

        <div className="relative grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-end">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em]"
              style={{
                background: 'rgba(26, 213, 160, 0.12)',
                color: 'var(--eaf-teal)',
              }}
            >
              <PenTool className="h-4 w-4" />
              Atelier écrit
            </div>
            <h1
              className="mt-5 max-w-4xl text-4xl leading-tight text-white md:text-[44px]"
              style={{ fontFamily: 'var(--font-heading, Fraunces, serif)', letterSpacing: '-1.5px' }}
            >
              Un studio d'entraînement pour produire, déposer et relire comme dans un vrai cycle de travail EAF.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
              Génère un sujet blanc, dépose une copie propre et récupère une correction détaillée sans te disperser
              entre dix écrans. L'interface suit un seul objectif : te faire passer d'une intention floue à un rapport exploitable.
            </p>
          </div>

          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Sujet', value: session.epreuve ? 'Prêt' : 'À générer' },
              { label: 'Copie', value: session.upload.selectedFile ? 'Chargée' : 'En attente' },
              {
                label: 'Rapport',
                value: session.correction.copieLink
                  ? 'Disponible'
                  : session.correction.pollingStatus
                    ? 'En analyse'
                    : 'À venir',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl px-4 py-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: getStatColor(item.label, item.value) }}
                >
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {session.error && (
        <div className="space-y-3">
          <StateNotice
            title={session.upgradeUrl ? 'Limite de ton plan atteinte' : 'Un souci est survenu'}
            description={session.error}
            variant="warning"
            icon={PenTool}
            live="assertive"
          />
          {session.upgradeUrl && (
            <Link
              href={session.upgradeUrl}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{ background: 'var(--eaf-orange)', color: '#050913' }}
            >
              Découvrir les plans <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {/* Overview Steps */}
      <EcritCorrectionProgress
        epreuveReady={Boolean(session.epreuve)}
        copieReady={Boolean(session.upload.selectedFile)}
        reportReady={Boolean(session.correction.copieLink)}
      />

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <EcritEpreuveSelector
            type={session.type}
            oeuvre={session.oeuvre}
            theme={session.theme}
            onTypeChange={session.setType}
            onOeuvreChange={session.setOeuvre}
            onThemeChange={session.setTheme}
            onGenerate={session.handleGenerate}
            isGenerating={session.isGenerating}
            epreuve={session.epreuve}
            baremeEntries={session.baremeEntries}
            onReset={() => session.setEpreuve(null)}
          />
          <EcritCopyUploader
            epreuve={session.epreuve}
            selectedFile={session.upload.selectedFile}
            previewUrl={session.upload.previewUrl}
            uploadProgress={session.upload.uploadProgress}
            isUploading={session.upload.isUploading}
            pollingStatus={session.correction.pollingStatus}
            processingLabel={session.correction.processingLabel}
            copieLink={session.correction.copieLink}
            tutorHref={session.tutorHref}
            maxUploadBytes={session.upload.maxUploadBytes}
            onSelectFile={session.upload.setSelectedFile}
            onTriggerFileDialog={() => session.upload.fileInputRef.current?.click()}
            onTriggerCameraDialog={() => session.upload.mobileInputRef.current?.click()}
            onUpload={session.handleUpload}
            fileInputRef={session.upload.fileInputRef}
            mobileInputRef={session.upload.mobileInputRef}
          />
        </div>

        <aside className="space-y-6">
          {/* Cadre de travail */}
          <section
            className="rounded-xl p-5"
            style={{
              background: 'var(--eaf-bg2)',
              border: '1px solid rgba(123, 142, 255, 0.12)',
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-indigo)]">
              Cadre de travail
            </p>
            <div className="mt-4 space-y-3">
              {[
                'Utilise un sujet à la fois pour garder une correction lisible.',
                'Privilégie des photos nettes, plates, bien éclairées.',
                'Relis le rapport immédiatement pour transformer les conseils en prochaine action.',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border px-4 py-4 text-sm leading-7 text-[var(--eaf-fg2)]"
                  style={{
                    background: 'var(--eaf-bg1)',
                    borderColor: 'rgba(123, 142, 255, 0.1)',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          {/* Pourquoi cette page */}
          <section
            className="rounded-xl p-5"
            style={{
              background: 'var(--eaf-bg2)',
              border: '1px solid rgba(123, 142, 255, 0.12)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: 'var(--eaf-gold)/10', color: 'var(--eaf-gold)' }}
              >
                <ShieldCheck className="h-5 w-5" style={{ color: 'var(--eaf-gold)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--eaf-fg0)]">Pourquoi cette page existe</p>
                <p className="text-xs text-[var(--eaf-fg2)]">Écrire, déposer, corriger, puis retravailler</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--eaf-fg2)]">
              Le bon usage de l'atelier écrit n'est pas de collectionner des sujets. Il sert à produire une copie, lire un retour structuré puis réinjecter ce retour dans la séance suivante.
            </p>
          </section>

          {session.epreuve && (
            <section
              className="rounded-xl p-5"
              style={{
                background: 'var(--eaf-bg2)',
                border: '1px solid rgba(123, 142, 255, 0.12)',
              }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-gold)]">Sujet actif</p>
              <p className="mt-3 text-sm font-semibold leading-7 text-[var(--eaf-fg1)]">
                {sanitizeLlmText(session.epreuve.sujet)}
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--eaf-fg3)]">
                {session.epreuve.generatedAt
                  ? `Généré le ${new Date(session.epreuve.generatedAt).toLocaleDateString('fr-FR')}`
                  : 'Sujet prêt à être travaillé.'}
              </p>
              <Link
                href={session.tutorHref}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[var(--eaf-teal)]"
                style={{ color: 'var(--eaf-indigo)' }}
              >
                Questionner le sujet avec le guidage
              </Link>
            </section>
          )}
        </aside>
      </div>

      {/* Toast notifications */}
      <div className="fixed bottom-24 right-6 z-50 space-y-2 md:bottom-6">
        {session.badgeToasts.map((badge) => (
          <div
            key={badge}
            className="rounded-lg border px-4 py-3 text-sm font-medium shadow-lg"
            role="status"
            aria-live="polite"
            style={{
              background: 'var(--eaf-bg2)',
              borderColor: 'var(--eaf-teal)',
              color: 'var(--eaf-teal)',
            }}
          >
            Badge débloqué : {badge}
          </div>
        ))}
      </div>
    </div>
  );
}
