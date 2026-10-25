import { supabase } from './supabase';

const baseUrl = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000/api';

const GET_CACHE_TTL = 30_000;
const MAX_CACHE_ENTRIES = 100;
type CacheEntry = { value: unknown; expiresAt: number };
const responseCache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<unknown>>();
let cacheVersion = 0;

export function clearApiCache() {
  cacheVersion += 1;
  responseCache.clear();
  pendingRequests.clear();
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  const token = session?.access_token;
  const canCache = method === 'GET' && !options.body;
  const cacheKey = `${session?.user.id || 'anonymous'}:${path}`;

  if (canCache) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value as T;
    if (cached) responseCache.delete(cacheKey);

    const pending = pendingRequests.get(cacheKey);
    if (pending) return pending as Promise<T>;
  } else if (method !== 'GET') {
    // A write can affect any list or summary, so invalidate all cached reads.
    clearApiCache();
  }

  const requestVersion = cacheVersion;
  const request = (async () => {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) clearApiCache();
      throw new Error(payload.error || `Request failed (${response.status})`);
    }

    if (method !== 'GET') clearApiCache();
    if (canCache && requestVersion === cacheVersion) {
      if (responseCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = responseCache.keys().next().value;
        if (oldestKey) responseCache.delete(oldestKey);
      }
      responseCache.set(cacheKey, { value: payload, expiresAt: Date.now() + GET_CACHE_TTL });
    }
    return payload as T;
  })();

  if (canCache) {
    pendingRequests.set(cacheKey, request);
    try {
      return await request;
    } finally {
      if (pendingRequests.get(cacheKey) === request) pendingRequests.delete(cacheKey);
    }
  }
  return request;
}
