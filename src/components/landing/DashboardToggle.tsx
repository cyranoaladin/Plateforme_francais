'use client';

import { useState } from 'react';

export function DashboardToggle() {
  const [view, setView] = useState<'eleve' | 'parent'>('eleve');

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--eaf-bg1), #0d1829)',
        border: '1px solid var(--eaf-border)',
        borderRadius: '24px',
        padding: '48px',
      }}
    >
      {/* Orbe de fond */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(123,142,255,0.06), transparent 70%)',
          top: '-50px',
          right: '-50px',
        }}
      />

      {/* Header */}
      <div className="relative">
        <div
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--eaf-indigo)',
            fontWeight: 600,
            marginBottom: '8px',
          }}
        >
          Un tableau de bord pour chacun
        </div>
        <h2
          style={{
            fontFamily: 'var(--eaf-font-display)',
            fontSize: '34px',
            fontWeight: 700,
            color: 'var(--eaf-text-primary)',
          }}
        >
          L'élève suit sa progression,
          <br />
          le parent garde le contrôle.
        </h2>

        {/* Toggle */}
        <div
          className="flex gap-2 mt-6"
          style={{
            background: 'var(--eaf-bg0)',
            border: '1px solid var(--eaf-border)',
            borderRadius: '12px',
            padding: '6px',
            width: 'fit-content',
          }}
        >
          <button
            onClick={() => setView('eleve')}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              background: view === 'eleve' ? 'var(--eaf-bg3)' : 'transparent',
              color:
                view === 'eleve'
                  ? 'var(--eaf-text-primary)'
                  : 'var(--eaf-text-secondary)',
              border: view === 'eleve' ? '1px solid var(--eaf-border)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Élève
          </button>
          <button
            onClick={() => setView('parent')}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              background: view === 'parent' ? 'var(--eaf-bg3)' : 'transparent',
              color:
                view === 'parent'
                  ? 'var(--eaf-text-primary)'
                  : 'var(--eaf-text-secondary)',
              border: view === 'parent' ? '1px solid var(--eaf-border)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Parent
          </button>
        </div>
      </div>

      {/* Dashboard preview */}
      {view === 'eleve' ? <StudentDashboard /> : <ParentDashboard />}
    </div>
  );
}

function StudentDashboard() {
  return (
    <div
      className="mt-8"
      style={{
        background: 'var(--eaf-bg0)',
        border: '1px solid var(--eaf-border)',
        borderRadius: '16px',
        padding: '28px',
        maxWidth: '500px',
      }}
    >
      {/* Header utilisateur */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="flex items-center justify-center text-white font-bold"
          style={{
            width: '40px',
            height: '40px',
            background: 'var(--eaf-gradient-indigo-deep)',
            borderRadius: '10px',
            fontSize: '15px',
          }}
        >
          SL
        </div>
        <div>
          <div
            style={{ fontSize: '15px', fontWeight: 600, color: 'var(--eaf-text-primary)' }}
          >
            Sarah L.
          </div>
          <div style={{ fontSize: '12px', color: 'var(--eaf-text-tertiary)' }}>
            Première — Français EAF
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: '13px', color: 'var(--eaf-text-secondary)' }}>
          Objectif : 14/20
        </span>
        <span
          style={{ fontSize: '13px', fontWeight: 600, color: 'var(--eaf-indigo)' }}
        >
          67 %
        </span>
      </div>
      <div
        style={{
          height: '6px',
          background: 'var(--eaf-bg2)',
          borderRadius: '3px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            height: '100%',
            width: '67%',
            background: 'var(--eaf-gradient-progress)',
            borderRadius: '3px',
          }}
        />
      </div>

      {/* KPIs */}
      <div
        className="grid gap-2.5 mb-4"
        style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
      >
        <div
          style={{
            background: 'var(--eaf-bg1)',
            border: '1px solid var(--eaf-border)',
            borderRadius: '10px',
            padding: '14px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--eaf-font-display)',
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--eaf-text-primary)',
            }}
          >
            12
          </div>
          <div style={{ fontSize: '11px', color: 'var(--eaf-text-tertiary)' }}>
            Corrections
          </div>
        </div>
        <div
          style={{
            background: 'var(--eaf-bg1)',
            border: '1px solid var(--eaf-border)',
            borderRadius: '10px',
            padding: '14px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--eaf-font-display)',
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--eaf-text-primary)',
            }}
          >
            5
          </div>
          <div style={{ fontSize: '11px', color: 'var(--eaf-text-tertiary)' }}>
            Oraux
          </div>
        </div>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(26,213,160,0.10), rgba(26,213,160,0.05))',
            border: '1px solid rgba(26,213,160,0.20)',
            borderRadius: '10px',
            padding: '14px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--eaf-font-display)',
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--eaf-teal)',
            }}
          >
            +2.3
          </div>
          <div style={{ fontSize: '11px', color: 'var(--eaf-text-tertiary)' }}>
            Progression
          </div>
        </div>
      </div>

      {/* Prochaine séance */}
      <div
        style={{
          background: 'var(--eaf-bg2)',
          border: '1px solid var(--eaf-border)',
          borderRadius: '10px',
          padding: '14px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--eaf-text-tertiary)',
            fontWeight: 600,
            marginBottom: '6px',
          }}
        >
          PROCHAINE SÉANCE
        </div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--eaf-text-primary)' }}>
          La Boétie
        </div>
        <div style={{ fontSize: '13px', color: 'var(--eaf-text-tertiary)' }}>
          Défendre et entretenir la liberté
        </div>
      </div>
    </div>
  );
}

function ParentDashboard() {
  return (
    <div
      className="mt-8"
      style={{
        background: 'var(--eaf-bg0)',
        border: '1px solid var(--eaf-border)',
        borderRadius: '16px',
        padding: '28px',
        maxWidth: '500px',
      }}
    >
      {/* Header parent */}
      <div className="flex items-center gap-3 mb-5">
        <div
          style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, var(--eaf-gold), #854f0b)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
            fontWeight: 700,
            color: 'white',
          }}
        >
          P
        </div>
        <div>
          <div
            style={{ fontSize: '15px', fontWeight: 600, color: 'var(--eaf-text-primary)' }}
          >
            Parent de Sarah L.
          </div>
          <div style={{ fontSize: '12px', color: 'var(--eaf-text-tertiary)' }}>
            Accès en lecture seule
          </div>
        </div>
      </div>

      {/* Alertes */}
      <div
        style={{
          background: 'rgba(255,107,53,0.10)',
          border: '1px solid rgba(255,107,53,0.25)',
          borderRadius: '10px',
          padding: '12px 14px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#ff8f61',
          }}
        >
          <span>⚠️</span>
          Objectif oral EAF dans 5 jours
        </div>
      </div>

      {/* Stats parent */}
      <div
        className="grid gap-2.5 mb-4"
        style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}
      >
        <div
          style={{
            background: 'var(--eaf-bg1)',
            border: '1px solid var(--eaf-border)',
            borderRadius: '10px',
            padding: '14px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--eaf-font-display)',
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--eaf-text-primary)',
            }}
          >
            4h 30
          </div>
          <div style={{ fontSize: '11px', color: 'var(--eaf-text-tertiary)' }}>
            Cette semaine
          </div>
        </div>
        <div
          style={{
            background: 'var(--eaf-bg1)',
            border: '1px solid var(--eaf-border)',
            borderRadius: '10px',
            padding: '14px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--eaf-font-display)',
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--eaf-teal)',
            }}
          >
            12/20
          </div>
          <div style={{ fontSize: '11px', color: 'var(--eaf-text-tertiary)' }}>
            Moyenne oral
          </div>
        </div>
      </div>

      {/* Activité récente */}
      <div
        style={{
          background: 'var(--eaf-bg1)',
          border: '1px solid var(--eaf-border)',
          borderRadius: '10px',
          padding: '14px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--eaf-text-tertiary)',
            fontWeight: 600,
            marginBottom: '10px',
          }}
        >
          ACTIVITÉ RÉCENTE
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span style={{ fontSize: '13px', color: 'var(--eaf-text-secondary)' }}>
              Correction La Boétie
            </span>
            <span style={{ fontSize: '12px', color: 'var(--eaf-text-tertiary)' }}>
              Aujourd'hui
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ fontSize: '13px', color: 'var(--eaf-text-secondary)' }}>
              Oral simulé
            </span>
            <span style={{ fontSize: '12px', color: 'var(--eaf-text-tertiary)' }}>
              Hier
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
