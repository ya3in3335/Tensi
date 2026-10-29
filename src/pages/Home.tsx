import { Link } from 'react-router-dom';
import { api, mediaUrl } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useDates, useI18n, useLoc, type Key } from '../lib/i18n';
import { Page, Pill, SectionHead, State, useLoad } from '../lib/ui';
import Icon, { type IconName } from '../components/Icon';

interface HomeNews { id: string; title_ar: string; title_fr: string | null; image_url: string | null; category: string; published_at: number | null; excerpt_ar: string | null; excerpt_fr: string | null }
interface HomeActivity { id: string; title_ar: string; title_fr: string | null; location: string | null; starts_at: number; image_url: string | null; is_campaign: number }
interface HomePoll { id: string; title_ar: string; title_fr: string | null; ends_at: number }
interface HomeMedia { id: string; kind: string; url: string; thumbnail_url: string | null; title_ar: string | null }
interface HomeData { settings: Record<string, string>; announcements: HomeNews[]; recentNews: HomeNews[]; featuredNews: HomeNews[]; activities: HomeActivity[]; activePolls: HomePoll[]; media: HomeMedia[] }
interface Lecture { id: string; kind: string; titleAr: string; titleFr: string | null; startsAt: number; speaker: string | null; location: string | null }

const QUICK: [string, Key, IconName, string, string][] = [
  ['/news', 'news', 'news', '#8b2b3d', '#5e1a28'],
  ['/lectures', 'lectures', 'mic', '#2f7d6b', '#1c5446'],
  ['/gallery', 'gallery', 'image', '#e9762b', '#c4501f'],
  ['/donations', 'donations', 'gift', '#e8432a', '#b02e1b'],
  ['/about', 'about', 'info', '#7a4b9a', '#4f2d6b'],
];

export function DateBadge({ ms }: { ms: number }) {
  const d = useDates();
  return <div className="date-badge"><b>{d.day(ms)}</b><small>{d.month(ms)}</small></div>;
}

export function NewsCard({ n }: { n: HomeNews }) {
  const loc = useLoc();
  const d = useDates();
  return (
    <Link to={`/news/${n.id}`} className="card glass">
      {n.image_url ? <img className="cover" src={mediaUrl(n.image_url)} alt="" loading="lazy" /> : <div className="cover" />}
      <div className="body">
        <h3>{loc(n.title_ar, n.title_fr)}</h3>
        {(n.excerpt_ar || n.excerpt_fr) && <p>{loc(n.excerpt_ar, n.excerpt_fr)}</p>}
        {n.published_at && <div className="meta"><span>{d.date(n.published_at)}</span></div>}
      </div>
    </Link>
  );
}

export default function Home() {
  const { t } = useI18n();
  const { user } = useAuth();
  const loc = useLoc();
  const d = useDates();
  const { data, error, loading, reload } = useLoad(() => api.get<HomeData>('/api/home'));
  const lectures = useLoad(() => api.get<{ items: Lecture[] }>('/api/lectures?pageSize=3'));
  const name = loc(data?.settings.association_name_ar, data?.settings.association_name_fr);

  return (
    <Page>
      <div className="hero">
        <img className="logo" src="/logo.webp" alt="" />
        <div>
          <h1>{user ? t('welcomeUser', { name: user.fullName.split(' ')[0] }) : name || t('welcome')}</h1>
          <p>{t('heroText')}</p>
          {!user && <Link className="btn" to="/register">{t('register')}</Link>}
        </div>
      </div>

      <nav className="quick">
        {QUICK.map(([to, k, ico, c, c2]) => (
          <Link key={to} to={to} className="glass"><span className="tile" style={{ ['--c' as string]: c, ['--c2' as string]: c2 }}><Icon name={ico} size={26} /></span>{t(k)}</Link>
        ))}
      </nav>

      {(loading || error != null) && <div style={{ marginTop: 24 }}><State loading={loading && !data} error={error} onRetry={reload} /></div>}

      {data && data.announcements.length > 0 && <>
        <SectionHead title={t('announcements')} to="/news" />
        <div className="stack">{data.announcements.map((n) => (
          <Link key={n.id} to={`/news/${n.id}`} className="list-item glass"><span className="tile-sm"><Icon name="megaphone" size={22} /></span><div className="grow"><h3>{loc(n.title_ar, n.title_fr)}</h3>{n.excerpt_ar && <p className="muted" style={{ margin: 0 }}>{loc(n.excerpt_ar, n.excerpt_fr)}</p>}</div></Link>
        ))}</div>
      </>}

      {data && data.activePolls.length > 0 && <>
        <SectionHead title={t('activePolls')} to="/polls" />
        <div className="stack">{data.activePolls.map((p) => (
          <Link key={p.id} to={`/polls/${p.id}`} className="list-item glass"><span className="tile-sm"><Icon name="ballot" size={22} /></span><div className="grow"><h3>{loc(p.title_ar, p.title_fr)}</h3><div className="meta"><span>{t('pollEnds', { d: d.dateTime(p.ends_at) })}</span></div></div></Link>
        ))}</div>
      </>}

      {lectures.data && lectures.data.items.length > 0 && <>
        <SectionHead title={t('lectures')} to="/lectures" />
        <div className="stack">{lectures.data.items.map((l) => (
          <Link key={l.id} to={`/lectures/${l.id}`} className="list-item glass"><DateBadge ms={l.startsAt} /><div className="grow"><h3>{loc(l.titleAr, l.titleFr)}</h3><div className="meta"><span>{t(`kind_${l.kind}` as Key)}</span>{l.speaker && <span><Icon name="mic" /> {l.speaker}</span>}<span><Icon name="clock" /> {d.time(l.startsAt)}</span></div></div></Link>
        ))}</div>
      </>}

      {data && data.activities.length > 0 && <>
        <SectionHead title={t('upcomingActivities')} to="/activities" />
        <div className="stack">{data.activities.map((a) => (
          <Link key={a.id} to={`/activities/${a.id}`} className="list-item glass"><DateBadge ms={a.starts_at} /><div className="grow"><h3>{loc(a.title_ar, a.title_fr)}</h3><div className="meta">{a.is_campaign ? <Pill tone="warn">{t('campaign')}</Pill> : null}{a.location && <span><Icon name="pin" /> {a.location}</span>}<span><Icon name="clock" /> {d.time(a.starts_at)}</span></div></div></Link>
        ))}</div>
      </>}

      {data && data.recentNews.length > 0 && <>
        <SectionHead title={t('latestNews')} to="/news" />
        <div className="grid">{data.recentNews.map((n) => <NewsCard key={n.id} n={n} />)}</div>
      </>}

      {data && data.media.length > 0 && <>
        <SectionHead title={t('latestMedia')} to="/gallery" />
        <div className="gallery">{data.media.slice(0, 8).map((m) => (
          <Link key={m.id} to="/gallery" style={{ borderRadius: 18, overflow: 'hidden', aspectRatio: '1' }}><img src={mediaUrl(m.thumbnail_url ?? m.url)} alt={m.title_ar ?? ''} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></Link>
        ))}</div>
      </>}

      <div className="cta">
        <Icon name="gift" size={36} />
        <div><h3>{t('donateTitle')}</h3><p>{t('donateBody')}</p></div>
        <Link className="btn" to="/donations">{t('donateCta')}</Link>
      </div>
    </Page>
  );
}
