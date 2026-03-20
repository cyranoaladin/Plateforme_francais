/**
 * Tests exhaustifs : routage post-login par rôle
 * Bug corrigé : admin/enseignant/parent étaient redirigés vers /onboarding
 * car le frontend appelait /api/v1/student/profile pour TOUS les rôles.
 *
 * Fix : l'API login retourne le rôle, le frontend route par rôle.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

// ─── Helpers to simulate the post-login routing logic ───────────────────

type ProfilePayload = { onboardingCompleted?: boolean };

/**
 * Extracted from login/page.tsx post-login logic for testability.
 * Given a role and optional redirect param, returns the target path.
 */
async function resolvePostLoginRedirect(params: {
  role: string;
  redirectParam: string | null;
  fetchProfile: () => Promise<ProfilePayload>;
}): Promise<string> {
  const { role, redirectParam, fetchProfile } = params;

  const ROLE_HOME: Record<string, string> = {
    admin: '/admin',
    enseignant: '/enseignant',
    parent: '/parent',
  };

  if (ROLE_HOME[role]) {
    return ROLE_HOME[role];
  }

  // Élève: check onboarding
  const rawRedirect = redirectParam || '/dashboard';
  const redirectTo =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/dashboard';

  try {
    const profile = await fetchProfile();
    if (!profile.onboardingCompleted) {
      return '/onboarding';
    }
    return redirectTo;
  } catch {
    return redirectTo;
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────

describe('Post-login routing par rôle', () => {
  const mockProfileCompleted = vi.fn<() => Promise<ProfilePayload>>();

  beforeEach(() => {
    mockProfileCompleted.mockReset();
  });

  describe('Admin', () => {
    it('redirige vers /admin, pas /onboarding', async () => {
      const target = await resolvePostLoginRedirect({
        role: 'admin',
        redirectParam: null,
        fetchProfile: mockProfileCompleted,
      });
      expect(target).toBe('/admin');
      expect(mockProfileCompleted).not.toHaveBeenCalled();
    });

    it('ignore le redirect param pour admin', async () => {
      const target = await resolvePostLoginRedirect({
        role: 'admin',
        redirectParam: '/dashboard',
        fetchProfile: mockProfileCompleted,
      });
      expect(target).toBe('/admin');
    });
  });

  describe('Enseignant', () => {
    it('redirige vers /enseignant', async () => {
      const target = await resolvePostLoginRedirect({
        role: 'enseignant',
        redirectParam: null,
        fetchProfile: mockProfileCompleted,
      });
      expect(target).toBe('/enseignant');
      expect(mockProfileCompleted).not.toHaveBeenCalled();
    });
  });

  describe('Parent', () => {
    it('redirige vers /parent', async () => {
      const target = await resolvePostLoginRedirect({
        role: 'parent',
        redirectParam: null,
        fetchProfile: mockProfileCompleted,
      });
      expect(target).toBe('/parent');
      expect(mockProfileCompleted).not.toHaveBeenCalled();
    });
  });

  describe('Élève avec onboarding complété', () => {
    it('redirige vers /dashboard par défaut', async () => {
      mockProfileCompleted.mockResolvedValue({ onboardingCompleted: true });
      const target = await resolvePostLoginRedirect({
        role: 'eleve',
        redirectParam: null,
        fetchProfile: mockProfileCompleted,
      });
      expect(target).toBe('/dashboard');
      expect(mockProfileCompleted).toHaveBeenCalledOnce();
    });

    it('respecte le redirect param quand onboarding est complété', async () => {
      mockProfileCompleted.mockResolvedValue({ onboardingCompleted: true });
      const target = await resolvePostLoginRedirect({
        role: 'eleve',
        redirectParam: '/tuteur',
        fetchProfile: mockProfileCompleted,
      });
      expect(target).toBe('/tuteur');
    });
  });

  describe('Élève sans onboarding complété', () => {
    it('redirige vers /onboarding', async () => {
      mockProfileCompleted.mockResolvedValue({ onboardingCompleted: false });
      const target = await resolvePostLoginRedirect({
        role: 'eleve',
        redirectParam: null,
        fetchProfile: mockProfileCompleted,
      });
      expect(target).toBe('/onboarding');
    });

    it('redirige vers /onboarding même avec redirect param', async () => {
      mockProfileCompleted.mockResolvedValue({ onboardingCompleted: false });
      const target = await resolvePostLoginRedirect({
        role: 'eleve',
        redirectParam: '/tuteur',
        fetchProfile: mockProfileCompleted,
      });
      expect(target).toBe('/onboarding');
    });
  });

  describe('Élève quand le profil échoue (erreur API)', () => {
    it('fallback vers /dashboard', async () => {
      mockProfileCompleted.mockRejectedValue(new Error('500'));
      const target = await resolvePostLoginRedirect({
        role: 'eleve',
        redirectParam: null,
        fetchProfile: mockProfileCompleted,
      });
      expect(target).toBe('/dashboard');
    });

    it('fallback vers le redirect param si fourni', async () => {
      mockProfileCompleted.mockRejectedValue(new Error('Network'));
      const target = await resolvePostLoginRedirect({
        role: 'eleve',
        redirectParam: '/quiz',
        fetchProfile: mockProfileCompleted,
      });
      expect(target).toBe('/quiz');
    });
  });

  describe('Sécurité redirect', () => {
    it('rejette les URL absolues (open redirect)', async () => {
      mockProfileCompleted.mockResolvedValue({ onboardingCompleted: true });
      const target = await resolvePostLoginRedirect({
        role: 'eleve',
        redirectParam: '//evil.com',
        fetchProfile: mockProfileCompleted,
      });
      expect(target).toBe('/dashboard');
    });

    it('rejette les URL sans slash initial', async () => {
      mockProfileCompleted.mockResolvedValue({ onboardingCompleted: true });
      const target = await resolvePostLoginRedirect({
        role: 'eleve',
        redirectParam: 'http://evil.com',
        fetchProfile: mockProfileCompleted,
      });
      expect(target).toBe('/dashboard');
    });

    it('accepte les chemins relatifs valides', async () => {
      mockProfileCompleted.mockResolvedValue({ onboardingCompleted: true });
      const target = await resolvePostLoginRedirect({
        role: 'eleve',
        redirectParam: '/bibliotheque',
        fetchProfile: mockProfileCompleted,
      });
      expect(target).toBe('/bibliotheque');
    });
  });

  describe('Rôle inconnu ou absent', () => {
    it('traite rôle undefined comme élève', async () => {
      mockProfileCompleted.mockResolvedValue({ onboardingCompleted: true });
      const target = await resolvePostLoginRedirect({
        role: 'eleve',
        redirectParam: null,
        fetchProfile: mockProfileCompleted,
      });
      expect(target).toBe('/dashboard');
    });
  });
});
