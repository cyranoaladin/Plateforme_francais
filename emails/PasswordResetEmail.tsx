import {
  Html, Head, Body, Container, Section,
  Button, Text, Heading, Hr, Link, Preview, Img,
} from '@react-email/components';
import * as React from 'react';

interface PasswordResetEmailProps {
  firstName: string;
  email: string;
  resetUrl: string;
  expiresAt: string;
}

export default function PasswordResetEmail({
  firstName = '',
  email = '',
  resetUrl = 'https://eaf.nexusreussite.academy/login?mode=reset',
  expiresAt = '',
}: PasswordResetEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Réinitialisation de ton mot de passe Nexus Réussite.</Preview>
      <Body style={{ backgroundColor: '#F7F8FA', fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", margin: 0, padding: 0 }}>
        {/* HEADER */}
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Section style={{ backgroundColor: '#ffffff', padding: '20px 40px 16px', borderRadius: '8px 8px 0 0', textAlign: 'center' as const, borderBottom: '3px solid #E63946' }}>
            <Link href="https://nexusreussite.academy" style={{ display: 'inline-block' }}>
              <Img src="https://eaf.nexusreussite.academy/images/logo_slogan_nexus_email.png" alt="Nexus Réussite — Viser. Atteindre. Dépasser." width={220} style={{ maxWidth: '220px', height: 'auto', display: 'block', margin: '0 auto' }} />
            </Link>
          </Section>

          {/* HERO */}
          <Section style={{ backgroundColor: '#ffffff', padding: '40px 40px 24px', textAlign: 'center' as const }}>
            <Text style={{ fontSize: '48px', margin: '0 0 16px' }}>🔑</Text>
            <Heading as="h1" style={{ color: '#1E3A5F', fontSize: '28px', fontWeight: 700, margin: '0 0 8px', textAlign: 'center' as const }}>
              Réinitialisation de ton mot de passe
            </Heading>
            <Text style={{ color: '#4A5568', fontSize: '16px', margin: '0 0 32px', textAlign: 'center' as const }}>
              {firstName ? `Salut ${firstName}\u00A0! ` : ''}Tu as demandé la réinitialisation de ton mot de passe. Ce lien est valable 1 heure.
            </Text>
            <Button href={resetUrl} style={{ backgroundColor: '#1E3A5F', color: '#ffffff', borderRadius: '8px', padding: '16px 32px', fontWeight: 600, fontSize: '16px', textDecoration: 'none', display: 'block', textAlign: 'center' as const }}>
              Réinitialiser mon mot de passe →
            </Button>
          </Section>

          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px' }}>
            <Hr style={{ borderColor: '#E2E8F0', margin: '32px 0' }} />
          </Section>

          {/* WARNING BLOCK */}
          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px 16px' }}>
            <Section style={{ backgroundColor: '#FFF8E1', borderLeft: '4px solid #F59E0B', borderRadius: '0 8px 8px 0', padding: '16px 20px' }}>
              <Text style={{ color: '#92400E', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>
                Si tu n'as pas demandé cette réinitialisation, ignore cet email.
              </Text>
            </Section>
          </Section>

          {/* EXPIRY NOTE */}
          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px 32px', borderRadius: '0 0 8px 8px' }}>
            <Text style={{ color: '#9CA3AF', fontSize: '13px', textAlign: 'center' as const, margin: 0 }}>
              Ce lien expire le {expiresAt}.
            </Text>
          </Section>

          {/* FOOTER */}
          <Section style={{ backgroundColor: '#F7F8FA', padding: '24px 40px', borderRadius: '0 0 8px 8px' }}>
            <Text style={{ color: '#9CA3AF', fontSize: '13px', lineHeight: '1.6', margin: '0 0 8px' }}>
              Tu reçois cet email car une demande de réinitialisation a été faite pour l'adresse {email} sur nexusreussite.academy.
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: '13px', margin: '0 0 8px' }}>
              <Link href="https://eaf.nexusreussite.academy/politique-de-confidentialite" style={{ color: '#9CA3AF' }}>Politique de confidentialité</Link> | <Link href="mailto:contact@nexusreussite.academy" style={{ color: '#9CA3AF' }}>contact@nexusreussite.academy</Link>
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: '13px', margin: '0' }}>© 2026 Nexus Réussite. Tous droits réservés.</Text>
            <Text style={{ color: '#9CA3AF', fontSize: '13px', margin: '4px 0 0' }}>Nexus Réussite — Préparation EAF Session 2026</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
