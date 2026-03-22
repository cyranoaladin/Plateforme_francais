import {
  Html, Head, Body, Container, Section,
  Button, Text, Heading, Hr, Preview, Img, Link,
} from '@react-email/components';
import * as React from 'react';

interface TeacherNotificationEmailProps {
  studentFirstName: string;
  studentLastName: string;
  studentClass: string;
  platformUrl: string;
}

export default function TeacherNotificationEmail({
  studentFirstName = 'un(e) élève',
  studentLastName = '',
  studentClass = 'Première générale',
  platformUrl = 'https://eaf.nexusreussite.academy',
}: TeacherNotificationEmailProps) {
  const fullName = [studentFirstName, studentLastName].filter(Boolean).join(' ');

  return (
    <Html lang="fr">
      <Head />
      <Preview>Votre élève {fullName} s&apos;est inscrit(e) sur Nexus Réussite — préparation EAF 2026.</Preview>
      <Body style={{ backgroundColor: '#F7F8FA', fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* HEADER */}
          <Section style={{ backgroundColor: '#1E3A5F', padding: '24px 40px', borderRadius: '8px 8px 0 0', textAlign: 'center' as const }}>
            <Link href="https://eaf.nexusreussite.academy">
              <Img src="https://eaf.nexusreussite.academy/images/logo_email.png" alt="Nexus Réussite — Préparation EAF 2026" width={200} style={{ maxWidth: '200px', height: 'auto', display: 'block', margin: '0 auto' }} />
            </Link>
          </Section>

          {/* CONTENT */}
          <Section style={{ backgroundColor: '#ffffff', padding: '40px 40px 24px' }}>
            <Text style={{ color: '#4A5568', fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px' }}>
              Madame, Monsieur,
            </Text>
            <Text style={{ color: '#4A5568', fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px' }}>
              Votre élève <strong>{fullName}</strong> ({studentClass}) vient de créer un compte
              sur Nexus Réussite et a renseigné votre adresse e-mail afin de vous associer
              à son suivi.
            </Text>
            <Text style={{ color: '#4A5568', fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px' }}>
              Nexus Réussite est une plateforme de préparation à l&apos;Épreuve Anticipée
              de Français (EAF) conçue selon les exigences du Bulletin Officiel 2026
              et les rapports de jury. Elle propose&nbsp;:
            </Text>
            <Section style={{ backgroundColor: '#F0F7FF', borderRadius: '8px', padding: '20px 24px', margin: '0 0 20px' }}>
              <Text style={{ color: '#1E3A5F', fontSize: '15px', lineHeight: '1.8', margin: 0 }}>
                ✓ Simulations d&apos;oral selon la grille officielle /2 /8 /2 /8{'\n'}
                ✓ Correction de copies (commentaire et dissertation){'\n'}
                ✓ Exercices de langue adaptés aux lacunes identifiées{'\n'}
                ✓ Tuteur pédagogique entraîné sur le corpus officiel
              </Text>
            </Section>
            <Text style={{ color: '#4A5568', fontSize: '16px', lineHeight: '1.6', margin: '0 0 24px' }}>
              La plateforme ne rédige jamais à la place de l&apos;élève&nbsp;: elle guide
              le raisonnement, cite les sources du BO et développe l&apos;autonomie —
              dans le respect de l&apos;intégrité académique.
            </Text>

            <Button href={platformUrl} style={{ backgroundColor: '#1E3A5F', color: '#ffffff', borderRadius: '8px', padding: '14px 28px', fontWeight: 600, fontSize: '15px', textDecoration: 'none', display: 'block', textAlign: 'center' as const }}>
              Découvrir la démarche pédagogique →
            </Button>
          </Section>

          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px 40px' }}>
            <Hr style={{ borderColor: '#E2E8F0', margin: '24px 0' }} />
            <Text style={{ color: '#4A5568', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
              Bien cordialement,{'\n'}
              L&apos;équipe Nexus Réussite
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
