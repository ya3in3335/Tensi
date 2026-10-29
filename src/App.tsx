import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { useI18n, type Key } from './lib/i18n';
import Home from './pages/Home';
import { NewsList, NewsDetail, Gallery, Donations, About } from './pages/Content';
import { ActivitiesPage, ActivityDetail } from './pages/Activities';
import { PollsPage, PollDetail } from './pages/Polls';
import { LecturesPage, LectureDetail, LectureForm } from './pages/Lectures';
import Volunteer from './pages/Volunteer';
import { Login, Register, Forgot, VerifyEmail, VerifyPhone } from './pages/Auth';
import { Account, Notifications, MyActivities } from './pages/Account';
import Icon, { type IconName } from './components/Icon';
import Splash from './components/Splash';

const MAIN: [string, Key, IconName][] = [['/', 'home', 'home'], ['/activities', 'activities', 'calendar'], ['/polls', 'polls', 'ballot'], ['/volunteer', 'volunteer', 'heart'], ['/account', 'account', 'user']];
const TOP: [string, Key][] = [['/', 'home'], ['/news', 'news'], ['/activities', 'activities'], ['/lectures', 'lectures'], ['/polls', 'polls'], ['/volunteer', 'volunteer'], ['/gallery', 'gallery'], ['/donations', 'donations']];

/** Pill shown while offline, then briefly when the connection is back. */
function ConnectionBanner() {
  const { t } = useI18n();
  const [online, setOnline] = useState(navigator.onLine);
  const [back, setBack] = useState(false);
  useEffect(() => {
    const on = () => { setOnline(true); setBack(true); setTimeout(() => setBack(false), 2200); };
    const off = () => { setOnline(false); setBack(false); };
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  if (online && !back) return null;
  return <div className={online ? 'conn back' : 'conn'} role="status">{online ? <Icon name="check" size={18} /> : <><Icon name="wifiOff" size={18} /> {t('offline')}</>}</div>;
}

export default function App() {
  const { t, lang, setLang } = useI18n();
  const { user } = useAuth();
  const loc = useLocation();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [loc.pathname]);
  return (
    <>
      <Splash />
      <ConnectionBanner />
      <header className="topbar glass">
        <Link to="/" className="brand"><img src="/logo.webp" alt="" /><span>{t('appName')}</span></Link>
        <nav aria-label="main">{TOP.map(([to, k]) => <NavLink key={to} to={to} end={to === '/'}>{t(k)}</NavLink>)}</nav>
        <div className="top-actions">
          <button className="icon-btn" onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')} aria-label={t('language')} title={t('language')}>{lang === 'ar' ? 'Fr' : 'ع'}</button>
          {user && <Link to="/notifications" className="icon-btn" aria-label={t('notifications')}><Icon name="bell" /></Link>}
          <Link to={user ? '/account' : '/login'} className="btn small">{user ? user.fullName.split(' ')[0] : t('login')}</Link>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<NewsList />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/activities/:id" element={<ActivityDetail />} />
          <Route path="/polls" element={<PollsPage />} />
          <Route path="/polls/:id" element={<PollDetail />} />
          <Route path="/lectures" element={<LecturesPage />} />
          <Route path="/lectures/:id" element={<LectureDetail />} />
          <Route path="/lectures/:id/register" element={<LectureForm />} />
          <Route path="/volunteer" element={<Volunteer />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/donations" element={<Donations />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<Forgot />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-phone" element={<VerifyPhone />} />
          <Route path="/account" element={<Account />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/my-activities" element={<MyActivities />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="site">
        <Link to="/about">{t('about')}</Link> · <Link to="/donations">{t('donations')}</Link> · <Link to="/gallery">{t('gallery')}</Link>
        <div>© {new Date().getFullYear()} {t('appName')}</div>
      </footer>
      <nav className="bottom-nav glass" aria-label="tabs">
        {MAIN.map(([to, k, ico]) => <NavLink key={to} to={to} end={to === '/'}><Icon name={ico} size={22} className="ico" />{t(k)}</NavLink>)}
      </nav>
    </>
  );
}
