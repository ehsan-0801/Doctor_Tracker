import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Anek_Bangla, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// Inter for English; Anek Bangla covers Bangla text (and is the fallback for Bengali glyphs in mixed text).
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const anekBangla = Anek_Bangla({ variable: "--font-bangla", subsets: ["bengali", "latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "DocTrack", template: "%s · DocTrack" },
  description: "DocTrack connects patients with the right specialists and keeps hospital care teams in sync.",
};

// Before first paint: mark the visible area from the URL (portal vs public) and
// apply the saved portal theme. AreaMarker keeps data-area in sync afterwards.
const PORTAL_PATHS = /^\/(dashboard|doctors|patients|users|settings|doctor|tracking|messages|locations)(\/|$)/;
const THEME_SCRIPT = `try{var d=document.documentElement;d.dataset.area=${PORTAL_PATHS}.test(location.pathname)?"admin":"site";if(localStorage.getItem("doctrack-theme")==="dark")d.dataset.theme="dark"}catch(e){}`;

export const viewport: Viewport = { themeColor: "#253c48" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${anekBangla.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        {/* Apply the saved portal theme before hydration (no light flash). */}
        <Script id="doctrack-theme-init" strategy="beforeInteractive">
          {THEME_SCRIPT}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
