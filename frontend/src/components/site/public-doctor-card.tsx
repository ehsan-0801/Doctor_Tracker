"use client";

import Link from "next/link";
import { ArrowRight, Building2, GraduationCap } from "lucide-react";
import { DoctorPhoto } from "./doctor-photo";
import { useLanguage } from "./language-provider";
import type { PublicDoctor } from "@/types/site";

export function PublicDoctorCard({ doctor }: { doctor: PublicDoctor }) {
  const { t } = useLanguage();
  return (
    <Link
      href={`/find-a-doctor/${doctor._id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <DoctorPhoto doctor={doctor} className="aspect-[4/3] w-full" />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div>
          <p className="truncate font-semibold group-hover:text-primary">{doctor.name}</p>
          <p className="truncate text-sm font-medium text-primary">{doctor.specialization}</p>
        </div>
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
        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-medium text-primary">
          {t.doctors.viewProfile} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
