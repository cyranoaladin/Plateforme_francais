export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-8 w-48 rounded-lg bg-[var(--navy)]/10" />
      <div className="h-4 w-full max-w-md rounded bg-[var(--navy)]/5" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 rounded-2xl bg-[var(--navy)]/5" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-[var(--navy)]/5" />
    </div>
  );
}
