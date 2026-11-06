"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, GraduationCap } from "lucide-react";
import type { PublicDoctor } from "@/types/site";
import { DoctorPhoto } from "./doctor-photo";
import { useLanguage } from "./language-provider";

export function PublicDoctorCard({ doctor }: { doctor: PublicDoctor }) {
  const { t } = useLanguage();
  return (
    <Link href={`/find-a-doctor/${doctor._id}`} className="group block rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:outline-none">
      <div className="relative overflow-hidden rounded-md">
        <DoctorPhoto
          doctor={doctor}
          className="aspect-[4/5] w-full transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
        />
        <span className="absolute right-3 bottom-3 flex size-10 translate-y-1 items-center justify-center rounded-md bg-white text-slate-deep opacity-0 shadow transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
          <ArrowUpRight className="size-5" aria-hidden />
        </span>
      </div>
      <div className="space-y-1.5 pt-4">
        <p className="truncate text-[11px] font-semibold tracking-[0.12em] text-teal uppercase sm:text-xs">{doctor.specialization}</p>
        <p className="text-base font-semibold text-slate-deep sm:text-lg">{doctor.name}</p>
        {doctor.qualifications && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{doctor.qualifications}</span>
          </p>
        )}
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{doctor.hospital}</span>
        </p>
        <span className="sr-only">{t.doctors.viewProfile}</span>
      </div>
    </Link>
  );
}
