'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Play, Sparkles, ListOrdered } from '@/components/ui/icons';
import { OralHero } from '@/components/atelier-oral/OralHero';
import { Button } from '@/components/ui';
import { getCurrentAnneeScolaire } from '@/lib/date/current-school-year';
import { getProgrammeSelection } from '@/data/oeuvres-programme';
import { OralPrepPhase } from './components/OralPrepPhase';
import { OralChecklistWarning } from './components/OralChecklistWarning';
import { OralPassagePhase } from './components/OralPassagePhase';
import { OralResultsPanel } from './components/OralResultsPanel';
import { OralWorkSelector } from './components/OralWorkSelector';
import { DescriptifStatus } from './components/DescriptifStatus';
import {
  PREP_CHECKLIST,
  STEPS,
  STEP_GUIDANCE,
  STEP_LABELS,
  useOralSession,
} from './hooks/useOralSession';

export default function AtelierOralPage() {
  const programmeYear = getCurrentAnneeScolaire();
  const programmeSelection = getProgrammeSelection(programmeYear);

  const [descriptifWorks, setDescriptifWorks] = useState<string[]>([]);
  const [descriptifCount, setDescriptifCount] = useState<number | undefined>(undefined);
  useEffect(() => {
    fetch('/api/v1/student/descriptif-lecture')
      .then((r) => r.ok ? r.json() : { textes: [], total: 0 })
      .then((d: { textes?: { oeuvreAuteur: string }[]; total?: number }) => {
        setDescriptifCount(d.total ?? (d.textes?.length ?? 0));
        const seen = new Set<string>();
        const unique: string[] = [];
        for (const t of d.textes ?? []) {
          if (t.oeuvreAuteur && !seen.has(t.oeuvreAuteur)) {
            seen.add(t.oeuvreAuteur);
            unique.push(t.oeuvreAuteur);
          }
        }
        setDescriptifWorks(unique);
      })
      .catch(() => null);
  }, []);
  const oral = useOralSession({
    initialWork: programmeSelection.availableWorks[0] ?? '',
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <OralHero isSimulation={oral.isSimulation} />

      {/* Error Alert */}
      {oral.error ? (
        <div
          data-testid="error-alert"
          className="space-y-3 rounded-xl border px-5 py-4 text-sm"
          role="alert"
          aria-live="assertive"
          style={{
            background: 'var(--eaf-bg2)',
            borderColor: 'var(--eaf-orange)/30',
            color: 'var(--eaf-orange)',
          }}
        >
          <p>{oral.error}</p>
          {oral.upgradeUrl ? (
            <Link
              href={oral.upgradeUrl}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:scale-[1.02]"
              style={{ background: 'var(--eaf-orange)', color: '#050913' }}
            >
              Découvrir les plans
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* Phase Indicator */}
      {oral.session ? (
        <section
          className="rounded-xl border px-5 py-4"
          style={{
            background: 'var(--eaf-bg2)',
            borderColor: 'rgba(123, 142, 255, 0.12)',
          }}
        >
          <div className="flex flex-wrap items-center gap-3">
            {(['TIRAGE', 'PREP', 'PASSAGE', 'BILAN'] as const).map((phase) => {
              const isActive = oral.wizardPhase === phase;
              const phaseColors: Record<string, { bg: string; text: string }> = {
                TIRAGE: { bg: 'var(--eaf-indigo)', text: '#050913' },
                PREP: { bg: 'var(--eaf-gold)', text: '#050913' },
                PASSAGE: { bg: 'var(--eaf-orange)', text: '#050913' },
                BILAN: { bg: 'var(--eaf-teal)', text: '#050913' },
              };
              const colors = phaseColors[phase];

              return (
                <span
                  key={phase}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]"
                  style={{
                    background: isActive ? colors.bg : 'var(--eaf-bg3)',
                    color: isActive ? colors.text : 'var(--eaf-fg3)',
                  }}
                >
                  {phase === 'TIRAGE'
                    ? 'Tirage'
                    : phase === 'PREP'
                      ? "Prépa 30'"
                      : phase === 'PASSAGE'
                        ? "Passage 20'"
                        : 'Bilan'}
                </span>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* TIRAGE Phase */}
      {oral.wizardPhase === 'TIRAGE' && !oral.session ? (
        <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <section
            className="rounded-xl border p-6 md:p-7"
            style={{
              background: 'var(--eaf-bg1)',
              borderColor: 'rgba(123, 142, 255, 0.12)',
            }}
          >
            <OralWorkSelector
              availableWorks={programmeSelection.availableWorks}
              descriptifWorks={descriptifWorks}
              currentWork={oral.oeuvre}
              selectedMode={oral.mode}
              onSelectWork={oral.setOeuvre}
              onChangeMode={oral.setMode}
              examinerProfile={oral.examinerProfile}
              onChangeProfile={oral.setExaminerProfile}
              showProgrammeWarning={programmeSelection.showProgrammeWarning}
              warningMessage={programmeSelection.warningMessage}
            />

            {/* Start Section */}
            <div className="mt-8 flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'var(--eaf-orange)/10', color: 'var(--eaf-orange)' }}
              >
                <Sparkles className="h-5 w-5" style={{ color: 'var(--eaf-orange)' }} />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-orange)]">
                  Démarrage
                </p>
                <h2
                  className="mt-2 text-3xl leading-tight text-[var(--eaf-fg0)]"
                  style={{ fontFamily: 'var(--font-heading, Fraunces, serif)', letterSpacing: '-1px' }}
                >
                  Tirage au sort de l'extrait
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--eaf-fg2)]">
                  Choisis ton œuvre et le niveau de contrainte. La plateforme tire l'extrait, la question de grammaire puis t'installe directement dans le rythme de l'épreuve.
                </p>
                <Button
                  data-testid="start-session-btn"
                  onClick={() => void oral.startSession()}
                  disabled={oral.isLoading}
                  loading={oral.isLoading}
                  size="lg"
                  icon={!oral.isLoading ? <Play className="h-4 w-4" /> : undefined}
                  className="mt-6 rounded-xl font-semibold"
                  style={{
                    background: 'var(--eaf-orange)',
                    color: '#050913',
                  }}
                >
                  Tirer un extrait
                </Button>
              </div>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Ce qui va suivre */}
            <section
              className="rounded-xl border p-5"
              style={{
                background: 'var(--eaf-teal)/5',
                borderColor: 'var(--eaf-teal)/20',
              }}
            >
              <div className="flex items-center gap-2">
                <ListOrdered className="h-4 w-4" style={{ color: 'var(--eaf-teal)' }} />
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-teal)]">
                  Ce qui va suivre
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  'Préparation structurée de 30 minutes avec notes personnelles.',
                  'Passage en quatre temps : lecture, explication, grammaire, entretien.',
                  'Bilan final /20 avec conseil concret pour la prochaine séance.',
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-lg border px-4 py-4 text-sm leading-7"
                    style={{
                      background: 'var(--eaf-bg1)',
                      borderColor: 'rgba(123, 142, 255, 0.1)',
                      color: 'var(--eaf-fg1)',
                    }}
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                      style={{ background: 'var(--eaf-teal)/15', color: 'var(--eaf-teal)' }}
                    >
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Bon usage */}
            <section
              className="rounded-xl border p-5"
              style={{
                background: 'var(--eaf-bg2)',
                borderColor: 'rgba(123, 142, 255, 0.12)',
              }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-gold)]">Bon usage</p>
              <p className="mt-4 text-sm leading-7 text-[var(--eaf-fg2)]">
                Une bonne simulation orale ne cherche pas à parler beaucoup. Elle cherche à rendre la parole plus nette, plus articulée et plus défendable étape après étape.
              </p>
              <Link
                href={oral.oralTutorHref}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[var(--eaf-teal)]"
                style={{ color: 'var(--eaf-indigo)' }}
              >
                Préparer cette œuvre avec le guidage
              </Link>
            </section>
          </aside>
        </div>
      ) : null}

      {/* PREP Phase */}
      {oral.wizardPhase === 'PREP' && oral.session ? (
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <section
            className="rounded-xl border p-6 md:p-7"
            style={{
              background: 'var(--eaf-bg1)',
              borderColor: 'rgba(123, 142, 255, 0.12)',
            }}
          >
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-gold)]">Préparation</p>
                <h2
                  className="mt-2 text-3xl leading-tight text-[var(--eaf-fg0)]"
                  style={{ fontFamily: 'var(--font-heading, Fraunces, serif)', letterSpacing: '-1px' }}
                >
                  Préparation
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--eaf-fg2)]">
                  Lis, structure, choisis tes procédés et prépare la grammaire. Les notes restent un brouillon de travail, pas un objet évalué.
                </p>
              </div>

              <div
                className="rounded-xl border p-5"
                style={{
                  background: 'var(--eaf-bg2)',
                  borderColor: 'rgba(123, 142, 255, 0.1)',
                }}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--eaf-indigo)]">Extrait tiré</p>
                <p
                  data-testid="extrait-texte"
                  className="mt-4 font-serif text-base leading-8 text-[var(--eaf-fg0)]"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  {oral.session.texte}
                </p>
                <div className="mt-5 space-y-2 text-sm leading-7 text-[var(--eaf-fg2)]">
                  <p>
                    <span className="font-semibold text-[var(--eaf-fg0)]">Question de grammaire :</span>{' '}
                    {oral.session.questionGrammaire}
                  </p>
                  {oral.session.phraseGrammaire ? (
                    <p>
                      <span className="font-semibold text-[var(--eaf-fg0)]">Phrase cible :</span>{' '}
                      {oral.session.phraseGrammaire}
                    </p>
                  ) : null}
                  {oral.session.oeuvreChoisie ? (
                    <p>
                      <span className="font-semibold text-[var(--eaf-fg0)]">Œuvre choisie (entretien) :</span>{' '}
                      {oral.session.oeuvreChoisie}
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <label htmlFor="prep-notes" className="mb-2 block text-sm font-semibold text-[var(--eaf-fg0)]">
                  Notes de préparation (brouillon — non évaluées)
                </label>
                <textarea
                  id="prep-notes"
                  value={oral.prepNotes}
                  onChange={(event) => oral.setPrepNotes(event.target.value)}
                  className="min-h-60 w-full rounded-xl border px-4 py-4 text-sm leading-7 outline-none transition-all duration-200 placeholder:text-[var(--eaf-fg3)]"
                  style={{
                    borderColor: 'rgba(123, 142, 255, 0.2)',
                    background: 'var(--eaf-bg2)',
                    color: 'var(--eaf-fg0)',
                  }}
                  placeholder="Structure ton explication linéaire, prépare tes axes, note les procédés..."
                />
              </div>

              <Button
                data-testid="commencer-passage-btn"
                onClick={() => void oral.startPassage()}
                size="lg"
                icon={<Play className="h-4 w-4" />}
                className="rounded-xl font-semibold"
                style={{
                  background: 'var(--eaf-orange)',
                  color: '#050913',
                }}
              >
                Commencer le passage (20 min)
              </Button>
            </div>
          </section>

          <aside className="space-y-6">
            <section
              className="rounded-xl border p-5"
              style={{
                background: 'var(--eaf-teal)/5',
                borderColor: 'var(--eaf-teal)/20',
              }}
            >
              <OralPrepPhase
                remainingSeconds={oral.prepRemaining}
                onReset={oral.resetPrepChecklist}
                checklistItems={[...PREP_CHECKLIST]}
                checkedSet={oral.prepChecklistSet}
                toggleItem={oral.togglePrepChecklist}
              />
              <p className="mt-4 text-sm font-medium text-[var(--eaf-teal)]">
                {oral.prepChecklist.length}/{PREP_CHECKLIST.length} étapes complétées
              </p>
              <div className="mt-4">
                <OralChecklistWarning completed={oral.prepChecklist.length} total={PREP_CHECKLIST.length} descriptifCount={descriptifCount} />
              </div>
            </section>

            <DescriptifStatus />

            <section
              className="rounded-xl border p-5"
              style={{
                background: 'var(--eaf-bg2)',
                borderColor: 'rgba(123, 142, 255, 0.12)',
              }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-gold)]">Rappel</p>
              <p className="mt-4 text-sm leading-7 text-[var(--eaf-fg2)]">
                La préparation utile ne cherche pas à tout écrire. Elle cherche à sécuriser les mouvements du texte, deux ou trois procédés décisifs et une réponse propre à la grammaire.
              </p>
              <Link
                href={oral.oralTutorHref}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[var(--eaf-teal)]"
                style={{ color: 'var(--eaf-indigo)' }}
              >
                Débloquer un point avant le passage
              </Link>
            </section>
          </aside>
        </div>
      ) : null}

      {/* PASSAGE Phase */}
      {oral.wizardPhase === 'PASSAGE' && oral.session && oral.currentStep ? (
        <OralPassagePhase
          session={oral.session}
          currentStep={oral.currentStep}
          currentStepIndex={oral.currentStepIndex}
          steps={STEPS}
          stepLabels={STEP_LABELS}
          stepGuidance={STEP_GUIDANCE}
          passageRemaining={oral.passageRemaining}
          phaseRemaining={oral.phaseRemaining}
          isSimulation={oral.isSimulation}
          isMicOn={oral.isMicOn}
          transcript={oral.transcript}
          setTranscript={oral.setTranscript}
          toggleMic={oral.toggleMic}
          submitStep={oral.submitStep}
          isLoading={oral.isLoading}
          useServerVoice={oral.useServerVoice}
          aggregated={oral.aggregated}
          feedbacks={oral.feedbacks}
          examinerProfile={oral.examinerProfile}
          setExaminerProfile={oral.setExaminerProfile}
          juryTurns={oral.juryTurns}
          juryContainerRef={oral.juryContainerRef}
          isJuryLoading={oral.isJuryLoading}
          askExaminerFollowUp={oral.askExaminerFollowUp}
          oralTutorHref={oral.oralTutorHref}
        />
      ) : null}

      {/* BILAN Phase */}
      {oral.wizardPhase === 'BILAN' && oral.bilan ? (
        <OralResultsPanel bilan={oral.bilan} oralTutorHref={oral.oralTutorHref} onReset={oral.resetAll} />
      ) : null}

      {/* Toast notifications */}
      <div className="fixed bottom-24 right-6 z-50 space-y-2 md:bottom-6">
        {oral.badgeToasts.map((badge) => (
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
