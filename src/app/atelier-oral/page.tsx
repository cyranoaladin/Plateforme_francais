'use client';

import Link from 'next/link';
import { Play, Sparkles } from 'lucide-react';
import { OralHero } from '@/components/atelier-oral/OralHero';
import { Badge, Button } from '@/components/ui';
import { getCurrentAnneeScolaire } from '@/lib/date/current-school-year';
import { getProgrammeSelection } from '@/data/oeuvres-programme';
import { OralPrepPhase } from './components/OralPrepPhase';
import { OralChecklistWarning } from './components/OralChecklistWarning';
import { OralPassagePhase } from './components/OralPassagePhase';
import { OralResultsPanel } from './components/OralResultsPanel';
import { OralWorkSelector } from './components/OralWorkSelector';
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
  const oral = useOralSession({
    initialWork: programmeSelection.availableWorks[0] ?? '',
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <OralHero isSimulation={oral.isSimulation} />

      {oral.error ? (
        <div
          data-testid="error-alert"
          className="space-y-3 rounded-[24px] border border-[var(--border-accent)] bg-[var(--c-accent-subtle)] px-5 py-4 text-sm text-[var(--c-accent-text)]"
          role="alert"
          aria-live="assertive"
        >
          <p>{oral.error}</p>
          {oral.upgradeUrl ? (
            <Link
              href={oral.upgradeUrl}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-[var(--c-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--text-on-primary)] shadow-[var(--shadow-md)] transition-transform hover:scale-[1.02]"
            >
              Découvrir les plans
            </Link>
          ) : null}
        </div>
      ) : null}

      {oral.session ? (
        <section className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] px-5 py-4 shadow-[var(--shadow-md)]">
          <div className="flex flex-wrap items-center gap-3">
            {(['TIRAGE', 'PREP', 'PASSAGE', 'BILAN'] as const).map((phase) => (
              <Badge
                key={phase}
                variant={oral.wizardPhase === phase ? 'navy' : 'default'}
                size="md"
                className="uppercase tracking-[0.16em]"
              >
                {phase === 'TIRAGE'
                  ? 'Tirage'
                  : phase === 'PREP'
                    ? "Prépa 30'"
                    : phase === 'PASSAGE'
                      ? "Passage 20'"
                      : 'Bilan'}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}

      {oral.wizardPhase === 'TIRAGE' && !oral.session ? (
        <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <section className="rounded-[24px] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface-secondary)_100%)] p-6 shadow-[var(--shadow-md)] md:p-7">
            <OralWorkSelector
              availableWorks={programmeSelection.availableWorks}
              currentWork={oral.oeuvre}
              selectedMode={oral.mode}
              onSelectWork={oral.setOeuvre}
              onChangeMode={oral.setMode}
              examinerProfile={oral.examinerProfile}
              onChangeProfile={oral.setExaminerProfile}
              showProgrammeWarning={programmeSelection.showProgrammeWarning}
              warningMessage={programmeSelection.warningMessage}
            />
            <div className="mt-6 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-primary)]/8 text-[var(--c-primary)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Démarrage</p>
                <h2 className="font-display mt-2 text-3xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
                  Tirage au sort de l’extrait
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                  Choisis ton œuvre et le niveau de contrainte. La plateforme tire l’extrait, la question de grammaire puis t’installe directement dans le rythme de l’épreuve.
                </p>
              </div>
            </div>

              <Button
                data-testid="start-session-btn"
                onClick={() => void oral.startSession()}
                disabled={oral.isLoading}
                variant="primary"
                size="md"
                loading={oral.isLoading}
                icon={!oral.isLoading ? <Play className="h-4 w-4" /> : undefined}
                className="mt-6"
              >
                Tirer un extrait
              </Button>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[24px] border border-[var(--border-success)] bg-[var(--bg-success)] p-5 shadow-[var(--shadow-md)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-success)]">Ce qui va suivre</p>
              <div className="mt-4 space-y-3">
                {[
                  'Préparation structurée de 30 minutes avec notes personnelles.',
                  'Passage en quatre temps : lecture, explication, grammaire, entretien.',
                  'Bilan final /20 avec conseil concret pour la prochaine séance.',
                ].map((item, index) => (
                  <div
                    key={item}
                    className="rounded-[16px] border border-[var(--border-success)] bg-[var(--bg-surface)]/88 px-4 py-4 text-sm leading-7 text-[var(--text-body)]"
                  >
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--c-success)]/10 text-xs font-semibold text-[var(--c-success)]">
                      {index + 1}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] p-5 shadow-[var(--shadow-md)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Bon usage</p>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                Une bonne simulation orale ne cherche pas à parler beaucoup. Elle cherche à rendre la parole plus nette, plus articulée et plus défendable étape après étape.
              </p>
              <Link
                href={oral.oralTutorHref}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--c-primary)] transition-colors hover:text-[var(--c-success)]"
              >
                Préparer cette œuvre avec le guidage
              </Link>
            </section>
          </aside>
        </div>
      ) : null}

      {oral.wizardPhase === 'PREP' && oral.session ? (
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <section className="rounded-[24px] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface-secondary)_100%)] p-6 shadow-[var(--shadow-md)] md:p-7">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Préparation</p>
                <h2 className="font-display mt-2 text-3xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
                  Préparation
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                  Lis, structure, choisis tes procédés et prépare la grammaire. Les notes restent un brouillon de travail, pas un objet évalué.
                </p>
              </div>

              <div className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-md)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--c-reward)]">Extrait tiré</p>
                <p data-testid="extrait-texte" className="mt-4 font-serif text-base leading-8 text-[var(--c-primary)]">
                  {oral.session.texte}
                </p>
                <div className="mt-5 space-y-2 text-sm leading-7 text-[var(--text-body)]">
                  <p>
                    <span className="font-semibold text-[var(--c-primary)]">Question de grammaire :</span>{' '}
                    {oral.session.questionGrammaire}
                  </p>
                  {oral.session.phraseGrammaire ? (
                    <p>
                      <span className="font-semibold text-[var(--c-primary)]">Phrase cible :</span>{' '}
                      {oral.session.phraseGrammaire}
                    </p>
                  ) : null}
                  {oral.session.oeuvreChoisie ? (
                    <p>
                      <span className="font-semibold text-[var(--c-primary)]">Œuvre choisie (entretien) :</span>{' '}
                      {oral.session.oeuvreChoisie}
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <label htmlFor="prep-notes" className="mb-2 block text-sm font-semibold text-[var(--c-primary)]">
                  Notes de préparation (brouillon — non évaluées)
                </label>
                <textarea
                  id="prep-notes"
                  value={oral.prepNotes}
                  onChange={(event) => oral.setPrepNotes(event.target.value)}
                  className="min-h-60 w-full rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-4 text-sm leading-7 text-[var(--c-primary)] outline-none transition-all duration-[var(--transition-normal)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--c-success)] focus-visible:ring-2 focus-visible:ring-[var(--c-success)]/20"
                  placeholder="Structure ton explication linéaire, prépare tes axes, note les procédés..."
                />
              </div>

              <Button
                data-testid="commencer-passage-btn"
                onClick={() => void oral.startPassage()}
                variant="primary"
                size="md"
                icon={<Play className="h-4 w-4" />}
              >
                Commencer le passage (20 min)
              </Button>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[24px] border border-[var(--border-success)] bg-[var(--bg-success)] p-5 shadow-[var(--shadow-md)]">
              <OralPrepPhase
                remainingSeconds={oral.prepRemaining}
                onReset={oral.resetPrepChecklist}
                checklistItems={[...PREP_CHECKLIST]}
                checkedSet={oral.prepChecklistSet}
                toggleItem={oral.togglePrepChecklist}
              />
              <p className="mt-4 text-sm font-medium text-[var(--c-success)]">
                {oral.prepChecklist.length}/{PREP_CHECKLIST.length} étapes complétées
              </p>
              <div className="mt-4">
                <OralChecklistWarning completed={oral.prepChecklist.length} total={PREP_CHECKLIST.length} />
              </div>
            </section>

            <section className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] p-5 shadow-[var(--shadow-md)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Rappel</p>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                La préparation utile ne cherche pas à tout écrire. Elle cherche à sécuriser les mouvements du texte, deux ou trois procédés décisifs et une réponse propre à la grammaire.
              </p>
              <Link
                href={oral.oralTutorHref}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--c-primary)] transition-colors hover:text-[var(--c-success)]"
              >
                Débloquer un point avant le passage
              </Link>
            </section>
          </aside>
        </div>
      ) : null}

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

      {oral.wizardPhase === 'BILAN' && oral.bilan ? (
        <OralResultsPanel bilan={oral.bilan} oralTutorHref={oral.oralTutorHref} onReset={oral.resetAll} />
      ) : null}

      <div className="fixed bottom-24 right-6 z-50 space-y-2 md:bottom-6">
        {oral.badgeToasts.map((badge) => (
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
