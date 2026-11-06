"use client";

import { Stethoscope } from "lucide-react";
import { AccessDenied } from "@/components/shared/access-denied";
import { EmptyState } from "@/components/shared/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { DoctorDetailsView } from "./doctor-details-view";

/** Doctor portal home: the signed-in doctor's own profile and patients. */
export function DoctorHomeView() {
  const { user, isLoading } = useSession();
  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (user?.role !== "doctor") return <AccessDenied />;
  if (!user.doctorId) {
    return (
      <div className="rounded-xl border bg-card">
        <EmptyState icon={Stethoscope} title="Your account is not linked to a doctor record" description="Ask an administrator to link your login to your doctor profile." />
      </div>
    );
  }
  return <DoctorDetailsView id={user.doctorId} self />;
}
