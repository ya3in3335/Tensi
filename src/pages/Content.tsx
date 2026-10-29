import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, mediaUrl } from '../lib/api';
import { useDates, useI18n, useLoc, type Key } from '../lib/i18n';
import { Ltr, Modal, Page, Pill, State, Tabs, Text, useLoad } from '../lib/ui';

interface NewsItem { id: string; titleAr: string; titleFr: string | null; category: string; imageUrl: string | null; publishedAt: number | null; bodyAr?: string; bodyFr?: string | null; excerptAr?: string | null; excerptFr?: string | null }
const CATS: [string, Key][] = [['', 'catAll'], ['announcement', 'catAnnouncement'], ['news', 'catNews'], ['campaign', 'catCampaign'], ['report', 'catReport']];
const catKey = (c: string) => (CATS.find(([k]) => k === c)?.[1] ?? 'catNews');

export function NewsList() {
  const { t } = useI18n();
  const loc = useLoc();
  const d = useDates();
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<NewsItem[]>([]);
  const { data, error, loading, reload } = useLoad(async () => {
    const p = new URLSearchParams({ page: String(page), pageSize: '12' });
    if (cat) p.set('category', cat);
    if (query) p.set('q', query);
    const r = await api.get<{ items: NewsItem[]; hasMore: boolean }>(`/api/news?${p}`);
    setItems((prev) => (page === 1 ? r.items : [...prev, ...r.items]));
    return r;
  }, [cat, query, page]);
  const reset = (fn: () => void) => { fn(); setPage(1); };

  return (
    <Page title={t('news')}>
      <form className="row" style={{ marginBottom: 12 }} onSubmit={(e) => { e.preventDefault(); reset(() => setQuery(q.trim())); }}>
        <input type="search" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
      </form>
      <div className="chips" style={{ marginBottom: 16 }}>{CATS.map(([k, l]) => <button key={k} className={cat === k ? 'chip on' : 'chip'} onClick={() => reset(() => setCat(k))}>{t(l)}</button>)}</div>
      {items.length === 0 && <State loading={loading} error={error} empty={!loading && !error} onRetry={reload} />}
      <div className="grid">{items.map((n) => (
        <Link key={n.id} to={`/news/${n.id}`} className="card glass">
          {n.imageUrl ? <img className="cover" src={mediaUrl(n.imageUrl)} alt="" loading="lazy" /> : <div className="cover" />}
          <div className="body">
            <div><Pill>{t(catKey(n.category))}</Pill></div>
            <h3>{loc(n.titleAr, n.titleFr)}</h3>
            {n.excerptAr && <p>{loc(n.excerptAr, n.excerptFr)}</p>}
            {n.publishedAt && <div className="meta"><span>{d.date(n.publishedAt)}</span></div>}
          </div>
        </Link>
      ))}</div>
      {data?.hasMore && <div className="center" style={{ marginTop: 18 }}><button className="btn ghost" disabled={loading} onClick={() => setPage(page + 1)}>{t('loadMore')}</button></div>}
    </Page>
  );
}

export function NewsDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const loc = useLoc();
  const d = useDates();
  const { data, error, loading, reload } = useLoad(() => api.get<{ item: NewsItem }>(`/api/news/${id}`), [id]);
  const n = data?.item;
  return (
    <Page title={n ? loc(n.titleAr, n.titleFr) : t('news')} back>
      <State loading={loading && !n} error={error} onRetry={reload} />
      {n && <article className="panel glass stack">
        {n.imageUrl && <img src={mediaUrl(n.imageUrl)} alt="" style={{ borderRadius: 18, width: '100%', maxHeight: 460, objectFit: 'cover' }} />}
        <div className="meta"><Pill>{t(catKey(n.category))}</Pill>{n.publishedAt && <span>{d.dateTime(n.publishedAt)}</span>}</div>
        <Text>{loc(n.bodyAr, n.bodyFr)}</Text>
      </article>}
    </Page>
  );
}

interface Media { id: string; kind: string; titleAr: string | null; titleFr: string | null; url: string; thumbnailUrl: string | null }
/** YouTube links are shown with the privacy-friendly embed; other videos open in a player. */
export function youtubeId(url: string): string | null {
  const m = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/.exec(url);
  return m ? m[1]! : null;
}

export function Gallery() {
  const { t } = useI18n();
  const loc = useLoc();
  const [kind, setKind] = useState<'photo' | 'video'>('photo');
  const [open, setOpen] = useState<Media | null>(null);
  const { data, error, loading, reload } = useLoad(() => api.get<{ items: Media[] }>(`/api/media?kind=${kind}&page=1&pageSize=48`), [kind]);
  const thumb = (m: Media) => mediaUrl(m.thumbnailUrl ?? (youtubeId(m.url) ? `https://i.ytimg.com/vi/${youtubeId(m.url)}/hqdefault.jpg` : m.url));
  return (
    <Page title={t('gallery')}>
      <Tabs value={kind} options={[['photo', t('photos')], ['video', t('videos')]]} onChange={setKind} />
      <State loading={loading && !data} error={error} empty={data?.items.length === 0} onRetry={reload} />
      {data && <div className="gallery">{data.items.map((m) => (
        <button key={m.id} onClick={() => setOpen(m)} aria-label={loc(m.titleAr, m.titleFr) || t('gallery')}>
          <img src={thumb(m)} alt="" loading="lazy" />{m.kind === 'video' && <span className="play">▶</span>}
        </button>
      ))}</div>}
      {open && <Modal title={loc(open.titleAr, open.titleFr) || t('gallery')} onClose={() => setOpen(null)}>
        <div className="lightbox">
          {open.kind === 'photo' ? <img src={mediaUrl(open.url)} alt="" />
            : youtubeId(open.url) ? <iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId(open.url)}?autoplay=1`} title="video" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            : <video src={mediaUrl(open.url)} controls autoPlay style={{ width: '100%', borderRadius: 16 }} />}
        </div>
      </Modal>}
    </Page>
  );
}

interface Donation { ccpAccount: string | null; ccpKey: string | null; ccpHolder: string | null; bankName: string | null; bankAccount: string | null; bankHolder: string | null; instructionsAr: string | null; instructionsFr: string | null; contactPhone: string | null; contactEmail: string | null }
interface Campaign { id: string; title_ar: string; title_fr: string | null; description_ar: string | null; description_fr: string | null; image_url: string | null }

function CopyRow({ label, value }: { label: string; value: string }) {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  return (
    <div className="copy-row">
      <div><small className="muted">{label}</small><div><b><Ltr>{value}</Ltr></b></div></div>
      <button className="btn ghost small" onClick={() => { void navigator.clipboard?.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500); }}>{done ? t('copied') : t('copy')}</button>
    </div>
  );
}

export function Donations() {
  const { t } = useI18n();
  const loc = useLoc();
  const { data, error, loading, reload } = useLoad(() => api.get<{ donation: Donation; campaigns: Campaign[] }>('/api/donations'));
  const dn = data?.donation;
  const any = dn && (dn.ccpAccount || dn.bankAccount || dn.instructionsAr);
  return (
    <Page title={t('donations')}>
      <State loading={loading && !data} error={error} onRetry={reload} />
      {data && !any && data.campaigns.length === 0 && <div className="state"><span className="state-icon">💝</span><p>{t('noDonation')}</p></div>}
      {dn && any && <div className="panel glass stack">
        {(dn.instructionsAr || dn.instructionsFr) && <Text>{loc(dn.instructionsAr, dn.instructionsFr)}</Text>}
        {dn.ccpAccount && <><h3>{t('ccp')}</h3><CopyRow label={t('ccp')} value={dn.ccpAccount} />{dn.ccpKey && <CopyRow label={t('key')} value={dn.ccpKey} />}{dn.ccpHolder && <p className="muted">{t('holder')}: {dn.ccpHolder}</p>}</>}
        {dn.bankAccount && <><h3>{t('bank')}{dn.bankName ? ` — ${dn.bankName}` : ''}</h3><CopyRow label="RIB" value={dn.bankAccount} />{dn.bankHolder && <p className="muted">{t('holder')}: {dn.bankHolder}</p>}</>}
        {(dn.contactPhone || dn.contactEmail) && <p className="muted">{t('contactUs')}: {dn.contactPhone && <Ltr>{dn.contactPhone}</Ltr>} {dn.contactEmail && <Ltr>{dn.contactEmail}</Ltr>}</p>}
      </div>}
      {data && data.campaigns.length > 0 && <>
        <h2 style={{ margin: '24px 4px 12px' }}>{t('campaigns')}</h2>
        <div className="grid">{data.campaigns.map((c) => (
          <Link key={c.id} to={`/activities/${c.id}`} className="card glass">
            {c.image_url ? <img className="cover" src={mediaUrl(c.image_url)} alt="" loading="lazy" /> : <div className="cover" />}
            <div className="body"><h3>{loc(c.title_ar, c.title_fr)}</h3>{c.description_ar && <p>{loc(c.description_ar, c.description_fr).slice(0, 160)}</p>}</div>
          </Link>
        ))}</div>
      </>}
    </Page>
  );
}

export function About() {
  const { t } = useI18n();
  const loc = useLoc();
  const { data, error, loading, reload } = useLoad(() => api.get<{ settings: Record<string, string> }>('/api/settings'));
  const s = data?.settings ?? {};
  const about = loc(s.about_ar, s.about_fr);
  return (
    <Page title={t('about')}>
      <State loading={loading && !data} error={error} onRetry={reload} />
      {data && <div className="panel glass stack">
        <img src="/logo.webp" alt="" style={{ width: 180, margin: '0 auto' }} />
        {(s.association_name_ar || s.association_name_fr) && <h2 className="center">{loc(s.association_name_ar, s.association_name_fr)}</h2>}
        {about ? <Text>{about}</Text> : <p className="muted center">{t('aboutEmpty')}</p>}
        {(s.contact_phone || s.contact_email || s.contact_address_ar) && <>
          <hr className="soft" />
          <h3>{t('contactUs')}</h3>
          {s.contact_phone && <p>📞 <a href={`tel:${s.contact_phone}`}><Ltr>{s.contact_phone}</Ltr></a></p>}
          {s.contact_email && <p>✉️ <a href={`mailto:${s.contact_email}`}><Ltr>{s.contact_email}</Ltr></a></p>}
          {s.contact_address_ar && <p>📍 {loc(s.contact_address_ar, s.contact_address_fr)}</p>}
        </>}
      </div>}
    </Page>
  );
}
