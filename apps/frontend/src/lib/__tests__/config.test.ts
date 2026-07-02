import { describe, it, expect, beforeEach, vi } from 'vitest';

const OriginalEnv = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = { ...OriginalEnv };
});

describe('config', () => {
  describe('API_URL', () => {
    it('reads NEXT_PUBLIC_API_URL from env', async () => {
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/api';
      const { API_URL } = await import('../config');
      expect(API_URL).toBe('https://api.example.com/api');
    });

    it('strips trailing slash', async () => {
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/api/';
      const { API_URL } = await import('../config');
      expect(API_URL).toBe('https://api.example.com/api');
    });

    it('falls back to localhost:3001/api when env is not set', async () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      const { API_URL } = await import('../config');
      expect(API_URL).toBe('http://localhost:3001/api');
    });
  });

  describe('SOCKET_URL', () => {
    it('strips /api suffix from API_URL', async () => {
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/api';
      const { SOCKET_URL } = await import('../config');
      expect(SOCKET_URL).toBe('https://api.example.com');
    });

    it('strips /api/ suffix', async () => {
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/api/';
      const { SOCKET_URL } = await import('../config');
      expect(SOCKET_URL).toBe('https://api.example.com');
    });

    it('returns same URL when API_URL does not end with /api', async () => {
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
      const { SOCKET_URL } = await import('../config');
      expect(SOCKET_URL).toBe('https://api.example.com');
    });

    it('handles port numbers correctly', async () => {
      process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001/api';
      const { SOCKET_URL } = await import('../config');
      expect(SOCKET_URL).toBe('http://localhost:3001');
    });

    it('falls back with localhost when env not set', async () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      const { SOCKET_URL } = await import('../config');
      expect(SOCKET_URL).toBe('http://localhost:3001');
    });
  });
});
