/**
 * Tests du sélecteur de provider de stockage.
 * Vérifie que STORAGE_PROVIDER=s3 / local choisit le bon backend,
 * et que le provider S3 lève une erreur sans credentials.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getStorageProvider, resetStorageProvider } from '@/lib/storage/provider';

describe('StorageProvider — sélection selon STORAGE_PROVIDER', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetStorageProvider();
  });

  afterEach(() => {
    resetStorageProvider();
    // Restaure l'environnement
    Object.assign(process.env, originalEnv);
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key];
    }
  });

  it('retourne LocalStorageProvider quand STORAGE_PROVIDER absent', () => {
    delete process.env.STORAGE_PROVIDER;
    const p = getStorageProvider();
    // L'URL de téléchargement locale commence par /api/v1/storage/local
    return p.getDownloadUrl('test.pdf').then((url) => {
      expect(url).toContain('/api/v1/storage/local');
    });
  });

  it('retourne LocalStorageProvider quand STORAGE_PROVIDER=local', () => {
    process.env.STORAGE_PROVIDER = 'local';
    const p = getStorageProvider();
    return p.getDownloadUrl('test.pdf').then((url) => {
      expect(url).toContain('/api/v1/storage/local');
    });
  });

  it('lève une erreur S3 si credentials manquants avec STORAGE_PROVIDER=s3', () => {
    process.env.STORAGE_PROVIDER = 's3';
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;
    expect(() => getStorageProvider()).toThrow(/S3_ACCESS_KEY_ID/);
  });

  it('instancie S3StorageProvider avec credentials valides', () => {
    process.env.STORAGE_PROVIDER = 's3';
    process.env.S3_ACCESS_KEY_ID = 'test-key';
    process.env.S3_SECRET_ACCESS_KEY = 'test-secret';
    process.env.S3_BUCKET = 'test-bucket';
    process.env.S3_ENDPOINT = 'https://s3.example.com';
    // Ne lève pas d'exception
    const p = getStorageProvider();
    expect(p).toBeDefined();
  });

  it('met en cache le provider (singleton)', () => {
    delete process.env.STORAGE_PROVIDER;
    const p1 = getStorageProvider();
    const p2 = getStorageProvider();
    expect(p1).toBe(p2);
  });
});
