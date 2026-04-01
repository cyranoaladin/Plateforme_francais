type Props = {
  completed: number;
  total: number;
};

export function OralChecklistWarning({ completed, total }: Props) {
  if (completed >= total) {
    return null;
  }

  return (
    <div className="rounded-[16px] border border-[var(--border-reward)] bg-[var(--bg-reward)] px-4 py-3 text-sm text-[var(--text-reward-on-subtle)]">
      Checklist incomplète : termine tes repères de préparation avant de lancer le passage.
    </div>
  );
}
