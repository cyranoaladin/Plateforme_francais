import { FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
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
          style={{ background: 'var(--eaf-indigo)/10', color: 'var(--eaf-indigo)' }}
        >
          <Sparkles className="h-5 w-5" style={{ color: 'var(--eaf-indigo)' }} />
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-indigo)]">Étape 1</p>
          <h2
            className="mt-2 text-3xl leading-tight text-[var(--eaf-fg0)]"
            style={{ fontFamily: 'var(--font-heading, Fraunces, serif)', letterSpacing: '-1px' }}
          >
            Génère un sujet d'épreuve blanche.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--eaf-fg2)]">
            Le sujet doit être suffisamment cadré pour lancer un vrai travail, mais assez souple pour coller à l'œuvre ou au thème que tu veux réactiver.
          </p>
        </div>
      </div>

      {!epreuve ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label htmlFor="epreuve-type" className="mb-1.5 block text-sm font-medium text-[var(--eaf-fg2)]">
                Type
              </label>
              <select
                id="epreuve-type"
                value={type}
                onChange={(event) => onTypeChange(event.target.value as EpreuveType)}
                className="w-full appearance-none rounded-lg border px-3 py-3 text-sm outline-none transition-all focus:border-[var(--eaf-indigo)] focus:ring-2 focus:ring-[var(--eaf-indigo)]/20"
                style={{
                  borderColor: 'rgba(123, 142, 255, 0.2)',
                  background: 'var(--eaf-bg2)',
                  color: 'var(--eaf-fg0)',
                }}
              >
                <option value="commentaire">Commentaire</option>
                <option value="dissertation">Dissertation</option>
                <option value="contraction_essai">Contraction / Essai</option>
              </select>
            </div>
            <div>
              <label htmlFor="epreuve-oeuvre" className="mb-1.5 block text-sm font-medium text-[var(--eaf-fg2)]">
                Œuvre (optionnel)
              </label>
              <input
                id="epreuve-oeuvre"
                type="text"
                value={oeuvre}
                onChange={(event) => onOeuvreChange(event.target.value)}
                placeholder="Ex: Sido"
                className="w-full rounded-lg border px-3 py-3 text-sm outline-none transition-all focus:border-[var(--eaf-indigo)] focus:ring-2 focus:ring-[var(--eaf-indigo)]/20"
                style={{
                  borderColor: 'rgba(123, 142, 255, 0.2)',
                  background: 'var(--eaf-bg2)',
                  color: 'var(--eaf-fg0)',
                }}
              />
            </div>
            <div>
              <label htmlFor="epreuve-theme" className="mb-1.5 block text-sm font-medium text-[var(--eaf-fg2)]">
                Thème (optionnel)
              </label>
              <input
                id="epreuve-theme"
                type="text"
                value={theme}
                onChange={(event) => onThemeChange(event.target.value)}
                placeholder="Ex: la mémoire"
                className="w-full rounded-lg border px-3 py-3 text-sm outline-none transition-all focus:border-[var(--eaf-indigo)] focus:ring-2 focus:ring-[var(--eaf-indigo)]/20"
                style={{
                  borderColor: 'rgba(123, 142, 255, 0.2)',
                  background: 'var(--eaf-bg2)',
                  color: 'var(--eaf-fg0)',
                }}
              />
            </div>
          </div>
          <Button
            data-testid="generate-subject-btn"
            onClick={() => void onGenerate()}
            loading={isGenerating}
            icon={<Sparkles className="h-4 w-4" />}
            size="lg"
            className="rounded-xl font-semibold"
            style={{
              background: 'var(--eaf-indigo)',
              color: '#050913',
            }}
          >
            {isGenerating ? 'Génération…' : 'Générer mon sujet'}
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_280px]">
          <div
            className="rounded-xl border p-5"
            style={{
              borderColor: 'rgba(123, 142, 255, 0.12)',
              background: 'var(--eaf-bg2)',
            }}
          >
            <p className="text-sm font-semibold text-[var(--eaf-fg0)]">{sanitizeLlmText(epreuve.sujet)}</p>
            {sanitizeLlmText(epreuve.texte).length > 0 ? (
              <p className="mt-4 whitespace-pre-line text-sm italic leading-7 text-[var(--eaf-fg2)]">
                {sanitizeLlmText(epreuve.texte)}
              </p>
            ) : null}
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[var(--eaf-fg3)]">
              {sanitizeLlmText(epreuve.consignes)}
            </p>
          </div>
          <div
            className="rounded-xl border p-5"
            style={{
              background: 'var(--eaf-teal)/5',
              borderColor: 'var(--eaf-teal)/20',
            }}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" style={{ color: 'var(--eaf-teal)' }} />
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--eaf-teal)]">Barème</p>
            </div>
            <div className="mt-4 space-y-2.5">
              {baremeOfficiel
                ? baremeOfficiel.criteres.map((critere) => (
                    <div
                      key={critere.id}
                      className="rounded-lg border px-3 py-3 text-sm"
                      style={{
                        background: 'var(--eaf-bg1)',
                        borderColor: 'rgba(123, 142, 255, 0.1)',
                        color: 'var(--eaf-fg0)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span>{critere.label}</span>
                        <span className="font-semibold text-[var(--eaf-teal)]">{critere.points} pts</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[var(--eaf-fg3)]">
                        Niveaux : {critere.niveaux.map((niveau) => `N${niveau.level} (${niveau.points})`).join(' · ')}
                      </p>
                    </div>
                  ))
                : baremeEntries.map(([label, points]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-lg border px-3 py-3 text-sm"
                      style={{
                        background: 'var(--eaf-bg1)',
                        borderColor: 'rgba(123, 142, 255, 0.1)',
                        color: 'var(--eaf-fg0)',
                      }}
                    >
                      <span className="capitalize">{label.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-[var(--eaf-teal)]">{points} pts</span>
                    </div>
                  ))}
            </div>
            <button
              onClick={onReset}
              className="mt-4 min-h-[44px] text-sm font-medium transition-colors hover:underline"
              style={{ color: 'var(--eaf-teal)' }}
            >
              Changer de sujet
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
