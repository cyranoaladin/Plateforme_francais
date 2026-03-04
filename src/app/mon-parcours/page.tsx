'use client';

import { useEffect, useMemo, useState } from 'react';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

type Plan = {
  semaines: {
    numero: number;
    objectif: string;
    activites: { type: string; titre: string; duree: string; lien: string }[];
  }[];
};

type ProfilePayload = {
  displayName: string;
  skillMap?: {
    ecrit: number;
    oral: number;
    grammaire: number;
    lectureCursive: number;
  };
  studyPlan?: {
    tasks: Array<{
      id: string;
      description: string;
      dueDate: string;
      estimatedMinutes: number;
      skill: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  };
};

export default function MonParcoursPage() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [profileResponse, planResponse] = await Promise.all([
          fetch('/api/v1/student/profile'),
          fetch('/api/v1/parcours/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': getCsrfTokenFromDocument(),
            },
            body: JSON.stringify({}),
          }),
        ]);

        if (profileResponse.ok) {
          setProfile((await profileResponse.json()) as ProfilePayload);
        }

        if (!planResponse.ok) {
          throw new Error('Génération du parcours indisponible.');
        }

        setPlan((await planResponse.json()) as Plan);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erreur de chargement.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const weekTasks = useMemo(() => {
    if (!plan) {
      return [] as Array<{ id: string; titre: string; type: string; duree: string; lien: string; semaine: number }>;
    }
    return plan.semaines.flatMap((week) =>
      week.activites.slice(0, 5).map((activity, idx) => ({
        id: `${week.numero}-${idx}-${activity.titre}`,
        titre: activity.titre,
        type: activity.type,
        duree: activity.duree,
        lien: activity.lien,
        semaine: week.numero,
      })),
    );
  }, [plan]);

  const toggleActivity = async (id: string) => {
    const next = new Set(checkedIds);
    const willBeChecked = !next.has(id);
    if (willBeChecked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setCheckedIds(next);

    await fetch('/api/v1/memory/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfTokenFromDocument(),
      },
      body: JSON.stringify({
        type: 'interaction',
        feature: 'study_plan_toggle',
        path: '/mon-parcours',
        payload: {
          taskId: id,
          done: willBeChecked,
        },
      }),
    });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Mon parcours</h1>
      <p className="text-muted-foreground">Planning hebdomadaire personnalisé selon ton profil et la session 2026.</p>

      {error && <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-error text-sm">{error}</div>}
      {isLoading && <div className="text-sm text-muted-foreground">Chargement du plan personnalisé...</div>}

      {profile?.studyPlan?.tasks?.length ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold mb-3">Priorités (3 prochaines tâches)</h2>
          <div className="space-y-2">
            {profile.studyPlan.tasks.slice(0, 3).map((task) => (
              <div key={task.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                <p className="font-medium">{task.description}</p>
                <p className="text-xs text-muted-foreground">
                  {task.estimatedMinutes} min · {new Date(task.dueDate).toLocaleDateString('fr-FR')} · {task.priority}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="space-y-5">
        {(plan?.semaines ?? []).map((week) => (
          <section key={week.numero} className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Semaine {week.numero}</h2>
            <p className="text-sm text-muted-foreground mt-1">{week.objectif}</p>
            <div className="mt-3 space-y-2">
              {week.activites.slice(0, 5).map((activity, idx) => {
                const id = `${week.numero}-${idx}-${activity.titre}`;
                const checked = checkedIds.has(id);
                return (
                  <label key={id} className="flex items-center gap-3 p-2 rounded border border-border cursor-pointer">
                    <input type="checkbox" checked={checked} onChange={() => void toggleActivity(id)} />
                    <div>
                      <p className="text-sm font-medium">{activity.titre}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.type} · {activity.duree}
                      </p>
                    </div>
                    <a href={activity.lien} className="ml-auto text-xs text-primary underline">
                      Ouvrir
                    </a>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {weekTasks.length === 0 && !isLoading && (
        <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          Aucun parcours disponible pour le moment.
        </div>
      )}
    </div>
  );
}
