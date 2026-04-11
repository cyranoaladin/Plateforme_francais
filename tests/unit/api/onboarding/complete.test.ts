import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mock: auth guard ───────────────────────────────────────────────────────
vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));

// ── Mock: CSRF ─────────────────────────────────────────────────────────────
vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn(async () => null),
}));

// ── Mock: validation/request ───────────────────────────────────────────────
vi.mock('@/lib/validation/request', () => ({
  parseJsonBody: vi.fn(),
}));

// ── Mock: sanitize ─────────────────────────────────────────────────────────
vi.mock('@/lib/security/sanitize', () => ({
  sanitizeString: vi.fn((s: string) => s),
}));

// ── Mock: userRepo ─────────────────────────────────────────────────────────
vi.mock('@/lib/db/repositories/userRepo', () => ({
  updateUserProfile: vi.fn(async () => undefined),
}));

// ── Mock: memoryRepo / memory/store ────────────────────────────────────────
vi.mock('@/lib/db/repositories/memoryRepo', () => ({
  createMemoryEventRecord: vi.fn(async () => undefined),
}));
vi.mock('@/lib/memory/store', () => ({
  createMemoryEvent: vi.fn(() => ({})),
}));

// ── Mock: LLM orchestrator (non-critique) ──────────────────────────────────
vi.mock('@/lib/llm/orchestrator', () => ({
  orchestrate: vi.fn(async () => ({ answer: 'Bienvenue ! Ton parcours est configuré.' })),
}));

// ── Mock: logger ───────────────────────────────────────────────────────────
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Helpers ────────────────────────────────────────────────────────────────
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { updateUserProfile } from '@/lib/db/repositories/userRepo';
import { orchestrate } from '@/lib/llm/orchestrator';

type AuthGuardReturn = Awaited<ReturnType<typeof requireAuthenticatedUser>>;

const MOCK_AUTH = {
  auth: {
    user: {
      id: 'user-001',
      email: 'eleve@nexus.test',
      role: 'eleve',
      profile: {
        displayName: 'Élève',
        classLevel: 'Première générale',
        targetScore: '14/20',
        onboardingCompleted: false,
        selectedOeuvres: [],
        parcoursProgress: [],
        badges: [],
        preferredObjects: [],
        weakSkills: [],
        lecturesCursives: [],
      },
    },
    sessionId: 'sess-001',
  },
  errorResponse: null,
} as unknown as AuthGuardReturn;

const VALID_ONBOARDING_BODY = {
  displayName: 'Sophie Martin',
  classLevel: 'Première générale',
  voie: 'GENERALE' as const,
  eafDate: '2026-06-11',
  selectedOeuvres: ['Cahier de Douai'],
  weakSignals: [],
};

function makeRequest(): Request {
  return new Request('http://localhost/api/v1/onboarding/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'csrf-tok' },
    body: JSON.stringify(VALID_ONBOARDING_BODY),
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('POST /api/v1/onboarding/complete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthenticatedUser).mockResolvedValue(MOCK_AUTH);
    vi.mocked(validateCsrf).mockResolvedValue(null);
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: true,
      data: VALID_ONBOARDING_BODY,
    } as ReturnType<typeof parseJsonBody> extends Promise<infer U> ? U : never);
    vi.mocked(updateUserProfile).mockResolvedValue(undefined);
    vi.mocked(orchestrate).mockResolvedValue({ answer: 'Bienvenue Sophie !' } as unknown as Awaited<ReturnType<typeof orchestrate>>);
  });

  it('exporte le handler POST', async () => {
    const mod = await import('@/app/api/v1/onboarding/complete/route');
    expect(typeof mod.POST).toBe('function');
  });

  it('retourne 200 avec welcomeMessage pour une requête valide', async () => {
    const { POST } = await import('@/app/api/v1/onboarding/complete/route');
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.welcomeMessage).toBe('string');
    expect(body.welcomeMessage.length).toBeGreaterThan(0);
  });

  it('retourne 401 si non authentifié', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: null,
      errorResponse: new Response(JSON.stringify({ error: 'Non authentifié.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    } as unknown as AuthGuardReturn);

    const { POST } = await import('@/app/api/v1/onboarding/complete/route');
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it('retourne 403 si le token CSRF est invalide', async () => {
    vi.mocked(validateCsrf).mockResolvedValue(
      new Response(JSON.stringify({ error: 'CSRF invalide.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }) as unknown as Awaited<ReturnType<typeof validateCsrf>>,
    );

    const { POST } = await import('@/app/api/v1/onboarding/complete/route');
    const res = await POST(makeRequest());
    expect(res.status).toBe(403);
  });

  it('retourne 400 si les données sont invalides (selectedOeuvres vide)', async () => {
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: false,
      response: new Response(
        JSON.stringify({ error: 'Validation', details: ['selectedOeuvres doit contenir au moins 1 élément.'] }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
    } as ReturnType<typeof parseJsonBody> extends Promise<infer U> ? U : never);

    const { POST } = await import('@/app/api/v1/onboarding/complete/route');
    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
  });

  it('retourne 400 si eafDate est absent', async () => {
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: false,
      response: new Response(
        JSON.stringify({ error: 'Validation', details: ['eafDate est requis.'] }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
    } as ReturnType<typeof parseJsonBody> extends Promise<infer U> ? U : never);

    const { POST } = await import('@/app/api/v1/onboarding/complete/route');
    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
  });

  it('retourne 500 si la sauvegarde du profil échoue', async () => {
    vi.mocked(updateUserProfile).mockRejectedValue(new Error('DB connexion perdue'));

    const { POST } = await import('@/app/api/v1/onboarding/complete/route');
    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it('retourne 200 même si le LLM échoue (fail-safe)', async () => {
    vi.mocked(orchestrate).mockRejectedValue(new Error('LLM indisponible'));

    const { POST } = await import('@/app/api/v1/onboarding/complete/route');
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.welcomeMessage).toBe('string');
  });

  it('marque onboardingCompleted=true dans le profil sauvegardé', async () => {
    const { POST } = await import('@/app/api/v1/onboarding/complete/route');
    await POST(makeRequest());
    expect(updateUserProfile).toHaveBeenCalledOnce();
    const callArg = vi.mocked(updateUserProfile).mock.calls[0]?.[1];
    expect(callArg?.onboardingCompleted).toBe(true);
    expect(callArg?.displayName).toBe('Sophie Martin');
  });

  it('le weakSignals déclaré est fusionné dans weakSkills', async () => {
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: true,
      data: {
        ...VALID_ONBOARDING_BODY,
        weakSignals: ['Grammaire', 'Plan'],
      },
    } as ReturnType<typeof parseJsonBody> extends Promise<infer U> ? U : never);

    const { POST } = await import('@/app/api/v1/onboarding/complete/route');
    await POST(makeRequest());
    const callArg = vi.mocked(updateUserProfile).mock.calls[0]?.[1];
    expect(callArg?.weakSkills).toContain('Grammaire');
    expect(callArg?.weakSkills).toContain('Plan');
  });
});
