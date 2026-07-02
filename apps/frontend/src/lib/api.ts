import { API_URL } from './config';
import { getTokenFromCookie } from './authFetch';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  baseDelay: number;
  headers: Record<string, string>;
}

export interface RequestOptions {
  params?: Record<string, string>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeout?: number;
  retries?: number;
  baseDelay?: number;
}

const DEFAULTS: ApiConfig = {
  baseUrl: API_URL,
  timeout: 15_000,
  retries: 3,
  baseDelay: 1_000,
  headers: { 'Content-Type': 'application/json' },
};

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(baseUrl: string): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${baseUrl}/auth/refresh`, {
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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const baseUrl = options?.headers?.['X-Base-Url'] || DEFAULTS.baseUrl;
  const url = new URL(path.replace(/^\//, ''), baseUrl.endsWith('/') ? baseUrl : baseUrl + '/');

  if (options?.params) {
    for (const [k, v] of Object.entries(options.params)) {
      url.searchParams.set(k, v);
    }
  }

  const headers: Record<string, string> = { ...DEFAULTS.headers, ...options?.headers };
  const token = getTokenFromCookie();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const maxRetries = options?.retries ?? DEFAULTS.retries;
  const baseDelay = options?.baseDelay ?? DEFAULTS.baseDelay;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = options?.timeout ?? DEFAULTS.timeout;
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const fetchOptions: RequestInit = {
        method,
        headers,
        credentials: 'include',
        signal: options?.signal ?? controller.signal,
      };

      if (body !== undefined && method !== 'GET') {
        if (body instanceof FormData) {
          const h = { ...headers };
          delete h['Content-Type'];
          fetchOptions.headers = h;
          fetchOptions.body = body;
        } else {
          fetchOptions.body = JSON.stringify(body);
        }
      }

      const response = await fetch(url.toString(), fetchOptions);
      clearTimeout(timeoutId);

      if (response.status === 204) {
        return undefined as T;
      }

      const contentType = response.headers.get('content-type') || '';
      let data: unknown;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const message =
          (data && typeof data === 'object' && 'message' in data
            ? (data as Record<string, unknown>).message
            : undefined) as string | undefined;
        const errorMessage =
          message ||
          (data && typeof data === 'object' && 'error' in data
            ? (data as Record<string, unknown>).error
            : undefined) as string | undefined;

        if (response.status === 401 && !options?.headers?.['X-Skip-Refresh']) {
          const refreshed = await tryRefreshToken(baseUrl);
          if (refreshed) {
            const retryOptions = { ...options, headers: { ...options?.headers, 'X-Skip-Refresh': '1' } };
            return request<T>(method, path, body, retryOptions);
          }
        }

        if (response.status >= 400 && response.status < 500) {
          throw new ApiError(
            errorMessage || `Request failed (${response.status})`,
            response.status,
            data,
          );
        }

        throw new ApiError(
          errorMessage || `Server error (${response.status})`,
          response.status,
          data,
        );
      }

      return data as T;
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (lastError.name === 'AbortError') {
        throw new ApiError('Request timed out', 408);
      }

      if (lastError instanceof ApiError) {
        if (lastError.status >= 400 && lastError.status < 500) {
          throw lastError;
        }
      }

      if (attempt === maxRetries) {
        throw lastError;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt) + Math.random() * baseDelay, 10_000);
      await sleep(delay);
    }
  }

  throw lastError ?? new Error('Unexpected error');
}

export const api = {
  get<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>('GET', path, undefined, options);
  },

  post<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('POST', path, body, options);
  },

  put<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PUT', path, body, options);
  },

  patch<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PATCH', path, body, options);
  },

  del<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>('DELETE', path, undefined, options);
  },

  upload<T = unknown>(path: string, formData: FormData, options?: RequestOptions): Promise<T> {
    return request<T>('POST', path, formData, options);
  },
};


