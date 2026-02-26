import { describe, it, expect } from 'vitest';
import { classifyIntent, resolveSkillForIntent, routeQuery } from '@/lib/agents/router';

describe('Router Agent — classifyIntent', () => {
  it('classe "méthode plan introduction" comme methode', () => {
    expect(classifyIntent('comment faire un plan pour l\'introduction')).toBe('methode');
  });

  it('classe "Baudelaire Les Fleurs du Mal" comme oeuvre', () => {
    expect(classifyIntent('je travaille Baudelaire Les Fleurs du Mal')).toBe('oeuvre');
  });

  it('classe "oral lecture explication" comme entrainement_oral', () => {
    expect(classifyIntent('je veux m\'entraîner à l\'oral explication linéaire')).toBe('entrainement_oral');
  });

  it('classe "corriger feedback évaluer" comme correction', () => {
    expect(classifyIntent('je veux corriger et évaluer mon travail, donne-moi un feedback')).toBe('correction');
  });

  it('classe "grammaire subordonnée" comme langue', () => {
    expect(classifyIntent('je ne comprends pas les subordonnées relatives')).toBe('langue');
  });

  it('classe les auteurs EAF programme', () => {
    expect(classifyIntent('Racine Phèdre')).toBe('oeuvre');
    expect(classifyIntent('Zola Germinal')).toBe('oeuvre');
    expect(classifyIntent('Voltaire Candide')).toBe('oeuvre');
    expect(classifyIntent('Montaigne Essais')).toBe('oeuvre');
  });

  it('classe les demandes de diagnostic', () => {
    expect(classifyIntent('évaluation initiale de mon niveau')).toBe('diagnostic');
  });

  it('classe les demandes bibliothèque', () => {
    expect(classifyIntent('barème officiel commentaire')).toBe('bibliotheque');
  });

  it('retourne unknown pour une requête vide ou non-reconnue', () => {
    expect(classifyIntent('blabla 123 xyz')).toBe('unknown');
  });
});

describe('Router Agent — resolveSkillForIntent', () => {
  it('methode + session orale → coach_oral', () => {
    expect(resolveSkillForIntent('methode', { isOralSession: true })).toBe('coach_oral');
  });

  it('methode + session écrite commentaire → ecrit_plans', () => {
    expect(resolveSkillForIntent('methode', { isEcritSession: true, subType: 'commentaire' })).toBe('ecrit_plans');
  });

  it('entrainement_oral sans session → oral_tirage', () => {
    expect(resolveSkillForIntent('entrainement_oral', {})).toBe('oral_tirage');
  });

  it('entrainement_ecrit contraction → ecrit_contraction', () => {
    expect(resolveSkillForIntent('entrainement_ecrit', { subType: 'contraction' })).toBe('ecrit_contraction');
  });

  it('entrainement_ecrit essai → ecrit_essai', () => {
    expect(resolveSkillForIntent('entrainement_ecrit', { subType: 'essai' })).toBe('ecrit_essai');
  });

  it('langue + oral → grammaire_ciblee', () => {
    expect(resolveSkillForIntent('langue', { isOralSession: true })).toBe('grammaire_ciblee');
  });

  it('langue hors session → ecrit_langue', () => {
    expect(resolveSkillForIntent('langue', {})).toBe('ecrit_langue');
  });

  it('correction + texte → correcteur', () => {
    expect(resolveSkillForIntent('correction', { hasText: true })).toBe('correcteur');
  });

  it('correction sans texte → coach_ecrit', () => {
    expect(resolveSkillForIntent('correction', { hasText: false })).toBe('coach_ecrit');
  });

  it('unknown → tuteur_libre', () => {
    expect(resolveSkillForIntent('unknown', {})).toBe('tuteur_libre');
  });

  it('oeuvre → bibliothecaire', () => {
    expect(resolveSkillForIntent('oeuvre', {})).toBe('bibliothecaire');
  });

  it('diagnostic → ecrit_diagnostic', () => {
    expect(resolveSkillForIntent('diagnostic', {})).toBe('ecrit_diagnostic');
  });

  it('administratif → support_produit', () => {
    expect(resolveSkillForIntent('administratif', {})).toBe('support_produit');
  });
});

describe('routeQuery (one-shot)', () => {
  it('retourne skill et confidence pour requête connue', () => {
    const { skill, category, confidence } = routeQuery('Baudelaire, explique-moi ce poème');
    expect(skill).toBe('bibliothecaire');
    expect(category).toBe('oeuvre');
    expect(confidence).toBe(0.85);
  });

  it('confidence = 0.3 pour requête inconnue', () => {
    const { confidence, category } = routeQuery('blabla 123');
    expect(category).toBe('unknown');
    expect(confidence).toBe(0.3);
  });

  it('accepte un contexte de session', () => {
    const { skill } = routeQuery('comment faire', { isOralSession: true });
    expect(skill).toBe('coach_oral');
  });
});
