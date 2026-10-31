import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import qrcode from 'qrcode-generator';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useDates, useErr, useI18n, type Key } from '../lib/i18n';
import { Field, Page, Pill, State, useLoad } from '../lib/ui';
import Icon from '../components/Icon';

// Census ("الإحصاء") for members: the same API, accounts and rules as the census member app.

interface Meeting {
  id: string; title: string; description: string | null; location: string; startsAt: number; registrationOpen: boolean; status: string;
  myRegistration: { id: string; status: string; regNo: number } | null;
}
interface Registration {
  id: string; meetingId: string; regNo: number; firstName: string; lastName: string; status: string; checkedInAt: number | null;
  wilayaAr: string | null; communeAr: string | null; meeting?: { title: string; startsAt: number; location: string; status: string }; qr?: string | null;
}
interface Profile { firstName: string; lastName: string; gender: string | null; wilayaCode: number | null; communeId: number | null; birthDate: string | null; maritalStatus: string | null; childrenCount: number | null }
interface Geo { w: [number, string, string][]; c: [number, number, string, string][] }

const MARITAL = ['single', 'married', 'divorced', 'widowed'] as const;
const NAME = /^[\p{L}\p{M}' .-]{2,60}$/u;
const canJoin = (m: Meeting) => m.registrationOpen && (!m.myRegistration || m.myRegistration.status === 'cancelled');
const STATUS_TONE: Record<string, 'ok' | 'warn' | 'bad' | 'neutral' | 'brand'> = { present: 'ok', late: 'warn', absent: 'bad', cancelled: 'neutral', registered: 'brand' };

let geoCache: Promise<Geo> | null = null;
/** The 58 wilayas and 1,541 communes (same data as the server and the apps). */
const loadGeo = () => (geoCache ??= fetch('/data/dz_geo.json').then((r) => r.json() as Promise<Geo>));

export function validBirthDate(y: number, m: number, d: number, now = new Date()): boolean {
  const t = new Date(Date.UTC(y, m - 1, d));
  return y >= 1900 && t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d && t.getTime() <= now.getTime();
}

/** Signed-in members only; others are sent to the sign-in page and brought back afterwards. */
function useMember() {
  const { user, ready } = useAuth();
  const loc = useLocation();
  return { user, ready, redirect: ready && !user ? <Navigate to="/login" replace state={{ next: loc.pathname + loc.search }} /> : null };
}

export function CensusHome() {
  const { t } = useI18n();
  const d = useDates();
  const { user, ready, redirect } = useMember();
  const meetings = useLoad(() => (user ? api.get<{ items: Meeting[] }>('/api/stats/meetings') : Promise.resolve({ items: [] })), [user?.id]);
  const mine = useLoad(() => (user ? api.get<{ items: Registration[] }>('/api/stats/me/registrations') : Promise.resolve({ items: [] })), [user?.id]);
  if (redirect) return redirect;
  const open = meetings.data?.items.filter(canJoin) ?? [];
  return (
    <Page title={t('census')}>
      <p className="muted">{t('censusIntro')}</p>
      {!ready && <State loading />}
      <h2 style={{ margin: '20px 4px 10px' }}>{t('censusOpen')}</h2>
      <State loading={meetings.loading && !meetings.data} error={meetings.error} onRetry={meetings.reload} />
      {meetings.data && open.length === 0 && <p className="muted">{t('censusNoOpen')}</p>}
      <div className="stack">{open.map((m) => (
        <div key={m.id} className="list-item glass">
          <div className="grow">
            <h3>{m.title}</h3>
            <div className="meta"><span><Icon name="calendar" /> {d.dateTime(m.startsAt)}</span><span><Icon name="pin" /> {m.location}</span></div>
          </div>
          <Link className="btn small" to={`/census/register?meeting=${m.id}`}>{t('censusRegisterNow')}</Link>
        </div>
      ))}</div>
      <h2 style={{ margin: '24px 4px 10px' }}>{t('censusMine')}</h2>
      <State loading={mine.loading && !mine.data} error={mine.error} onRetry={mine.reload} />
      {mine.data && mine.data.items.length === 0 && <p className="muted">{t('censusNoMine')}</p>}
      <div className="stack">{mine.data?.items.map((r) => (
        <Link key={r.id} to={`/census/card/${r.id}`} className="list-item glass">
          <div className="grow">
            <h3>{r.meeting?.title}</h3>
            <div className="meta">{r.meeting && <span><Icon name="calendar" /> {d.dateTime(r.meeting.startsAt)}</span>}<span>{t('regNo')} #{r.regNo}</span></div>
          </div>
          <Pill tone={STATUS_TONE[r.status] ?? 'neutral'}>{t(`st_${r.status}` as Key)}</Pill>
        </Link>
      ))}</div>
    </Page>
  );
}

export function CensusForm() {
  const { t, lang } = useI18n();
  const d = useDates();
  const err = useErr();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { user, redirect } = useMember();
  const [geo, setGeo] = useState<Geo | null>(null);
  const [meetings, setMeetings] = useState<Meeting[] | null>(null);
  const [f, setF] = useState({ firstName: '', lastName: '', gender: '', wilaya: 0, commune: 0, day: 0, month: 0, year: 0, marital: '', children: '', meeting: params.get('meeting') ?? '' });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));

  useEffect(() => { void loadGeo().then(setGeo); }, []);
  useEffect(() => {
    if (!user) return;
    void api.get<{ items: Meeting[] }>('/api/stats/meetings').then((r) => {
      const open = r.items.filter(canJoin);
      setMeetings(open);
      setF((x) => ({ ...x, meeting: open.some((m) => m.id === x.meeting) ? x.meeting : open.length === 1 ? open[0]!.id : '' }));
    }).catch(setError);
    // Prefilled from the member's profile (the same one the apps and the lectures form use).
    void api.get<{ profile: Profile }>('/api/stats/me/profile').then(({ profile: p }) => {
      const [y, m, dd] = (p.birthDate ?? '').split('-').map(Number);
      setF((x) => ({
        ...x, firstName: x.firstName || p.firstName, lastName: x.lastName || p.lastName, gender: x.gender || (p.gender ?? ''),
        wilaya: x.wilaya || (p.wilayaCode ?? 0), commune: x.commune || (p.communeId ?? 0), marital: x.marital || (p.maritalStatus ?? ''),
        children: x.children || (p.childrenCount != null ? String(p.childrenCount) : ''),
        year: x.year || y || 0, month: x.month || m || 0, day: x.day || dd || 0,
      }));
    }).catch(() => undefined);
  }, [user]);

  const communes = useMemo(() => (geo && f.wilaya ? geo.c.filter((c) => c[1] === f.wilaya).sort((a, b) => a[lang === 'fr' ? 3 : 2].localeCompare(b[lang === 'fr' ? 3 : 2])) : []), [geo, f.wilaya, lang]);
  const days = f.month ? new Date(Date.UTC(f.year || 2000, f.month, 0)).getUTCDate() : 31;
  const thisYear = new Date().getFullYear();
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => new Intl.DateTimeFormat(lang === 'fr' ? 'fr' : 'ar-DZ', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, i, 1)))), [lang]);

  const bad = {
    firstName: !NAME.test(f.firstName.trim()), lastName: !NAME.test(f.lastName.trim()), wilaya: !f.wilaya,
    commune: !f.commune || !communes.some((c) => c[0] === f.commune), birth: !validBirthDate(f.year, f.month, f.day),
    marital: !MARITAL.includes(f.marital as never), meeting: !f.meeting,
    // Married: number of children required (the wife is counted with them).
    children: f.marital === 'married' && !(/^\d{1,2}$/.test(f.children) && Number(f.children) <= 30),
  };
  const invalid = Object.values(bad).some(Boolean);

  if (redirect) return redirect;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (invalid) return;
    setBusy(true); setError(null);
    try {
      const r = await api.post<{ item: Registration }>(`/api/stats/meetings/${f.meeting}/register`, {
        firstName: f.firstName.trim(), lastName: f.lastName.trim(), gender: f.gender || null, wilayaCode: f.wilaya, communeId: f.commune,
        birthDate: `${f.year}-${String(f.month).padStart(2, '0')}-${String(f.day).padStart(2, '0')}`, maritalStatus: f.marital,
        childrenCount: f.marital === 'married' ? Number(f.children) : null,
      });
      nav(`/census/card/${r.item.id}`, { replace: true });
    } catch (x) { setError(x); } finally { setBusy(false); }
  };

  return (
    <Page title={t('censusTitle')} back>
      <form className="stack" onSubmit={submit} noValidate>
        <section className="panel glass stack">
          <h3><Icon name="users" /> {t('secPersonal')}</h3>
          <Field label={t('firstName')} error={tried && bad.firstName}><input value={f.firstName} maxLength={60} onChange={(e) => set({ firstName: e.target.value })} /></Field>
          <Field label={t('lastName')} error={tried && bad.lastName}><input value={f.lastName} maxLength={60} onChange={(e) => set({ lastName: e.target.value })} /></Field>
          <Field label={t('genderOptional')}>
            <div className="chips">{(['male', 'female'] as const).map((g) => (
              <button type="button" key={g} className={f.gender === g ? 'chip on' : 'chip'} onClick={() => set({ gender: f.gender === g ? '' : g })}>{t(g === 'male' ? 'male' : 'female')}</button>
            ))}</div>
          </Field>
        </section>
        <section className="panel glass stack">
          <h3><Icon name="pin" /> {t('secResidence')}</h3>
          <Field label={t('wilayaLabel')} error={tried && bad.wilaya}>
            <select value={f.wilaya || ''} onChange={(e) => set({ wilaya: Number(e.target.value), commune: 0 })}>
              <option value="">—</option>
              {geo?.w.map(([code, a, fr]) => <option key={code} value={code}>{String(code).padStart(2, '0')} - {lang === 'fr' ? fr : a}</option>)}
            </select>
          </Field>
          <Field label={t('communeLabel')} error={tried && bad.commune} hint={f.wilaya ? undefined : t('pickWilayaFirst')}>
            <select value={f.commune || ''} disabled={!f.wilaya} onChange={(e) => set({ commune: Number(e.target.value) })}>
              <option value="">—</option>
              {communes.map(([id, , a, fr]) => <option key={id} value={id}>{lang === 'fr' ? fr : a}</option>)}
            </select>
          </Field>
        </section>
        <section className="panel glass stack">
          <h3><Icon name="calendar" /> {t('secBirth')}</h3>
          <div className="row" style={{ gap: 8 }}>
            <Field label={t('day')} error={tried && bad.birth}>
              <select value={f.day || ''} onChange={(e) => set({ day: Number(e.target.value) })}><option value="">—</option>{Array.from({ length: days }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select>
            </Field>
            <Field label={t('month')} error={tried && bad.birth}>
              <select value={f.month || ''} onChange={(e) => { const m = Number(e.target.value); set({ month: m, day: f.day > new Date(Date.UTC(f.year || 2000, m, 0)).getUTCDate() ? 0 : f.day }); }}>
                <option value="">—</option>{months.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
              </select>
            </Field>
            <Field label={t('year')} error={tried && bad.birth}>
              <select value={f.year || ''} onChange={(e) => set({ year: Number(e.target.value) })}><option value="">—</option>{Array.from({ length: thisYear - 1899 }, (_, i) => thisYear - i).map((y) => <option key={y} value={y}>{y}</option>)}</select>
            </Field>
          </div>
        </section>
        <section className="panel glass stack">
          <h3><Icon name="users" /> {t('secMarital')}</h3>
          <div className="chips">{MARITAL.map((m) => (
            <button type="button" key={m} className={f.marital === m ? 'chip on' : 'chip'} onClick={() => set({ marital: m })}>{t(`ms_${m}` as Key)}</button>
          ))}</div>
          {tried && bad.marital && <small className="error-text">{t('censusFix')}</small>}
          {f.marital === 'married' && (
            <Field label={t('childrenCountLabel')} error={tried && bad.children} hint={t('childrenHint')}>
              <input inputMode="numeric" value={f.children} onChange={(e) => set({ children: e.target.value.replace(/\D/g, '').slice(0, 2) })} />
            </Field>
          )}
        </section>
        <section className="panel glass stack">
          <h3><Icon name="calendar" /> {t('secMeeting')}</h3>
          {meetings && meetings.length === 0 ? <p className="muted">{t('censusNoOpen')}</p> : (
            <Field label={t('secMeeting')} error={tried && bad.meeting}>
              <select value={f.meeting} onChange={(e) => set({ meeting: e.target.value })}>
                <option value="">—</option>
                {meetings?.map((m) => <option key={m.id} value={m.id}>{m.title} — {d.dateTime(m.startsAt)}</option>)}
              </select>
            </Field>
          )}
        </section>
        {tried && invalid && <div className="error-text"><Icon name="alert" /> {t('censusFix')}</div>}
        {error != null && <div className="error-text"><Icon name="alert" /> {err(error)}</div>}
        <button className="btn big" disabled={busy || !meetings?.length}>{busy ? t('loading') : t('censusSubmit')}</button>
      </form>
    </Page>
  );
}

/** The QR code drawn as SVG squares (it carries only the registration id and the server's signature). */
function Qr({ text }: { text: string }) {
  const q = useMemo(() => { const x = qrcode(0, 'M'); x.addData(text); x.make(); return x; }, [text]);
  const n = q.getModuleCount();
  const cells: string[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) cells.push(`M${c + 1} ${r + 1}h1v1h-1z`);
  return (
    <svg viewBox={`0 0 ${n + 2} ${n + 2}`} width="240" height="240" role="img" aria-label="QR" style={{ background: '#fff', borderRadius: 16, padding: 8 }} shapeRendering="crispEdges">
      <path d={cells.join('')} fill="#000" />
    </svg>
  );
}

export function CensusCard() {
  const { id } = useParams();
  const { t } = useI18n();
  const d = useDates();
  const err = useErr();
  const { user, redirect } = useMember();
  const { data, error, loading, reload } = useLoad(() => (user ? api.get<{ item: Registration }>(`/api/stats/me/registrations/${id}`) : Promise.resolve(null)), [id, user?.id]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);
  // Live: the card turns "present" as soon as the officer scans the code.
  useEffect(() => {
    if (!user || data?.item.status !== 'registered') return;
    const h = setInterval(() => { if (document.visibilityState === 'visible') reload(); }, 5000);
    return () => clearInterval(h);
  }, [user, data?.item.status, reload]);
  if (redirect) return redirect;
  const r = data?.item;
  const cancel = async () => {
    if (!confirm(t('cancelConfirm'))) return;
    setBusy(true); setActionError(null);
    try { await api.post(`/api/stats/me/registrations/${id}/cancel`); reload(); } catch (e) { setActionError(e); } finally { setBusy(false); }
  };
  return (
    <Page title={t('cardTitle')} back>
      <State loading={loading && !r} error={error} onRetry={reload} />
      {r && <div className="panel glass stack center" style={{ alignItems: 'center', textAlign: 'center' }}>
        <img src="/logo.webp" alt="" style={{ height: 56 }} />
        <h2>{r.firstName} {r.lastName}</h2>
        <h3 style={{ color: 'var(--ember)' }}>{r.meeting?.title}</h3>
        {r.meeting && <p className="muted">{d.dateTime(r.meeting.startsAt)} · {r.meeting.location}</p>}
        <div className="meta" style={{ justifyContent: 'center' }}><b>{t('regNo')} #{r.regNo}</b><Pill tone={STATUS_TONE[r.status] ?? 'neutral'}>{t(`st_${r.status}` as Key)}</Pill></div>
        {r.status === 'registered' && r.qr && <>
          <Qr text={r.qr} />
          <p className="muted">{t('cardShow')}</p>
          <small className="muted"><Icon name="clock" size={14} /> {t('liveUpdates')}</small>
        </>}
        {(r.status === 'present' || r.status === 'late') && <>
          <Icon name="checkCircle" size={72} />
          {r.checkedInAt && <p>{t('checkedInAt', { d: d.dateTime(r.checkedInAt) })}</p>}
        </>}
        {actionError != null && <div className="error-text"><Icon name="alert" /> {err(actionError)}</div>}
        {r.status === 'registered' && r.meeting?.status === 'open' && <button className="btn ghost" disabled={busy} onClick={cancel}>{t('cancelRegistration')}</button>}
      </div>}
      <p className="center" style={{ marginTop: 16 }}><Link to="/census">{t('census')}</Link></p>
    </Page>
  );
}
