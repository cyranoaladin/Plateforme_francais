'use client';

import { useEffect, useState } from 'react';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

type Plan = {
  semaines: {
    numero: number;
    objectif: string;
    activites: { type: string; titre: string; duree: string; lien: string }[];
  }[];
};

type Profile = {
  displayName: string;
  classLevel: string;
  targetScore: string;
  onboardingCompleted: boolean;
  selectedOeuvres: string[];
  parcoursProgress: string[];
  preferredObjects: string[];
  weakSkills: string[];
};

export default function MonParcoursPage() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [progress, setProgress] = useState<string[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const profileResponse = await fetch('/api/v1/student/profile');
      if (profileResponse.ok) {
        const profilePayload = (await profileResponse.json()) as Profile;
        setProfile(profilePayload);
        setProgress(profilePayload.parcoursProgress ?? []);
      }

      setIsLoading(true);
      const response = await fetch('/api/v1/parcours/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfTokenFromDocument(),
        },
        body: JSON.stringify({}),
      });
      setIsLoading(false);

      if (response.ok) {
        setPlan((await response.json()) as Plan);
      }
    };

    void load();
  }, []);

  const toggleActivity = async (id: string) => {
    const next = progress.includes(id) ? progress.filter((item) => item !== id) : [...progress, id];
    setProgress(next);

    if (!profile) return;

    await fetch('/api/v1/student/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfTokenFromDocument(),
      },
      body: JSON.stringify({ parcoursProgress: next }),
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Mon parcours</h1>
      <p className="text-muted-foreground">Plan de révision hebdomadaire personnalisé.</p>

      {isLoading && <p>Chargement du plan...</p>}

      <div className="space-y-5">
        {(plan?.semaines ?? []).map((week) => (
          <section key={week.numero} className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Semaine {week.numero}</h2>
            <p className="text-sm text-muted-foreground mt-1">{week.objectif}</p>
            <div className="mt-3 space-y-2">
              {week.activites.map((activity, idx) => {
                const id = `${week.numero}-${idx}-${activity.titre}`;
                const checked = progress.includes(id);
                return (
                  <label key={id} className="flex items-center gap-3 p-2 rounded border border-border cursor-pointer">
                    <input type="checkbox" checked={checked} onChange={() => void toggleActivity(id)} />
                    <div>
                      <p className="text-sm font-medium">{activity.titre}</p>
                      <p className="text-xs text-muted-foreground">{activity.type} • {activity.duree}</p>
                    </div>
                    <a href={activity.lien} className="ml-auto text-xs text-primary underline">Ouvrir</a>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
