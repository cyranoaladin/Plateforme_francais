/**
 * Helper pour créer un serveur de test pour les tests d'intégration
 */
import { createServer } from 'http';
import { NextApiHandler } from 'next';
import { apiResolver } from 'next/dist/server/api-utils/node';

export function createTestServer() {
  // Simple mock server for integration tests
  const server = createServer();
  
  return {
    fetch: async (path: string, init?: RequestInit): Promise<Response> => {
      // For integration tests with real DB, this would proxy to the actual API
      // For now, return a mock response to prevent crashes
      console.warn(`Test server fetch not fully implemented for: ${path}`);
      return new Response(JSON.stringify({ error: 'Test server not configured' }), {
        status: 501,
        headers: { 'Content-Type': 'application/json' },
      });
    },
    close: async () => {
      server.close();
    },
  };
}
