export function getCurrentAnneeScolaire(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}
