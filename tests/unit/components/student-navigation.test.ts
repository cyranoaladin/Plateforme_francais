import { describe, expect, it } from 'vitest';

import {
  computeSidebarLearningSignals,
  studentMobileOverflowItems,
  studentMobilePrimaryNavItems,
  studentNavSections,
} from '@/components/layout/student-navigation';

describe('student navigation', () => {
  it('uses French user-facing labels in the main navigation', () => {
    const labels = studentNavSections.flatMap((section) => section.items.map((item) => item.name));

    expect(labels).toContain('Tableau de bord');
    expect(labels).not.toContain('Dashboard');
  });

  it('keeps mobile navigation focused with five primary entries maximum', () => {
    expect(studentMobilePrimaryNavItems).toHaveLength(5);
    expect(studentMobileOverflowItems.length).toBeGreaterThan(0);
  });

  it('does not fabricate a global score when the timeline has no evaluation', () => {
    const signals = computeSidebarLearningSignals([]);

    expect(signals.globalScore).toBeNull();
    expect(signals.streak).toBe(0);
  });
});
