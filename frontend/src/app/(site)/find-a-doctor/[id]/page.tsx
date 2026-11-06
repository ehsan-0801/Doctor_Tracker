import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Building2, Phone, Stethoscope } from "lucide-react";
import { DoctorAvatar } from "@/components/doctors/doctor-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicDoctor, getPublicSite } from "@/lib/server/public-api";

export async function generateMetadata({ params }: PageProps<"/find-a-doctor/[id]">): Promise<Metadata> {
  const doctor = await getPublicDoctor((await params).id);
  return doctor
    ? { title: `${doctor.name} · ${doctor.specialization}`, description: `${doctor.name}, ${doctor.specialization} at ${doctor.hospital}.` }
    : { title: "Doctor not found" };
}

async function DoctorProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doctor, site] = await Promise.all([getPublicDoctor(id), getPublicSite()]);
  if (!doctor) notFound();

  return (
    <article className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="rounded-3xl border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <DoctorAvatar name={doctor.name} className="size-20 text-xl" />
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{doctor.name}</h1>
            <p className="flex items-center gap-2 text-primary">
              <Stethoscope className="size-4" aria-hidden /> {doctor.specialization}
            </p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="size-4" aria-hidden /> {doctor.hospital}
            </p>
          </div>
        </div>
        <div className="mt-8 rounded-2xl bg-muted p-5 text-sm leading-relaxed text-muted-foreground">
          {doctor.name} is part of the {doctor.specialization.toLowerCase()} team at {doctor.hospital}, within the {site.hospitalName} care
          network. Patients are registered with a doctor by our front desk, and each visit and condition update is recorded in their
          care record.
        </div>
      </section>
      <aside className="space-y-4 rounded-3xl border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-semibold">See {doctor.name.replace(/^Dr\.?\s*/i, "Dr. ")}</h2>
        <p className="text-sm text-muted-foreground">Call the front desk to register as a patient or to be referred to this doctor.</p>
        {site.contact.phone && (
          <Button asChild size="lg" className="h-11 w-full">
            <a href={`tel:${site.contact.phone.replace(/[^\d+]/g, "")}`}>
              <Phone aria-hidden /> Call {site.contact.phone}
            </a>
          </Button>
        )}
        {site.contact.hours && <p className="text-center text-xs text-muted-foreground">{site.contact.hours}</p>}
      </aside>
    </article>
  );
}

export default function DoctorProfilePage({ params }: PageProps<"/find-a-doctor/[id]">) {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/find-a-doctor" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All doctors
      </Link>
      <Suspense fallback={<Skeleton className="h-72 rounded-3xl" />}>
        <DoctorProfile params={params} />
      </Suspense>
    </div>
  );
}
