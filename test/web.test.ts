import { describe, expect, it, vi } from 'vitest';
import { Api, ApiError, isExpired } from '../src/lib/api';
import { missingFields, normalize, WILAYAS, type MemberProfile } from '../src/lib/lectureForm';
import { normalizePhone, passwordOk } from '../src/pages/Auth';
import { linkFor } from '../src/pages/Account';
import { youtubeId } from '../src/pages/Content';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const jwt = (expInSec: number) => `h.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expInSec })).replace(/=+$/, '')}.s`;
function store() { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m }; }

describe('api client', () => {
  it('renews an expired token before calling a public endpoint', async () => {
    const s = store(); s.setItem('assoc_rt', 'R1');
    const calls: string[] = [];
    const f = vi.fn(async (url: string, init: RequestInit) => {
      calls.push(`${new URL(url).pathname} ${(init.headers as Record<string, string>).authorization ?? '-'}`);
      if (url.endsWith('/api/auth/refresh')) return json(200, { tokens: { accessToken: jwt(900), refreshToken: 'R2' } });
      return json(200, { eligible: true });
    });
    const api = new Api(['https://a.test'], s, f as never);
    await api.get('/api/polls/p1');
    expect(calls[0]).toBe('/api/auth/refresh -');
    expect(calls[1]).toMatch(/^\/api\/polls\/p1 Bearer h\./);
    expect(s.getItem('assoc_rt')).toBe('R2');
  });

  it('keeps the session on a network error, drops it when the server rejects the refresh token', async () => {
    const s = store(); s.setItem('assoc_rt', 'R1');
    const offline = new Api(['https://a.test'], s, (async () => { throw new TypeError('offline'); }) as never);
    await expect(offline.get('/api/me')).rejects.toBeInstanceOf(ApiError);
    expect(s.getItem('assoc_rt')).toBe('R1');
    const ended = vi.fn();
    const rejected = new Api(['https://a.test'], s, (async () => json(401, { error: 'refresh_token_reused' })) as never);
    rejected.onSessionEnd = ended;
    await expect(rejected.get('/api/me')).rejects.toBeInstanceOf(ApiError);
    expect(s.getItem('assoc_rt')).toBeNull();
    expect(ended).toHaveBeenCalled();
  });

  it('reads move to the fallback address; writes are never repeated elsewhere', async () => {
    const seen: string[] = [];
    const f = vi.fn(async (url: string) => { seen.push(new URL(url).host); if (url.includes('main.test')) throw new TypeError('blocked'); return json(200, { ok: true }); });
    const api = new Api(['https://main.test', 'https://backup.test'], store(), f as never);
    await api.get('/api/home');
    expect(seen).toEqual(['main.test', 'backup.test']);
    await api.get('/api/news'); // remembered
    expect(seen.at(-1)).toBe('backup.test');
    const api2 = new Api(['https://main.test', 'https://backup.test'], store(), f as never);
    seen.length = 0;
    await expect(api2.post('/api/polls/x/vote', { optionId: 'o' })).rejects.toBeInstanceOf(ApiError);
    expect(seen).toEqual(['main.test']);
  });

  it('reads JWT expiry', () => {
    expect(isExpired(jwt(-10))).toBe(true);
    expect(isExpired(jwt(10))).toBe(true); // inside the 30 s margin
    expect(isExpired(jwt(600))).toBe(false);
    expect(isExpired('garbage')).toBe(true);
  });
});

describe('forms', () => {
  const ok: MemberProfile = { firstName: 'أحمد', lastName: 'بن علي', gender: 'male', birthYear: 1995, wilaya: WILAYAS[30]!, maritalStatus: 'married', childrenCount: 2, occupation: 'worker', occupationDetail: 'أستاذ' };
  it('lecture form rules match the server', () => {
    expect(missingFields(ok, 2026)).toEqual([]);
    expect(missingFields({ ...ok, childrenCount: null }, 2026)).toEqual(['childrenCount']);
    expect(missingFields({ ...ok, maritalStatus: 'single', childrenCount: null }, 2026)).toEqual([]);
    expect(missingFields({ ...ok, occupation: 'pupil', occupationDetail: ' ' }, 2026)).toEqual(['occupationDetail']);
    expect(missingFields({ ...ok, firstName: '<b>', birthYear: 2025 }, 2026)).toEqual(['firstName', 'birthYear']);
    expect(normalize({ ...ok, maritalStatus: 'single', occupation: 'retired' })).toMatchObject({ childrenCount: null, occupationDetail: null });
    expect(WILAYAS).toHaveLength(58);
    expect(WILAYAS[15]).toBe('16 - الجزائر');
  });
  it('phone and password checks', () => {
    expect(normalizePhone('0555 12 34 56')).toBe('+213555123456');
    expect(normalizePhone('+213 661234567')).toBe('+213661234567');
    expect(normalizePhone('0455123456')).toBeNull();
    expect(passwordOk('abcdefg1')).toBe(true);
    expect(passwordOk('abcdefgh')).toBe(false);
  });
  it('notification links and YouTube ids', () => {
    expect(linkFor('app://news/abc-1')).toBe('/news/abc-1');
    expect(linkFor('app://lectures/x')).toBe('/lectures/x');
    expect(linkFor('app://volunteer')).toBe('/volunteer');
    expect(linkFor('https://evil.test')).toBeNull();
    expect(linkFor('app://news/../../x')).toBe('/news');
    expect(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://example.com/v.mp4')).toBeNull();
  });
});

import { shouldShowSplash } from '../src/components/Splash';
describe('splash', () => {
  it('plays once per session and never with reduced motion', () => {
    expect(shouldShowSplash({ getItem: () => null }, false)).toBe(true);
    expect(shouldShowSplash({ getItem: () => '1' }, false)).toBe(false);
    expect(shouldShowSplash({ getItem: () => null }, true)).toBe(false);
    expect(shouldShowSplash(null, false)).toBe(true);
  });
});
