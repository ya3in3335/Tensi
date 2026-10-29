import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, ApiError, type User } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useErr, useI18n } from '../lib/i18n';
import { Field, Ltr, OkBox, Page } from '../lib/ui';
import Icon from '../components/Icon';

const useNext = () => (useLocation().state as { next?: string } | null)?.next;

/** Algerian mobile numbers: 05/06/07 + 8 digits, or +213 / 00213 forms. */
export function normalizePhone(raw: string): string | null {
  const d = raw.replace(/[\s.-]/g, '');
  const m = /^(?:\+213|00213|0)([567]\d{8})$/.exec(d);
  return m ? `+213${m[1]}` : null;
}
export const passwordOk = (p: string) => p.length >= 8 && /\p{L}/u.test(p) && /\d/.test(p);

export function Login() {
  const { t } = useI18n();
  const err = useErr();
  const nav = useNavigate();
  const next = useNext();
  const { setUser } = useAuth();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [e, setE] = useState<unknown>(null);
  const submit = async () => {
    setBusy(true); setE(null);
    try {
      const u = await api.login(id.trim(), pw);
      setUser(u);
      if (!u.emailVerified) nav('/verify-email', { replace: true, state: { next: next ?? '/' } }); else nav(next ?? '/', { replace: true });
    } catch (x) { setE(x); } finally { setBusy(false); }
  };
  return (
    <Page title={t('login')}>
      <form className="panel glass stack auth" onSubmit={(ev) => { ev.preventDefault(); void submit(); }}>
        <img className="logo" src="/logo.webp" alt="" />
        <Field label={t('identifier')}><input dir="ltr" autoComplete="username" required value={id} onChange={(ev) => setId(ev.target.value)} /></Field>
        <Field label={t('password')}><input dir="ltr" type="password" autoComplete="current-password" required value={pw} onChange={(ev) => setPw(ev.target.value)} /></Field>
        {e != null && <p className="error-text" role="alert">{err(e)}</p>}
        <button className="btn block" disabled={busy}>{t('login')}</button>
        <Link to="/forgot" className="center">{t('forgot')}</Link>
        <Link to="/register" state={{ next }} className="center">{t('noAccount')}</Link>
      </form>
    </Page>
  );
}

export function Register() {
  const { t, lang } = useI18n();
  const err = useErr();
  const nav = useNavigate();
  const next = useNext();
  const { setUser } = useAuth();
  const [f, setF] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [e, setE] = useState<unknown>(null);
  const bad = {
    fullName: f.fullName.trim().length < 3,
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim()),
    phone: normalizePhone(f.phone) === null,
    password: !passwordOk(f.password),
    confirmPassword: f.confirmPassword !== f.password,
  };
  const submit = async () => {
    setTried(true); setE(null);
    if (Object.values(bad).some(Boolean)) return;
    setBusy(true);
    try {
      const u = await api.register({ ...f, fullName: f.fullName.trim(), email: f.email.trim(), phone: f.phone.trim(), locale: lang });
      setUser(u);
      nav('/verify-email', { replace: true, state: { next: '/verify-phone', after: next ?? '/' } });
    } catch (x) { setE(x); } finally { setBusy(false); }
  };
  const set = (k: keyof typeof f) => (ev: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: ev.target.value });
  return (
    <Page title={t('register')}>
      <form className="panel glass stack auth" noValidate onSubmit={(ev) => { ev.preventDefault(); void submit(); }}>
        <Field label={t('fullName')} error={tried && bad.fullName}><input autoComplete="name" value={f.fullName} onChange={set('fullName')} /></Field>
        <Field label={t('email')} error={tried && bad.email}><input dir="ltr" type="email" autoComplete="email" value={f.email} onChange={set('email')} /></Field>
        <Field label={t('phone')} error={tried && bad.phone}><input dir="ltr" type="tel" autoComplete="tel" placeholder="0555 12 34 56" value={f.phone} onChange={set('phone')} /></Field>
        <Field label={t('password')} hint={t('passwordHint')} error={tried && bad.password}><input dir="ltr" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} /></Field>
        <Field label={t('confirmPassword')} error={tried && bad.confirmPassword}><input dir="ltr" type="password" autoComplete="new-password" value={f.confirmPassword} onChange={set('confirmPassword')} /></Field>
        {e != null && <p className="error-text" role="alert">{err(e)}</p>}
        <button className="btn block" disabled={busy}>{t('register')}</button>
        <Link to="/login" state={{ next }} className="center">{t('haveAccount')}</Link>
      </form>
    </Page>
  );
}

export function Forgot() {
  const { t } = useI18n();
  const err = useErr();
  const [id, setId] = useState('');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [step, setStep] = useState<'ask' | 'code' | 'done'>('ask');
  const [busy, setBusy] = useState(false);
  const [e, setE] = useState<unknown>(null);
  const run = async (fn: () => Promise<unknown>, after: typeof step) => {
    setBusy(true); setE(null);
    try { await fn(); setStep(after); } catch (x) { setE(x); } finally { setBusy(false); }
  };
  return (
    <Page title={t('resetTitle')} back>
      <form className="panel glass stack auth" onSubmit={(ev) => {
        ev.preventDefault();
        if (step === 'ask') void run(() => api.post('/api/auth/password/forgot', { identifier: id.trim() }), 'code');
        else if (step === 'code') void run(() => api.post('/api/auth/password/reset', { identifier: id.trim(), code, newPassword: pw }), 'done');
      }}>
        {step === 'done' ? <><OkBox>{t('resetDone')}</OkBox><Link className="btn" to="/login">{t('login')}</Link></> : <>
          <Field label={t('identifier')}><input dir="ltr" required value={id} disabled={step === 'code'} onChange={(ev) => setId(ev.target.value)} /></Field>
          {step === 'code' && <>
            <div className="info-box">{t('resetSent')}</div>
            <Field label={t('code')}><input className="code-input" inputMode="numeric" maxLength={6} value={code} onChange={(ev) => setCode(ev.target.value.replace(/\D/g, ''))} /></Field>
            <Field label={t('newPassword')} hint={t('passwordHint')}><input dir="ltr" type="password" autoComplete="new-password" value={pw} onChange={(ev) => setPw(ev.target.value)} /></Field>
          </>}
          {e != null && <p className="error-text">{err(e)}</p>}
          <button className="btn block" disabled={busy || (step === 'code' && (code.length !== 6 || !passwordOk(pw)))}>{step === 'ask' ? t('sendCode') : t('confirm')}</button>
        </>}
      </form>
    </Page>
  );
}

/** E-mail code step (after sign-up, or when the address is still unverified). Skipped when the server sends no e-mail. */
export function VerifyEmail() {
  const { t } = useI18n();
  const err = useErr();
  const nav = useNavigate();
  const st = useLocation().state as { next?: string; after?: string } | null;
  const { user, ready, setUser } = useAuth();
  const [phase, setPhase] = useState<'sending' | 'sent' | 'failed'>('sending');
  const [code, setCode] = useState('');
  const [cool, setCool] = useState(0);
  const [busy, setBusy] = useState(false);
  const [e, setE] = useState<unknown>(null);
  const started = useRef(false);
  const done = () => nav(st?.next ?? '/', { replace: true, state: st?.after ? { next: st.after } : undefined });

  const send = async () => {
    setPhase('sending'); setE(null);
    try {
      const r = await api.post<{ alreadyVerified?: boolean }>('/api/auth/email/send');
      if (r.alreadyVerified) return done();
      setPhase('sent'); setCool(60);
    } catch (x) {
      if (x instanceof ApiError && x.code === 'email_not_configured') return done();
      setE(x); setPhase('failed');
    }
  };
  useEffect(() => {
    if (!ready) return;
    if (!user) { nav('/login', { replace: true }); return; }
    if (user.emailVerified) { done(); return; }
    if (!started.current) { started.current = true; void send(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);
  useEffect(() => { if (cool > 0) { const h = setTimeout(() => setCool(cool - 1), 1000); return () => clearTimeout(h); } }, [cool]);

  const verify = async (c: string) => {
    setBusy(true); setE(null);
    try { await api.post('/api/auth/email/verify', { code: c }); const me = await api.get<{ user: User }>('/api/me'); setUser(me.user); done(); }
    catch (x) { setE(x); } finally { setBusy(false); }
  };
  return (
    <Page title={t('emailTitle')} back>
      <div className="panel glass stack auth center">
        <Icon name="mail" size={56} className="hero-icon" />
        {phase === 'sending' && <p>{t('emailSending')}</p>}
        {phase === 'failed' && <><p className="error-text">{err(e)}</p><button className="btn" onClick={send}>{t('retry')}</button></>}
        {phase === 'sent' && <>
          <p>{t('emailSent')}<br /><b><Ltr>{user?.email}</Ltr></b></p>
          <input className="code-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} aria-label={t('code')}
            onChange={(ev) => { const v = ev.target.value.replace(/\D/g, '').slice(0, 6); setCode(v); if (v.length === 6) void verify(v); }} />
          {e != null && <p className="error-text">{err(e)}</p>}
          <button className="btn" disabled={busy || code.length !== 6} onClick={() => verify(code)}>{t('confirm')}</button>
          <button className="btn ghost" disabled={cool > 0} onClick={() => { setCode(''); void send(); }}>{cool > 0 ? t('resendIn', { s: cool }) : t('resend')}</button>
          <small className="muted">{t('spamHint')}</small>
        </>}
      </div>
    </Page>
  );
}

/** Phone verification through the Telegram bot (contact sharing), polled until confirmed. */
export function VerifyPhone() {
  const { t } = useI18n();
  const err = useErr();
  const nav = useNavigate();
  const next = useNext();
  const { user, ready, setUser } = useAuth();
  const [v, setV] = useState<{ verificationId: string; deepLink: string } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [e, setE] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (ready && !user) nav('/login', { replace: true }); }, [ready, user, nav]);
  const start = async () => {
    setBusy(true); setE(null); setStatus(null);
    try { const r = await api.post<{ verificationId: string; deepLink: string }>('/api/verification/telegram'); setV(r); setStatus('pending'); window.open(r.deepLink, '_blank', 'noopener'); }
    catch (x) { setE(x); } finally { setBusy(false); }
  };
  useEffect(() => {
    if (!v || !status || ['verified', 'failed', 'expired', 'cancelled'].includes(status)) return;
    const h = setInterval(async () => {
      try {
        const r = await api.get<{ status: string; failureReason: string | null }>(`/api/verification/telegram/${v.verificationId}`);
        setStatus(r.status); setReason(r.failureReason);
        if (r.status === 'verified') { const me = await api.get<{ user: User }>('/api/me'); setUser(me.user); }
      } catch { /* keep polling */ }
    }, 3000);
    return () => clearInterval(h);
  }, [v, status, setUser]);

  const verified = status === 'verified' || user?.phoneVerified;
  return (
    <Page title={t('phoneTitle')} back>
      <div className="panel glass stack auth center">
        <Icon name="send" size={56} className="hero-icon" />
        {verified ? <><OkBox>{t('phoneVerified')}</OkBox><button className="btn" onClick={() => nav(next ?? '/', { replace: true })}>{t('confirm')}</button></> : <>
          <p>{t('phoneIntro')}</p>
          {user && <p><b><Ltr>{user.phone}</Ltr></b></p>}
          {status && ['pending', 'awaiting_contact'].includes(status) ? <>
            <p className="muted"><Icon name="hourglass" /> {t('waitingTelegram')}</p>
            {v && <a className="btn" href={v.deepLink} target="_blank" rel="noopener noreferrer">{t('openTelegram')}</a>}
          </> : <>
            {status && <p className="error-text">{t('verifyFailed', { r: reason ?? status })}</p>}
            <button className="btn" disabled={busy} onClick={start}>{status ? t('startAgain') : t('openTelegram')}</button>
          </>}
          {e != null && <p className="error-text">{err(e)}</p>}
          <button className="btn ghost" onClick={() => nav(next ?? '/', { replace: true })}>{t('close')}</button>
        </>}
      </div>
    </Page>
  );
}
