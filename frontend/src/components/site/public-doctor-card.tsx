import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { DoctorAvatar } from "@/components/doctors/doctor-avatar";
import type { PublicDoctor } from "@/types/site";

export function PublicDoctorCard({ doctor }: { doctor: PublicDoctor }) {
  return (
    <Link
      href={`/find-a-doctor/${doctor._id}`}
      className="group flex h-full flex-col gap-4 rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="flex items-center gap-3">
        <DoctorAvatar name={doctor.name} className="size-12 text-sm" />
        <div className="min-w-0">
          <p className="truncate font-semibold group-hover:text-primary">{doctor.name}</p>
          <p className="truncate text-sm text-primary">{doctor.specialization}</p>
        </div>
      </div>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{doctor.hospital}</span>
      </p>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
        View profile <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}
