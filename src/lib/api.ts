// API client for the members' website.
// - Access token in memory only; refresh token in localStorage so members stay signed in.
// - Expired access tokens are renewed before the request (public pages answer an expired token as
//   "anonymous", so waiting for a 401 would hide votes/registrations).
// - Read requests move to the fallback address when the main one cannot be reached.

export interface Tokens { accessToken: string; refreshToken: string }
export interface Preferences { notifyNews: boolean; notifyActivities: boolean; notifyPolls: boolean; notifyVolunteer: boolean; showNamePublic: boolean }
export interface User {
  id: string; fullName: string; email: string; phone: string; role: string; locale: string;
  emailVerified: boolean; phoneVerified: boolean; telegramLinked?: boolean; preferences: Preferences;
}

export class ApiError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const RT = 'assoc_rt';

/** Seconds-precision `exp` claim of a JWT; null when unreadable. */
export function jwtExp(token: string): number | null {
  try {
    const p = token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/');
    const exp = JSON.parse(atob(p.padEnd(Math.ceil(p.length / 4) * 4, '='))).exp;
    return typeof exp === 'number' ? exp : null;
  } catch { return null; }
}
export const isExpired = (token: string, nowMs = Date.now()) => {
  const exp = jwtExp(token);
  return exp === null || exp * 1000 - 30_000 <= nowMs;
};

export class Api {
  private access: string | null = null;
  private refreshing: Promise<boolean> | null = null;
  private preferred = 0;
  onSessionEnd: () => void = () => {};

  constructor(private bases: string[], private store: Store, private f: typeof fetch = (...a) => fetch(...a)) {}

  get signedIn() { return !!this.store.getItem(RT); }

  setTokens(t: Tokens) { this.access = t.accessToken; this.store.setItem(RT, t.refreshToken); }
  clear() { this.access = null; this.store.removeItem(RT); }

  /** Sends to the address that last worked; GET requests move to the next one on network failure. */
  private async send(path: string, init: RequestInit): Promise<Response> {
    const order = [this.preferred, ...this.bases.map((_, i) => i).filter((i) => i !== this.preferred)];
    const safe = (init.method ?? 'GET') === 'GET';
    let last: unknown;
    for (const i of order) {
      try {
        const res = await this.f(this.bases[i] + path, init);
        this.preferred = i;
        return res;
      } catch (e) {
        last = e;
        if (!safe) break;
      }
    }
    throw last ?? new TypeError('network');
  }

  private async raw<T>(method: string, path: string, body?: unknown, token?: string | null, extra: Record<string, string> = {}): Promise<T> {
    const headers: Record<string, string> = { ...extra };
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (token) headers.authorization = `Bearer ${token}`;
    let res: Response;
    try {
      res = await this.send(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch {
      throw new ApiError(0, 'network');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, (data as { error?: string })?.error ?? `http_${res.status}`);
    return data as T;
  }

  /** Single-flight refresh; the session is dropped only when the server rejects the refresh token. */
  refresh(): Promise<boolean> {
    if (!this.refreshing) {
      this.refreshing = (async () => {
        const rt = this.store.getItem(RT);
        if (!rt) return false;
        try {
          const r = await this.raw<{ tokens: Tokens }>('POST', '/api/auth/refresh', { refreshToken: rt });
          this.setTokens(r.tokens);
          return true;
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) { this.clear(); this.onSessionEnd(); }
          return false;
        } finally {
          setTimeout(() => { this.refreshing = null; }, 0);
        }
      })();
    }
    return this.refreshing;
  }

  async req<T = unknown>(method: string, path: string, body?: unknown, extra?: Record<string, string>): Promise<T> {
    if (this.signedIn && (!this.access || isExpired(this.access))) await this.refresh();
    try {
      return await this.raw<T>(method, path, body, this.access, extra);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401 && this.signedIn && (await this.refresh())) return this.raw<T>(method, path, body, this.access, extra);
      throw e;
    }
  }

  get = <T = unknown>(p: string) => this.req<T>('GET', p);
  post = <T = unknown>(p: string, b: unknown = {}) => this.req<T>('POST', p, b);
  patch = <T = unknown>(p: string, b: unknown) => this.req<T>('PATCH', p, b);
  del = <T = unknown>(p: string, b?: unknown) => this.req<T>('DELETE', p, b);

  async login(identifier: string, password: string) {
    const r = await this.raw<{ user: User; tokens: Tokens }>('POST', '/api/auth/login', { identifier, password });
    this.setTokens(r.tokens);
    return r.user;
  }
  async register(b: { fullName: string; email: string; phone: string; password: string; confirmPassword: string; locale: string }) {
    const r = await this.raw<{ user: User; tokens: Tokens }>('POST', '/api/auth/register', b);
    this.setTokens(r.tokens);
    return r.user;
  }
  async logout() {
    const rt = this.store.getItem(RT);
    if (rt) await this.raw('POST', '/api/auth/logout', { refreshToken: rt }, this.access).catch(() => {});
    this.clear();
  }
}

const env = import.meta.env as Record<string, string | undefined>;
export const API_BASES = [env.VITE_API_BASE_URL ?? 'https://association-api.yacincianai31.workers.dev', ...(env.VITE_API_FALLBACK_URLS ?? 'https://association-gateway.pages.dev').split(',')]
  .map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);

const storage: Store = (() => {
  try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return localStorage; } catch { const m = new Map<string, string>(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) }; }
})();

export const api = new Api(API_BASES, storage);
export const mediaUrl = (u: string | null | undefined) => (!u ? '' : u.startsWith('/') ? API_BASES[0] + u : u);
