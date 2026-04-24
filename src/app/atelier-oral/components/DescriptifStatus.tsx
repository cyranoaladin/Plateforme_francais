'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, AlertCircle, CheckCircle } from '@/components/ui/icons';
import { Button } from '@/components/ui';

type DescriptifItem = {
  id: string;
  label: string;
  detail: string;
};

export function DescriptifStatus() {
  const [items, setItems] = useState<DescriptifItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDescriptif();
  }, []);

  const loadDescriptif = async () => {
    try {
      const res = await fetch('/api/v1/student/descriptif');
      if (res.ok) {
        const data = await res.json();
        const textes: DescriptifItem[] = (data.textes ?? []).map((t: { id: string; oeuvre: string; auteur: string; titre: string }) => ({
          id: t.id,
          label: `${t.oeuvre} — ${t.auteur}`,
          detail: t.titre,
        }));
        setItems(textes);
      }
    } catch {
      // silent — component is non-critical
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] p-5 shadow-[var(--shadow-md)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-primary)]">Descriptif de lecture</p>
        <p className="mt-4 text-sm text-[var(--text-muted)]">Chargement...</p>
      </section>
    );
  }

  const hasTextes = items.length > 0;

  return (
    <section className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] p-5 shadow-[var(--shadow-md)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-primary)]">Descriptif de lecture</p>

      {hasTextes ? (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">{items.length} textes dans ton descriptif</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mb-3">
            Le tirage se fera dans ta liste personnelle.
          </p>
          <div className="space-y-1">
            {items.slice(0, 3).map((item) => (
              <div key={item.id} className="text-xs text-[var(--text-body)] truncate">
                {item.label} — {item.detail}
              </div>
            ))}
            {items.length > 3 && (
              <div className="text-xs text-[var(--text-muted)]">
                … et {items.length - 3} autre(s)
              </div>
            )}
          </div>
          <Link href="/descriptif-lecture">
            <Button variant="ghost" size="sm" className="mt-3 text-xs">
              <BookOpen className="h-3 w-3 mr-1" />
              Modifier mon descriptif
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-sm text-amber-600 mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Descriptif vide</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mb-3">
            Ton descriptif de lecture est vide. L'atelier va simuler sur la liste générale du programme.
          </p>
          <p className="text-xs text-[var(--text-secondary)] mb-3">
            Pour t'entraîner sur TES textes, configure ton descriptif :
          </p>
          <Link href="/descriptif-lecture">
            <Button variant="primary" size="sm" className="text-xs">
              <BookOpen className="h-3 w-3 mr-1" />
              Configurer mon descriptif
            </Button>
          </Link>
        </div>
      )}
    </section>
  );
}
