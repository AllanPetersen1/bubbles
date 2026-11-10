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

export default function BottomNav() {
  const pathname = usePathname();
  // Check-in is a task, not a tab: it stays under Search
  const current = pathname.startsWith("/checkin") ? "/search" : pathname;

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40">
      <ul className="mx-auto flex max-w-md border-x border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? current === "/" : current.startsWith(item.href);
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
