import { describe, it, expect } from 'vitest';
import { resetPasswordBodySchema, forgotPasswordBodySchema } from '@/lib/validation/schemas';

describe('forgotPasswordBodySchema', () => {
  it('accepte un email valide', () => {
    const result = forgotPasswordBodySchema.safeParse({ email: 'test@example.com' });
    expect(result.success).toBe(true);
  });

  it('rejette un email invalide', () => {
    const result = forgotPasswordBodySchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejette un body vide', () => {
    const result = forgotPasswordBodySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordBodySchema', () => {
  it('accepte un token et password valides', () => {
    const result = resetPasswordBodySchema.safeParse({
      token: 'abc123def456',
      password: 'MonPass1fort',
    });
    expect(result.success).toBe(true);
  });

  it('rejette un mot de passe trop court', () => {
    const result = resetPasswordBodySchema.safeParse({
      token: 'abc123',
      password: 'Ab1',
    });
    expect(result.success).toBe(false);
  });

  it('rejette un mot de passe sans majuscule', () => {
    const result = resetPasswordBodySchema.safeParse({
      token: 'abc123',
      password: 'monpassword1',
    });
    expect(result.success).toBe(false);
  });

  it('rejette un mot de passe sans chiffre', () => {
    const result = resetPasswordBodySchema.safeParse({
      token: 'abc123',
      password: 'MonPassword',
    });
    expect(result.success).toBe(false);
  });

  it('rejette un mot de passe sans minuscule', () => {
    const result = resetPasswordBodySchema.safeParse({
      token: 'abc123',
      password: 'MONPASSWORD1',
    });
    expect(result.success).toBe(false);
  });

  it('rejette un token vide', () => {
    const result = resetPasswordBodySchema.safeParse({
      token: '',
      password: 'MonPass1fort',
    });
    expect(result.success).toBe(false);
  });
});
