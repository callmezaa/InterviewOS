import { getTokenFromCookie } from './authFetch';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.token) {
        document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Lax`;
      }
      return true;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

function hasSkipRefresh(init: RequestInit | undefined): boolean {
  if (!init?.headers) return false;
  const h = new Headers(init.headers);
  return h.has('X-Skip-Refresh');
}

export function patchGlobalFetch() {
  if (typeof window === 'undefined' || (window as any).__fetchPatched) return;
  (window as any).__fetchPatched = true;

  const original = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const token = getTokenFromCookie();
    const headers = new Headers(init?.headers);
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await original(input, {
      ...init,
      headers,
      credentials: init?.credentials || 'include',
    });

    if (res.status === 401 && !hasSkipRefresh(init)) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        const newToken = getTokenFromCookie();
        const retryHeaders = new Headers(init?.headers);
        if (newToken) retryHeaders.set('Authorization', `Bearer ${newToken}`);
        retryHeaders.set('X-Skip-Refresh', '1');
        return original(input, {
          ...init,
          headers: retryHeaders,
          credentials: init?.credentials || 'include',
        });
      }
    }

    return res;
  };
}