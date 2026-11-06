import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Brand } from "@/components/layout/brand";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main data-area="admin" className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Link href="/" aria-label="DocTrack home"><Brand compact /></Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">DocTrack</h1>
            <p className="text-sm text-muted-foreground">Sign in to the hospital portal</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">For hospital administrators, management, front-desk staff and doctors.</p>
        <p className="mt-3 text-center text-sm">
          <Link href="/" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
            <ArrowLeft className="size-4" aria-hidden /> Back to website
          </Link>
        </p>
      </div>
    </main>
  );
}
