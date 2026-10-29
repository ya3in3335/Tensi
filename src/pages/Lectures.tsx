import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useDates, useErr, useI18n, useLoc, type Key } from '../lib/i18n';
import { GENDERS, MARITAL, OCCUPATIONS, WILAYAS, missingFields, needsDetail, normalize, type MemberProfile } from '../lib/lectureForm';
import { Field, Ltr, Page, Pill, State, Tabs, Text, useLoad } from '../lib/ui';
import { DateBadge } from './Home';

interface Lecture { id: string; kind: string; titleAr: string; titleFr: string | null; descriptionAr: string | null; descriptionFr: string | null; speaker: string | null; location: string | null; onlineUrl: string | null; startsAt: number; endsAt: number; capacity: number | null; registeredCount: number; status: string; registrationOpen: boolean; myRegistration?: string | null }

export function LecturesPage() {
  const { t } = useI18n();
  const loc = useLoc();
  const d = useDates();
  const { user } = useAuth();
  const [when, setWhen] = useState<'upcoming' | 'past'>('upcoming');
  const { data, error, loading, reload } = useLoad(() => api.get<{ items: Lecture[] }>(`/api/lectures?when=${when}`), [when, user?.id]);
  return (
    <Page title={t('lectures')}>
      <Tabs value={when} options={[['upcoming', t('upcoming')], ['past', t('past')]]} onChange={setWhen} />
      <State loading={loading && !data} error={error} empty={data?.items.length === 0} onRetry={reload} />
      {data && <div className="stack">{data.items.map((l) => (
        <Link key={l.id} to={`/lectures/${l.id}`} className="list-item glass">
          <DateBadge ms={l.startsAt} />
          <div className="grow">
            <div className="meta" style={{ marginBottom: 4 }}><Pill>{t(`kind_${l.kind}` as Key)}</Pill>
              {l.status === 'cancelled' && <Pill tone="bad">{t('cancelled')}</Pill>}
              {l.myRegistration === 'registered' && <Pill tone="ok">{t('youAreRegistered')}</Pill>}
              {l.myRegistration === 'attended' && <Pill tone="ok">{t('attended')}</Pill>}</div>
            <h3>{loc(l.titleAr, l.titleFr)}</h3>
            <div className="meta">{l.speaker && <span>🎤 {l.speaker}</span>}<span>🕒 {d.time(l.startsAt)}</span>{l.location && <span>📍 {l.location}</span>}{l.capacity && <span>{t('seats', { n: l.registeredCount, max: l.capacity })}</span>}</div>
          </div>
        </Link>
      ))}</div>}
    </Page>
  );
}

export function LectureDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const loc = useLoc();
  const d = useDates();
  const err = useErr();
  const nav = useNavigate();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState<unknown>(null);
  const { data, error, loading, reload } = useLoad(() => api.get<{ item: Lecture; myRegistration: string | null; contactVerified: boolean }>(`/api/lectures/${id}`), [id, user?.id]);
  const l = data?.item;
  const cancel = async () => {
    setBusy(true); setActionErr(null);
    try { await api.post(`/api/lectures/${id}/cancel`); await reload(true); } catch (e) { setActionErr(e); } finally { setBusy(false); }
  };
  return (
    <Page title={t('lectures')} back>
      <State loading={loading && !l} error={error} onRetry={reload} />
      {data && l && <div className="panel glass stack">
        <div><Pill>{t(`kind_${l.kind}` as Key)}</Pill></div>
        <h2>{loc(l.titleAr, l.titleFr)}</h2>
        <div className="meta">
          <span>🗓 {d.dateTime(l.startsAt)} → {d.time(l.endsAt)}</span>
          {l.speaker && <span>🎤 {t('speaker', { s: l.speaker })}</span>}
          {l.location && <span>📍 {l.location}</span>}
          <span>{l.capacity ? t('seats', { n: l.registeredCount, max: l.capacity }) : t('registeredN', { n: l.registeredCount })}</span>
        </div>
        {l.onlineUrl && <a href={l.onlineUrl} target="_blank" rel="noopener noreferrer">🎥 <Ltr>{l.onlineUrl}</Ltr></a>}
        {l.descriptionAr && <Text>{loc(l.descriptionAr, l.descriptionFr)}</Text>}
        {actionErr != null && <p className="error-text">{err(actionErr)}</p>}
        {l.status === 'cancelled' ? <Pill tone="bad">{t('cancelled')}</Pill>
          : data.myRegistration === 'attended' ? <div className="ok-box">{t('attended')}</div>
          : data.myRegistration === 'registered' ? <>
            <div className="ok-box">{t('youAreRegistered')}</div>
            {l.registrationOpen && <div className="row"><button className="btn ghost" onClick={() => nav(`/lectures/${id}/register`)}>{t('editAnswers')}</button><button className="btn danger" disabled={busy} onClick={cancel}>{t('cancelRegistration')}</button></div>}
          </>
          : !l.registrationOpen ? <Pill>{t('registrationClosed')}</Pill>
          : !user ? <><p className="muted">{t('needLogin')}</p><button className="btn" onClick={() => nav('/login', { state: { next: `/lectures/${id}` } })}>{t('login')}</button></>
          : !data.contactVerified ? <>
            <div className="info-box">🔒 {t('needVerifyContact')}</div>
            <div className="row">
              {!user.emailVerified && <button className="btn ghost" onClick={() => nav('/verify-email', { state: { next: `/lectures/${id}` } })}>{t('verifyEmail')}</button>}
              {!user.phoneVerified && <button className="btn ghost" onClick={() => nav('/verify-phone', { state: { next: `/lectures/${id}` } })}>{t('verifyPhone')}</button>}
            </div>
          </>
          : <button className="btn" onClick={() => nav(`/lectures/${id}/register`)}>{t('lectureRegister')}</button>}
      </div>}
    </Page>
  );
}

const EMPTY: MemberProfile = { firstName: '', lastName: '', gender: null, birthYear: null, wilaya: null, maritalStatus: null, childrenCount: null, occupation: null, occupationDetail: null };

export function LectureForm() {
  const { id } = useParams();
  const { t } = useI18n();
  const err = useErr();
  const nav = useNavigate();
  const { user, ready } = useAuth();
  const { data, error, loading, reload } = useLoad(() => api.get<{ profile: MemberProfile | null; phone: string }>('/api/me/lecture-profile'), [user?.id]);
  const [p, setP] = useState<MemberProfile>(EMPTY);
  const [year, setYear] = useState('');
  const [children, setChildren] = useState('');
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sendErr, setSendErr] = useState<unknown>(null);

  useEffect(() => { if (ready && !user) nav('/login', { state: { next: `/lectures/${id}/register` }, replace: true }); }, [ready, user, nav, id]);
  useEffect(() => {
    if (!data) return;
    const s = data.profile ?? { ...EMPTY, firstName: user?.fullName.split(' ')[0] ?? '', lastName: user?.fullName.split(' ').slice(1).join(' ') ?? '' };
    setP(s); setYear(s.birthYear?.toString() ?? ''); setChildren(s.childrenCount?.toString() ?? '');
  }, [data, user]);

  const profile: MemberProfile = { ...p, birthYear: year ? Number(year) : null, childrenCount: children === '' ? null : Number(children) };
  const missing = tried ? missingFields(profile) : [];
  const labels: Record<string, string> = {
    firstName: t('firstName'), lastName: t('lastName'), gender: t('gender'), birthYear: t('birthYear'), wilaya: t('wilaya'),
    maritalStatus: t('marital'), childrenCount: t('children'), occupation: t('occupation'), occupationDetail: p.occupation ? t(`detail_${p.occupation}` as Key) : '',
  };
  const submit = async () => {
    setTried(true); setSendErr(null);
    if (missingFields(profile).length) return;
    setBusy(true);
    try { await api.post(`/api/lectures/${id}/register`, { profile: normalize(profile), note: note.trim() || undefined }); nav(`/lectures/${id}`, { replace: true }); }
    catch (e) { setSendErr(e); } finally { setBusy(false); }
  };
  const chip = (on: boolean, label: string, click: () => void) => <button type="button" className={on ? 'chip on' : 'chip'} onClick={click}>{label}</button>;

  return (
    <Page title={t('formTitle')} back>
      <State loading={loading && !data} error={error} onRetry={reload} />
      {data && <form className="panel glass stack" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <div className="row">
          <Field label={t('firstName')} error={missing.includes('firstName')}><input value={p.firstName} onChange={(e) => setP({ ...p, firstName: e.target.value })} autoComplete="given-name" /></Field>
          <Field label={t('lastName')} error={missing.includes('lastName')}><input value={p.lastName} onChange={(e) => setP({ ...p, lastName: e.target.value })} autoComplete="family-name" /></Field>
        </div>
        <Field label={t('phoneAuto')}><input value={data.phone} disabled dir="ltr" /></Field>
        <Field label={t('gender')} error={missing.includes('gender')}><div className="chips">{GENDERS.map((g) => chip(p.gender === g, t(g), () => setP({ ...p, gender: g })))}</div></Field>
        <div className="row">
          <Field label={t('birthYear')} error={missing.includes('birthYear')}><input inputMode="numeric" maxLength={4} value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} /></Field>
          <Field label={t('wilaya')} error={missing.includes('wilaya')}>
            <select value={p.wilaya ?? ''} onChange={(e) => setP({ ...p, wilaya: e.target.value || null })}><option value="">{t('chooseWilaya')}</option>{WILAYAS.map((w) => <option key={w} value={w}>{w}</option>)}</select>
          </Field>
        </div>
        <Field label={t('marital')} error={missing.includes('maritalStatus')}><div className="chips">{MARITAL.map((m) => chip(p.maritalStatus === m, t(m), () => setP({ ...p, maritalStatus: m })))}</div></Field>
        {p.maritalStatus && p.maritalStatus !== 'single' && <Field label={t('children')} error={missing.includes('childrenCount')}><input inputMode="numeric" maxLength={2} value={children} onChange={(e) => setChildren(e.target.value.replace(/\D/g, '').slice(0, 2))} /></Field>}
        <Field label={t('occupation')} error={missing.includes('occupation')}><div className="chips">{OCCUPATIONS.map((o) => chip(p.occupation === o, t(`occ_${o}` as Key), () => setP({ ...p, occupation: o })))}</div></Field>
        {needsDetail(p.occupation) && <Field label={labels.occupationDetail!} error={missing.includes('occupationDetail')}><input value={p.occupationDetail ?? ''} maxLength={120} onChange={(e) => setP({ ...p, occupationDetail: e.target.value })} /></Field>}
        <Field label={t('note')}><textarea rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <small className="muted">{t('privacy')}</small>
        {missing.length > 0 && <p className="error-text">{t('fillThese', { f: missing.map((m) => labels[m]).join('، ') })}</p>}
        {sendErr != null && <p className="error-text">{err(sendErr)}</p>}
        <button className="btn" disabled={busy}>{t('submitRegistration')}</button>
      </form>}
    </Page>
  );
}
