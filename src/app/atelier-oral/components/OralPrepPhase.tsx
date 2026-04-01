import { useMemo } from 'react';

type ChecklistItem = { id: string; label: string };

type Props = {
  remainingSeconds: number;
  onReset: () => void;
  checklistItems: ChecklistItem[];
  checkedSet: Set<string>;
  toggleItem: (id: string) => void;
};

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export function OralPrepPhase({
  remainingSeconds,
  onReset,
  checklistItems,
  checkedSet,
  toggleItem,
}: Props) {
  const progress = useMemo(() => Math.max(0, Math.min(100, (1 - remainingSeconds / 1800) * 100)), [
    remainingSeconds,
  ]);

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Préparation libre (30 min)</p>
          <p className="text-3xl font-mono">{formatTime(remainingSeconds)}</p>
        </div>
        <button type="button" className="text-xs uppercase" onClick={onReset}>
          Réinitialiser
        </button>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200">
        <div style={{ width: `${progress}%` }} className="h-full rounded-full bg-sky-500" />
      </div>
      <div className="space-y-2">
        {checklistItems.map((item) => (
          <label key={item.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={checkedSet.has(item.id)}
              onChange={() => toggleItem(item.id)}
              className="accent-sky-500"
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
