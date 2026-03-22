import {
  Html, Head, Body, Container, Section, Row, Column,
  Button, Text, Heading, Hr, Link, Preview,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  firstName: string;
  email: string;
  dashboardUrl: string;
  profileSetupUrl: string;
}

export default function WelcomeEmail({
  firstName = '',
  email = '',
  dashboardUrl = 'https://eaf.nexusreussite.academy/dashboard',
  profileSetupUrl = 'https://eaf.nexusreussite.academy/onboarding',
}: WelcomeEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Ton espace EAF est prêt — configure ton parcours en 3 minutes et accède à tes premiers ateliers.</Preview>
      <Body style={{ backgroundColor: '#F7F8FA', fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", margin: 0, padding: 0 }}>
        {/* HEADER */}
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Section style={{ backgroundColor: '#1E3A5F', padding: '32px 40px', borderRadius: '8px 8px 0 0' }}>
            <Text style={{ color: '#ffffff', fontSize: '22px', fontWeight: 700, margin: 0 }}>Nexus Réussite</Text>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', margin: '4px 0 0' }}>Préparation EAF — Session 2026</Text>
          </Section>

          {/* HERO */}
          <Section style={{ backgroundColor: '#ffffff', padding: '40px 40px 24px', textAlign: 'center' as const }}>
            <Text style={{ fontSize: '48px', margin: '0 0 16px' }}>🎓</Text>
            <Heading as="h1" style={{ color: '#1E3A5F', fontSize: '28px', fontWeight: 700, margin: '0 0 8px', textAlign: 'center' as const }}>
              {firstName ? `Bienvenue, ${firstName}\u00A0!` : 'Bienvenue\u00A0!'}
            </Heading>
            <Text style={{ color: '#4A5568', fontSize: '16px', margin: '0 0 32px', textAlign: 'center' as const }}>
              Ton espace de préparation au Bac de Français est prêt.
            </Text>
            <Button href={profileSetupUrl} style={{ backgroundColor: '#1E3A5F', color: '#ffffff', borderRadius: '8px', padding: '16px 32px', fontWeight: 600, fontSize: '16px', textDecoration: 'none', display: 'block', textAlign: 'center' as const }}>
              Configurer mon parcours EAF →
            </Button>
            <Text style={{ color: '#9CA3AF', fontSize: '13px', margin: '8px 0 0', textAlign: 'center' as const }}>
              Prend 3 minutes • Choisis tes œuvres • Premiers ateliers accessibles immédiatement
            </Text>
          </Section>

          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px' }}>
            <Hr style={{ borderColor: '#E2E8F0', margin: '32px 0' }} />
          </Section>

          {/* CE QUI T'ATTEND */}
          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px 32px' }}>
            <Heading as="h2" style={{ color: '#1E3A5F', fontSize: '18px', fontWeight: 600, margin: '0 0 20px' }}>
              Voici ce que tu peux faire dès maintenant
            </Heading>

            <Row style={{ marginBottom: '16px' }}>
              <Column style={{ width: '48px', verticalAlign: 'top' }}>
                <Text style={{ backgroundColor: '#E8F4FD', width: '40px', height: '40px', lineHeight: '40px', textAlign: 'center' as const, borderRadius: '8px', fontSize: '24px', margin: 0 }}>📝</Text>
              </Column>
              <Column style={{ paddingLeft: '12px', verticalAlign: 'top' }}>
                <Text style={{ color: '#1E3A5F', fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>Dépose ta première copie</Text>
                <Text style={{ color: '#4A5568', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>Upload un PDF ou une photo de devoir. Nexus le corrige rubrique par rubrique selon le barème EAF.</Text>
              </Column>
            </Row>
            <Row style={{ marginBottom: '16px' }}>
              <Column style={{ width: '48px', verticalAlign: 'top' }}>
                <Text style={{ backgroundColor: '#E8F4FD', width: '40px', height: '40px', lineHeight: '40px', textAlign: 'center' as const, borderRadius: '8px', fontSize: '24px', margin: 0 }}>🎤</Text>
              </Column>
              <Column style={{ paddingLeft: '12px', verticalAlign: 'top' }}>
                <Text style={{ color: '#1E3A5F', fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>Simule un oral officiel</Text>
                <Text style={{ color: '#4A5568', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>Format réel /2 /8 /2 /8 avec relances pédagogiques. Une session disponible dès ton inscription gratuite.</Text>
              </Column>
            </Row>
            <Row>
              <Column style={{ width: '48px', verticalAlign: 'top' }}>
                <Text style={{ backgroundColor: '#E8F4FD', width: '40px', height: '40px', lineHeight: '40px', textAlign: 'center' as const, borderRadius: '8px', fontSize: '24px', margin: 0 }}>📚</Text>
              </Column>
              <Column style={{ paddingLeft: '12px', verticalAlign: 'top' }}>
                <Text style={{ color: '#1E3A5F', fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>Interroge le corpus</Text>
                <Text style={{ color: '#4A5568', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>BO, Eduscol, rapports de jury et œuvres au programme — toutes les sources citées dans chaque réponse du tuteur.</Text>
              </Column>
            </Row>
          </Section>

          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px' }}>
            <Hr style={{ borderColor: '#E2E8F0', margin: '0 0 32px' }} />
          </Section>

          {/* PLAN GRATUIT */}
          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px 32px' }}>
            <Section style={{ backgroundColor: '#F0FDF4', borderLeft: '4px solid #27AE60', borderRadius: '0 8px 8px 0', padding: '16px 20px' }}>
              <Text style={{ color: '#166534', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>
                ✓ Tu es sur le plan Freemium — gratuit, sans carte bancaire requise. Tu accèdes à 1 session orale, 2 corrections et 3 échanges guidés par mois pour tester la méthode à ton rythme.
              </Text>
            </Section>
            <Text style={{ textAlign: 'center' as const, margin: '12px 0 0' }}>
              <Link href={dashboardUrl.replace('/dashboard', '/pricing')} style={{ color: '#2E86C1', fontSize: '14px' }}>Voir tous les plans et passer à Premium ou Masterium →</Link>
            </Text>
          </Section>

          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px' }}>
            <Hr style={{ borderColor: '#E2E8F0', margin: '0 0 32px' }} />
          </Section>

          {/* DIFFÉRENCIATION */}
          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px 32px', borderRadius: '0 0 8px 8px' }}>
            <Text style={{ color: '#1E3A5F', fontSize: '16px', fontWeight: 600, margin: '0 0 12px' }}>Une chose importante à savoir</Text>
            <Text style={{ color: '#4A5568', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
              Nexus refuse de rédiger ta copie, ton commentaire ou ta dissertation à ta place. Si tu lui demandes, il te guidera avec des questions de méthode et des rappels de barème — mais c'est toi qui écris. C'est une décision pédagogique délibérée. Ton bac, c'est ton travail.
            </Text>
          </Section>

          {/* FOOTER */}
          <Section style={{ backgroundColor: '#F7F8FA', padding: '24px 40px', borderRadius: '0 0 8px 8px' }}>
            <Text style={{ color: '#9CA3AF', fontSize: '13px', lineHeight: '1.6', margin: '0 0 8px' }}>
              Tu reçois cet email car tu viens de créer un compte sur nexusreussite.academy avec l'adresse {email}.
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: '13px', margin: '0 0 8px' }}>Si ce n'est pas toi, ignore cet email.</Text>
            <Text style={{ color: '#9CA3AF', fontSize: '13px', margin: '0 0 8px' }}>
              <Link href={`${dashboardUrl.replace('/dashboard', '/profil')}`} style={{ color: '#9CA3AF' }}>Se désabonner</Link> | <Link href="https://eaf.nexusreussite.academy/politique-de-confidentialite" style={{ color: '#9CA3AF' }}>Politique de confidentialité</Link> | <Link href="mailto:contact@nexusreussite.academy" style={{ color: '#9CA3AF' }}>contact@nexusreussite.academy</Link>
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: '13px', margin: '0' }}>© 2026 Nexus Réussite. Tous droits réservés.</Text>
            <Text style={{ color: '#9CA3AF', fontSize: '13px', margin: '4px 0 0' }}>Nexus Réussite — Préparation EAF Session 2026</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
