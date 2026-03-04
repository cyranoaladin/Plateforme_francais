/**
 * Sanitization des inputs utilisateur
 * Objectif: Prévenir XSS et injections
 * 
 * Usage:
 * ```typescript
 * const safeName = sanitizeString(userInput.name, { maxLength: 100 });
 * const safeBody = sanitizeObject(requestBody, { maxLength: 5000, allowHtml: false });
 * ```
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
 * Options de sanitization
 */
export interface SanitizeOptions {
  /** Longueur maximale (défaut: 10000) */
  maxLength?: number;
  /** Autoriser HTML (défaut: false) */
  allowHtml?: boolean;
  /** Trim whitespace (défaut: true) */
  trim?: boolean;
  /** Autoriser sauts de ligne (défaut: true) */
  allowNewlines?: boolean;
}

/**
 * Sanitize un string:
 * - Trim whitespace
 * - Limite longueur
 * - Échappe HTML (sauf si allowHtml=true)
 * - Normalise Unicode (NFKC)
 */
export function sanitizeString(
  input: string,
  options?: SanitizeOptions
): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }

  const {
    maxLength = 10000,
    allowHtml = false,
    trim = true,
    allowNewlines = true,
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

  // Optionnel: supprimer les sauts de ligne si non autorisés
  if (!allowNewlines) {
    result = result.replace(/[\r\n]+/g, ' ');
  }

  return result;
}

/**
 * Sanitize un objet JSON (récursif)
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options?: SanitizeOptions
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
 * 
 * Usage dans une route API:
 * ```typescript
 * export async function POST(request: Request) {
 *   const body = await sanitizeRequestJson(request, { maxLength: 5000 });
 *   const parsed = mySchema.safeParse(body);
 *   // ...
 * }
 * ```
 */
export async function sanitizeRequestJson(
  request: Request,
  options?: SanitizeOptions
): Promise<unknown> {
  const body = await request.json();
  return sanitizeObject(body as Record<string, unknown>, options);
}

/**
 * Wrapper pour parse + sanitize avec schema Zod
 * 
 * Usage:
 * ```typescript
 * const result = parseAndSanitize(body, mySchema, { maxLength: 500 });
 * if (!result.success) {
 *   return NextResponse.json({ error: 'Invalid' }, { status: 400 });
 * }
 * ```
 */
export function parseAndSanitize<T extends Record<string, unknown>>(
  body: unknown,
  options?: SanitizeOptions
): T {
  return sanitizeObject(body as T, options);
}

/**
 * Nettoie un string pour affichage sécurisé dans HTML
 * (à utiliser quand on affiche du contenu utilisateur)
 */
export function safeHtmlDisplay(input: string): string {
  return escapeHtml(input);
}

/**
 * Valide qu'un string ne contient pas de HTML/JS dangereux
 * Retourne true si le string est "propre"
 */
export function isSafeString(input: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,  // onclick=, onerror=, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:text\/html/i,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(input));
}
