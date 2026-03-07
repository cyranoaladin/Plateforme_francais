type TutorContext = {
  workId?: string | null;
  parcours?: string | null;
  sessionId?: string | null;
};

export function buildTuteurHref(context?: TutorContext): string {
  const searchParams = new URLSearchParams();

  if (context?.workId) {
    searchParams.set('workId', context.workId);
  }
  if (context?.parcours) {
    searchParams.set('parcours', context.parcours);
  }
  if (context?.sessionId) {
    searchParams.set('sessionId', context.sessionId);
  }

  const query = searchParams.toString();
  return query.length > 0 ? `/tuteur?${query}` : '/tuteur';
}
