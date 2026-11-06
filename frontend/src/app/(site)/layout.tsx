import { Suspense } from "react";
import { LanguageProvider } from "@/components/site/language-provider";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getPublicSite } from "@/lib/server/public-api";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const site = await getPublicSite();
  return (
    <LanguageProvider>
    <div data-area="site" className="flex min-h-screen flex-col">
      <a
        href="#site-main"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      {/* The header highlights the current path, which is only known at request time. */}
      <Suspense fallback={<div className="sticky top-0 z-40 h-16 border-b bg-card" aria-hidden />}>
        <SiteHeader emergencyPhone={site.contact.emergencyPhone} />
      </Suspense>
      <main id="site-main" className="flex-1">
        {children}
      </main>
      <SiteFooter site={site} />
    </div>
    </LanguageProvider>
  );
}
