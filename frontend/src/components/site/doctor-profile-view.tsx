"use client";

import Link from "next/link";
import { ArrowLeft, Building2, GraduationCap, Phone, Stethoscope } from "lucide-react";
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
    <div className="space-y-6">
      <Link href="/find-a-doctor" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> {t.profile.allDoctors}
      </Link>
      <article className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="overflow-hidden rounded-3xl border bg-card">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
            <DoctorPhoto doctor={doctor} className="size-28 shrink-0 rounded-2xl text-3xl" />
            <div className="space-y-1.5">
              <h1 className="text-3xl font-bold tracking-tight">{doctor.name}</h1>
              <p className="flex items-center gap-2 font-medium text-primary">
                <Stethoscope className="size-[18px]" aria-hidden /> {doctor.specialization}
              </p>
              {doctor.qualifications && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GraduationCap className="size-[18px]" aria-hidden />
                  <span className="sr-only">{t.profile.qualifications}: </span>
                  {doctor.qualifications}
                </p>
              )}
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="size-[18px]" aria-hidden /> {doctor.hospital}
              </p>
            </div>
          </div>
          <p className="mx-6 mb-6 rounded-2xl bg-muted p-5 text-sm leading-relaxed text-muted-foreground sm:mx-8 sm:mb-8">
            {t.profile.bio(doctor.name, doctor.specialization, doctor.hospital, network)}
          </p>
        </section>
        <aside className="h-fit space-y-4 rounded-3xl border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold">{t.profile.see(doctor.name)}</h2>
          <p className="text-sm text-muted-foreground">{t.profile.seeText}</p>
          {site.contact.phone && (
            <Button asChild size="lg" className="h-11 w-full rounded-full">
              <a href={`tel:${site.contact.phone.replace(/[^\d+]/g, "")}`}>
                <Phone aria-hidden /> {t.call} {site.contact.phone}
              </a>
            </Button>
          )}
          {hours && <p className="text-center text-xs text-muted-foreground">{hours}</p>}
        </aside>
      </article>
    </div>
  );
}
