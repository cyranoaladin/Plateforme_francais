# 📋 PLAN D'ACTION — FIXES P1 AVANT PRODUCTION

**Projet:** Nexus Réussite EAF  
**Version:** 1.0.0  
**Date:** 1er mars 2026  
**Priorité:** P1 — Haute Priorité (Avant lancement commercial)  
**Durée estimée:** 1-2 sprints (5-10 jours)

---

## 🎯 OBJECTIF

Corriger les **4 issues P1** identifiées lors de l'audit avant le déploiement en production commerciale.

---

## 📊 RÉSUMÉ DES FIXES

| ID | Issue | Complexité | Impact | Effort |
|----|-------|------------|--------|--------|
| P1-01 | Rate limit fail-closed | Moyenne | 🔴 Élevé | 2h |
| P1-02 | Input sanitization | Moyenne | 🟠 Moyen | 4h |
| P1-03 | Error message leakage | Faible | 🟠 Moyen | 1h |
| P1-04 | Tests payment flow | Moyenne | 🔴 Élevé | 3h |
| **TOTAL** | | | | **~10h** |

---

## 🔧 FIX 1 : RATE LIMIT FAIL-CLOSED (P1-01)

### 📍 Problème Actuel

**Fichier:** `src/lib/security/rate-limit.ts`

```typescript
// ❌ ACTUEL — FAIL-OPEN (DANGEREUX)
export async function checkRateLimit(input: {
  request: Request;
  key: string;
  limit: number;
  windowMs?: number;
}): Promise<{ allowed: boolean; retryAfter: number }> {
  try {
    const redis = getRedisClient();
    // ... logic ...
    return { allowed: true, retryAfter: 0 };
  } catch {
    // Quand Redis est indisponible, tout est autorisé !
    return { allowed: true, retryAfter: 0 };  // ← VULNÉRABILITÉ
  }
}
```

**Risque:** Pendant un outage Redis, les attaquants peuvent bypasser le rate limiting → DoS, abus de quotas, coûts LLM explosifs.

---

### ✅ Solution — FAIL-CLOSED

**Fichier à modifier:** `src/lib/security/rate-limit.ts`

```typescript
// ✅ NOUVELLE IMPLÉMENTATION — FAIL-CLOSED
export async function checkRateLimit(input: {
  request: Request;
  key: string;
  limit: number;
  windowMs?: number;
}): Promise<{ allowed: boolean; retryAfter: number }> {
  const windowMs = input.windowMs ?? 60_000; // 1 minute par défaut
  
  try {
    const redis = getRedisClient();
    if (!redis) {
      // Redis non configuré → fallback in-memory
      return checkRateLimitMemory(input);
    }
    
    const now = Date.now();
    const redisKey = `ratelimit:${input.key}:${Math.floor(now / windowMs)}`;
    const ttl = windowMs / 1000;
    
    const current = await redis.incr(redisKey);
    if (current === 1) {
      await redis.expire(redisKey, ttl);
    }
    
    if (current > input.limit) {
      return { allowed: false, retryAfter: ttl };
    }
    
    return { allowed: true, retryAfter: 0 };
  } catch (error) {
    // ⚠️ FAIL-CLOSED : En cas d'erreur, on bloque
    logger.error({ error }, 'rate_limit_redis_error, fail_closed');
    
    // Log pour alerting (optionnel : envoyer webhook/PagerDuty)
    // await sendAlert('rate_limit_redis_down');
    
    // Retourner FAIL-CLOSED avec retryAfter raisonnable
    return { allowed: false, retryAfter: 60 };
  }
}

// Fallback in-memory pour dev sans Redis
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimitMemory(input: {
  key: string;
  limit: number;
  windowMs?: number;
}): { allowed: boolean; retryAfter: number } {
  const windowMs = input.windowMs ?? 60_000;
  const now = Date.now();
  const storeKey = `${input.key}:${Math.floor(now / windowMs)}`;
  
  const entry = memoryStore.get(storeKey);
  if (!entry) {
    memoryStore.set(storeKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  
  entry.count++;
  if (entry.count > input.limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  
  return { allowed: true, retryAfter: 0 };
}
```

---

### 🧪 Tests à Ajouter

**Fichier:** `tests/unit/security/rate-limit.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRateLimit } from '../../../src/lib/security/rate-limit';

describe('checkRateLimit - fail closed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('bloque quand Redis est indisponible (fail-closed)', async () => {
    // Mock getRedisClient pour lever une erreur
    vi.mock('../../../src/lib/queue/redis', () => ({
      getRedisClient: () => {
        throw new Error('Redis unavailable');
      },
    }));

    const result = await checkRateLimit({
      request: {} as Request,
      key: 'test-user',
      limit: 10,
      windowMs: 60_000,
    });

    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBe(60);
  });

  it('autorise quand Redis fonctionne et limite non atteinte', async () => {
    // Mock Redis fonctionnel
    const mockRedis = {
      incr: vi.fn().mockResolvedValue(1),
      expire: vi.fn().mockResolvedValue(undefined),
    };
    
    vi.mock('../../../src/lib/queue/redis', () => ({
      getRedisClient: () => mockRedis,
    }));

    const result = await checkRateLimit({
      request: {} as Request,
      key: 'test-user',
      limit: 10,
      windowMs: 60_000,
    });

    expect(result.allowed).toBe(true);
    expect(result.retryAfter).toBe(0);
  });

  it('bloque quand limite atteinte', async () => {
    const mockRedis = {
      incr: vi.fn().mockResolvedValue(11), // > limit
      expire: vi.fn().mockResolvedValue(undefined),
    };
    
    vi.mock('../../../src/lib/queue/redis', () => ({
      getRedisClient: () => mockRedis,
    }));

    const result = await checkRateLimit({
      request: {} as Request,
      key: 'test-user',
      limit: 10,
      windowMs: 60_000,
    });

    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });
});
```

---

### ✅ Checklist P1-01

- [ ] Modifier `src/lib/security/rate-limit.ts` avec fail-closed
- [ ] Ajouter fallback in-memory pour dev
- [ ] Ajouter tests unitaires
- [ ] Vérifier logs d'erreur rate limit
- [ ] Tester manuellement avec Redis stoppé

**Estimation:** 2 heures  
**Responsable:** Lead Developer

---

## 🔧 FIX 2 : INPUT SANITIZATION (P1-02)

### 📍 Problème Actuel

Plusieurs routes API stockent des inputs utilisateur sans sanitization, créant un risque XSS si le contenu est rendu plus tard.

**Exemples de routes concernées:**
- `/api/v1/onboarding/complete` — displayName
- `/api/v1/student/profile` — champs profil
- `/api/v1/carnet/entry` — journal entries
- `/api/v1/tuteur/message` — messages

---

### ✅ Solution — Middleware de Sanitization

#### Étape 1: Créer utilitaire de sanitization

**Fichier à créer:** `src/lib/security/sanitize.ts`

```typescript
/**
 * Sanitization des inputs utilisateur
 * Objectif: Prévenir XSS et injections
 */

// Caractères dangereux pour HTML
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

const HTML_REGEX = /[&<>"'/]/g;

/**
 * Échappe les caractères HTML dangereux
 */
export function escapeHtml(input: string): string {
  return input.replace(HTML_REGEX, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Sanitize un string:
 * - Trim whitespace
 * - Limite longueur
 * - Échappe HTML
 * - Normalise Unicode
 */
export function sanitizeString(
  input: string,
  options?: {
    maxLength?: number;
    allowHtml?: boolean;
    trim?: boolean;
  }
): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }

  const {
    maxLength = 10000,
    allowHtml = false,
    trim = true,
  } = options ?? {};

  let result = input;

  // Trim whitespace
  if (trim) {
    result = result.trim();
  }

  // Limite longueur
  if (result.length > maxLength) {
    result = result.slice(0, maxLength);
  }

  // Normalise Unicode (NFKC)
  result = result.normalize('NFKC');

  // Échappe HTML sauf si explicitement autorisé
  if (!allowHtml) {
    result = escapeHtml(result);
  }

  return result;
}

/**
 * Sanitize un objet JSON (récursif)
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options?: {
    maxLength?: number;
    allowHtml?: boolean;
    trim?: boolean;
  }
): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value, options);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>, options);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeString(item, options)
          : typeof item === 'object' && item !== null
          ? sanitizeObject(item as Record<string, unknown>, options)
          : item
      );
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Middleware Next.js pour sanitization automatique
 */
export async function sanitizeRequestJson(
  request: Request,
  options?: {
    maxLength?: number;
    allowHtml?: boolean;
    trim?: boolean;
  }
): Promise<unknown> {
  const body = await request.json();
  return sanitizeObject(body as Record<string, unknown>, options);
}
```

---

#### Étape 2: Appliquer aux routes critiques

**Exemple:** `src/app/api/v1/onboarding/complete/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { sanitizeRequestJson } from '@/lib/security/sanitize';
import { onboardingCompleteBodySchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  // ✅ SANITIZATION AVANT VALIDATION
  let body: unknown;
  try {
    body = await sanitizeRequestJson(request, {
      maxLength: 500,
      allowHtml: false,
      trim: true,
    });
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête invalide' },
      { status: 400 }
    );
  }

  // Validation Zod
  const parsed = onboardingCompleteBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { displayName, classLevel, targetScore, eafDate, selectedOeuvres } = parsed.data;

  // ... suite du traitement
}
```

**Exemple:** `src/app/api/v1/tuteur/message/route.ts`

```typescript
import { sanitizeRequestJson } from '@/lib/security/sanitize';

export async function POST(request: NextRequest) {
  // Sanitize avec maxLength plus élevé pour messages
  const body = await sanitizeRequestJson(request, {
    maxLength: 4000,
    allowHtml: false,
    trim: true,
  });

  const parsed = tuteurMessageBodySchema.safeParse(body);
  // ...
}
```

---

#### Étape 3: Wrapper utilitaire pour routes

**Fichier à créer:** `src/lib/validation/request.ts` (extension)

```typescript
import { z } from 'zod';
import { sanitizeObject } from '../security/sanitize';

/**
 * Parse et sanitize un body avec schema Zod
 */
export function parseAndSanitize<T extends z.ZodType>(
  body: unknown,
  schema: T,
  options?: {
    maxLength?: number;
    allowHtml?: boolean;
    trim?: boolean;
  }
): z.SafeParseReturnType<z.infer<T>, z.infer<T>> {
  // Sanitize avant validation
  const sanitized = sanitizeObject(body as Record<string, unknown>, options);
  return schema.safeParse(sanitized);
}
```

---

### 🧪 Tests à Ajouter

**Fichier:** `tests/unit/security/sanitize.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { sanitizeString, sanitizeObject, escapeHtml } from '../../../src/lib/security/sanitize';

describe('sanitizeString', () => {
  it('échappe les caractères HTML dangereux', () => {
    expect(sanitizeString('<script>alert("XSS")</script>'))
      .toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
  });

  it('trim les whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('limite la longueur', () => {
    expect(sanitizeString('a'.repeat(1000), { maxLength: 10 })).toHaveLength(10);
  });

  it('normalise Unicode', () => {
    expect(sanitizeString('café')).toBe('café'); // NFKC normalized
  });
});

describe('sanitizeObject', () => {
  it('sanitize récursivement les objets', () => {
    const input = {
      name: '<script>alert(1)</script>',
      nested: {
        value: '"><img src=x onerror=alert(1)>',
      },
    };

    const output = sanitizeObject(input);
    expect(output.name).toContain('&lt;script&gt;');
    expect(output.nested.value).toContain('&lt;img');
  });
});
```

---

### ✅ Checklist P1-02

- [ ] Créer `src/lib/security/sanitize.ts`
- [ ] Créer wrapper `parseAndSanitize` dans `validation/request.ts`
- [ ] Appliquer à toutes les routes API avec body utilisateur
- [ ] Ajouter tests unitaires sanitization
- [ ] Audit code pour inputs non sanitized

**Estimation:** 4 heures  
**Responsable:** Lead Developer

---

## 🔧 FIX 3 : ERROR MESSAGE LEAKAGE (P1-03)

### 📍 Problème Actuel

Certaines erreurs API révèlent des informations internes:

```typescript
// ❌ ACTUEL — Fuites d'information
if (!copie) {
  return NextResponse.json(
    { error: 'Copie introuvable' },  // ← Révèle que la copie existe/n'existe pas
    { status: 404 }
  );
}

if (!user) {
  return NextResponse.json(
    { error: `Utilisateur ${email} inexistant` },  // ← Fuite d'email
    { status: 404 }
  );
}
```

---

### ✅ Solution — Messages Génériques

**Principe:** Messages d'erreur identiques pour succès/échec sensible.

```typescript
// ✅ NOUVELLE IMPLÉMENTATION — Messages génériques

// Pour les ressources non trouvées
if (!copie) {
  return NextResponse.json(
    { error: 'Ressource non disponible' },  // ← Générique
    { status: 404 }
  );
}

// Pour authentification
if (!user) {
  return NextResponse.json(
    { error: 'Identifiants invalides' },  // ← Générique
    { status: 401 }
  );
}

// Pour autorisation
if (copie.userId !== auth.user.id) {
  return NextResponse.json(
    { error: 'Accès non autorisé' },  // ← Générique
    { status: 403 }
  );
}
```

---

### 📝 Guide des Messages d'Erreur

| Contexte | ❌ À éviter | ✅ À utiliser |
|----------|-------------|---------------|
| Login échoué | "Email inexistant" / "Mot de passe incorrect" | "Identifiants invalides" |
| Resource 404 | "Copie {id} introuvable" | "Ressource non disponible" |
| Accès refusé | "Vous n'êtes pas l'enseignant de cette classe" | "Accès non autorisé" |
| Rate limit | "Trop de requêtes, limite: 10/min" | "Trop de requêtes, réessayez plus tard" |
| Erreur DB | "PostgreSQL: relation X n'existe pas" | "Erreur interne" |

---

### 🔍 Audit des Routes à Corriger

| Route | Message Actuel | Message Corrigé |
|-------|----------------|-----------------|
| `/api/v1/copies/[id]` | "Copie introuvable" | "Ressource non disponible" |
| `/api/v1/auth/login` | "Email inexistant" | "Identifiants invalides" |
| `/api/v1/enseignant/class/{code}` | "Classe inexistante" | "Code invalide" |
| `/api/v1/oral/session/[id]` | "Session non trouvée" | "Session non disponible" |

---

### ✅ Checklist P1-03

- [ ] Audit complet des messages d'erreur (grep "error:")
- [ ] Remplacer messages spécifiques par génériques
- [ ] Vérifier logs internes gardent détails (pour debug)
- [ ] Tester UX des messages (compréhensibles par élèves)

**Estimation:** 1 heure  
**Responsable:** Developer

---

## 🔧 FIX 4 : TESTS PAYMENT FLOW (P1-04)

### 📍 Problème Actuel

Aucun test pour le flow de paiement ClicToPay, critique pour les revenus.

**Routes non testées:**
- `/api/v1/payments/clictopay/callback` — Webhook de paiement
- `/api/v1/payments/init` — Initiation paiement (si existe)

---

### ✅ Solution — Suite de Tests Complète

#### Étape 1: Tests unitaires webhook

**Fichier à créer:** `tests/unit/payments/clictopay-webhook.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';

describe('ClicToPay Webhook', () => {
  const WEBHOOK_SECRET = 'test_webhook_secret_123';
  const ORDER_REF = 'order_12345';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLICTOPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  });

  it('accepte un webhook avec signature valide', async () => {
    const payload = {
      orderRef: ORDER_REF,
      status: 'ACCEPTED',
      providerRef: 'clictopay_ref_xyz',
      amount: 25000, // millimes
    };

    // Générer signature HMAC
    const signature = createHmac('sha256', WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    // Mock request
    const mockRequest = {
      json: async () => payload,
      headers: {
        get: (name: string) => {
          if (name === 'x-clictopay-signature') return signature;
          return null;
        },
      },
    } as unknown as NextRequest;

    // Importer et tester la route
    const { POST } = await import('../../../src/app/api/v1/payments/clictopay/callback/route');
    const response = await POST(mockRequest);

    expect(response.status).toBe(200);
    
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('rejette un webhook avec signature invalide', async () => {
    const payload = {
      orderRef: ORDER_REF,
      status: 'ACCEPTED',
    };

    const mockRequest = {
      json: async () => payload,
      headers: {
        get: () => 'invalid_signature',
      },
    } as unknown as NextRequest;

    const { POST } = await import('../../../src/app/api/v1/payments/clictopay/callback/route');
    const response = await POST(mockRequest);

    expect(response.status).toBe(401);
  });

  it('gère le statut ACCEPTED correctement', async () => {
    const payload = {
      orderRef: ORDER_REF,
      status: 'ACCEPTED',
      providerRef: 'clictopay_123',
    };

    const signature = createHmac('sha256', WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    const mockRequest = {
      json: async () => payload,
      headers: { get: () => signature },
    } as unknown as NextRequest;

    const { POST } = await import('../../../src/app/api/v1/payments/clictopay/callback/route');
    const response = await POST(mockRequest);

    expect(response.status).toBe(200);

    // Vérifier que la subscription a été activée en DB
    // (mock Prisma nécessaire)
  });

  it('gère le statut REFUSÉ correctement', async () => {
    const payload = {
      orderRef: ORDER_REF,
      status: 'REFUSED',
      errorCode: 'INSUFFICIENT_FUNDS',
    };

    const signature = createHmac('sha256', WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    const mockRequest = {
      json: async () => payload,
      headers: { get: () => signature },
    } as unknown as NextRequest;

    const { POST } = await import('../../../src/app/api/v1/payments/clictopay/callback/route');
    const response = await POST(mockRequest);

    expect(response.status).toBe(200);
    // Subscription ne doit pas être activée
  });

  it('rejette les replay attacks (orderRef déjà traité)', async () => {
    // Mock: orderRef déjà traité dans DB
    const mockPrisma = {
      paymentTransaction: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'existing_payment',
          status: 'ACCEPTED',
          callbackPayload: { processed: true },
        }),
      },
    };

    vi.mock('@/lib/db/client', () => ({
      prisma: mockPrisma,
    }));

    const payload = { orderRef: ORDER_REF, status: 'ACCEPTED' };
    const signature = createHmac('sha256', WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    const mockRequest = {
      json: async () => payload,
      headers: { get: () => signature },
    } as unknown as NextRequest;

    const { POST } = await import('../../../src/app/api/v1/payments/clictopay/callback/route');
    const response = await POST(mockRequest);

    // Doit être idempotent — retourne 200 mais ne traite pas 2x
    expect(response.status).toBe(200);
  });
});
```

---

#### Étape 2: Tests d'intégration E2E

**Fichier à créer:** `tests/e2e/payment-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Payment Flow', () => {
  test('page pricing affiche les plans correctement', async ({ page }) => {
    await page.goto('/pricing');
    
    // Vérifier les 3 plans
    await expect(page.getByText('FREE')).toBeVisible();
    await expect(page.getByText('MONTHLY')).toBeVisible();
    await expect(page.getByText('LIFETIME')).toBeVisible();
    
    // Vérifier les features
    await expect(page.getByText('Sessions orales')).toBeVisible();
  });

  test('clic bouton upgrade → redirection paiement', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByTestId('auth-email').fill('jean@eaf.local');
    await page.getByTestId('auth-password').fill('demo1234');
    await page.getByTestId('auth-submit').click();
    await expect(page).toHaveURL('/');

    // Navigate to pricing
    await page.goto('/pricing');
    await page.getByRole('button', { name: 'Choisir MONTHLY' }).click();

    // Should redirect to payment or show payment modal
    await expect(page).toHaveURL(/\/paiement/);
  });

  test('page confirmation paiement accessible', async ({ page }) => {
    await page.goto('/paiement/confirmation');
    await expect(page.getByText('Paiement réussi')).toBeVisible();
  });

  test('page refus paiement accessible', async ({ page }) => {
    await page.goto('/paiement/refus');
    await expect(page.getByText('Paiement refusé')).toBeVisible();
  });
});
```

---

#### Étape 3: Mock serveur de test pour webhook

**Fichier à créer:** `tests/fixtures/clictopay-mock-server.ts`

```typescript
/**
 * Mock server pour simuler les callbacks ClicToPay en E2E
 */
import { createServer } from 'http';
import { createHmac } from 'crypto';

const WEBHOOK_SECRET = process.env.CLICTOPAY_WEBHOOK_SECRET || 'test_secret';

export function createClicToPayMockServer(port: number = 3111) {
  const server = createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/webhook') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        const payload = JSON.parse(body);
        
        // Générer signature
        const signature = createHmac('sha256', WEBHOOK_SECRET)
          .update(body)
          .digest('hex');

        // Forward to actual webhook endpoint
        const response = await fetch('http://localhost:3110/api/v1/payments/clictopay/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-clictopay-signature': signature,
          },
          body: body,
        });

        res.writeHead(response.status);
        res.end(await response.text());
      });
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return {
    start: () => new Promise<void>(resolve => server.listen(port, resolve)),
    stop: () => new Promise<void>(resolve => server.close(() => resolve())),
    sendWebhook: async (payload: Record<string, unknown>) => {
      const response = await fetch(`http://localhost:${port}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return response.json();
    },
  };
}
```

---

### ✅ Checklist P1-04

- [ ] Créer `tests/unit/payments/clictopay-webhook.test.ts`
- [ ] Créer `tests/e2e/payment-flow.spec.ts`
- [ ] Créer mock server pour tests webhook
- [ ] Tester scénarios: ACCEPTED, REFUSED, PENDING, ERROR
- [ ] Tester idempotence (replay attacks)
- [ ] Tester signature HMAC validation

**Estimation:** 3 heures  
**Responsable:** QA Engineer / Developer

---

## 📅 PLANNING DE DÉPLOIEMENT

### Sprint 1 (Jours 1-5)

| Jour | Tâche | Responsable |
|------|-------|-------------|
| J1 | P1-01: Rate limit fail-closed | Lead Dev |
| J2 | P1-02: Input sanitization (utilitaires) | Lead Dev |
| J3 | P1-02: Appliquer sanitization aux routes | Dev |
| J4 | P1-03: Audit + fix error messages | Dev |
| J5 | P1-04: Tests payment flow (unitaires) | QA |

### Sprint 2 (Jours 6-10)

| Jour | Tâche | Responsable |
|------|-------|-------------|
| J6 | P1-04: Tests payment flow (E2E) | QA |
| J7 | Tests manuels + QA | Tous |
| J8 | Correction bugs + regression | Tous |
| J9 | Pré-production deploy | Lead Dev |
| J10 | Validation finale + GO/NO-GO | Tous |

---

## 🧪 VALIDATION FINALE

### Checklist Pré-Production

```bash
# 1. TypeScript
npm run typecheck  # Doit afficher 0 erreurs

# 2. Tests
npm run test:unit  # Doit afficher 100% pass
npm run test:e2e   # Doit afficher tous tests verts

# 3. Build
npm run build      # Doit réussir sans erreurs

# 4. Lint
npm run lint       # Doit être clean

# 5. Tests manuels
- [ ] Rate limit avec Redis stoppé → doit bloquer
- [ ] Input XSS: `<script>alert(1)</script>` → doit être échappé
- [ ] Messages d'erreur → doivent être génériques
- [ ] Payment webhook → doit accepter/rejeter correctement
```

---

## 📊 SUIVI DE PROGRESSION

| Issue | Statut | Progress |
|-------|--------|----------|
| P1-01 Rate limit | ⬜ Pending | 0% |
| P1-02 Sanitization | ⬜ Pending | 0% |
| P1-03 Error messages | ⬜ Pending | 0% |
| P1-04 Payment tests | ⬜ Pending | 0% |

**Légende:** ⬜ Pending | 🟡 In Progress | ✅ Completed

---

## 📞 CONTACTS & RESPONSABLES

| Rôle | Nom | Contact |
|------|-----|---------|
| Lead Developer | À définir | |
| QA Engineer | À définir | |
| DevOps | À définir | |
| Product Owner | À définir | |

---

**Document approuvé par:** Lead Senior Full Stack  
**Date de création:** 1er mars 2026  
**Prochaine revue:** Après Sprint 2
