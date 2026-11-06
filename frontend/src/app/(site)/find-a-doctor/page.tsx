import type { Metadata } from "next";
import { Suspense } from "react";
import { DirectoryHeader } from "@/components/site/directory-header";
import { DoctorDirectory } from "@/components/site/doctor-directory";
import { getPublicSite } from "@/lib/server/public-api";

export const metadata: Metadata = {
  title: "Find a doctor",
  description: "Search our specialists by name, speciality and hospital.",
};

export default async function FindADoctorPage() {
  const site = await getPublicSite();
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <DirectoryHeader hospitalName={site.hospitalName} hospitalNameBn={site.hospitalNameBn} />
      <Suspense>
        <DoctorDirectory specializations={site.specializations} />
      </Suspense>
    </div>
  );
}
