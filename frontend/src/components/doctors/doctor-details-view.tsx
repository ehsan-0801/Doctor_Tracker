"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, CalendarDays, Mail, Phone, Plus, Stethoscope, Users } from "lucide-react";
import { PatientFormDialog } from "@/components/patients/patient-form-dialog";
import { PatientsPanel } from "@/components/patients/patients-panel";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { ApiError } from "@/lib/api/client";
import { doctorsApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { formatDate, formatNumber } from "@/lib/format";
import { DoctorAvatar } from "./doctor-avatar";

function Detail({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate text-sm font-medium">{children}</dd>
      </div>
    </div>
  );
}

export function DoctorDetailsView({ id }: { id: string }) {
  const [addOpen, setAddOpen] = useState(false);
  const canAdd = useSession().can("patients:write");
  const doctor = useQuery({ queryKey: queryKeys.doctors.detail(id), queryFn: () => doctorsApi.get(id) });
  const d = doctor.data;

  const back = <Breadcrumbs items={[{ label: "Doctors", href: "/doctors" }, { label: d?.name ?? "Doctor details" }]} />;

  if (doctor.error) {
    const notFound = doctor.error instanceof ApiError && (doctor.error.status === 404 || doctor.error.status === 400);
    return (
      <div className="space-y-6">
        {back}
        <div className="rounded-xl border bg-card">
          {notFound ? (
            <EmptyState icon={Stethoscope} title="Doctor not found" description="This doctor does not exist or the link is incorrect." />
          ) : (
            <ErrorState message={doctor.error.message} onRetry={() => doctor.refetch()} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {back}

      <section className="rounded-xl border bg-card p-5 sm:p-6" aria-label="Doctor information">
        {!d ? (
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <DoctorAvatar name={d.name} className="size-14 text-base" />
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-semibold">{d.name}</h1>
                  <p className="text-sm text-muted-foreground">{d.specialization}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start rounded-lg bg-accent px-3 py-2 text-accent-foreground sm:self-auto">
                <Users className="size-4" aria-hidden />
                <span className="text-sm font-semibold tabular-nums">{formatNumber(d.patientCount)}</span>
                <span className="text-sm">associated {d.patientCount === 1 ? "patient" : "patients"}</span>
              </div>
            </div>
            <dl className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-2 xl:grid-cols-4">
              <Detail icon={Building2} label="Hospital">{d.hospital}</Detail>
              <Detail icon={Mail} label="Email">
                <a href={`mailto:${d.email}`} className="hover:text-primary hover:underline">{d.email}</a>
              </Detail>
              <Detail icon={Phone} label="Phone">
                <a href={`tel:${d.phone.replace(/[^\d+]/g, "")}`} className="hover:text-primary hover:underline">{d.phone}</a>
              </Detail>
              <Detail icon={CalendarDays} label="Created">{formatDate(d.createdAt)}</Detail>
            </dl>
          </>
        )}
      </section>

      <section id="patients" className="scroll-mt-20 space-y-4" aria-labelledby="patients-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="patients-heading" className="text-lg font-semibold">Patients</h2>
            <p className="text-sm text-muted-foreground">Patients associated with this doctor.</p>
          </div>
          {canAdd && (
            <Button size="lg" className="h-10 px-4" onClick={() => setAddOpen(true)} disabled={!d}>
              <Plus aria-hidden /> Add patient
            </Button>
          )}
        </div>
        {d && <PatientsPanel doctor={d} />}
      </section>

      {d && canAdd && <PatientFormDialog open={addOpen} onOpenChange={setAddOpen} mode={{ kind: "create-for-doctor", doctor: d }} />}
    </div>
  );
}
