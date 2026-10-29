import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, mediaUrl } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useDates, useErr, useI18n, useLoc } from '../lib/i18n';
import { Page, Pill, State, Tabs, Text, useLoad } from '../lib/ui';
import { DateBadge } from './Home';
import { youtubeId } from './Content';

export interface Activity {
  id: string; titleAr: string; titleFr: string | null; descriptionAr: string; descriptionFr: string | null; location: string | null;
  latitude: number | null; longitude: number | null; startsAt: number; endsAt: number; capacity: number | null; registeredCount: number;
  imageUrl: string | null; videoUrl: string | null; isCampaign: boolean; status: string; phase: string; registrationOpen: boolean;
}

export function ActivityRow({ a }: { a: Activity }) {
  const { t } = useI18n();
  const loc = useLoc();
  const d = useDates();
  return (
    <Link to={`/activities/${a.id}`} className="list-item glass">
      <DateBadge ms={a.startsAt} />
      <div className="grow">
        <h3>{loc(a.titleAr, a.titleFr)}</h3>
        <div className="meta">
          {a.isCampaign && <Pill tone="warn">{t('campaign')}</Pill>}
          {a.status === 'cancelled' && <Pill tone="bad">{t('cancelled')}</Pill>}
          {a.location && <span>📍 {a.location}</span>}
          <span>🕒 {d.time(a.startsAt)}</span>
          {a.capacity && <span>{t('seats', { n: a.registeredCount, max: a.capacity })}</span>}
        </div>
      </div>
    </Link>
  );
}

export function ActivitiesPage() {
  const { t } = useI18n();
  const [phase, setPhase] = useState<'upcoming' | 'ongoing' | 'completed'>('upcoming');
  const { data, error, loading, reload } = useLoad(() => api.get<{ items: Activity[] }>(`/api/activities?phase=${phase}`), [phase]);
  return (
    <Page title={t('activities')}>
      <Tabs value={phase} options={[['upcoming', t('upcoming')], ['ongoing', t('ongoing')], ['completed', t('completed')]]} onChange={setPhase} />
      <State loading={loading && !data} error={error} empty={data?.items.length === 0} onRetry={reload} />
      {data && <div className="stack">{data.items.map((a) => <ActivityRow key={a.id} a={a} />)}</div>}
    </Page>
  );
}

export function ActivityDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const loc = useLoc();
  const d = useDates();
  const err = useErr();
  const nav = useNavigate();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState<unknown>(null);
  const { data, error, loading, reload } = useLoad(() => api.get<{ item: Activity; myRegistration: string | null; media: { id: string; kind: string; url: string; thumbnail_url: string | null }[] }>(`/api/activities/${id}`), [id, user?.id]);
  const a = data?.item;
  const act = async (path: 'register' | 'cancel') => {
    setBusy(true); setActionErr(null);
    try { await api.post(`/api/activities/${id}/${path}`); await reload(true); } catch (e) { setActionErr(e); } finally { setBusy(false); }
  };
  const yt = a?.videoUrl ? youtubeId(a.videoUrl) : null;
  return (
    <Page title={a ? loc(a.titleAr, a.titleFr) : t('activities')} back>
      <State loading={loading && !a} error={error} onRetry={reload} />
      {a && <div className="panel glass stack">
        {a.imageUrl && <img src={mediaUrl(a.imageUrl)} alt="" style={{ borderRadius: 18, width: '100%', maxHeight: 420, objectFit: 'cover' }} />}
        <div className="meta">
          {a.isCampaign && <Pill tone="warn">{t('campaign')}</Pill>}
          {a.status === 'cancelled' && <Pill tone="bad">{t('cancelled')}</Pill>}
          <span>🗓 {d.dateTime(a.startsAt)} → {d.dateTime(a.endsAt)}</span>
          {a.location && <span>📍 {a.location}</span>}
          {a.latitude != null && a.longitude != null && <a href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`} target="_blank" rel="noopener noreferrer">🗺 Maps</a>}
          <span>{a.capacity ? t('seats', { n: a.registeredCount, max: a.capacity }) : t('registeredN', { n: a.registeredCount })}</span>
        </div>
        <Text>{loc(a.descriptionAr, a.descriptionFr)}</Text>
        {yt && <iframe src={`https://www.youtube-nocookie.com/embed/${yt}`} title="video" style={{ width: '100%', aspectRatio: '16/9', border: 0, borderRadius: 16 }} allowFullScreen />}
        {actionErr != null && <p className="error-text">{err(actionErr)}</p>}
        {data.myRegistration === 'attended' ? <div className="ok-box">{t('attended')}</div>
          : data.myRegistration === 'registered' ? <>
            <div className="ok-box">{t('youAreRegistered')}</div>
            {a.registrationOpen && <button className="btn danger" disabled={busy} onClick={() => act('cancel')}>{t('cancelRegistration')}</button>}
          </>
          : !a.registrationOpen ? <Pill>{t('registrationClosed')}</Pill>
          : !user ? <><p className="muted">{t('needLogin')}</p><button className="btn" onClick={() => nav('/login', { state: { next: `/activities/${id}` } })}>{t('login')}</button></>
          : <button className="btn" disabled={busy} onClick={() => act('register')}>{t('registerActivity')}</button>}
        {data.media.length > 0 && <div className="gallery">{data.media.map((m) => <a key={m.id} href={mediaUrl(m.url)} target="_blank" rel="noopener noreferrer" style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '1' }}><img src={mediaUrl(m.thumbnail_url ?? m.url)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></a>)}</div>}
      </div>}
    </Page>
  );
}
