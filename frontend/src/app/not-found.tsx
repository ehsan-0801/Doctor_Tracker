import Link from "next/link";
import { ArrowLeft, LayoutDashboard, LogIn } from "lucide-react";
import { AreaMarker } from "@/components/layout/area-marker";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 text-center">
      <AreaMarker area="site" />
      <Brand />
      <div className="space-y-2">
        <p className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">Error 404</p>
        <h1 className="text-3xl font-semibold tracking-tight">This page could not be found</h1>
        <p className="text-muted-foreground">The link may be outdated, or the page may have moved.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild size="lg" className="h-11 rounded-md px-5 font-semibold">
          <Link href="/">
            <ArrowLeft aria-hidden /> Back to website
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-11 rounded-md px-5">
          <Link href="/dashboard">
            <LayoutDashboard aria-hidden /> Go to portal
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-11 rounded-md px-5">
          <Link href="/login">
            <LogIn aria-hidden /> Sign in
          </Link>
        </Button>
      </div>
    </main>
  );
}
