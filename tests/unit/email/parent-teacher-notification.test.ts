import { describe, expect, test } from 'vitest';
import { render } from '@react-email/render';
import React from 'react';
import ParentNotificationEmail from '../../../emails/ParentNotificationEmail';
import TeacherNotificationEmail from '../../../emails/TeacherNotificationEmail';

describe('ParentNotificationEmail', () => {
  test('contenu français irréprochable', async () => {
    const html = await render(
      React.createElement(ParentNotificationEmail, {
        studentFirstName: 'Yasmine',
        studentClass: 'Première générale',
        platformUrl: 'https://eaf.nexusreussite.academy',
      }),
    );

    expect(html).toContain('Yasmine');
    expect(html).toContain('Nexus Réussite');
    expect(html).not.toContain('Nexus Reussite');
    expect(html).toContain('Bonjour');
    expect(html).not.toContain('Dear');
    expect(html).not.toContain('password');
    expect(html).toContain('https://eaf.nexusreussite.academy');

    const lower = html.toLowerCase();
    expect(lower).not.toMatch(/\bclick here\b/);
    expect(lower).not.toMatch(/\bdashboard\b/);
    expect(lower).not.toMatch(/\blogin\b/);
  });
});

describe('TeacherNotificationEmail', () => {
  test('contenu français professionnel', async () => {
    const html = await render(
      React.createElement(TeacherNotificationEmail, {
        studentFirstName: 'Mehdi',
        studentLastName: 'Kaddour',
        studentClass: 'Première générale',
        platformUrl: 'https://eaf.nexusreussite.academy',
      }),
    );

    expect(html).toContain('Mehdi');
    expect(html).toContain('Kaddour');
    expect(html).toContain('Madame, Monsieur');
    expect(html).toContain('Nexus Réussite');
    expect(html).toContain('Bulletin Officiel');
    expect(html).toContain('/2 /8 /2 /8');
    expect(html).toContain('Bien cordialement');
    expect(html).not.toContain('Dear');
  });
});
