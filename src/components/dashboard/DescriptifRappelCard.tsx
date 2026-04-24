'use client';

import Link from 'next/link';
import { AlertTriangle, FileText, ArrowRight } from '@/components/ui/icons';

interface DescriptifRappelCardProps {
  current: number;
  minimum: number;
}

export function DescriptifRappelCard({ current, minimum }: DescriptifRappelCardProps) {
  const manquants = minimum - current;
  const pct = Math.min(Math.round((current / minimum) * 100), 100);

  return (
    <div
      className="rounded-[16px] p-5"
      style={{
        background: 'rgba(255,107,53,0.06)',
        border: '1px solid rgba(255,107,53,0.30)',
      }}
    >
      <div className="flex items-start gap-4">
        {/* Icône */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
          style={{
            background: 'rgba(255,107,53,0.12)',
            border: '1px solid rgba(255,107,53,0.25)',
          }}
        >
          <AlertTriangle className="h-[18px] w-[18px]" style={{ color: 'var(--eaf-orange)' }} />
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <p
            className="text-[15px] font-bold mb-1"
            style={{ color: 'var(--eaf-orange)' }}
          >
            Ton descriptif de lecture est incomplet
          </p>
          <p
            className="text-[13px] leading-[1.6] mb-3"
            style={{ color: 'var(--eaf-text-secondary)' }}
          >
            L&apos;atelier oral simule l&apos;épreuve à partir de{' '}
            <strong style={{ color: 'var(--eaf-text-primary)' }}>
              tes textes réellement étudiés en classe
            </strong>
            . Sans eux, la simulation reste générique et peu fidèle à l&apos;examen réel. Il manque encore{' '}
            <strong style={{ color: 'var(--eaf-orange)' }}>
              {manquants} texte{manquants > 1 ? 's' : ''}
            </strong>{' '}
            pour atteindre le minimum réglementaire.
          </p>

          {/* Barre de progression */}
          <div
            className="h-[4px] rounded-full mb-2"
            style={{ background: 'var(--eaf-bg3)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: pct >= 80 ? 'var(--eaf-teal)' : 'var(--eaf-orange)',
              }}
            />
          </div>
          <p
            className="text-[12px] mb-4"
            style={{ color: 'var(--eaf-text-tertiary)' }}
          >
            {current} / {minimum} textes déposés ({pct}%)
          </p>

          {/* CTA */}
          <Link
            href="/descriptif-lecture"
            className="inline-flex items-center gap-2 rounded-[9px] px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:-translate-y-px"
            style={{
              background: 'var(--eaf-orange)',
              boxShadow: '0 2px 12px rgba(255,107,53,0.25)',
            }}
          >
            <FileText className="h-[14px] w-[14px]" />
            Déposer mes textes
            <ArrowRight className="h-[14px] w-[14px]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
