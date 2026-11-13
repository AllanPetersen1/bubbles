"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const icon = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
} as const;

const ITEMS = [
  {
    href: "/",
    label: "Feed",
    icon: (
      <svg {...icon}>
        <path d="M4 6.5h16M4 12h16M4 17.5h9" />
      </svg>
    ),
  },
  {
    href: "/search",
    label: "Search",
    icon: (
      <svg {...icon}>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </svg>
    ),
  },
  {
    href: "/activity",
    label: "Activity",
    icon: (
      <svg {...icon}>
        <circle cx="9" cy="14.5" r="4.5" />
        <circle cx="16.5" cy="8" r="2.5" />
        <circle cx="15" cy="19" r="1.1" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg {...icon}>
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
      </svg>
    ),
  },
];

/** Check-in is a task, not a tab: it stays under Search */
function useIsActive() {
  const pathname = usePathname();
  const current = pathname.startsWith("/checkin") ? "/search" : pathname;
  return (href: string) => (href === "/" ? current === "/" : current.startsWith(href));
}

/** Phone and tablet: tabs along the bottom edge. Hidden from lg up, where SideNav takes over. */
export default function BottomNav() {
  const isActive = useIsActive();

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <ul className="mx-auto flex max-w-md border-x border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`press relative flex h-[var(--nav-height)] flex-col items-center justify-center gap-1 ${
                  active ? "text-text-main" : "text-text-muted"
                }`}
              >
                {active && <span className="absolute inset-x-5 top-0 h-[2px] bg-brand-primary" />}
                {item.icon}
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Desktop (lg and up): the same destinations as a left sidebar, plus the check-in button. */
export function SideNav() {
  const isActive = useIsActive();

  return (
    <nav aria-label="Main" className="sticky top-0 hidden h-dvh flex-col px-4 py-6 lg:flex">
      <p className="px-3 font-display text-[28px] leading-none tracking-[-0.01em]">Bubbles</p>
      <ul className="mt-8 flex flex-col gap-1">
        {ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`press flex min-h-11 items-center gap-3 border-l-2 px-3 ${
                  active
                    ? "border-brand-primary bg-badge-bg text-text-main"
                    : "border-transparent text-text-muted [@media(hover:hover)_and_(pointer:fine)]:hover:text-text-main"
                }`}
              >
                {item.icon}
                <span className="text-[12px] font-semibold uppercase tracking-[0.12em]">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link href="/search" className="btn btn-gold press mt-6">
        Check in
      </Link>
    </nav>
  );
}
