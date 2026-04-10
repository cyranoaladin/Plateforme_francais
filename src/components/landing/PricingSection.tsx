'use client';

import Link from 'next/link';

export function PricingSection() {
  return (
    <div>
      {/* Header */}
      <div className="text-center mb-12">
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
          Tarifs simples
        </div>
        <h2
          style={{
            fontFamily: 'var(--eaf-font-display)',
            fontSize: '36px',
            fontWeight: 700,
            color: 'var(--eaf-text-primary)',
          }}
        >
          Trois plans clairs,
          <br />
          des quotas réels.
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--eaf-text-secondary)',
            marginTop: '8px',
          }}
        >
          Activation par code après règlement. Pas de carte bancaire pour le Freemium.
        </p>
      </div>

      {/* Grille pricing */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '48px' }}
      >
        {/* Freemium */}
        <PlanCard
          name="Freemium"
          description="Découvre la méthode sans paiement."
          price="0"
          unit="TND"
          subPrice="Pour toujours gratuit"
          features={[
            '1 / mois de simulation orale',
            '2 / mois de correction écrite',
            '3 / jour d\'échanges guidés',
            'Échantillon de bibliothèque',
          ]}
          buttonText="Commencer gratuitement"
          buttonVariant="ghost"
          note="Création de compte immédiate, sans carte bancaire."
        />

        {/* Premium - FEATURED */}
        <PlanCard
          featured
          badge="⭐ Recommandé"
          name="Premium"
          nameColor="var(--eaf-indigo)"
          description="Le plan complet pour travailler chaque semaine."
          price="99"
          unit="TND / mois"
          subPrice="/ mois"
          features={[
            '10 / semaine de simulation orale',
            '20 / mois de correction écrite',
            '100 / jour d\'échanges guidés',
            'Rapport PDF oral',
            'Historique oral complet',
            'Bibliothèque complète',
            'Activation par code après règlement',
          ]}
          buttonText="Choisir Premium →"
          buttonVariant="primary"
          note="Règlement par virement bancaire ou espèces, puis code d'activation."
        />

        {/* Masterium */}
        <PlanCard
          name="Masterium"
          description="Pour travailler sans plafond et viser la mention."
          price="129"
          unit="TND / mois"
          subPrice="/ mois"
          features={[
            'Illimité d\'oral',
            'Illimité de corrections écrites',
            'Illimité d\'accompagnement guidé',
            'Recherche avancée dans le corpus',
            'Support prioritaire',
          ]}
          buttonText="Choisir Masterium →"
          buttonVariant="secondary"
        />
      </div>
    </div>
  );
}

interface PlanCardProps {
  featured?: boolean;
  badge?: string;
  name: string;
  nameColor?: string;
  description: string;
  price: string;
  unit: string;
  subPrice: string;
  features: string[];
  buttonText: string;
  buttonVariant: 'ghost' | 'primary' | 'secondary';
  note?: string;
}

function PlanCard({
  featured,
  badge,
  name,
  nameColor,
  description,
  price,
  unit,
  subPrice,
  features,
  buttonText,
  buttonVariant,
  note,
}: PlanCardProps) {
  return (
    <div
      className="relative"
      style={{
        background: featured
          ? 'var(--eaf-gradient-card-featured)'
          : 'var(--eaf-bg1)',
        border: featured
          ? '1px solid rgba(123,142,255,0.40)'
          : '1px solid var(--eaf-border)',
        borderRadius: '20px',
        padding: '32px',
      }}
    >
      {/* Badge featured */}
      {badge && (
        <div
          className="absolute whitespace-nowrap"
          style={{
            top: '-14px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(90deg, var(--eaf-indigo), var(--eaf-indigo-hover))',
            color: 'white',
            padding: '5px 16px',
            borderRadius: '100px',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '-0.1px',
          }}
        >
          {badge}
        </div>
      )}

      {/* Name */}
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: nameColor || 'var(--eaf-text-secondary)',
          marginBottom: '8px',
        }}
      >
        {name}
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: '13px',
          color: 'var(--eaf-text-tertiary)',
          marginBottom: '24px',
        }}
      >
        {description}
      </p>

      {/* Price */}
      <div className="flex items-baseline gap-1 mb-1">
        <span
          style={{
            fontFamily: 'var(--eaf-font-display)',
            fontSize: '44px',
            fontWeight: 900,
            letterSpacing: '-2px',
            lineHeight: 1,
            color: 'var(--eaf-text-primary)',
          }}
        >
          {price}
        </span>
        <span
          style={{
            fontSize: '16px',
            fontWeight: 400,
            color: 'var(--eaf-text-tertiary)',
          }}
        >
          {unit}
        </span>
      </div>
      <p
        style={{
          fontSize: '12px',
          color: 'var(--eaf-text-tertiary)',
          marginBottom: '28px',
        }}
      >
        {subPrice}
      </p>

      {/* Features */}
      <ul className="flex flex-col gap-2.5 mb-7" style={{ listStyle: 'none', padding: 0 }}>
        {features.map((feature, index) => (
          <li
            key={index}
            className="flex items-start gap-2"
            style={{ fontSize: '14px', color: 'var(--eaf-text-secondary)' }}
          >
            <span
              style={{
                color: 'var(--eaf-teal)',
                flexShrink: 0,
                marginTop: '1px',
              }}
            >
              ✓
            </span>
            {feature}
          </li>
        ))}
      </ul>

      {/* Button */}
      <Link
        href="/login"
        className="block text-center font-semibold transition-all duration-200"
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '11px',
          fontSize: '15px',
          background:
            buttonVariant === 'primary'
              ? 'var(--eaf-orange)'
              : buttonVariant === 'secondary'
              ? 'var(--eaf-bg2)'
              : 'transparent',
          border:
            buttonVariant === 'primary'
              ? 'none'
              : buttonVariant === 'secondary'
              ? '1px solid rgba(123,142,255,0.30)'
              : '1px solid var(--eaf-border)',
          color:
            buttonVariant === 'primary'
              ? 'white'
              : buttonVariant === 'secondary'
              ? 'var(--eaf-indigo)'
              : 'var(--eaf-text-secondary)',
        }}
        onMouseEnter={(e) => {
          if (buttonVariant === 'primary') {
            e.currentTarget.style.background = 'var(--eaf-orange-hover)';
            e.currentTarget.style.boxShadow = 'var(--eaf-shadow-orange)';
          } else if (buttonVariant === 'secondary') {
            e.currentTarget.style.background = 'var(--eaf-indigo-dim)';
          } else {
            e.currentTarget.style.borderColor = 'rgba(123,142,255,0.40)';
            e.currentTarget.style.color = 'var(--eaf-text-primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (buttonVariant === 'primary') {
            e.currentTarget.style.background = 'var(--eaf-orange)';
            e.currentTarget.style.boxShadow = 'none';
          } else if (buttonVariant === 'secondary') {
            e.currentTarget.style.background = 'var(--eaf-bg2)';
          } else {
            e.currentTarget.style.borderColor = 'var(--eaf-border)';
            e.currentTarget.style.color = 'var(--eaf-text-secondary)';
          }
        }}
      >
        {buttonText}
      </Link>

      {/* Note */}
      {note && (
        <p
          className="text-center mt-2.5"
          style={{ fontSize: '11px', color: 'var(--eaf-text-tertiary)' }}
        >
          {note}
        </p>
      )}
    </div>
  );
}
