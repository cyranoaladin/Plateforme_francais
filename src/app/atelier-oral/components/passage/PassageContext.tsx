import { type SessionPayload } from '../../types';

type Props = {
  session: SessionPayload;
};

export function PassageContext({ session }: Props) {
  return (
    <details className="mt-6 rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-md)]">
      <summary className="cursor-pointer text-sm font-semibold text-[var(--c-primary)]">
        Extrait & question de grammaire
      </summary>
      <p className="mt-3 font-serif text-sm leading-7 text-[var(--c-primary)]">{session.texte}</p>
      <div className="mt-3 space-y-2 text-sm leading-7 text-[var(--text-body)]">
        <p>
          <span className="font-semibold text-[var(--c-primary)]">Grammaire :</span>{' '}
          {session.questionGrammaire}
        </p>
        {session.phraseGrammaire ? (
          <p>
            <span className="font-semibold text-[var(--c-primary)]">Phrase cible :</span>{' '}
            {session.phraseGrammaire}
          </p>
        ) : null}
        {session.oeuvreChoisie ? (
          <p>
            <span className="font-semibold text-[var(--c-primary)]">Entretien sur :</span>{' '}
            {session.oeuvreChoisie}
          </p>
        ) : null}
      </div>
    </details>
  );
}
