import { Sparkles } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { BAREMES } from '@/data/baremes-officiels';
import { sanitizeLlmText } from '@/lib/ui/sanitize-llm';
import { type EpreuvePayload, type EpreuveType } from '../types';

type Props = {
  type: EpreuveType;
  oeuvre: string;
  theme: string;
  onTypeChange: (value: EpreuveType) => void;
  onOeuvreChange: (value: string) => void;
  onThemeChange: (value: string) => void;
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
  epreuve: EpreuvePayload | null;
  baremeEntries?: Array<[string, number]>;
  onReset?: () => void;
};

export function EcritEpreuveSelector({
  type,
  oeuvre,
  theme,
  onTypeChange,
  onOeuvreChange,
  onThemeChange,
  onGenerate,
  isGenerating,
  epreuve,
  baremeEntries = [],
  onReset,
}: Props) {
  const baremeOfficiel = type === 'commentaire' || type === 'dissertation'
    ? BAREMES[type]
    : null;

  return (
    <section className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface)_100%)] p-6 shadow-[var(--shadow-md)] md:p-7">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-primary)]/8 text-[var(--c-primary)]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Étape 1</p>
          <h2 className="font-display mt-2 text-3xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
            Génère un sujet d'épreuve blanche.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
            Le sujet doit être suffisamment cadré pour lancer un vrai travail, mais assez souple pour coller à l'œuvre ou au thème que tu veux réactiver.
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
                onChange={(event) => onTypeChange(event.target.value as EpreuveType)}
                className="w-full appearance-none rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-3 text-sm text-[var(--c-primary)] outline-none transition-all duration-[var(--transition-normal)] focus:border-[var(--c-success)] focus:ring-2 focus:ring-[var(--c-success)]/20"
              >
                <option value="commentaire">Commentaire</option>
                <option value="dissertation">Dissertation</option>
                <option value="contraction_essai">Contraction / Essai</option>
              </select>
            </div>
            <Input
              label={'Œuvre (optionnel)'}
              id="epreuve-oeuvre"
              value={oeuvre}
              onChange={(event) => onOeuvreChange(event.target.value)}
              placeholder="Ex: Sido"
              size="md"
            />
            <Input
              label="Thème (optionnel)"
              id="epreuve-theme"
              value={theme}
              onChange={(event) => onThemeChange(event.target.value)}
              placeholder="Ex: la mémoire"
              size="md"
            />
          </div>
          <Button
            data-testid="generate-subject-btn"
            onClick={() => void onGenerate()}
            loading={isGenerating}
            icon={<Sparkles className="h-4 w-4" />}
            size="lg"
            className="rounded-[var(--radius-lg)] font-semibold"
          >
            {isGenerating ? 'Génération…' : 'Générer mon sujet'}
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-sm)]">
            <p className="text-sm font-semibold text-[var(--c-primary)]">{sanitizeLlmText(epreuve.sujet)}</p>
            {sanitizeLlmText(epreuve.texte).length > 0 ? (
              <p className="mt-4 whitespace-pre-line text-sm italic leading-7 text-[var(--text-body)]">
                {sanitizeLlmText(epreuve.texte)}
              </p>
            ) : null}
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[var(--text-secondary)]">
              {sanitizeLlmText(epreuve.consignes)}
            </p>
          </div>
          <div className="rounded-[var(--radius-2xl)] border border-[var(--border-success)] bg-[var(--bg-success)] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--c-success)]">Barème</p>
            <div className="mt-4 space-y-2.5">
              {baremeOfficiel
                ? baremeOfficiel.criteres.map((critere) => (
                    <div
                      key={critere.id}
                      className="rounded-[var(--radius-lg)] border border-[var(--border-success)] bg-[var(--bg-surface)] px-3 py-3 text-sm text-[var(--c-primary)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span>{critere.label}</span>
                        <span className="font-semibold">{critere.points} pts</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                        Niveaux : {critere.niveaux.map((niveau) => `N${niveau.level} (${niveau.points})`).join(' · ')}
                      </p>
                    </div>
                  ))
                : baremeEntries.map(([label, points]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border-success)] bg-[var(--bg-surface)] px-3 py-3 text-sm text-[var(--c-primary)]"
                    >
                      <span className="capitalize">{label.replace(/_/g, ' ')}</span>
                      <span className="font-semibold">{points} pts</span>
                    </div>
                  ))}
            </div>
            <button
              onClick={onReset}
              className="mt-4 min-h-[44px] text-sm font-medium text-[var(--c-success)] hover:underline"
            >
              Changer de sujet
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
