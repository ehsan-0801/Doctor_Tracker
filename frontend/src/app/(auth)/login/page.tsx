import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck, Stethoscope, Users } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AreaMarker } from "@/components/layout/area-marker";
import { Brand } from "@/components/layout/brand";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const POINTS = [
  { icon: Stethoscope, text: "Doctors see and update their own patients" },
  { icon: Users, text: "Front desk registers patients and assigns care" },
  { icon: ShieldCheck, text: "Role-based access with server-side sessions" },
];

/** Staff & doctor sign-in, styled with the public Coral & Slate brand. */
export default function LoginPage() {
  return (
    <main data-area="site" className="grid min-h-screen bg-cloud lg:grid-cols-[1.05fr_1fr]">
      <AreaMarker area="site" />
      {/* Brand panel (desktop) */}
      <section aria-hidden className="relative hidden overflow-hidden bg-slate-deep text-ice lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <Link href="/" className="w-fit rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" tabIndex={-1}>
          <Brand inverted />
        </Link>

        <div className="relative space-y-6">
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-coral uppercase">
            <span className="h-px w-10 bg-coral" />
            Hospital portal
          </p>
          <h2 className="max-w-md text-5xl leading-[1.05] font-semibold tracking-tight text-white">
            Care teams,{" "}
            <span className="relative inline-block">
              <span className="relative z-10">in sync.</span>
              <span className="absolute inset-x-0 bottom-[0.08em] h-[0.3em] bg-coral-deep/60" />
            </span>
          </h2>
          <ul className="space-y-3 text-sm">
            {POINTS.map((point) => (
              <li key={point.text} className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-md bg-white/10 text-coral">
                  <point.icon className="size-4" />
                </span>
                {point.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-10 max-w-md">
          <div className="absolute -top-4 -right-4 h-full w-full bg-coral" />
          {/* eslint-disable-next-line @next/next/no-img-element -- static, already optimized poster */}
          <img src="/media/hero-care-team.webp" alt="" className="relative aspect-[16/10] w-full rounded-md object-cover" />
        </div>
      </section>

      {/* Form */}
      <section className="flex flex-col px-4 py-8 sm:px-8 lg:px-12 xl:px-20">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="DocTrack home" className="rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:invisible">
            <Brand />
          </Link>
          <Link href="/" className="group inline-flex items-center gap-1.5 text-sm font-medium text-teal">
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" aria-hidden />
            Back to website
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">
          <div className="mb-8 space-y-3">
            <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-slate-deep uppercase">
              <span className="h-px w-8 bg-coral-deep" aria-hidden />
              Staff &amp; doctors
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-deep sm:text-4xl">Sign in to DocTrack</h1>
            <p className="text-muted-foreground">Use the email and password provided by your hospital administrator.</p>
          </div>
          <div className="rounded-md border bg-white p-6 shadow-[0_24px_48px_-32px_rgba(37,60,72,0.35)] sm:p-8">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            For hospital administrators, management, front-desk staff and doctors.
          </p>
        </div>
      </section>
    </main>
  );
}
