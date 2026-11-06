"use client";

import { useMutation } from "@tanstack/react-query";
import { CalendarDays, Clock, KeyRound, Loader2, RefreshCw, ShieldCheck, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fieldAria, FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { publicApi } from "@/lib/api/endpoints";
import type { Lang } from "@/lib/i18n/dictionaries";
import type { PatientStatus } from "@/types/site";
import { DoctorPhoto } from "./doctor-photo";
import { useLanguage } from "./language-provider";

type Values = { name: string; token: string };

const formatDay = (lang: Lang, iso: string) =>
  new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-US", { dateStyle: "medium" }).format(new Date(iso));

/** Public page: a patient enters their name and front-desk token to see their current condition. */
export function PatientStatusView() {
  const { t, lang } = useLanguage();
  const s = t.patientStatus;
  const [values, setValues] = useState<Values>({ name: "", token: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const resultRef = useRef<HTMLHeadingElement>(null);

  // Kept outside the mutation so a refresh does not blank the result while it loads.
  const [status, setStatus] = useState<PatientStatus | null>(null);
  const check = useMutation({
    mutationFn: (input: Values) => publicApi.patientStatus(input),
    onSuccess: setStatus,
    onError: () => setStatus(null),
  });

  // Move focus to the result so screen-reader and keyboard users land on it.
  useEffect(() => {
    if (status) resultRef.current?.focus();
  }, [status]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (values.name.trim().length < 2) next.name = s.nameRequired;
    if (values.token.replace(/[^a-z0-9]/gi, "").length < 8) next.token = s.tokenRequired;
    setErrors(next);
    if (Object.keys(next).length === 0) check.mutate({ name: values.name.trim(), token: values.token.trim() });
  };

  const reset = () => {
    // The token is private: clear it from the page when done.
    setValues({ name: "", token: "" });
    setStatus(null);
    check.reset();
  };

  const errorMessage = check.error
    ? check.error instanceof ApiError && check.error.status === 404
      ? s.notFound
      : check.error instanceof ApiError && check.error.status === 429
        ? s.tooMany
        : s.failed
    : null;

  return (
    <>
      <header className="bg-peach">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-14 sm:px-6 md:py-20">
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-slate-deep uppercase">
            <span className="h-px w-10 bg-coral-deep" aria-hidden />
            {s.eyebrow}
          </p>
          <h1 className="text-4xl leading-tight font-semibold tracking-tight text-slate-deep sm:text-5xl">{s.title}</h1>
          <p className="max-w-xl leading-relaxed text-slate-deep/80">{s.description}</p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <div className="-mt-10 rounded-md border bg-white p-5 shadow-[0_20px_40px_-28px_rgba(37,60,72,0.35)] sm:p-8">
          {status ? (
            <StatusResult status={status} lang={lang} headingRef={resultRef} onRefresh={() => check.mutate(check.variables!)} refreshing={check.isPending} onReset={reset} />
          ) : (
            <form onSubmit={submit} noValidate className="space-y-5" aria-describedby="status-privacy">
              <FormField id="status-name" label={s.nameLabel} error={errors.name}>
                <Input
                  {...fieldAria("status-name", errors.name)}
                  className="h-11"
                  autoComplete="name"
                  placeholder={s.namePlaceholder}
                  value={values.name}
                  onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                />
              </FormField>
              <FormField id="status-token" label={s.tokenLabel} error={errors.token} hint={s.tokenHint}>
                <Input
                  {...fieldAria("status-token", errors.token)}
                  aria-describedby={errors.token ? "status-token-error" : "status-token-hint"}
                  className="h-11 font-mono tracking-[0.12em] uppercase"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={40}
                  placeholder="XXXX-XXXX-XXXX"
                  value={values.token}
                  onChange={(e) => setValues((v) => ({ ...v, token: e.target.value }))}
                />
              </FormField>

              {errorMessage && (
                <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                  {errorMessage}
                </p>
              )}

              <Button type="submit" size="lg" className="h-11 w-full rounded-md bg-slate-deep text-white hover:bg-slate-deep/90 sm:w-auto sm:px-6" disabled={check.isPending}>
                {check.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <KeyRound aria-hidden />}
                {check.isPending ? s.checking : s.submit}
              </Button>

              <p id="status-privacy" className="flex items-start gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
                {s.privacy}
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

function StatusResult({
  status,
  lang,
  headingRef,
  onRefresh,
  refreshing,
  onReset,
}: {
  status: PatientStatus;
  lang: Lang;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onRefresh: () => void;
  refreshing: boolean;
  onReset: () => void;
}) {
  const { t } = useLanguage();
  const s = t.patientStatus;
  return (
    <section aria-labelledby="status-result-heading" className="space-y-6">
      <h2 id="status-result-heading" ref={headingRef} tabIndex={-1} className="text-xl font-semibold text-slate-deep outline-none">
        {s.resultFor(status.name)}
      </h2>

      <div className="rounded-md bg-ice/60 p-5">
        <p className="text-xs font-semibold tracking-[0.14em] text-slate-deep/70 uppercase">{s.condition}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-deep">{status.condition}</p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-slate-deep/70 uppercase">{s.doctor}</p>
        {status.doctor ? (
          <div className="flex items-center gap-4 rounded-md border p-3">
            <DoctorPhoto doctor={status.doctor} className="size-16 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-deep">{status.doctor.name}</p>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Stethoscope className="size-3.5" aria-hidden />
                {status.doctor.specialization} · {status.doctor.hospital}
              </p>
              <Link href={`/find-a-doctor/${status.doctor._id}`} className="mt-1 inline-block text-sm font-medium text-link hover:underline">
                {s.viewProfile}
              </Link>
            </div>
          </div>
        ) : (
          <p className="rounded-md border p-3 text-sm text-muted-foreground">{s.noDoctor}</p>
        )}
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
          <dt className="text-muted-foreground">{s.registered}:</dt>
          <dd className="font-medium">{formatDay(lang, status.registeredAt)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" aria-hidden />
          <dt className="text-muted-foreground">{s.updated}:</dt>
          <dd className="font-medium">{formatDay(lang, status.updatedAt)}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2 border-t pt-5 sm:flex-row">
        <Button variant="outline" size="lg" className="h-11 rounded-md" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={refreshing ? "animate-spin" : undefined} aria-hidden />
          {s.refresh}
        </Button>
        <Button variant="ghost" size="lg" className="h-11 rounded-md" onClick={onReset}>
          {s.checkAnother}
        </Button>
      </div>
    </section>
  );
}
