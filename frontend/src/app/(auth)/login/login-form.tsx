"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { fieldAria, FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { authApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { homeFor } from "@/lib/permissions";
import { loginSchema, type LoginFormValues } from "@/lib/validations";

/** Only allow same-site relative redirects. */
function safeRedirect(from: string | null) {
  return from && from.startsWith("/") && !from.startsWith("//") && !from.startsWith("/login") ? from : null;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(
    searchParams.get("expired") ? "Your session has ended. Please sign in again." : null,
  );
  const requested = safeRedirect(searchParams.get("from"));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  // Already signed in: skip the form.
  useEffect(() => {
    authApi
      .session()
      .then(({ user }) => router.replace(requested ?? homeFor(user.role)))
      .catch(() => undefined);
  }, [requested, router]);

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    try {
      const { user } = await authApi.login(email, password);
      queryClient.setQueryData(queryKeys.session, { user });
      router.replace(requested ?? homeFor(user.role));
    } catch (error) {
      setFormError(
        error instanceof ApiError && (error.status === 401 || error.status === 429)
          ? error.message
          : "Unable to sign in right now. Please try again.",
      );
    }
  });

  // method="post" keeps credentials out of the URL even if JavaScript has not loaded yet.
  return (
    <form method="post" onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          {formError}
        </div>
      )}

      <FormField id="email" label="Email" error={errors.email?.message}>
        <Input
          {...fieldAria("email", errors.email?.message)}
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          className="h-11"
          {...register("email")}
        />
      </FormField>

      <FormField id="password" label="Password" error={errors.password?.message}>
        <div className="relative">
          <Input
            {...fieldAria("password", errors.password?.message)}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            className="h-11 pr-11"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </FormField>

      <Button type="submit" className="h-11 w-full rounded-md text-sm font-semibold" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
