import {
  Html, Head, Body, Container, Section,
  Button, Text, Hr, Preview, Img, Link,
} from '@react-email/components';
import * as React from 'react';

interface ParentNotificationEmailProps {
  studentFirstName: string;
  studentClass: string;
  platformUrl: string;
}

export default function ParentNotificationEmail({
  studentFirstName = 'votre enfant',
  studentClass = 'Première générale',
  platformUrl = 'https://eaf.nexusreussite.academy',
}: ParentNotificationEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Votre enfant {studentFirstName} vient de rejoindre Nexus Réussite pour préparer l’EAF 2026.</Preview>
      <Body style={{ backgroundColor: '#F7F8FA', fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* HEADER */}
          <Section style={{ backgroundColor: '#ffffff', padding: '20px 40px 16px', borderRadius: '8px 8px 0 0', textAlign: 'center' as const, borderBottom: '3px solid #E63946' }}>
            <Link href="https://nexusreussite.academy" style={{ display: 'inline-block' }}>
              <Img src="https://eaf.nexusreussite.academy/images/logo_slogan_nexus_email.png" alt="Nexus Réussite — Viser. Atteindre. Dépasser." width={220} style={{ maxWidth: '220px', height: 'auto', display: 'block', margin: '0 auto' }} />
            </Link>
          </Section>

          {/* CONTENT */}
          <Section style={{ backgroundColor: '#ffffff', padding: '40px 40px 24px' }}>
            <Text style={{ color: '#4A5568', fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px' }}>
              Bonjour,
            </Text>
            <Text style={{ color: '#4A5568', fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px' }}>
              Votre enfant, <strong>{studentFirstName}</strong> ({studentClass}), vient de créer
              un compte sur Nexus Réussite, la plateforme de préparation à l’Épreuve
              Anticipée de Français (EAF) du Baccalauréat 2026.
            </Text>
            <Text style={{ color: '#4A5568', fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px' }}>
              Il ou elle bénéficie dès maintenant d’un accès Freemium gratuit comprenant&nbsp;:
            </Text>
            <Section style={{ backgroundColor: '#F0F7FF', borderRadius: '8px', padding: '20px 24px', margin: '0 0 20px' }}>
              <Text style={{ color: '#1E3A5F', fontSize: '15px', lineHeight: '1.8', margin: 0 }}>
                ✓ Des simulations d’oral guidées par l’IA{'\n'}
                ✓ Des exercices de langue et de grammaire{'\n'}
                ✓ Un tuteur pédagogique disponible à tout moment{'\n'}
                ✓ Un tableau de bord de suivi de progression
              </Text>
            </Section>
            <Text style={{ color: '#4A5568', fontSize: '16px', lineHeight: '1.6', margin: '0 0 24px' }}>
              Nexus Réussite ne rédige jamais à la place de votre enfant&nbsp;: la plateforme
              pose des questions, cite les sources officielles et entraîne l’autonomie
              de réflexion — conformément aux exigences du jury.
            </Text>

            <Button href={platformUrl} style={{ backgroundColor: '#1E3A5F', color: '#ffffff', borderRadius: '8px', padding: '14px 28px', fontWeight: 600, fontSize: '15px', textDecoration: 'none', display: 'block', textAlign: 'center' as const }}>
              Découvrir Nexus Réussite →
            </Button>
          </Section>

          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px 40px' }}>
            <Hr style={{ borderColor: '#E2E8F0', margin: '24px 0' }} />
            <Text style={{ color: '#9CA3AF', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
              Si vous n’attendiez pas ce message ou si votre enfant n’a pas créé
              ce compte, vous pouvez ignorer cet e-mail en toute sécurité.
            </Text>
          </Section>

          {/* FOOTER */}
          <Section style={{ padding: '20px 40px', textAlign: 'center' as const }}>
            <Text style={{ color: '#9CA3AF', fontSize: '12px', margin: 0 }}>
              Nexus Réussite — Préparation EAF 2026
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
