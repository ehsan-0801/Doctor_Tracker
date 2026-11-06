import { Suspense } from "react";
import { AreaMarker } from "@/components/layout/area-marker";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function DashboardLayout({ children }: LayoutProps<"/">) {
  // The background gradient paints the sidebar column for the full page height (the sidebar itself is fixed).
  return (
    <div data-area="admin" className="min-h-screen md:bg-[linear-gradient(to_right,var(--sidebar)_72px,transparent_72px)] lg:bg-[linear-gradient(to_right,var(--sidebar)_250px,transparent_250px)]">
      <AreaMarker area="admin" />
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      {/* Navigation reads the current path, which is only known at request time. */}
      <Suspense
        fallback={<div className="fixed inset-y-0 left-0 hidden w-[72px] bg-sidebar md:block lg:w-[250px]" aria-hidden />}
      >
        <AppSidebar />
      </Suspense>
      <div className="flex min-h-screen flex-col md:pl-[72px] lg:pl-[250px]">
        <Suspense fallback={<div className="sticky top-0 z-20 h-16 border-b bg-card" aria-hidden />}>
          <AppHeader />
        </Suspense>
        <main id="main-content" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
