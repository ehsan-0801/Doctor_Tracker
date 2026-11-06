import type { Metadata } from "next";
import { Suspense } from "react";
import { DoctorHomeView } from "@/components/doctors/doctor-home-view";

export const metadata: Metadata = { title: "My patients" };

export default function DoctorHomePage() {
  return (
    <Suspense>
      <DoctorHomeView />
    </Suspense>
  );
}
