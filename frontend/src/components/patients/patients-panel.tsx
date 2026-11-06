"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MoreHorizontal, Pencil, Trash2, UserMinus, Users } from "lucide-react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { FilterBar } from "@/components/shared/filter-bar";
import { FilterSelect } from "@/components/shared/filter-select";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { SortSelect } from "@/components/shared/sort-select";
import { EmptyState } from "@/components/shared/states";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/use-session";
import { filterState, readSort, useUrlFilters } from "@/hooks/use-url-filters";
import { doctorsApi, patientsApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { formatDate } from "@/lib/format";
import type { DoctorSummary, Patient, PatientListParams } from "@/types/api";
import { DoctorCombobox, type DoctorChoice } from "./doctor-combobox";
import { PatientFormDialog } from "./patient-form-dialog";
import { usePatientMutations } from "./use-patient-mutations";

const PAGE_SIZE = 10;
const FILTER_KEYS = ["search", "condition", "doctorId", "startDate", "endDate"] as const;
// doctorName only labels the selected doctor in the picker.
const URL_KEYS = [...FILTER_KEYS, "doctorName", "sortBy", "sortOrder"] as const;
const ALL_DOCTORS: DoctorChoice = { _id: "", name: "All doctors" };
const UNASSIGNED: DoctorChoice = { _id: "unassigned", name: "Unassigned" };

type Pending =
  | { kind: "edit"; patient: Patient }
  | { kind: "delete"; patient: Patient }
  | { kind: "unassign"; patient: Patient }
  | null;

/**
 * Searchable, filterable, paginated patient list. Used globally (/patients) and
 * scoped to one doctor (doctor details), where "Remove from doctor" is offered.
 */
export function PatientsPanel({ doctor }: { doctor?: DoctorSummary }) {
  const { values, page, setFilters } = useUrlFilters(URL_KEYS);
  const [pending, setPending] = useState<Pending>(null);
  const { remove, unassign } = usePatientMutations();
  const session = useSession();
  const canEdit = session.can("patients:write");
  const canAssign = session.can("patients:assign");
  const canDelete = session.can("patients:delete");
  const hasActions = canEdit || (!!doctor && canAssign) || canDelete;

  const sort = readSort(values.sortBy, values.sortOrder);
  const params: PatientListParams = {
    ...sort,
    page,
    limit: PAGE_SIZE,
    search: values.search,
    condition: values.condition,
    doctorId: doctor ? undefined : values.doctorId,
    startDate: values.startDate,
    endDate: values.endDate,
  };

  const patients = useQuery({
    queryKey: doctor ? queryKeys.doctors.patients(doctor._id, params) : queryKeys.patients.list(params),
    queryFn: () => (doctor ? doctorsApi.patients(doctor._id, params) : patientsApi.list(params)),
    placeholderData: keepPreviousData,
  });
  const conditions = useQuery({ queryKey: queryKeys.patients.conditions, queryFn: patientsApi.conditions, staleTime: 5 * 60_000 });

  // A page beyond the last one (e.g. after deleting the final row) falls back.
  const totalPages = patients.data?.pagination.totalPages ?? 0;
  useEffect(() => {
    if (totalPages > 0 && page > totalPages && !patients.isFetching) setFilters({ page: totalPages });
  }, [page, totalPages, patients.isFetching, setFilters]);

  const selectedDoctor: DoctorChoice | null =
    values.doctorId === "unassigned" ? UNASSIGNED : values.doctorId ? { _id: values.doctorId, name: values.doctorName ?? "Selected doctor" } : null;
  const { hasFilters, panelCount, clear: clearFilters } = filterState(values, FILTER_KEYS, setFilters, ["doctorName"]);

  const actions = (patient: Patient) =>
    hasActions && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-lg" aria-label={`Actions for ${patient.name}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {canEdit && (
          <DropdownMenuItem onSelect={() => setPending({ kind: "edit", patient })}>
            <Pencil aria-hidden /> Edit patient
          </DropdownMenuItem>
        )}
        {doctor && canAssign && (
          <DropdownMenuItem onSelect={() => setPending({ kind: "unassign", patient })}>
            <UserMinus aria-hidden /> Remove from doctor
          </DropdownMenuItem>
        )}
        {canDelete && (
          <>
            {(canEdit || (doctor && canAssign)) && <DropdownMenuSeparator />}
            <DropdownMenuItem variant="destructive" onSelect={() => setPending({ kind: "delete", patient })}>
              <Trash2 aria-hidden /> Delete patient
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
    );

  const doctorCell = (p: Patient) =>
    p.doctor ? (
      <Link href={`/doctors/${p.doctor._id}`} className="font-medium hover:text-primary hover:underline">
        {p.doctor.name}
      </Link>
    ) : (
      <Badge variant="outline" className="text-muted-foreground">
        Unassigned
      </Badge>
    );

  const columns: Column<Patient>[] = [
    { id: "name", header: "Patient", sortKey: "name", cell: (p) => <span className="font-medium text-foreground">{p.name}</span> },
    { id: "condition", header: "Condition", cell: (p) => <Badge variant="secondary" className="font-normal">{p.condition}</Badge> },
    ...(doctor ? [] : [{ id: "doctor", header: "Doctor", cell: doctorCell }]),
    { id: "registered", header: "Registered", sortKey: "createdAt", cell: (p) => <span className="text-muted-foreground">{formatDate(p.createdAt)}</span> },
    ...(hasActions
      ? [{ id: "actions", header: <span className="sr-only">Actions</span>, cell: actions, className: "w-14 text-right", headerClassName: "w-14" }]
      : []),
  ];

  return (
    <>
      <section className="overflow-hidden rounded-xl border bg-card" aria-label={doctor ? "Associated patients" : "Patients"}>
        <FilterBar
          search={
            <SearchInput
              label="Search patients by name"
              placeholder="Search patients by name…"
              value={values.search}
              onSearch={(search) => setFilters({ search })}
            />
          }
          activeCount={panelCount}
          canClear={hasFilters}
          onClear={clearFilters}
        >
          <FilterSelect
            id="filter-condition"
            label="Condition"
            allLabel="All conditions"
            value={values.condition}
            onChange={(condition) => setFilters({ condition })}
            options={(conditions.data ?? []).map((c) => ({ value: c, label: c }))}
          />
          {doctor ? (
            <div className="hidden md:block" />
          ) : (
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="filter-doctor" className="text-xs font-medium text-muted-foreground">
                Doctor
              </Label>
              <DoctorCombobox
                id="filter-doctor"
                value={selectedDoctor ?? ALL_DOCTORS}
                placeholder="All doctors"
                extraOptions={[ALL_DOCTORS, UNASSIGNED]}
                onChange={(choice) => setFilters({ doctorId: choice?._id || undefined, doctorName: choice?._id && choice._id !== "unassigned" ? choice.name : undefined })}
              />
            </div>
          )}
          <DateRangeFilter
            id="filter-registered"
            label="Registration date"
            startDate={values.startDate}
            endDate={values.endDate}
            onChange={(range) => setFilters(range)}
          />
          <SortSelect
            id="sort-patients"
            sort={sort}
            onChange={(next) => setFilters({ sortBy: next.sortBy, sortOrder: next.sortOrder, page: 1 })}
          />
        </FilterBar>

        <DataTable
          caption={doctor ? `Patients of ${doctor.name}` : "All patients"}
          columns={columns}
          rows={patients.data?.data}
          getRowId={(p) => p._id}
          isLoading={patients.isLoading}
          isFetching={patients.isFetching}
          error={patients.error}
          onRetry={() => patients.refetch()}
          sort={sort}
          onSortChange={(next) => setFilters({ sortBy: next.sortBy, sortOrder: next.sortOrder, page: 1 })}
          renderMobileCard={(p) => (
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="truncate font-medium">{p.name}</p>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="secondary" className="font-normal">{p.condition}</Badge>
                  {!doctor && doctorCell(p)}
                </div>
                <p className="text-xs text-muted-foreground">Registered {formatDate(p.createdAt)}</p>
              </div>
              {actions(p)}
            </div>
          )}
          empty={
            <EmptyState
              icon={Users}
              title={hasFilters ? "No patients match your filters" : doctor ? "No patients yet" : "No patients found"}
              description={
                hasFilters
                  ? "Try a different search or clear the filters."
                  : doctor
                    ? "Add a patient to associate them with this doctor."
                    : "Patients added under a doctor will appear here."
              }
              action={
                hasFilters ? (
                  <Button variant="outline" size="lg" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          }
        />
        <Pagination pagination={patients.data?.pagination} onPageChange={(next) => setFilters({ page: next })} noun="patients" />
      </section>

      {pending?.kind === "edit" && (
        <PatientFormDialog open onOpenChange={(open) => !open && setPending(null)} mode={{ kind: "edit", patient: pending.patient }} />
      )}

      <ConfirmDialog
        open={pending?.kind === "delete"}
        onOpenChange={(open) => !open && setPending(null)}
        title="Delete patient?"
        description={
          <>
            This permanently deletes <strong className="text-foreground">{pending?.patient.name}</strong>&apos;s record. This
            cannot be undone.
          </>
        }
        confirmLabel="Delete patient"
        pendingLabel="Deleting…"
        pending={remove.isPending}
        onConfirm={() => pending && remove.mutate(pending.patient._id, { onSuccess: () => setPending(null) })}
      />

      {doctor && (
        <ConfirmDialog
          open={pending?.kind === "unassign"}
          onOpenChange={(open) => !open && setPending(null)}
          title="Remove patient from this doctor?"
          description={
            <>
              <strong className="text-foreground">{pending?.patient.name}</strong> will be removed from {doctor.name}&apos;s
              list. The patient record is kept and can be reassigned from the Patients page.
            </>
          }
          confirmLabel="Remove from doctor"
          pendingLabel="Removing…"
          destructive={false}
          pending={unassign.isPending}
          onConfirm={() =>
            pending &&
            unassign.mutate({ doctorId: doctor._id, patientId: pending.patient._id }, { onSuccess: () => setPending(null) })
          }
        />
      )}
    </>
  );
}
