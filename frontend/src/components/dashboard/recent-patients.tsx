"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { patientsApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { formatDate } from "@/lib/format";

const PARAMS = { page: 1, limit: 6, sortBy: "createdAt", sortOrder: "desc" } as const;

export function RecentPatients() {
  // Shares the dashboard key family so patient mutations refresh it.
  const recent = useQuery({
    queryKey: [...queryKeys.dashboard.all, "recent-patients"],
    queryFn: () => patientsApi.list(PARAMS),
  });

  return (
    <section className="flex min-w-0 flex-col rounded-xl border bg-card" aria-labelledby="recent-patients-title">
      <header className="flex items-start justify-between gap-3 border-b px-5 py-4">
        <div className="space-y-0.5">
          <h2 id="recent-patients-title" className="text-base font-semibold">
            Recently added patients
          </h2>
          <p className="text-xs text-muted-foreground">Latest patient registrations</p>
        </div>
        <Link href="/patients" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
          View all <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </header>
      {recent.isLoading ? (
        <ul className="divide-y">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="space-y-2 px-5 py-3.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </li>
          ))}
        </ul>
      ) : recent.error ? (
        <ErrorState message={recent.error.message} onRetry={() => recent.refetch()} />
      ) : !recent.data?.data.length ? (
        <EmptyState icon={Users} title="No patients yet" description="New patient records will appear here." />
      ) : (
        <ul className="divide-y">
          {recent.data.data.map((patient) => (
            <li key={patient._id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-medium">{patient.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {patient.doctor ? patient.doctor.name : "Unassigned"} · {formatDate(patient.createdAt)}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 font-normal">
                {patient.condition}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
