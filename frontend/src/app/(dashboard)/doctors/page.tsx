import type { Metadata } from "next";
import { Suspense } from "react";
import { DoctorsView } from "@/components/doctors/doctors-view";

export const metadata: Metadata = { title: "Doctors" };

export default function DoctorsPage() {
  return (
    <Suspense>
      <DoctorsView />
    </Suspense>
  );
}
