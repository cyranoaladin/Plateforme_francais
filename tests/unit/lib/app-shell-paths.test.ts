import { describe, expect, it } from 'vitest';
import { isStandaloneAppShellPath, usesStudentAppShell } from '@/lib/navigation/app-shell-paths';

describe('app shell paths', () => {
  it('reconnait les pages standalone hors shell eleve', () => {
    expect(isStandaloneAppShellPath('/')).toBe(true);
    expect(isStandaloneAppShellPath('/login')).toBe(true);
    expect(isStandaloneAppShellPath('/onboarding')).toBe(true);
    expect(isStandaloneAppShellPath('/admin')).toBe(true);
    expect(isStandaloneAppShellPath('/enseignant/dashboard')).toBe(true);
    expect(isStandaloneAppShellPath('/parent/dashboard')).toBe(true);
  });

  it('laisse les pages eleve dans le shell applicatif', () => {
    expect(usesStudentAppShell('/dashboard')).toBe(true);
    expect(usesStudentAppShell('/mon-parcours')).toBe(true);
    expect(usesStudentAppShell('/atelier-oral')).toBe(true);
    expect(usesStudentAppShell('/quiz')).toBe(true);
  });
});
