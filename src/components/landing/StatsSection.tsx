/**
 * StatsSection — 3 key metrics with counter-up animation on scroll.
 * Dependencies: none (Intersection Observer + rAF)
 */
'use client';

import { useEffect, useRef, useState } from 'react';

interface Stat {
  value: number;
  unit: string;
  prefix: string;
  label: string;
  sub: string;
  decimals: number;
}

const STATS: Stat[] = [
  {
    value: 4.2,
    unit: 'pts',
    prefix: '+',
    label: "à l'oral en 4 semaines",
    sub: 'Vs 0 point gagné avec ChatGPT seul',
    decimals: 1,
  },
  {
    value: 3,
    unit: 'min',
    prefix: '',
    label: 'pour corriger une copie',
    sub: 'Contre 48h chez un prof particulier',
    decimals: 0,
  },
  {
    value: 98,
    unit: '%',
    prefix: '',
    label: 'de mention (AB et plus)',
    sub: 'Élèves Premium, session 2025',
    decimals: 0,
  },
];

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function AnimatedNumber({ stat }: { stat: Stat }) {
  const [display, setDisplay] = useState('0');
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;

          // Respect prefers-reduced-motion
          const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (prefersReduced) {
            setDisplay(stat.value.toFixed(stat.decimals));
            return;
          }

          const duration = 1200;
          const start = performance.now();

          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOut(progress);
            const current = eased * stat.value;
            setDisplay(current.toFixed(stat.decimals));
            if (progress < 1) requestAnimationFrame(tick);
          };

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [stat.value, stat.decimals]);

  return (
    <div ref={ref} className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
      <p className="tabular-nums text-4xl font-bold text-violet-600">
        {stat.prefix}{display}{stat.unit}
      </p>
      <p className="mt-2 text-base font-medium text-gray-800">{stat.label}</p>
      <p className="mt-1 text-sm text-gray-400">{stat.sub}</p>
    </div>
  );
}

export function StatsSection() {
  return (
    <section className="bg-gray-50 px-4 py-16" aria-label="Résultats mesurables">
      <div className="mx-auto max-w-4xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STATS.map((stat) => (
            <AnimatedNumber key={stat.label} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
