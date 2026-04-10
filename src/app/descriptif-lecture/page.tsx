'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, CheckCircle } from 'lucide-react';
import { AddTexteForm } from './AddTexteForm';
import { TexteCard } from './TexteCard';
import { DESCRIPTIF_REGLEMENTAIRE, OBJETS_ETUDE, type ObjetEtudeId } from '@/data/programme-eaf-2025';

type TexteDescriptif = {
  id: string;
  objetEtude: ObjetEtudeId;
  typeTexte: 'EXTRAIT_OEUVRE' | 'EXTRAIT_PARCOURS' | 'LECTURE_CURSIVE' | 'OEUVRE_CHOISIE_ENTRETIEN';
  oeuvreAuteur: string;
  titreExtrait: string;
  incipit?: string | null;
  numeroPagesRef?: string | null;
  contenuTexte?: string | null;
  fichierPath?: string | null;
  position: number;
  notesPersonnelles?: string | null;
};

type ConformiteObjet = {
  objetEtude: ObjetEtudeId;
  conforme: boolean;
  manquant: string[];
};

type ApiResponse = {
  textes: TexteDescriptif[];
  total: number;
  conformite: ConformiteObjet[];
  estCompletReglementairement: boolean;
};

const TYPE_SECTIONS: Array<{
  type: TexteDescriptif['typeTexte'];
  label: string;
  requis: string;
  icon: string;
}> = [
  { type: 'EXTRAIT_OEUVRE', label: "Extraits de l'œuvre", requis: '2 minimum', icon: '📄' },
  { type: 'EXTRAIT_PARCOURS', label: 'Textes du parcours associé', requis: '1 minimum', icon: '🔗' },
  { type: 'LECTURE_CURSIVE', label: 'Lectures cursives', requis: '1 minimum', icon: '📚' },
  { type: 'OEUVRE_CHOISIE_ENTRETIEN', label: "Œuvre choisie pour l'entretien", requis: 'Optionnel', icon: '⭐' },
];

const TAB_ICONS: Record<ObjetEtudeId, string> = {
  POESIE: '📝',
  THEATRE: '🎭',
  LITTERATURE_IDEES: '💡',
  ROMAN_RECIT: '📖',
};

export default function DescriptifLecturePage() {
  const searchParams = useSearchParams();
  const isFromOnboarding = searchParams.get('onboarding') === 'true';
  const [textes, setTextes] = useState<TexteDescriptif[]>([]);
  const [conformite, setConformite] = useState<ConformiteObjet[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedObjet, setSelectedObjet] = useState<ObjetEtudeId>('POESIE');
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchDescriptif() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/student/descriptif-lecture');
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Chargement impossible.' }));
        throw new Error(String(data.error ?? 'Chargement impossible.'));
      }
      const data = (await response.json()) as ApiResponse;
      setTextes(data.textes);
      setConformite(data.conformite);
      setTotal(data.total);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchDescriptif();
  }, []);

  const totalMissing = Math.max(0, DESCRIPTIF_REGLEMENTAIRE.totalTextesMinimum - total);
  const progressPercent = Math.min(100, (total / DESCRIPTIF_REGLEMENTAIRE.totalTextesMinimum) * 100);

  const selectedConformite = useMemo(
    () => conformite.find((item) => item.objetEtude === selectedObjet) ?? null,
    [conformite, selectedObjet],
  );

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Supprimer ce texte du descriptif ?');
    if (!confirmed) return;

    setError(null);
    setMessage(null);

    const response = await fetch(`/api/v1/student/descriptif-lecture/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Suppression impossible.' }));
      setError(String(data.error ?? 'Suppression impossible.'));
      return;
    }

    setMessage('Texte supprimé.');
    await fetchDescriptif();
  }

  const textesObjet = textes.filter((texte) => texte.objetEtude === selectedObjet);

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* ─── A.2 — HERO CARD ─── */}
      <section 
        className="relative overflow-hidden rounded-[24px] p-8 md:p-10"
        style={{ 
          background: 'linear-gradient(135deg, #0d1a35 0%, #111c30 60%, #0f1629 100%)',
          border: '1px solid var(--eaf-indigo-border)'
        }}
      >
        {/* Decorative orb */}
        <div 
          className="pointer-events-none absolute -right-20 -top-20 h-[350px] w-[350px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(123,142,255,0.08), transparent 70%)' }}
        />

        <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10">
          {/* Colonne gauche */}
          <div className="flex-1 max-w-[520px]">
            {/* Badge conformité */}
            <div 
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold mb-5"
              style={{ 
                background: 'var(--eaf-teal-dim)', 
                border: '1px solid var(--eaf-teal-border)',
                color: 'var(--eaf-teal)'
              }}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Oral EAF conforme au descriptif réel
            </div>

            {/* Titre */}
            <h1 
              className="text-[40px] font-bold leading-[1.1] tracking-[-1.5px] mb-4"
              style={{ 
                fontFamily: 'var(--eaf-font-display)',
                color: 'var(--eaf-text-primary)'
              }}
            >
              Mon descriptif de lecture
            </h1>

            {/* Description */}
            <p 
              className="text-[14px] leading-[1.6]"
              style={{ color: 'var(--eaf-text-secondary)' }}
            >
              Tu saisis ici les textes réellement étudiés en classe. L&apos;atelier oral doit tirer
              dans cette liste, comme l&apos;examinateur le jour de l&apos;épreuve.
            </p>
          </div>

          {/* Colonne droite — Card conformité */}
          <div 
            className="rounded-2xl p-6 min-w-[220px]"
            style={{ 
              background: 'var(--eaf-bg2)', 
              border: '1px solid var(--eaf-border)'
            }}
          >
            <p 
              className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-4"
              style={{ color: 'var(--eaf-text-tertiary)' }}
            >
              Conformité réglementaire
            </p>

            <div className="flex items-baseline gap-2 mb-1">
              <span 
                className="text-[48px] font-black"
                style={{ 
                  fontFamily: 'var(--eaf-font-display)',
                  color: 'var(--eaf-orange)'
                }}
              >
                {total}
              </span>
              <span 
                className="text-[13px]"
                style={{ color: 'var(--eaf-text-secondary)' }}
              >
                textes enregistrés
              </span>
            </div>

            <p 
              className="text-[12px] font-medium mb-4"
              style={{ color: 'var(--eaf-text-tertiary)' }}
            >
              Minimum réglementaire : {DESCRIPTIF_REGLEMENTAIRE.totalTextesMinimum}
            </p>

            {totalMissing > 0 ? (
              <>
                <div 
                  className="rounded-lg px-3.5 py-2 text-[12px] font-semibold text-center"
                  style={{ 
                    background: 'rgba(255,107,53,0.15)', 
                    border: '1px solid var(--eaf-orange-border)',
                    color: 'var(--eaf-orange)'
                  }}
                >
                  {totalMissing} texte(s) encore attendus
                </div>
                {/* Barre de progression */}
                <div 
                  className="h-[3px] rounded-full mt-3"
                  style={{ background: 'var(--eaf-bg3)' }}
                >
                  <div 
                    className="h-[3px] rounded-full transition-all duration-500"
                    style={{ 
                      width: `${progressPercent}%`,
                      background: 'var(--eaf-orange)'
                    }}
                  />
                </div>
              </>
            ) : (
              <div 
                className="rounded-lg px-3.5 py-2 text-[12px] font-semibold text-center"
                style={{ 
                  background: 'var(--eaf-teal-dim)', 
                  border: '1px solid var(--eaf-teal-border)',
                  color: 'var(--eaf-teal)'
                }}
              >
                <CheckCircle className="h-3.5 w-3.5 inline mr-1" />
                Seuil réglementaire atteint
              </div>
            )}
          </div>
        </div>

        {message ? (
          <p 
            className="mt-4 text-sm"
            style={{ color: 'var(--eaf-teal)' }}
          >
            {message}
          </p>
        ) : null}
        {error ? (
          <p 
            className="mt-4 text-sm"
            style={{ color: 'var(--eaf-orange)' }}
          >
            {error}
          </p>
        ) : null}
      </section>

      {/* ─── A.3 — TABS DES 4 OBJETS D'ÉTUDE ─── */}
      <div className="flex flex-wrap gap-2 pb-2">
        {OBJETS_ETUDE.map((objet) => {
          const state = conformite.find((item) => item.objetEtude === objet.id);
          const active = selectedObjet === objet.id;
          const isComplete = state?.conforme ?? false;

          return (
            <button
              key={objet.id}
              type="button"
              onClick={() => setSelectedObjet(objet.id)}
              className="relative flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-medium transition-all duration-200"
              style={{
                background: active ? 'var(--eaf-bg3)' : 'var(--eaf-bg1)',
                border: active ? '1px solid var(--eaf-indigo-border)' : '1px solid var(--eaf-border)',
                color: active ? 'var(--eaf-text-primary)' : 'var(--eaf-text-secondary)',
                boxShadow: active ? '0 0 0 3px rgba(123,142,255,0.08)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.borderColor = 'var(--eaf-indigo-border)';
                  e.currentTarget.style.color = 'var(--eaf-text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.borderColor = 'var(--eaf-border)';
                  e.currentTarget.style.color = 'var(--eaf-text-secondary)';
                }
              }}
            >
              <span>{TAB_ICONS[objet.id]}</span>
              <span>{objet.label}</span>
              {/* Badge état */}
              {isComplete ? (
                <span 
                  className="ml-1 h-2 w-2 rounded-full"
                  style={{ background: 'var(--eaf-teal)' }}
                />
              ) : (
                <span 
                  className="ml-1 h-2 w-2 rounded-full animate-pulse"
                  style={{ background: '#ef4444' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ─── A.4 — LAYOUT DU CONTENU ─── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        {/* Colonne gauche */}
        <div className="space-y-5">
          {/* Bandeau d'alerte */}
          {selectedConformite && !selectedConformite.conforme && (
            <div 
              className="flex items-center justify-between rounded-r-lg px-4 py-3"
              style={{ 
                background: 'rgba(255,107,53,0.06)', 
                borderLeft: '3px solid var(--eaf-orange)',
              }}
            >
              <p 
                className="text-[13px] font-medium"
                style={{ color: 'var(--eaf-orange)' }}
              >
                Il manque : {selectedConformite.manquant?.join(', ') ?? 'compléter cet objet d\'étude'}.
              </p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-all"
                style={{ 
                  background: 'var(--eaf-teal-dim)', 
                  border: '1px solid var(--eaf-teal-border)',
                  color: 'var(--eaf-teal)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(26,213,160,0.18)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--eaf-teal-dim)';
                }}
              >
                <Plus className="h-4 w-4" />
                Ajouter un texte
              </button>
            </div>
          )}

          {/* Message onboarding */}
          {isFromOnboarding && (
            <div 
              className="rounded-xl p-4"
              style={{ 
                background: 'var(--eaf-indigo-dim)', 
                border: '1px solid var(--eaf-indigo-border)',
              }}
            >
              <h3 
                className="font-semibold mb-2 flex items-center gap-2"
                style={{ color: 'var(--eaf-indigo)' }}
              >
                <span className="text-lg">🎉</span>
                Bienvenue ! Complète ton descriptif de lecture
              </h3>
              <p 
                className="text-sm"
                style={{ color: 'var(--eaf-text-secondary)' }}
              >
                Pour que l&apos;atelier oral simule les vraies conditions de l&apos;épreuve, saisis ici les textes étudiés en classe avec ton enseignant.
              </p>
            </div>
          )}

          {/* Formulaire d'ajout */}
          {showAddForm && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--eaf-border)' }}>
              <AddTexteForm
                selectedObjet={selectedObjet}
                onSaved={async () => {
                  setMessage('Texte ajouté au descriptif.');
                  setShowAddForm(false);
                  await fetchDescriptif();
                }}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}

          {/* Bouton ajouter si pas de manques */}
          {!showAddForm && (selectedConformite?.conforme ?? true) && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all"
                style={{ 
                  background: 'var(--eaf-teal-dim)', 
                  border: '1px solid var(--eaf-teal-border)',
                  color: 'var(--eaf-teal)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(26,213,160,0.18)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--eaf-teal-dim)';
                }}
              >
                <Plus className="h-4 w-4" />
                Ajouter un texte
              </button>
            </div>
          )}

          {/* Les 4 sections */}
          {TYPE_SECTIONS.map((section) => {
            const items = textesObjet.filter((texte) => texte.typeTexte === section.type);
            const isOptional = section.type === 'OEUVRE_CHOISIE_ENTRETIEN';

            return (
              <section
                key={section.type}
                className="rounded-[14px] overflow-hidden"
                style={{ 
                  background: 'var(--eaf-bg1)', 
                  border: isOptional ? '1px dashed var(--eaf-border)' : '1px solid var(--eaf-border)'
                }}
              >
                {/* Header */}
                <div 
                  className="flex items-center justify-between gap-3 px-5 py-4"
                  style={{ borderBottom: items.length > 0 ? '1px solid var(--eaf-border)' : 'none' }}
                >
                  <div>
                    <h3 
                      className="text-[14px] font-semibold"
                      style={{ color: 'var(--eaf-text-primary)' }}
                    >
                      {section.label}
                    </h3>
                    <p 
                      className="text-[12px] mt-0.5"
                      style={{ color: 'var(--eaf-text-tertiary)' }}
                    >
                      {section.requis}
                    </p>
                  </div>
                  <span 
                    className="rounded-full px-2.5 py-1 text-[12px] font-semibold"
                    style={{ 
                      background: items.length > 0 ? 'var(--eaf-teal-dim)' : 'var(--eaf-bg3)',
                      border: `1px solid ${items.length > 0 ? 'var(--eaf-teal-border)' : 'var(--eaf-border)'}`,
                      color: items.length > 0 ? 'var(--eaf-teal)' : 'var(--eaf-text-tertiary)'
                    }}
                  >
                    {items.length} texte(s)
                  </span>
                </div>

                {/* Corps */}
                {items.length === 0 ? (
                  <div 
                    className="flex items-center gap-3 px-5 py-5"
                    style={{ background: 'rgba(255,255,255,0.01)' }}
                  >
                    <div 
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
                      style={{ 
                        border: '1px dashed var(--eaf-border)',
                        color: 'var(--eaf-text-tertiary)'
                      }}
                    >
                      {section.icon}
                    </div>
                    <p 
                      className="text-[13px] flex-1"
                      style={{ color: 'var(--eaf-text-tertiary)' }}
                    >
                      Aucun texte pour cette catégorie.
                    </p>
                    <button 
                      type="button" 
                      onClick={() => setShowAddForm(true)} 
                      className="text-[13px] font-semibold no-underline transition-colors hover:underline"
                      style={{ color: 'var(--eaf-indigo)' }}
                    >
                      Ajouter un {section.label.toLowerCase().replace(/s$/, '')} →
                    </button>
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {items.map((texte) => (
                      <TexteCard
                        key={texte.id}
                        texte={texte}
                        onDelete={async () => handleDelete(texte.id)}
                        onRefresh={fetchDescriptif}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Colonne droite */}
        <aside className="space-y-4">
          {/* Œuvres du programme */}
          <div 
            className="rounded-2xl p-5"
            style={{ 
              background: 'var(--eaf-bg1)', 
              border: '1px solid var(--eaf-border)'
            }}
          >
            <p 
              className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-3.5"
              style={{ color: 'var(--eaf-text-tertiary)' }}
            >
              Œuvres du programme 2025
            </p>
            <div className="space-y-2">
              {(OBJETS_ETUDE.find((objet) => objet.id === selectedObjet)?.oeuvres ?? []).map((oeuvre) => (
                <div
                  key={`${oeuvre.titre}-${oeuvre.auteur}`}
                  className="rounded-r-lg py-2.5 px-3.5"
                  style={{ 
                    background: 'var(--eaf-bg2)',
                    borderLeft: '3px solid var(--eaf-indigo)'
                  }}
                >
                  <p 
                    className="text-[13px] font-semibold"
                    style={{ color: 'var(--eaf-text-primary)' }}
                  >
                    {oeuvre.titre}
                  </p>
                  <p 
                    className="text-[11px] mt-0.5"
                    style={{ color: 'var(--eaf-text-tertiary)' }}
                  >
                    {oeuvre.auteur}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Rappel réglementaire */}
          <div 
            className="rounded-[14px] p-4"
            style={{ 
              background: 'rgba(255,181,71,0.06)', 
              border: '1px solid var(--eaf-gold-border)'
            }}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-sm">⚠️</span>
              <span 
                className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: 'var(--eaf-gold)' }}
              >
                Rappel réglementaire
              </span>
            </div>
            <p 
              className="text-[13px] leading-[1.6]"
              style={{ color: 'var(--eaf-text-secondary)' }}
            >
              L&apos;examinateur interroge à partir du descriptif transmis à l&apos;avance. Si ton descriptif
              est vide ou incomplet, la simulation sera moins fidèle à l&apos;épreuve réelle.
            </p>
          </div>
        </aside>
      </div>

      {loading ? (
        <div 
          className="text-sm text-center py-8"
          style={{ color: 'var(--eaf-text-tertiary)' }}
        >
          Chargement du descriptif…
        </div>
      ) : null}
    </div>
  );
}
