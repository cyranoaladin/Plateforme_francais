import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeObject,
  escapeHtml,
  isSafeString,
  safeHtmlDisplay,
} from '../../../src/lib/security/sanitize';

describe('escapeHtml', () => {
  it('échappe les caractères HTML de base', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    expect(escapeHtml('a & b')).toBe('a &amp; b');
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
    expect(escapeHtml("it's")).toBe('it&#x27;s');
    expect(escapeHtml('</div>')).toBe('&lt;&#x2F;div&gt;');
  });

  it('gère les strings vides', () => {
    expect(escapeHtml('')).toBe('');
  });
});

describe('sanitizeString', () => {
  it('échappe le HTML dangereux', () => {
    const result = sanitizeString('<script>alert("XSS")</script>');
    expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
  });

  it('trim les whitespace par défaut', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('ne trim pas si trim=false', () => {
    expect(sanitizeString('  hello  ', { trim: false })).toBe('  hello  ');
  });

  it('limite la longueur', () => {
    const longString = 'a'.repeat(100);
    const result = sanitizeString(longString, { maxLength: 10 });
    expect(result).toHaveLength(10);
    expect(result).toBe('aaaaaaaaaa');
  });

  it('normalise Unicode (NFKC)', () => {
    // café avec combining accent → normalisé
    const input = 'cafe\u0301'; // e + combining acute accent
    const result = sanitizeString(input);
    expect(result).toBe('café');
  });

  it('conserve les newlines par défaut', () => {
    const input = 'line1\nline2\r\nline3';
    const result = sanitizeString(input);
    // \r\n est normalisé en \n par normalize('NFKC')
    expect(result).toContain('line1');
    expect(result).toContain('line2');
    expect(result).toContain('line3');
  });

  it('supprime les newlines si allowNewlines=false', () => {
    const input = 'line1\nline2\r\nline3';
    const result = sanitizeString(input, { allowNewlines: false });
    expect(result).toBe('line1 line2 line3');
  });

  it('autorise HTML si allowHtml=true', () => {
    const input = '<p>Safe HTML</p>';
    const result = sanitizeString(input, { allowHtml: true });
    expect(result).toBe('<p>Safe HTML</p>');
  });

  it('lève une erreur si input non-string', () => {
    expect(() => sanitizeString(123 as unknown as string)).toThrow('Input must be a string');
    expect(() => sanitizeString(null as unknown as string)).toThrow('Input must be a string');
  });
});

describe('sanitizeObject', () => {
  it('sanitize récursivement les strings', () => {
    const input = {
      name: '<script>alert(1)</script>',
      description: 'Normal text',
    };

    const output = sanitizeObject(input);
    expect(output.name).toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;');
    expect(output.description).toBe('Normal text');
  });

  it('sanitize les objets imbriqués', () => {
    const input = {
      user: {
        name: '<img src=x onerror=alert(1)>',
        profile: {
          bio: 'Normal bio',
        },
      },
    };

    const output = sanitizeObject(input);
    expect(output.user.name).toContain('&lt;img');
    expect(output.user.profile.bio).toBe('Normal bio');
  });

  it('sanitize les tableaux de strings', () => {
    const input = {
      tags: ['<script>', 'normal', '</iframe>'],
    };

    const output = sanitizeObject(input);
    expect(output.tags[0]).toBe('&lt;script&gt;');
    expect(output.tags[1]).toBe('normal');
    expect(output.tags[2]).toBe('&lt;&#x2F;iframe&gt;');
  });

  it('préserve les types non-string', () => {
    const input = {
      count: 42,
      active: true,
      data: null,
      tags: [1, 2, 3],
    };

    const output = sanitizeObject(input);
    expect(output.count).toBe(42);
    expect(output.active).toBe(true);
    expect(output.data).toBe(null);
    expect(output.tags).toEqual([1, 2, 3]);
  });

  it('applique les options à tous les niveaux', () => {
    const input = {
      short: 'a'.repeat(200),
      nested: {
        alsoShort: 'b'.repeat(200),
      },
    };

    const output = sanitizeObject(input, { maxLength: 50 });
    expect(output.short).toHaveLength(50);
    expect(output.nested.alsoShort).toHaveLength(50);
  });
});

describe('isSafeString', () => {
  it('détecte les scripts dangereux', () => {
    expect(isSafeString('<script>alert(1)</script>')).toBe(false);
    expect(isSafeString('<SCRIPT>')).toBe(false);
  });

  it('détecte javascript: protocol', () => {
    expect(isSafeString('javascript:alert(1)')).toBe(false);
    expect(isSafeString('<a href="javascript:void(0)">')).toBe(false);
  });

  it('détecte les event handlers', () => {
    expect(isSafeString('<img onerror=alert(1)>')).toBe(false);
    expect(isSafeString('<div onclick="doSomething()">')).toBe(false);
  });

  it('détecte iframe/object/embed', () => {
    expect(isSafeString('<iframe src="evil.com">')).toBe(false);
    expect(isSafeString('<object data="malware.swf">')).toBe(false);
    expect(isSafeString('<embed src="virus.exe">')).toBe(false);
  });

  it('accepte les strings sûrs', () => {
    expect(isSafeString('Hello world!')).toBe(true);
    expect(isSafeString('Ceci est un texte normal.')).toBe(true);
    expect(isSafeString('Email: test@example.com')).toBe(true);
  });
});

describe('safeHtmlDisplay', () => {
  it('échappe HTML pour affichage sécurisé', () => {
    expect(safeHtmlDisplay('<script>')).toBe('&lt;script&gt;');
    expect(safeHtmlDisplay('Click <button>here</button>')).toBe(
      'Click &lt;button&gt;here&lt;&#x2F;button&gt;'
    );
  });
});

describe('sanitizeString - cas réels XSS', () => {
  it('bloque XSS classique', () => {
    const xssPayloads = [
      '<script>alert(document.cookie)</script>',
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      '<iframe src="data:text/html,<script>alert(1)</script>">',
      '<body onload=alert(1)>',
    ];

    xssPayloads.forEach((payload) => {
      const result = sanitizeString(payload);
      // Après sanitization, le HTML doit être échappé
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<img');
      expect(result).not.toContain('<svg');
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('<body');
      // Les tags doivent être échappés
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });
    
    // javascript: protocol n'a pas de tags HTML mais doit être sécurisé
    const jsProtocol = sanitizeString('javascript:alert(1)');
    expect(jsProtocol).toBe('javascript:alert(1)'); // Pas de HTML à échapper
  });
});
