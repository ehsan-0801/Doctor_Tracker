import type { Metadata } from "next";
import { Suspense } from "react";
import { Brand } from "@/components/layout/brand";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Brand compact />
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Doctor Tracker</h1>
            <p className="text-sm text-muted-foreground">Sign in to the administration portal</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">Authorized administrators only.</p>
      </div>
    </main>
  );
}
