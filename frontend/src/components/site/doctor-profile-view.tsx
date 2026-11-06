"use client";

import Link from "next/link";
import { ArrowLeft, Building2, Clock, GraduationCap, Phone, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { localized } from "@/lib/i18n/dictionaries";
import type { PublicDoctor, PublicSite } from "@/types/site";
import { DoctorPhoto } from "./doctor-photo";
import { useLanguage } from "./language-provider";

export function DoctorProfileView({ doctor, site }: { doctor: PublicDoctor; site: PublicSite }) {
  const { t, lang } = useLanguage();
  const network = localized(lang, site.hospitalName, site.hospitalNameBn);
  const hours = localized(lang, site.contact.hours, site.contact.hoursBn);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Link href="/find-a-doctor" className="group inline-flex items-center gap-2 text-sm font-medium text-teal">
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" aria-hidden />
        {t.profile.allDoctors}
      </Link>
      <article className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="relative lg:col-span-5">
          <div className="absolute -right-4 -bottom-4 h-3/4 w-3/4 bg-coral sm:-right-6 sm:-bottom-6" aria-hidden />
          <DoctorPhoto doctor={doctor} className="relative aspect-[4/5] w-full rounded-md text-6xl" />
        </div>
        <div className="space-y-8 lg:col-span-7 lg:pt-4">
          <header className="space-y-4">
            <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-slate-deep uppercase">
              <span className="h-px w-10 bg-coral-deep" aria-hidden />
              {doctor.specialization}
            </p>
            <h1 className="text-4xl leading-tight font-semibold tracking-tight text-slate-deep sm:text-5xl">{doctor.name}</h1>
          </header>
          <dl className="grid gap-4 border-y border-border py-6 sm:grid-cols-2">
            <div className="flex gap-3">
              <Stethoscope className="mt-0.5 size-5 shrink-0 text-teal" aria-hidden />
              <div>
                <dt className="text-xs text-muted-foreground">{t.directory.speciality}</dt>
                <dd className="font-medium text-slate-deep">{doctor.specialization}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <Building2 className="mt-0.5 size-5 shrink-0 text-teal" aria-hidden />
              <div>
                <dt className="text-xs text-muted-foreground">{network}</dt>
                <dd className="font-medium text-slate-deep">{doctor.hospital}</dd>
              </div>
            </div>
            {doctor.qualifications && (
              <div className="flex gap-3 sm:col-span-2">
                <GraduationCap className="mt-0.5 size-5 shrink-0 text-teal" aria-hidden />
                <div>
                  <dt className="text-xs text-muted-foreground">{t.profile.qualifications}</dt>
                  <dd className="font-medium text-slate-deep">{doctor.qualifications}</dd>
                </div>
              </div>
            )}
          </dl>
          <p className="max-w-2xl leading-relaxed text-muted-foreground">
            {t.profile.bio(doctor.name, doctor.specialization, doctor.hospital, network)}
          </p>
          <aside className="space-y-4 rounded-md bg-ice p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-deep">{t.profile.see(doctor.name)}</h2>
            <p className="text-sm text-slate-deep/80">{t.profile.seeText}</p>
            <div className="flex flex-wrap items-center gap-4">
              {site.contact.phone && (
                <Button asChild size="lg" className="h-11 rounded-md px-5 font-semibold">
                  <a href={`tel:${site.contact.phone.replace(/[^\d+]/g, "")}`}>
                    <Phone aria-hidden /> {t.call} {site.contact.phone}
                  </a>
                </Button>
              )}
              {hours && (
                <p className="flex items-center gap-2 text-sm text-slate-deep/80">
                  <Clock className="size-4" aria-hidden /> {hours}
                </p>
              )}
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
}
