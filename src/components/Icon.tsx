import type { CSSProperties } from 'react';

// One consistent SVG icon set (24×24 grid, 2px rounded strokes, colour from `currentColor`),
// replacing emojis so icons look the same on every phone and computer.
const P = {
  home: <><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
  ballot: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="m8 12 3 3 5-6" /></>,
  heart: <><path d="M12 20s-7-4.4-9.2-8.6C1.4 8.6 3 5 6.5 5c2 0 3.5 1.2 5.5 3.2C14 6.2 15.5 5 17.5 5c3.5 0 5.1 3.6 3.7 6.4C19 15.6 12 20 12 20z" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.3.6 4 2.6 4 6" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
  news: <><rect x="3" y="4" width="14" height="16" rx="2" /><path d="M17 8h3a1 1 0 0 1 1 1v9a2 2 0 0 1-4 0M7 9h6M7 13h6M7 17h4" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" /></>,
  gift: <><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v8h14v-8M12 8v12M12 8S10.5 4 8.5 4 6 6.5 8 8m4 0s1.5-4 3.5-4S18 6.5 16 8" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  bell: <><path d="M6 16v-5a6 6 0 1 1 12 0v5l2 2H4z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M17 6l3 3M14 9l2 2" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  pin: <><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15" /></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3" /></>,
  play: <><path d="M8 5v14l11-7z" fill="currentColor" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  phone: <><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></>,
  call: <><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  check: <><path d="m5 12 5 5 9-10" /></>,
  checkCircle: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
  alert: <><path d="M12 3 2 20h20z" /><path d="M12 9v5M12 17h.01" /></>,
  megaphone: <><path d="M3 11v2a1 1 0 0 0 1 1h3l8 5V5L7 10H4a1 1 0 0 0-1 1zM18 9a4 4 0 0 1 0 6" /></>,
  back: <><path d="M19 12H5M12 5l-7 7 7 7" /></>,
  forward: <><path d="M5 12h14M12 5l7 7-7 7" /></>,
  close: <><path d="M6 6l12 12M18 6 6 18" /></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-5-5" /></>,
  logout: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l-4 4 4 4M6 12h9" /></>,
  trash: <><path d="M4 7h16M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  inbox: <><path d="M3 13h5l2 3h4l2-3h5" /><path d="M5 5h14l2 8v6H3v-6z" /></>,
  wifiOff: <><path d="M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M19 13a10 10 0 0 0-2.3-1.6M2 8.8a15 15 0 0 1 4.2-2.5M22 8.8A15 15 0 0 0 10.7 5M12 20h.01" /></>,
  hourglass: <><path d="M6 3h12M6 21h12M7 3v3a5 5 0 0 0 10 0V3M7 21v-3a5 5 0 0 1 10 0v3" /></>,
  send: <><path d="M21 3 3 10l7 3 3 7z" /><path d="m10 13 4-4" /></>,
} as const;

export type IconName = keyof typeof P;

export default function Icon({ name, size = 20, className, style, label }: { name: IconName; size?: number; className?: string; style?: CSSProperties; label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={['icon', name === 'back' || name === 'forward' ? 'flip' : '', className].filter(Boolean).join(' ')}
      style={style} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false"
    >
      {P[name]}
    </svg>
  );
}

export const ICON_NAMES = Object.keys(P) as IconName[];
