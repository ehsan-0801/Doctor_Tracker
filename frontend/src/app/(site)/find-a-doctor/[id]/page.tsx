import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DoctorProfileView } from "@/components/site/doctor-profile-view";
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
  return <DoctorProfileView doctor={doctor} site={site} />;
}

export default function DoctorProfilePage({ params }: PageProps<"/find-a-doctor/[id]">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<Skeleton className="h-72 rounded-3xl" />}>
        <DoctorProfile params={params} />
      </Suspense>
    </div>
  );
}
