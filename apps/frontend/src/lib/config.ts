function getEnv(name: string): string | undefined {
  if (typeof process === 'undefined') return undefined;
  return process.env[name];
}

const rawApiUrl = getEnv('NEXT_PUBLIC_API_URL') || '/api';

export const API_URL = rawApiUrl.replace(/\/+$/, '');

export const SOCKET_URL = (() => {
  // In development with proxy, connect directly to backend
  const envSocket = getEnv('NEXT_PUBLIC_SOCKET_URL');
  if (envSocket) return envSocket;
  // Fallback: if API_URL is a proxy path, use the actual backend URL
  if (rawApiUrl.startsWith('/')) return 'http://localhost:3001';
  const cleaned = rawApiUrl.replace(/\/+$/, '');
  if (cleaned.endsWith('/api')) return cleaned.slice(0, -4);
  if (cleaned.endsWith('/api/')) return cleaned.slice(0, -5);
  return cleaned;
})();
