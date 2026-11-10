export default function PageHeader({
  title,
  eyebrow,
  right,
}: {
  title: string;
  eyebrow?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-border bg-background/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="py-2">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="font-display text-[26px] leading-none tracking-[-0.01em]">{title}</h1>
      </div>
      {right}
    </header>
  );
}

/** Shown when the screen is running on mock data. */
export function DemoNote() {
  return (
    <p className="mx-4 mt-4 border-l-2 border-brand-primary bg-badge-bg px-3 py-2 text-xs leading-snug text-text-muted">
      Demo data. Add your Supabase keys in <code>.env.local</code> to go live.
    </p>
  );
}
