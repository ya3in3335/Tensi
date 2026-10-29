import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon, { type IconName } from '../components/Icon';
import Tilt from '../components/Tilt';
import { api, mediaUrl } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useDates, useI18n, useLoc, type Key } from '../lib/i18n';
import { Ltr, Page, Pill, SectionHead, State, useLoad } from '../lib/ui';

interface HomeNews { id: string; title_ar: string; title_fr: string | null; image_url: string | null; category: string; published_at: number | null; excerpt_ar: string | null; excerpt_fr: string | null }
interface HomeActivity { id: string; title_ar: string; title_fr: string | null; location: string | null; starts_at: number; image_url: string | null; is_campaign: number }
interface HomePoll { id: string; title_ar: string; title_fr: string | null; ends_at: number }
interface HomeMedia { id: string; kind: string; url: string; thumbnail_url: string | null; title_ar: string | null }
interface HomeData { settings: Record<string, string>; announcements: HomeNews[]; recentNews: HomeNews[]; activities: HomeActivity[]; activePolls: HomePoll[]; media: HomeMedia[] }
interface Lecture { id: string; kind: string; titleAr: string; titleFr: string | null; startsAt: number; speaker: string | null }
export interface ApkInfo { version: string; size: number; sha256: string; date: string; minAndroid: string; url: string }

const QUICK: [string, Key, IconName, string, string][] = [
  ['/news', 'news', 'news', '#8b2b3d', '#5e1a28'],
  ['/lectures', 'lectures', 'mic', '#2f7d6b', '#1c5446'],
  ['/gallery', 'gallery', 'image', '#e9762b', '#c4501f'],
  ['/donations', 'donations', 'gift', '#e8432a', '#b02e1b'],
  ['/about', 'about', 'info', '#7a4b9a', '#4f2d6b'],
];
const FEATURES: [IconName, Key, Key, string, string, string][] = [
  ['news', 'f_news_t', 'f_news_d', '#8b2b3d', '#5e1a28', '/news'],
  ['calendar', 'f_act_t', 'f_act_d', '#e9762b', '#c4501f', '/activities'],
  ['ballot', 'f_poll_t', 'f_poll_d', '#e8432a', '#9b2a1a', '/polls'],
  ['mic', 'f_lec_t', 'f_lec_d', '#2f7d6b', '#1c5446', '/lectures'],
  ['users', 'f_vol_t', 'f_vol_d', '#7a4b9a', '#4f2d6b', '/volunteer'],
  ['bell', 'f_notif_t', 'f_notif_d', '#f2832c', '#c4501f', '#download'],
];

export function DateBadge({ ms }: { ms: number }) {
  const d = useDates();
  return <div className="date-badge"><b>{d.day(ms)}</b><small>{d.month(ms)}</small></div>;
}

export function NewsCard({ n }: { n: HomeNews }) {
  const loc = useLoc();
  const d = useDates();
  return (
    <Tilt as={Link} to={`/news/${n.id}`} className="card glass" max={6}>
      {n.image_url ? <img className="cover" src={mediaUrl(n.image_url)} alt="" loading="lazy" /> : <div className="cover" />}
      <div className="body depth">
        <h3>{loc(n.title_ar, n.title_fr)}</h3>
        {(n.excerpt_ar || n.excerpt_fr) && <p>{loc(n.excerpt_ar, n.excerpt_fr)}</p>}
        {n.published_at && <div className="meta"><span><Icon name="calendar" /> {d.date(n.published_at)}</span></div>}
      </div>
    </Tilt>
  );
}

/** 3D phone showing the real Android app (a rendering of its home screen). */
function Phone3D() {
  const { t } = useI18n();
  return (
    <div className="phone-stage" aria-hidden>
      <div className="orb orb-a" /><div className="orb orb-b" /><div className="ring" />
      <div className="phone3d">
        <div className="phone-screen">
          <picture>
            <source srcSet="/img/app-home-dark.webp" media="(prefers-color-scheme: dark)" />
            <img src="/img/app-home-light.webp" alt="" width={540} height={1170} />
          </picture>
        </div>
        <div className="float-chip chip-1 glass"><span className="tile-xs" style={{ ['--c' as string]: '#e8432a' }}><Icon name="ballot" size={16} /></span>{t('chipVote')}</div>
        <div className="float-chip chip-2 glass"><span className="tile-xs" style={{ ['--c' as string]: '#2f7d6b' }}><Icon name="mic" size={16} /></span>{t('chipLecture')}</div>
        <div className="float-chip chip-3 glass"><span className="tile-xs" style={{ ['--c' as string]: '#2e7d4f' }}><Icon name="check" size={16} /></span>{t('chipVerified')}</div>
      </div>
    </div>
  );
}

const mb = (n: number) => `${(n / 1048576).toFixed(1)} MB`;

export function DownloadSection() {
  const { t } = useI18n();
  const d = useDates();
  const { data } = useLoad(() => fetch('/app-latest.json', { cache: 'no-cache' }).then((r) => r.json() as Promise<ApkInfo>));
  const [copied, setCopied] = useState(false);
  return (
    <section id="download" className="download">
      <Tilt className="download-card glass glow-border reveal" max={4}>
        <div className="download-main depth">
          <span className="tile-lg"><Icon name="phone" size={34} /></span>
          <h2>{t('dlTitle')}</h2>
          <p className="muted">{t('dlSub')}</p>
          {data && <div className="specs">
            <div><small>{t('dlVersion')}</small><b><Ltr>{data.version}</Ltr></b></div>
            <div><small>{t('dlSize')}</small><b><Ltr>{mb(data.size)}</Ltr></b></div>
            <div><small>{t('dlDate')}</small><b>{d.date(Date.parse(data.date))}</b></div>
          </div>}
          <a className="btn big" href={data?.url ?? '/downloads/association-members.apk'} download>
            <Icon name="download" size={22} /> {t('dlButton')}
          </a>
          {data && <small className="muted">{t('dlAndroid', { v: data.minAndroid })}</small>}
          <div className="info-box small-note"><Icon name="info" /> {t('dlIphone')}</div>
        </div>
        <div className="download-side depth">
          <div className="qr"><img src="/img/apk-qr.svg" alt={t('dlScan')} width={180} height={180} /></div>
          <small className="muted center">{t('dlScan')}</small>
          <h3>{t('dlHowTitle')}</h3>
          <ol className="steps-mini"><li>{t('dl1')}</li><li>{t('dl2')}</li><li>{t('dl3')}</li></ol>
          {data && <details className="checksum">
            <summary>{t('dlChecksum')}</summary>
            <code dir="ltr">{data.sha256}</code>
            <button className="btn ghost small" onClick={() => { void navigator.clipboard?.writeText(data.sha256); setCopied(true); }}>{copied ? t('copied') : t('copy')}</button>
          </details>}
        </div>
      </Tilt>
    </section>
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
  const hasLive = !!data && (data.announcements.length + data.activePolls.length + data.activities.length + data.recentNews.length + data.media.length > 0 || (lectures.data?.items.length ?? 0) > 0);

  return (
    <Page>
      <section className="landing-hero">
        <div className="hero-copy">
          <span className="kicker"><img src="/logo.webp" alt="" />{name || t('landingKicker')}</span>
          <h1 className="words">{(user ? t('welcomeUser', { name: user.fullName.split(' ')[0] }) : t('landingTitle')).split(' ').map((w, i) => <span key={i} style={{ ['--i' as string]: i }}>{w}</span>)}</h1>
          <p>{t('landingTagline')}</p>
          <div className="hero-ctas">
            <a className="btn big glow-border" href="#download"><Icon name="download" size={22} /> {t('ctaDownload')}</a>
            {user ? <a className="btn ghost big" href="#live">{t('ctaExplore')}</a> : <Link className="btn ghost big" to="/register">{t('ctaJoin')}</Link>}
          </div>
        </div>
        <Phone3D />
      </section>

      <nav className="quick">
        {QUICK.map(([to, k, ico, c, c2]) => (
          <Tilt key={to} as={Link} to={to} className="glass" max={14}>
            <span className="tile depth" style={{ ['--c' as string]: c, ['--c2' as string]: c2 }}><Icon name={ico} size={26} /></span>
            <span className="depth">{t(k)}</span>
          </Tilt>
        ))}
      </nav>

      <div className="marquee" aria-hidden>
        <div className="marquee-track">{[0, 1].map((k) => <span key={k}>{FEATURES.map(([ico, title]) => <b key={title}><Icon name={ico} size={20} /> {t(title)}</b>)}</span>)}</div>
      </div>

      <section className="features">
        <div className="section-title reveal"><span className="eyebrow">{t('appName')}</span><h2>{t('featuresTitle')}</h2><p className="muted">{t('featuresSub')}</p></div>
        <div className="bento">{FEATURES.map(([ico, title, desc, c, c2, to], i) => {
          const inner = <>
            <span className="tile-lg depth" style={{ ['--c' as string]: c, ['--c2' as string]: c2 }}><Icon name={ico} size={30} /></span>
            <h3 className="depth">{t(title)}</h3><p className="depth">{t(desc)}</p>
            {i === 0 && <img className="bento-shot depth" src="/img/app-home-light.webp" alt="" loading="lazy" />}
            <span className="go depth" aria-hidden><Icon name="forward" size={18} /></span>
          </>;
          const cls = `feature glass spot reveal b${i + 1}`;
          return to.startsWith('#') ? <Tilt key={title} as="a" href={to} className={cls} max={6}>{inner}</Tilt> : <Tilt key={title} as={Link} to={to} className={cls} max={6} viewTransition>{inner}</Tilt>;
        })}</div>
      </section>

      <div id="live" />
      {(loading || error != null) && <div style={{ marginTop: 24 }}><State loading={loading && !data} error={error} onRetry={reload} /></div>}
      {hasLive && <div className="section-title reveal"><span className="eyebrow">Live</span><h2>{t('liveTitle')}</h2></div>}

      {data && data.announcements.length > 0 && <>
        <SectionHead title={t('announcements')} to="/news" />
        <div className="stack">{data.announcements.map((n) => (
          <Tilt key={n.id} as={Link} to={`/news/${n.id}`} className="list-item glass" max={4}><span className="tile-sm depth"><Icon name="megaphone" size={22} /></span><div className="grow depth"><h3>{loc(n.title_ar, n.title_fr)}</h3>{n.excerpt_ar && <p className="muted" style={{ margin: 0 }}>{loc(n.excerpt_ar, n.excerpt_fr)}</p>}</div></Tilt>
        ))}</div>
      </>}

      {data && data.activePolls.length > 0 && <>
        <SectionHead title={t('activePolls')} to="/polls" />
        <div className="stack">{data.activePolls.map((p) => (
          <Tilt key={p.id} as={Link} to={`/polls/${p.id}`} className="list-item glass" max={4}><span className="tile-sm depth"><Icon name="ballot" size={22} /></span><div className="grow depth"><h3>{loc(p.title_ar, p.title_fr)}</h3><div className="meta"><span><Icon name="clock" /> {t('pollEnds', { d: d.dateTime(p.ends_at) })}</span></div></div></Tilt>
        ))}</div>
      </>}

      {lectures.data && lectures.data.items.length > 0 && <>
        <SectionHead title={t('lectures')} to="/lectures" />
        <div className="stack">{lectures.data.items.map((l) => (
          <Tilt key={l.id} as={Link} to={`/lectures/${l.id}`} className="list-item glass" max={4}><DateBadge ms={l.startsAt} /><div className="grow depth"><h3>{loc(l.titleAr, l.titleFr)}</h3><div className="meta"><Pill>{t(`kind_${l.kind}` as Key)}</Pill>{l.speaker && <span><Icon name="mic" /> {l.speaker}</span>}<span><Icon name="clock" /> {d.time(l.startsAt)}</span></div></div></Tilt>
        ))}</div>
      </>}

      {data && data.activities.length > 0 && <>
        <SectionHead title={t('upcomingActivities')} to="/activities" />
        <div className="stack">{data.activities.map((a) => (
          <Tilt key={a.id} as={Link} to={`/activities/${a.id}`} className="list-item glass" max={4}><DateBadge ms={a.starts_at} /><div className="grow depth"><h3>{loc(a.title_ar, a.title_fr)}</h3><div className="meta">{a.is_campaign ? <Pill tone="warn">{t('campaign')}</Pill> : null}{a.location && <span><Icon name="pin" /> {a.location}</span>}<span><Icon name="clock" /> {d.time(a.starts_at)}</span></div></div></Tilt>
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

      <section className="steps">
        <div className="section-title reveal"><span className="eyebrow">1 · 2 · 3</span><h2>{t('stepsTitle')}</h2></div>
        <div className="grid">{([['s1_t', 's1_d', 'user'], ['s2_t', 's2_d', 'lock'], ['s3_t', 's3_d', 'checkCircle']] as [Key, Key, IconName][]).map(([title, desc, ico], i) => (
          <Tilt key={title} className="step glass spot reveal" max={8}>
            <span className="step-num depth">{i + 1}</span>
            <span className="tile-sm depth"><Icon name={ico} size={22} /></span>
            <h3 className="depth">{t(title)}</h3><p className="depth muted">{t(desc)}</p>
          </Tilt>
        ))}</div>
      </section>

      <DownloadSection />

      <div className="cta reveal">
        <Icon name="gift" size={36} />
        <div><h3>{t('donateTitle')}</h3><p>{t('donateBody')}</p></div>
        <Link className="btn" to="/donations">{t('donateCta')}</Link>
      </div>
    </Page>
  );
}
