import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useErr, useI18n } from './i18n';

/** Loads data with loading / error / reload; reloads when deps change. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try { setData(await fn()); } catch (e) { setError(e); } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { void reload(); }, [reload]);
  // Automatic retry when the connection comes back.
  useEffect(() => {
    const on = () => { if (error) void reload(); };
    window.addEventListener('online', on);
    return () => window.removeEventListener('online', on);
  }, [error, reload]);
  return { data, error, loading, reload, setData };
}

export function Page({ title, back, children, actions }: { title?: string; back?: boolean; children: ReactNode; actions?: ReactNode }) {
  const nav = useNavigate();
  const { t } = useI18n();
  useEffect(() => { document.title = title ? `${title} — ${t('appName')}` : t('appName'); }, [title, t]);
  return (
    <section className="page">
      {title && <header className="page-head">
        {back && <button className="icon-btn" onClick={() => (history.length > 1 ? nav(-1) : nav('/'))} aria-label={t('back')}><span className="flip">←</span></button>}
        <h1>{title}</h1>
        <div className="actions">{actions}</div>
      </header>}
      {children}
    </section>
  );
}

export function State({ loading, error, empty, onRetry }: { loading?: boolean; error?: unknown; empty?: boolean; onRetry?: () => void }) {
  const { t } = useI18n();
  const err = useErr();
  if (loading) return <div className="skeletons" aria-label={t('loading')}>{[0, 1, 2].map((i) => <div key={i} className="skeleton" />)}</div>;
  if (error) return <div className="state error" role="alert"><span className="state-icon">⚠</span><p>{err(error)}</p>{onRetry && <button className="btn ghost" onClick={onRetry}>{t('retry')}</button>}</div>;
  if (empty) return <div className="state"><span className="state-icon">○</span><p>{t('empty')}</p></div>;
  return null;
}

export function Tabs<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return <div className="tabs" role="tablist">{options.map(([v, l]) => <button key={v} role="tab" aria-selected={v === value} className={v === value ? 'tab on' : 'tab'} onClick={() => onChange(v)}>{l}</button>)}</div>;
}

export const Pill = ({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'ok' | 'warn' | 'bad' | 'brand' }) => <span className={`pill ${tone}`}>{children}</span>;

export function SectionHead({ title, to }: { title: string; to?: string }) {
  const { t } = useI18n();
  return <div className="section-head"><h2>{title}</h2>{to && <Link to={to}>{t('seeAll')}</Link>}</div>;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useI18n();
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal glass" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label={t('close')}>✕</button></header>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, hint, error }: { label: string; children: ReactNode; hint?: string; error?: boolean }) {
  return <label className={error ? 'field invalid' : 'field'}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export const Ltr = ({ children }: { children: ReactNode }) => <bdi dir="ltr">{children}</bdi>;

/** Paragraphs from plain text (no HTML is ever injected). */
export const Text = ({ children }: { children: string | null | undefined }) => <div className="prose">{(children ?? '').split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>;
