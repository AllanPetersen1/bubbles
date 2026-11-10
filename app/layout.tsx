import type { Metadata, Viewport } from "next";
import BottomNav from "@/components/BottomNav";
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
        <div className="mx-auto min-h-dvh max-w-md border-x border-border bg-background pb-[calc(var(--nav-height)+env(safe-area-inset-bottom))]">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
