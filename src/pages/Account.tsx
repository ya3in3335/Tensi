import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useDates, useErr, useI18n, useLoc } from '../lib/i18n';
import { Field, Ltr, Modal, OkBox, Page, Pill, State, useLoad } from '../lib/ui';
import { passwordOk } from './Auth';
import { ActivityRow, type Activity } from './Activities';
import Icon from '../components/Icon';

function useRequireUser() {
  const { user, ready } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (ready && !user) nav('/login', { replace: true }); }, [ready, user, nav]);
  return user;
}

export function Account() {
  const { t, lang, setLang } = useI18n();
  const err = useErr();
  const nav = useNavigate();
  const { logout, setUser } = useAuth();
  const user = useRequireUser();
  const [dialog, setDialog] = useState<'password' | 'delete' | null>(null);
  const [cur, setCur] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [e, setE] = useState<unknown>(null);
  const [ok, setOk] = useState(false);
  if (!user) return <Page><State loading /></Page>;

  const close = () => { setDialog(null); setCur(''); setPw(''); setE(null); setOk(false); };
  const changePw = async () => {
    setBusy(true); setE(null);
    try { await api.post('/api/me/password', { currentPassword: cur, newPassword: pw }); setOk(true); } catch (x) { setE(x); } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true); setE(null);
    try { await api.del('/api/me', { password: cur }); api.clear(); setUser(null); nav('/', { replace: true }); } catch (x) { setE(x); } finally { setBusy(false); }
  };
  const switchLang = async () => {
    const l = lang === 'ar' ? 'fr' : 'ar';
    setLang(l);
    api.patch('/api/me', { locale: l }).catch(() => {});
  };

  return (
    <Page title={t('account')}>
      <div className="panel glass stack">
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div className="date-badge" style={{ width: 60, height: 60, display: 'grid', placeItems: 'center', fontSize: 26, borderRadius: 20 }}>{user.fullName.trim()[0]}</div>
          <div><h2>{user.fullName}</h2><div className="meta"><span><Ltr>{user.email}</Ltr></span><span><Ltr>{user.phone}</Ltr></span></div></div>
        </div>
        <div className="row">
          {user.emailVerified ? <Pill tone="ok"><Icon name="mail" size={14} /> {t('verified')}</Pill> : <button className="btn ghost small" onClick={() => nav('/verify-email', { state: { next: '/account' } })}><Icon name="mail" size={16} /> {t('emailNotVerified')} — {t('verifyEmail')}</button>}
          {user.phoneVerified ? <Pill tone="ok"><Icon name="phone" size={14} /> {t('verified')}</Pill> : <button className="btn ghost small" onClick={() => nav('/verify-phone', { state: { next: '/account' } })}><Icon name="phone" size={16} /> {t('phoneNotVerified')} — {t('verifyPhone')}</button>}
        </div>
      </div>
      <div className="stack" style={{ marginTop: 16 }}>
        <Link to="/my-activities" className="list-item glass"><span className="tile-sm"><Icon name="calendar" size={22} /></span><div className="grow"><h3>{t('myActivities')}</h3></div></Link>
        <Link to="/notifications" className="list-item glass"><span className="tile-sm"><Icon name="bell" size={22} /></span><div className="grow"><h3>{t('notifications')}</h3></div></Link>
        <button className="list-item glass" style={{ border: 0, cursor: 'pointer', textAlign: 'start', width: '100%' }} onClick={switchLang}><span className="tile-sm"><Icon name="globe" size={22} /></span><div className="grow"><h3>{t('language')}</h3></div></button>
        <button className="list-item glass" style={{ border: 0, cursor: 'pointer', textAlign: 'start', width: '100%' }} onClick={() => setDialog('password')}><span className="tile-sm"><Icon name="key" size={22} /></span><div className="grow"><h3>{t('changePassword')}</h3></div></button>
      </div>
      <div className="row" style={{ marginTop: 20 }}>
        <button className="btn ghost" onClick={async () => { await logout(); nav('/'); }}>{t('logout')}</button>
        <button className="btn danger" onClick={() => setDialog('delete')}>{t('deleteAccount')}</button>
      </div>

      {dialog === 'password' && <Modal title={t('changePassword')} onClose={close}>
        {ok ? <OkBox>{t('done')}</OkBox> : <form className="stack" onSubmit={(ev) => { ev.preventDefault(); void changePw(); }}>
          <Field label={t('currentPassword')}><input type="password" dir="ltr" autoComplete="current-password" value={cur} onChange={(ev) => setCur(ev.target.value)} /></Field>
          <Field label={t('newPassword')} hint={t('passwordHint')}><input type="password" dir="ltr" autoComplete="new-password" value={pw} onChange={(ev) => setPw(ev.target.value)} /></Field>
          {e != null && <p className="error-text">{err(e)}</p>}
          <button className="btn" disabled={busy || !cur || !passwordOk(pw)}>{t('save')}</button>
        </form>}
      </Modal>}
      {dialog === 'delete' && <Modal title={t('deleteAccount')} onClose={close}>
        <form className="stack" onSubmit={(ev) => { ev.preventDefault(); void remove(); }}>
          <p>{t('deleteConfirm')}</p>
          <Field label={t('password')}><input type="password" dir="ltr" autoComplete="current-password" value={cur} onChange={(ev) => setCur(ev.target.value)} /></Field>
          {e != null && <p className="error-text">{err(e)}</p>}
          <button className="btn danger" disabled={busy || !cur}>{t('deleteAccount')}</button>
        </form>
      </Modal>}
    </Page>
  );
}

interface Notif { id: string; title_ar: string; title_fr: string | null; body_ar: string; body_fr: string | null; deep_link: string | null; created_at: number }
/** app://news/<id> → /news/<id> (same links as the Android notifications). */
export function linkFor(deep: string | null): string | null {
  if (!deep?.startsWith('app://')) return null;
  const [kind, id] = deep.slice(6).split('/');
  const base: Record<string, string> = { news: '/news', activities: '/activities', polls: '/polls', lectures: '/lectures', volunteer: '/volunteer', donations: '/donations' };
  const root = base[kind ?? ''];
  if (!root) return null;
  return id && /^[\w-]{1,64}$/.test(id) && root !== '/volunteer' && root !== '/donations' ? `${root}/${id}` : root;
}

export function Notifications() {
  const { t } = useI18n();
  const loc = useLoc();
  const d = useDates();
  const user = useRequireUser();
  const { data, error, loading, reload } = useLoad(async () => (user ? api.get<{ items: Notif[] }>('/api/me/notifications') : null), [user?.id]);
  return (
    <Page title={t('notifications')} back>
      <State loading={loading && !data} error={error} empty={data?.items.length === 0} onRetry={reload} />
      {data && <div className="stack">{data.items.map((n) => {
        const to = linkFor(n.deep_link);
        const inner = <><span className="tile-sm"><Icon name="bell" size={22} /></span><div className="grow"><h3>{loc(n.title_ar, n.title_fr)}</h3><p className="muted" style={{ margin: 0 }}>{loc(n.body_ar, n.body_fr)}</p><div className="meta"><span>{d.dateTime(n.created_at)}</span></div></div></>;
        return to ? <Link key={n.id} to={to} className="list-item glass">{inner}</Link> : <div key={n.id} className="list-item glass">{inner}</div>;
      })}</div>}
    </Page>
  );
}

export function MyActivities() {
  const { t } = useI18n();
  const user = useRequireUser();
  const { data, error, loading, reload } = useLoad(async () => (user ? api.get<{ items: Activity[] }>('/api/me/activities') : null), [user?.id]);
  return (
    <Page title={t('myActivities')} back>
      <State loading={loading && !data} error={error} empty={data?.items.length === 0} onRetry={reload} />
      {data && <div className="stack">{data.items.map((a) => <ActivityRow key={a.id} a={a} />)}</div>}
    </Page>
  );
}
