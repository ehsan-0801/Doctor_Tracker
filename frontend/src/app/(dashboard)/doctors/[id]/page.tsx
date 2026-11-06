import type { Metadata } from "next";
import { Suspense } from "react";
import { DoctorDetailsView } from "@/components/doctors/doctor-details-view";

export const metadata: Metadata = { title: "Doctor details" };

async function DoctorDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DoctorDetailsView id={id} />;
}

export default function DoctorDetailsPage({ params }: PageProps<"/doctors/[id]">) {
  return (
    <Suspense>
      <DoctorDetails params={params} />
    </Suspense>
  );
}
