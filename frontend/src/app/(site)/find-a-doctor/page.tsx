import type { Metadata } from "next";
import { Suspense } from "react";
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
      <header className="max-w-2xl space-y-2">
        <p className="text-sm font-semibold text-primary">{site.hospitalName}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Find a doctor</h1>
        <p className="text-muted-foreground">Browse our specialists by speciality and hospital. Contact the front desk to be registered with a doctor.</p>
      </header>
      <Suspense>
        <DoctorDirectory specializations={site.specializations} />
      </Suspense>
    </div>
  );
}
