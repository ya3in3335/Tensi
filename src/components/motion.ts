import { useEffect } from 'react';

/**
 * Page-wide motion helpers, applied once:
 *  - `.reveal` elements rise into view when scrolled to (IntersectionObserver; new elements are
 *    picked up automatically as pages change).
 *  - `.spot` elements get a light that follows the pointer (two CSS variables, one frame per move).
 * Both are skipped for people who prefer reduced motion.
 */
export function useMotionEffects() {
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      document.documentElement.classList.add('no-reveal');
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    const scan = () => document.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.getElementById('root')!, { childList: true, subtree: true });

    let frame = 0;
    const move = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.('.spot') as HTMLElement | null;
      if (!el) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    };
    document.addEventListener('pointermove', move, { passive: true });
    return () => { io.disconnect(); mo.disconnect(); document.removeEventListener('pointermove', move); };
  }, []);
}
