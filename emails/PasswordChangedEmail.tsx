import {
  Html, Head, Body, Container, Section,
  Button, Text, Heading, Hr, Link, Preview, Img,
} from '@react-email/components';
import * as React from 'react';

interface PasswordChangedEmailProps {
  firstName: string;
  email: string;
  changedAt: string;
  loginUrl: string;
}

export default function PasswordChangedEmail({
  firstName = '',
  email = '',
  changedAt = '',
  loginUrl = 'https://eaf.nexusreussite.academy/login',
}: PasswordChangedEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Ton mot de passe Nexus Réussite a été modifié.</Preview>
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
            <Text style={{ fontSize: '48px', margin: '0 0 16px' }}>🔒</Text>
            <Heading as="h1" style={{ color: '#1E3A5F', fontSize: '28px', fontWeight: 700, margin: '0 0 8px', textAlign: 'center' as const }}>
              Ton mot de passe a été modifié
            </Heading>
            <Text style={{ color: '#4A5568', fontSize: '16px', margin: '0 0 32px', textAlign: 'center' as const }}>
              {firstName ? `Salut ${firstName}\u00A0! ` : ''}Ton mot de passe Nexus Réussite a été modifié le {changedAt}.
            </Text>
          </Section>

          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px' }}>
            <Hr style={{ borderColor: '#E2E8F0', margin: '0 0 32px' }} />
          </Section>

          {/* ALERT BLOCK */}
          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px 24px' }}>
            <Section style={{ backgroundColor: '#FEF2F2', borderLeft: '4px solid #DC2626', borderRadius: '0 8px 8px 0', padding: '16px 20px' }}>
              <Text style={{ color: '#991B1B', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>
                Si ce n'est pas toi, contacte-nous immédiatement à{' '}
                <Link href="mailto:contact@nexusreussite.academy" style={{ color: '#991B1B', fontWeight: 600 }}>contact@nexusreussite.academy</Link>
              </Text>
            </Section>
          </Section>

          {/* CTA */}
          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px 32px', textAlign: 'center' as const, borderRadius: '0 0 8px 8px' }}>
            <Button href={loginUrl} style={{ backgroundColor: '#1E3A5F', color: '#ffffff', borderRadius: '8px', padding: '16px 32px', fontWeight: 600, fontSize: '16px', textDecoration: 'none', display: 'block', textAlign: 'center' as const }}>
              Accéder à mon compte →
            </Button>
          </Section>

          {/* FOOTER */}
          <Section style={{ backgroundColor: '#F7F8FA', padding: '24px 40px', borderRadius: '0 0 8px 8px' }}>
            <Text style={{ color: '#9CA3AF', fontSize: '13px', lineHeight: '1.6', margin: '0 0 8px' }}>
              Tu reçois cet email car le mot de passe du compte {email} sur nexusreussite.academy a été modifié.
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
