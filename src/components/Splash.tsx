import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n';

const SEEN = 'splash_seen';

/** Whether the intro should play: once per browser session, never with reduced motion. */
export function shouldShowSplash(store: Pick<Storage, 'getItem'> | null, reducedMotion: boolean): boolean {
  if (reducedMotion) return false;
  try { return store?.getItem(SEEN) !== '1'; } catch { return true; }
}

/**
 * The client's intro animation (same video as the Android app) over the page while it loads.
 * Played at 1.6× (about 6 s), skippable after 0.8 s; ends on its own when the video finishes, fails, or after a safety timeout.
 */
export default function Splash() {
  const { t } = useI18n();
  const [show, setShow] = useState(() => {
    let store: Storage | null = null;
    try { store = sessionStorage; } catch { /* private mode */ }
    return shouldShowSplash(store, typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  });
  const [leaving, setLeaving] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  const close = () => {
    if (leaving) return;
    setLeaving(true);
    try { sessionStorage.setItem(SEEN, '1'); } catch { /* ignore */ }
    setTimeout(() => setShow(false), 550);
  };

  useEffect(() => {
    if (!show) return;
    document.documentElement.style.overflow = 'hidden';
    const skip = setTimeout(() => setCanSkip(true), 800);
    const safety = setTimeout(close, 8_000);
    // Autoplay can be refused (e.g. data saver): then the splash simply closes.
    if (video.current) video.current.playbackRate = 1.6;
    video.current?.play().catch(() => setTimeout(close, 800));
    return () => { clearTimeout(skip); clearTimeout(safety); document.documentElement.style.overflow = ''; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  if (!show) return null;
  return (
    <div className={leaving ? 'splash leaving' : 'splash'} role="presentation">
      <video ref={video} src="/intro.mp4" poster="/intro-poster.jpg" muted playsInline autoPlay preload="auto" onEnded={close} onError={close} aria-hidden />
      {canSkip && <button className="splash-skip" onClick={close}>{t('skip')}</button>}
    </div>
  );
}
