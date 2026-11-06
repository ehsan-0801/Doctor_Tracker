import type { Metadata } from "next";
import { PatientStatusView } from "@/components/site/patient-status-view";

export const metadata: Metadata = {
  title: "Check your status",
  description: "Patients can see their current condition and doctor using the access token from the front desk.",
  robots: { index: false },
};

export default function CheckStatusPage() {
  return <PatientStatusView />;
}
