import {
  Html, Head, Body, Container, Section, Row, Column,
  Button, Text, Heading, Hr, Link, Preview,
} from '@react-email/components';
import * as React from 'react';

interface SubscriptionEmailProps {
  firstName: string;
  email: string;
  planName: string;
  planPrice: string;
  startDate: string;
  nextBillingDate: string;
  transactionId: string;
  dashboardUrl: string;
  limits: { oraux: string; corrections: string; echanges: string; analyses: string };
}

export default function SubscriptionEmail({
  firstName = 'là',
  email = '',
  planName = 'Régulier',
  planPrice = '9,90 €/mois',
  startDate = '20 mars 2026',
  nextBillingDate = '20 avril 2026',
  transactionId = 'TXN-20260320-XXXX',
  dashboardUrl = 'https://eaf.nexusreussite.academy/dashboard',
  limits = { oraux: '6', corrections: '10', echanges: '30', analyses: '5' },
}: SubscriptionEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>✓ Paiement reçu · Plan {planName} actif dès maintenant · Accède à ton espace complet.</Preview>
      <Body style={{ backgroundColor: '#F7F8FA', fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>

          {/* GREEN CONFIRMATION BAND */}
          <Section style={{ backgroundColor: '#27AE60', height: '4px', borderRadius: '8px 8px 0 0' }}>
            <Text style={{ margin: 0, fontSize: '1px', lineHeight: '1px' }}>&nbsp;</Text>
          </Section>

          {/* HEADER */}
          <Section style={{ backgroundColor: '#1E3A5F', padding: '32px 40px' }}>
            <Text style={{ color: '#ffffff', fontSize: '22px', fontWeight: 700, margin: 0 }}>Nexus Réussite</Text>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', margin: '4px 0 0' }}>Préparation EAF — Session 2026</Text>
          </Section>

          {/* CONFIRMATION BADGE */}
          <Section style={{ backgroundColor: '#ffffff', padding: '40px 40px 24px', textAlign: 'center' as const }}>
            <Section style={{ backgroundColor: '#F0FDF4', borderRadius: '50px', padding: '8px 24px', margin: '0 auto', textAlign: 'center' as const }}>
              <Text style={{ color: '#166534', fontSize: '15px', fontWeight: 600, margin: 0 }}>✓ Paiement confirmé</Text>
            </Section>
          </Section>

          {/* GREETING */}
          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px 24px', textAlign: 'center' as const }}>
            <Heading as="h1" style={{ color: '#1E3A5F', fontSize: '28px', fontWeight: 700, margin: '0 0 8px', textAlign: 'center' as const }}>
              Merci, {firstName} !
            </Heading>
            <Text style={{ color: '#4A5568', fontSize: '16px', lineHeight: '1.7', margin: 0, textAlign: 'center' as const }}>
              Ton abonnement est actif. Voici le récapitulatif de ta souscription.
            </Text>
          </Section>

          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px' }}>
            <Hr style={{ borderColor: '#E2E8F0', margin: '0 0 32px' }} />
          </Section>

          {/* SUBSCRIPTION SUMMARY TABLE */}
          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px 32px' }}>
            <Heading as="h2" style={{ color: '#1E3A5F', fontSize: '18px', fontWeight: 600, margin: '0 0 20px' }}>
              Récapitulatif de l'abonnement
            </Heading>
            <Section style={{ backgroundColor: '#F7F8FA', borderRadius: '8px', padding: '20px 24px' }}>
              <Row style={{ marginBottom: '12px' }}>
                <Column style={{ width: '50%' }}>
                  <Text style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Plan</Text>
                </Column>
                <Column style={{ width: '50%', textAlign: 'right' as const }}>
                  <Text style={{ color: '#1E3A5F', fontSize: '14px', fontWeight: 600, margin: 0 }}>{planName}</Text>
                </Column>
              </Row>
              <Row style={{ marginBottom: '12px' }}>
                <Column style={{ width: '50%' }}>
                  <Text style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Montant</Text>
                </Column>
                <Column style={{ width: '50%', textAlign: 'right' as const }}>
                  <Text style={{ color: '#1E3A5F', fontSize: '14px', fontWeight: 600, margin: 0 }}>{planPrice}</Text>
                </Column>
              </Row>
              <Row style={{ marginBottom: '12px' }}>
                <Column style={{ width: '50%' }}>
                  <Text style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Date de début</Text>
                </Column>
                <Column style={{ width: '50%', textAlign: 'right' as const }}>
                  <Text style={{ color: '#1E3A5F', fontSize: '14px', fontWeight: 600, margin: 0 }}>{startDate}</Text>
                </Column>
              </Row>
              <Row style={{ marginBottom: '12px' }}>
                <Column style={{ width: '50%' }}>
                  <Text style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Prochain prélèvement</Text>
                </Column>
                <Column style={{ width: '50%', textAlign: 'right' as const }}>
                  <Text style={{ color: '#1E3A5F', fontSize: '14px', fontWeight: 600, margin: 0 }}>{nextBillingDate}</Text>
                </Column>
              </Row>
              <Row>
                <Column style={{ width: '50%' }}>
                  <Text style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Transaction</Text>
                </Column>
                <Column style={{ width: '50%', textAlign: 'right' as const }}>
                  <Text style={{ color: '#1E3A5F', fontSize: '13px', fontWeight: 600, margin: 0, fontFamily: 'monospace' }}>{transactionId}</Text>
                </Column>
              </Row>
            </Section>
          </Section>

          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px' }}>
            <Hr style={{ borderColor: '#E2E8F0', margin: '0 0 32px' }} />
          </Section>

          {/* 2x2 LIMITS GRID */}
          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px 32px' }}>
            <Heading as="h2" style={{ color: '#1E3A5F', fontSize: '18px', fontWeight: 600, margin: '0 0 20px' }}>
              Tes quotas mensuels
            </Heading>
            <Row style={{ marginBottom: '12px' }}>
              <Column style={{ width: '50%', paddingRight: '6px' }}>
                <Section style={{ backgroundColor: '#E8F4FD', borderRadius: '8px', padding: '16px 20px', textAlign: 'center' as const }}>
                  <Text style={{ fontSize: '28px', margin: '0 0 4px' }}>🎤</Text>
                  <Text style={{ color: '#1E3A5F', fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>{limits.oraux}</Text>
                  <Text style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>Oraux simulés</Text>
                </Section>
              </Column>
              <Column style={{ width: '50%', paddingLeft: '6px' }}>
                <Section style={{ backgroundColor: '#E8F4FD', borderRadius: '8px', padding: '16px 20px', textAlign: 'center' as const }}>
                  <Text style={{ fontSize: '28px', margin: '0 0 4px' }}>📝</Text>
                  <Text style={{ color: '#1E3A5F', fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>{limits.corrections}</Text>
                  <Text style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>Corrections</Text>
                </Section>
              </Column>
            </Row>
            <Row>
              <Column style={{ width: '50%', paddingRight: '6px' }}>
                <Section style={{ backgroundColor: '#E8F4FD', borderRadius: '8px', padding: '16px 20px', textAlign: 'center' as const }}>
                  <Text style={{ fontSize: '28px', margin: '0 0 4px' }}>💬</Text>
                  <Text style={{ color: '#1E3A5F', fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>{limits.echanges}</Text>
                  <Text style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>Échanges guidés</Text>
                </Section>
              </Column>
              <Column style={{ width: '50%', paddingLeft: '6px' }}>
                <Section style={{ backgroundColor: '#E8F4FD', borderRadius: '8px', padding: '16px 20px', textAlign: 'center' as const }}>
                  <Text style={{ fontSize: '28px', margin: '0 0 4px' }}>📊</Text>
                  <Text style={{ color: '#1E3A5F', fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>{limits.analyses}</Text>
                  <Text style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>Analyses de texte</Text>
                </Section>
              </Column>
            </Row>
          </Section>

          {/* CTA */}
          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px 32px', textAlign: 'center' as const }}>
            <Button href={dashboardUrl} style={{ backgroundColor: '#1E3A5F', color: '#ffffff', borderRadius: '8px', padding: '16px 32px', fontWeight: 600, fontSize: '16px', textDecoration: 'none', display: 'block', textAlign: 'center' as const }}>
              Accéder à mon espace Nexus →
            </Button>
          </Section>

          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px' }}>
            <Hr style={{ borderColor: '#E2E8F0', margin: '0 0 32px' }} />
          </Section>

          {/* 3-COLUMN GUARANTEE SECTION */}
          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px 32px' }}>
            <Heading as="h2" style={{ color: '#1E3A5F', fontSize: '18px', fontWeight: 600, margin: '0 0 20px' }}>
              Nos engagements
            </Heading>
            <Row>
              <Column style={{ width: '33%', paddingRight: '8px', verticalAlign: 'top' }}>
                <Section style={{ textAlign: 'center' as const }}>
                  <Text style={{ fontSize: '28px', margin: '0 0 8px' }}>🔄</Text>
                  <Text style={{ color: '#1E3A5F', fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>7 jours</Text>
                  <Text style={{ color: '#6B7280', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>Satisfait ou remboursé, sans condition</Text>
                </Section>
              </Column>
              <Column style={{ width: '33%', paddingRight: '4px', paddingLeft: '4px', verticalAlign: 'top' }}>
                <Section style={{ textAlign: 'center' as const }}>
                  <Text style={{ fontSize: '28px', margin: '0 0 8px' }}>✋</Text>
                  <Text style={{ color: '#1E3A5F', fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>Résiliation libre</Text>
                  <Text style={{ color: '#6B7280', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>En 1 clic depuis ton espace, sans frais</Text>
                </Section>
              </Column>
              <Column style={{ width: '33%', paddingLeft: '8px', verticalAlign: 'top' }}>
                <Section style={{ textAlign: 'center' as const }}>
                  <Text style={{ fontSize: '28px', margin: '0 0 8px' }}>💬</Text>
                  <Text style={{ color: '#1E3A5F', fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>Support réactif</Text>
                  <Text style={{ color: '#6B7280', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>Réponse sous 24h par email</Text>
                </Section>
              </Column>
            </Row>
          </Section>

          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px' }}>
            <Hr style={{ borderColor: '#E2E8F0', margin: '0 0 32px' }} />
          </Section>

          {/* ONBOARDING STEPS */}
          <Section style={{ backgroundColor: '#ffffff', padding: '0 40px 32px', borderRadius: '0 0 8px 8px' }}>
            <Heading as="h2" style={{ color: '#1E3A5F', fontSize: '18px', fontWeight: 600, margin: '0 0 20px' }}>
              Pour bien démarrer
            </Heading>

            <Row style={{ marginBottom: '16px' }}>
              <Column style={{ width: '48px', verticalAlign: 'top' }}>
                <Text style={{ backgroundColor: '#1E3A5F', color: '#ffffff', width: '32px', height: '32px', lineHeight: '32px', textAlign: 'center' as const, borderRadius: '50%', fontSize: '15px', fontWeight: 700, margin: 0 }}>1</Text>
              </Column>
              <Column style={{ paddingLeft: '12px', verticalAlign: 'top' }}>
                <Text style={{ color: '#1E3A5F', fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>Configure ton profil</Text>
                <Text style={{ color: '#4A5568', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>Choisis tes œuvres au programme et ton parcours (général ou techno) pour que Nexus adapte ses retours.</Text>
              </Column>
            </Row>
            <Row style={{ marginBottom: '16px' }}>
              <Column style={{ width: '48px', verticalAlign: 'top' }}>
                <Text style={{ backgroundColor: '#1E3A5F', color: '#ffffff', width: '32px', height: '32px', lineHeight: '32px', textAlign: 'center' as const, borderRadius: '50%', fontSize: '15px', fontWeight: 700, margin: 0 }}>2</Text>
              </Column>
              <Column style={{ paddingLeft: '12px', verticalAlign: 'top' }}>
                <Text style={{ color: '#1E3A5F', fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>Dépose ta première copie</Text>
                <Text style={{ color: '#4A5568', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>Upload un devoir (PDF ou photo) et reçois une correction détaillée rubrique par rubrique en quelques minutes.</Text>
              </Column>
            </Row>
            <Row>
              <Column style={{ width: '48px', verticalAlign: 'top' }}>
                <Text style={{ backgroundColor: '#1E3A5F', color: '#ffffff', width: '32px', height: '32px', lineHeight: '32px', textAlign: 'center' as const, borderRadius: '50%', fontSize: '15px', fontWeight: 700, margin: 0 }}>3</Text>
              </Column>
              <Column style={{ paddingLeft: '12px', verticalAlign: 'top' }}>
                <Text style={{ color: '#1E3A5F', fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>Lance ton premier oral</Text>
                <Text style={{ color: '#4A5568', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>Simule un oral blanc au format officiel avec relances pédagogiques et évaluation détaillée.</Text>
              </Column>
            </Row>
          </Section>

          {/* FOOTER */}
          <Section style={{ backgroundColor: '#F7F8FA', padding: '24px 40px', borderRadius: '0 0 8px 8px' }}>
            <Text style={{ color: '#9CA3AF', fontSize: '13px', lineHeight: '1.6', margin: '0 0 8px' }}>
              Tu reçois cet email car tu viens de souscrire au plan {planName} sur nexusreussite.academy avec l'adresse {email}.
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: '13px', margin: '0 0 8px' }}>
              Référence de transaction : <span style={{ fontFamily: 'monospace' }}>{transactionId}</span>
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: '13px', margin: '0 0 8px' }}>
              <Link href={`${dashboardUrl}/settings`} style={{ color: '#9CA3AF' }}>Gérer mon abonnement</Link> | <Link href="https://eaf.nexusreussite.academy/politique-de-confidentialite" style={{ color: '#9CA3AF' }}>Politique de confidentialité</Link> | <Link href="mailto:contact@nexusreussite.academy" style={{ color: '#9CA3AF' }}>contact@nexusreussite.academy</Link>
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: '13px', margin: '0' }}>© 2026 Nexus Réussite. Tous droits réservés.</Text>
            <Text style={{ color: '#9CA3AF', fontSize: '13px', margin: '4px 0 0' }}>Nexus Réussite — Préparation EAF Session 2026</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
