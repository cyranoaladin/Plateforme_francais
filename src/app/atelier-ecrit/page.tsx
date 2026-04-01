'use client';

import Link from 'next/link';
import { ChevronRight, PenTool, ShieldCheck } from 'lucide-react';
import { StateNotice } from '@/components/ui';
import { sanitizeLlmText } from '@/lib/ui/sanitize-llm';
import { EcritCorrectionProgress } from './components/EcritCorrectionProgress';
import { EcritCopyUploader } from './components/EcritCopyUploader';
import { EcritEpreuveSelector } from './components/EcritEpreuveSelector';
import { useEcritSession } from './hooks/useEcritSession';
import './types';

export default function AtelierEcritPage() {
  const session = useEcritSession();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <section className="hero-premium-panel relative overflow-hidden rounded-[24px] px-6 py-7 md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.24),_transparent_72%)] blur-2xl lg:block" />
        <div className="absolute left-[-5%] top-[-20%] h-44 w-44 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-end">
          <div>
            <div className="hero-kicker">
              <PenTool className="h-4 w-4" />
              Atelier écrit
            </div>
            <h1 className="font-display mt-5 max-w-4xl text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
              Un studio d'entraînement pour produire, déposer et relire comme dans un vrai cycle de travail EAF.
            </h1>
            <p className="hero-body mt-4 max-w-3xl text-sm leading-7 md:text-base">
              Génère un sujet blanc, dépose une copie propre et récupère une correction détaillée sans te disperser
              entre dix écrans. L'interface suit un seul objectif : te faire passer d'une intention floue à un rapport exploitable.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
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
              <div key={item.label} className="hero-glass-card rounded-[24px] px-4 py-4">
                <p className="ui-stat-label text-[var(--hero-kicker-text)]">{item.label}</p>
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
              className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-[var(--c-primary)] px-5 py-3 text-sm font-semibold text-[var(--text-on-primary)] shadow-[var(--shadow-md)] transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-success)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-page)]"
            >
              Découvrir les plans <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

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
          <section className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--bg-primary)] p-5 shadow-[var(--shadow-md)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-primary)]">Cadre de travail</p>
            <div className="mt-4 space-y-3">
              {[
                'Utilise un sujet à la fois pour garder une correction lisible.',
                'Privilégie des photos nettes, plates, bien éclairées.',
                'Relis le rapport immédiatement pour transformer les conseils en prochaine action.',
              ].map((item) => (
                <div key={item} className="rounded-[16px] border border-[var(--border-primary)] bg-[var(--bg-surface)]/88 px-4 py-4 text-sm leading-7 text-[var(--text-body)]">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] p-5 shadow-[var(--shadow-md)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-amber-300)]/10 text-[var(--c-reward)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--c-primary)]">Pourquoi cette page existe</p>
                <p className="text-xs text-[var(--text-body)]">Écrire, déposer, corriger, puis retravailler</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
              Le bon usage de l'atelier écrit n'est pas de collectionner des sujets. Il sert à produire une copie, lire un retour structuré puis réinjecter ce retour dans la séance suivante.
            </p>
          </section>

          {session.epreuve && (
            <section className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-md)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Sujet actif</p>
              <p className="mt-3 text-sm font-semibold leading-7 text-[var(--c-primary)]">{sanitizeLlmText(session.epreuve.sujet)}</p>
              <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                {session.epreuve.generatedAt ? `Généré le ${new Date(session.epreuve.generatedAt).toLocaleDateString('fr-FR')}` : 'Sujet prêt à être travaillé.'}
              </p>
              <Link
                href={session.tutorHref}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--c-primary)] transition-colors hover:text-[var(--c-success)]"
              >
                Questionner le sujet avec le guidage
              </Link>
            </section>
          )}
        </aside>
      </div>

      <div className="fixed bottom-24 right-6 z-50 space-y-2 md:bottom-6">
        {session.badgeToasts.map((badge) => (
          <div
            key={badge}
            className="rounded-[16px] border border-[var(--border-success)] bg-[var(--bg-success)] px-4 py-3 text-sm font-medium text-[var(--c-success)] shadow-[var(--shadow-md)]"
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
