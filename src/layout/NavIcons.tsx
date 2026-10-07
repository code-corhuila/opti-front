import type { ReactNode } from 'react';

/** Small stroke icons for the sidebar, one per route. 20x20, inherits color from the link. */
const ICONS: Record<string, ReactNode> = {
  '/notifications': <path d="M5 8a5 5 0 0 1 10 0v4l2 3H3l2-3V8ZM8 17h4" />,
  '/sales/billing': <><rect x="4" y="2.5" width="12" height="15" rx="2" /><path d="M7 6h6M7 10h6M7 14h3" /></>,
  '/': (
    <path d="M3 10.5 10 4l7 6.5M5 9v7a1 1 0 0 0 1 1h3v-4.5h2V17h3a1 1 0 0 0 1-1V9" />
  ),
  '/customers': (
    <>
      <circle cx="7.5" cy="7" r="2.5" />
      <path d="M2.5 16c0-2.5 2-4 5-4s5 1.5 5 4" />
      <circle cx="14.5" cy="7.5" r="2" />
      <path d="M13 12.2c1.9.3 3.5 1.5 3.5 3.8" />
    </>
  ),
  '/products': (
    <path d="M10 2.5 17 6v8l-7 3.5L3 14V6l7-3.5ZM3 6l7 3.5M10 9.5V17M17 6l-7 3.5" />
  ),
  '/sales': (
    <path d="M3 4h2l1.2 8.4A1.5 1.5 0 0 0 7.7 13.7h6.6a1.5 1.5 0 0 0 1.47-1.2L17 6H5.3M8 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
  ),
  '/auth/users': (
    <>
      <circle cx="7" cy="7" r="2.8" />
      <path d="M2 16.5c0-2.9 2.2-4.5 5-4.5s5 1.6 5 4.5" />
      <path d="M13.5 8a2.2 2.2 0 1 0 0-4.4M15 12.5c1.8.4 3 1.6 3 4" />
    </>
  ),
  '/auth/account': (
    <>
      <circle cx="10" cy="6.5" r="3" />
      <path d="M4 17c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
    </>
  ),
  '/customers/optometry': (
    <>
      <circle cx="6.5" cy="10" r="3" />
      <circle cx="13.5" cy="10" r="3" />
      <path d="M9.5 10h1M3.5 10c0-1.5 1-2.5 2-2.5M16.5 10c0-1.5-1-2.5-2-2.5" />
    </>
  ),
  '/sales/reports': (
    <path d="M3.5 16.5h13M5.5 16.5V11M9.5 16.5V7M13.5 16.5v-5.5M16.5 16.5V4" />
  ),
};

/** Falls back to a generic dot when a route has no icon mapped. */
export function NavIcon({ to }: { to: string }): ReactNode {
  return (
    <svg
      className="nav-icon"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[to] ?? <circle cx="10" cy="10" r="3" />}
    </svg>
  );
}
