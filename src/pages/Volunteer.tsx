import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useDates, useErr, useI18n, useLoc, type Key } from '../lib/i18n';
import { Field, Page, Pill, State, useLoad } from '../lib/ui';

interface Application { id: string; status: string; reviewNote: string | null; skills: string; availability: string }
interface Assignment { id: string; title_ar: string; title_fr: string | null; starts_at: number; location: string | null; role_note: string | null }

export default function Volunteer() {
  const { t } = useI18n();
  const loc = useLoc();
  const d = useDates();
  const err = useErr();
  const nav = useNavigate();
  const { user } = useAuth();
  const { data, error, loading, reload } = useLoad(async () => (user ? api.get<{ application: Application | null; assignments: Assignment[] }>('/api/volunteers/me') : null), [user?.id]);
  const [f, setF] = useState({ fullName: '', contact: '', skills: '', availability: '', preferredAreas: '', experience: '' });
  const [busy, setBusy] = useState(false);
  const [sendErr, setSendErr] = useState<unknown>(null);

  const apply = async () => {
    setBusy(true); setSendErr(null);
    try {
      await api.post('/api/volunteers', { ...f, fullName: f.fullName || user!.fullName, contact: f.contact || user!.phone, preferredAreas: f.preferredAreas || undefined, experience: f.experience || undefined });
      await reload();
    } catch (e) { setSendErr(e); } finally { setBusy(false); }
  };
  const withdraw = async () => { setBusy(true); try { await api.del('/api/volunteers/me'); await reload(); } catch (e) { setSendErr(e); } finally { setBusy(false); } };

  return (
    <Page title={t('volunteerTitle')}>
      <p className="muted" style={{ marginTop: -6 }}>{t('volunteerIntro')}</p>
      {!user ? <div className="panel glass stack center"><span style={{ fontSize: 46 }}>🤝</span><p>{t('needLogin')}</p><button className="btn" onClick={() => nav('/login', { state: { next: '/volunteer' } })}>{t('login')}</button></div>
        : <>
          <State loading={loading && !data} error={error} onRetry={reload} />
          {data?.application ? <div className="panel glass stack">
            <div><Pill tone={data.application.status === 'approved' ? 'ok' : data.application.status === 'rejected' ? 'bad' : 'warn'}>{t(`status_${data.application.status}` as Key)}</Pill></div>
            {data.application.reviewNote && <p>{data.application.reviewNote}</p>}
            {data.assignments.length > 0 && <><h3>{t('assignments')}</h3>{data.assignments.map((a) => <div key={a.id} className="list-item glass"><div className="grow"><b>{loc(a.title_ar, a.title_fr)}</b><div className="meta"><span>{d.dateTime(a.starts_at)}</span>{a.location && <span>📍 {a.location}</span>}{a.role_note && <span>{a.role_note}</span>}</div></div></div>)}</>}
            <button className="btn danger" disabled={busy} onClick={withdraw}>{t('withdraw')}</button>
          </div>
          : data && <form className="panel glass stack" onSubmit={(e) => { e.preventDefault(); void apply(); }}>
            <div className="row">
              <Field label={t('fullName')}><input value={f.fullName} placeholder={user.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></Field>
              <Field label={t('contact')}><input value={f.contact} placeholder={user.phone} dir="ltr" onChange={(e) => setF({ ...f, contact: e.target.value })} /></Field>
            </div>
            <Field label={t('skills')}><textarea rows={2} required minLength={2} value={f.skills} onChange={(e) => setF({ ...f, skills: e.target.value })} /></Field>
            <Field label={t('availability')}><input required minLength={2} value={f.availability} onChange={(e) => setF({ ...f, availability: e.target.value })} /></Field>
            <Field label={t('preferredAreas')}><input value={f.preferredAreas} onChange={(e) => setF({ ...f, preferredAreas: e.target.value })} /></Field>
            <Field label={t('experience')}><textarea rows={2} value={f.experience} onChange={(e) => setF({ ...f, experience: e.target.value })} /></Field>
            {sendErr != null && <p className="error-text">{err(sendErr)}</p>}
            <button className="btn" disabled={busy}>{t('apply')}</button>
          </form>}
        </>}
    </Page>
  );
}
