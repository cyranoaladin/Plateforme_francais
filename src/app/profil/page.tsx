'use client';

import { useEffect, useState } from 'react';

export default function ProfilPage() {
  const [badges, setBadges] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/v1/badges/list');
      if (!response.ok) return;
      const payload = (await response.json()) as { badges: string[] };
      setBadges(payload.badges);
    };

    void load();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Mon profil</h1>
      <p className="text-muted-foreground">Galerie des badges obtenus.</p>

      <div className="grid md:grid-cols-2 gap-4">
        {badges.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">Aucun badge pour le moment.</div>
        )}
        {badges.map((badge) => (
          <div key={badge} className="rounded-xl border border-border bg-card p-5 font-medium">
            {badge}
          </div>
        ))}
      </div>
    </div>
  );
}
