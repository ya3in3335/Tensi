import { useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';

const canTilt = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * 3D tilt that follows the pointer (desktop only; touch screens and reduced-motion users get a
 * static card). Only CSS variables change, applied in a single animation frame, so it stays cheap.
 */
export default function Tilt({ as: Tag = 'div', max = 10, className = '', style, children, ...rest }: {
  as?: ElementType; max?: number; className?: string; style?: CSSProperties; children: ReactNode; [k: string]: unknown;
}) {
  const ref = useRef<HTMLElement>(null);
  const frame = useRef(0);
  const set = (rx: number, ry: number, gx: number, gy: number) => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.style.setProperty('--rx', `${rx}deg`); el.style.setProperty('--ry', `${ry}deg`);
      el.style.setProperty('--gx', `${gx}%`); el.style.setProperty('--gy', `${gy}%`);
    });
  };
  const move = (e: React.PointerEvent) => {
    if (!canTilt() || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    set((0.5 - y) * max, (x - 0.5) * max, x * 100, y * 100);
  };
  return (
    <Tag ref={ref} className={`tilt ${className}`} style={style} onPointerMove={move} onPointerLeave={() => set(0, 0, 50, 50)} {...rest}>
      {children}
      <span className="glare" aria-hidden />
    </Tag>
  );
}
