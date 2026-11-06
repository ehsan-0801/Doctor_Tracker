import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = { themeColor: "#253c48" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${anekBangla.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
