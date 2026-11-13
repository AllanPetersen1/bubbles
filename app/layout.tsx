import type { Metadata, Viewport } from "next";
import BottomNav, { SideNav } from "@/components/BottomNav";
import PopularRail from "@/components/PopularRail";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Bubbles", template: "%s · Bubbles" },
  description: "Log and share every glass of Champagne and sparkling wine.",
  applicationName: "Bubbles",
  appleWebApp: { capable: true, title: "Bubbles", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FAF8F5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/*
          Phone: one column, max-w-md, tabs at the bottom.
          lg: sidebar + feed column. xl: sidebar + feed column + right rail.
        */}
        <div className="mx-auto min-h-dvh w-full max-w-md border-x border-border bg-background pb-[calc(var(--nav-height)+env(safe-area-inset-bottom))] lg:grid lg:max-w-[860px] lg:grid-cols-[220px_minmax(0,1fr)] lg:border-x-0 lg:bg-transparent lg:pb-0 xl:max-w-[1240px] xl:grid-cols-[240px_minmax(0,640px)_minmax(0,1fr)]">
          <SideNav />
          <main className="min-w-0 bg-background lg:border-x lg:border-border">{children}</main>
          <aside className="sticky top-0 hidden h-dvh overflow-y-auto px-3 py-6 xl:block">
            <PopularRail />
          </aside>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
