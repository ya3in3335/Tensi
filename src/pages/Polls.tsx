import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useDates, useErr, useI18n, useLoc } from '../lib/i18n';
import { Modal, Page, Pill, State, Tabs, Text, useLoad } from '../lib/ui';
import Icon from '../components/Icon';

interface Poll { id: string; titleAr: string; titleFr: string | null; descriptionAr: string | null; descriptionFr: string | null; startsAt: number; endsAt: number; eligibility: string; resultVisibility: string; anonymous: boolean; state: string; hasVoted?: boolean }
interface Option { id: string; labelAr: string; labelFr: string | null; description: string | null; imageUrl: string | null }
interface PollDetailData { poll: Poll; options: Option[]; eligible: boolean; ineligibleReason: string | null; hasVoted: boolean; receipt: string | null; results: { totalVotes: number; byOption: Record<string, number> } | null }

export function PollsPage() {
  const { t } = useI18n();
  const loc = useLoc();
  const d = useDates();
  const { user } = useAuth();
  const [state, setState] = useState<'active' | 'closed'>('active');
  const { data, error, loading, reload } = useLoad(() => api.get<{ items: Poll[] }>(`/api/polls?state=${state}`), [state, user?.id]);
  return (
    <Page title={t('polls')}>
      <Tabs value={state} options={[['active', t('active')], ['closed', t('closed')]]} onChange={setState} />
      <State loading={loading && !data} error={error} empty={data?.items.length === 0} onRetry={reload} />
      {data && <div className="stack">{data.items.map((p) => (
        <Link key={p.id} to={`/polls/${p.id}`} className="list-item glass">
          <span className="tile-sm"><Icon name="ballot" size={22} /></span>
          <div className="grow">
            <h3>{loc(p.titleAr, p.titleFr)}</h3>
            <div className="meta"><span>{t('pollEnds', { d: d.dateTime(p.endsAt) })}</span>{p.hasVoted && <Pill tone="ok">{t('voted')}</Pill>}{p.eligibility === 'members' && <Pill>{t('membersOnly')}</Pill>}</div>
          </div>
        </Link>
      ))}</div>}
    </Page>
  );
}

export function PollDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const loc = useLoc();
  const d = useDates();
  const err = useErr();
  const nav = useNavigate();
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [voteErr, setVoteErr] = useState<unknown>(null);
  const [justVoted, setJustVoted] = useState(false);
  const { data, error, loading, reload } = useLoad(() => api.get<PollDetailData>(`/api/polls/${id}`), [id, user?.id]);

  const vote = async () => {
    if (!selected) return;
    setConfirm(false); setBusy(true); setVoteErr(null);
    try { await api.post(`/api/polls/${id}/vote`, { optionId: selected }); setJustVoted(true); await reload(true); } catch (e) { setVoteErr(e); } finally { setBusy(false); }
  };

  const p = data?.poll;
  const canVote = !!data && p?.state === 'active' && !data.hasVoted && data.eligible;
  const opt = data?.options.find((o) => o.id === selected);
  const total = data?.results?.totalVotes ?? 0;

  return (
    <Page title={t('polls')} back>
      <State loading={loading && !data} error={error} onRetry={reload} />
      {data && p && <div className="panel glass stack">
        <h2>{loc(p.titleAr, p.titleFr)}</h2>
        {p.descriptionAr && <Text>{loc(p.descriptionAr, p.descriptionFr)}</Text>}
        <div className="meta"><span>{t('pollEnds', { d: d.dateTime(p.endsAt) })}</span>{p.anonymous && <Pill>{t('anonymous')}</Pill>}{p.eligibility === 'members' && <Pill>{t('membersOnly')}</Pill>}</div>
        {data.hasVoted && <div className="ok-box"><Icon name="checkCircle" size={22} /> <span>{justVoted ? t('voted') : t('alreadyVoted')}{data.receipt && <div style={{ fontWeight: 400, fontSize: 14 }}>{t('receipt', { r: data.receipt })}</div>}</span></div>}
        <div className="stack" role="radiogroup">{data.options.map((o) => {
          const n = data.results?.byOption[o.id] ?? 0;
          return (
            <button key={o.id} type="button" role="radio" aria-checked={selected === o.id} disabled={!canVote} className={selected === o.id ? 'option on' : 'option'} onClick={() => setSelected(o.id)}>
              {canVote && <span className="radio" />}
              <span style={{ flex: 1 }}>
                <b>{loc(o.labelAr, o.labelFr)}</b>{o.description && <small className="muted" style={{ display: 'block' }}>{o.description}</small>}
                {data.results && <span className="bar"><i style={{ width: `${total ? (n * 100) / total : 0}%` }} /></span>}
              </span>
              {data.results && <b>{n}</b>}
            </button>
          );
        })}</div>
        {data.results ? <p className="muted">{t('totalVotes', { n: total })}</p>
          : p.resultVisibility === 'after_close' ? <p className="muted">{t('resultsHidden')}</p>
          : p.resultVisibility === 'admins' ? <p className="muted">{t('resultsAdmins')}</p> : null}
        {voteErr != null && <p className="error-text">{err(voteErr)}</p>}
        {p.state === 'active' && !data.hasVoted && (
          !user || data.ineligibleReason === 'login_required' ? <><p className="muted">{t('needLogin')}</p><button className="btn" onClick={() => nav('/login', { state: { next: `/polls/${id}` } })}>{t('login')}</button></>
          : data.ineligibleReason === 'phone_not_verified' ? <><p className="muted">{t('needVerifyPhone')}</p><button className="btn" onClick={() => nav('/verify-phone', { state: { next: `/polls/${id}` } })}>{t('verifyPhone')}</button></>
          : data.ineligibleReason === 'not_on_member_list' ? <p className="muted">{t('notMember')}</p>
          : !data.eligible ? <p className="muted">{t('notEligible')}</p>
          : <>{!selected && <p className="muted">{t('pickOption')}</p>}<button className="btn" disabled={!selected || busy} onClick={() => setConfirm(true)}>{t('vote')}</button></>
        )}
      </div>}
      {confirm && opt && <Modal title={t('voteConfirmTitle')} onClose={() => setConfirm(false)}>
        <p>{t('voteConfirmBody', { o: loc(opt.labelAr, opt.labelFr) })}</p>
        <div className="row"><button className="btn" onClick={vote}>{t('confirm')}</button><button className="btn ghost" onClick={() => setConfirm(false)}>{t('cancel')}</button></div>
      </Modal>}
    </Page>
  );
}
