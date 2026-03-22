/**
 * Messages de reset de quota lisibles pour les élèves.
 * Utilisé dans tous les body 402 pour indiquer quand le quota se réinitialise.
 */
export function getResetMessage(period: 'day' | 'week' | 'month'): string {
  if (period === 'day') {
    return 'Ton quota quotidien se réinitialise ce soir à minuit.';
  }
  if (period === 'week') {
    return 'Ton quota hebdomadaire se réinitialise lundi prochain.';
  }
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const formatted = nextMonth.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `Ton quota mensuel se réinitialise le ${formatted}.`;
}
