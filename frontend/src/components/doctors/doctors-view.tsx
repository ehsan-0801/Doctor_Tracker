"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, MoreHorizontal, Plus, Stethoscope, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { FilterBar } from "@/components/shared/filter-bar";
import { FilterSelect } from "@/components/shared/filter-select";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { SortSelect } from "@/components/shared/sort-select";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/hooks/use-session";
import { filterState, readSort, useUrlFilters } from "@/hooks/use-url-filters";
import { doctorsApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { formatDate, formatNumber } from "@/lib/format";
import type { Doctor, DoctorListParams } from "@/types/api";
import { DoctorAvatar } from "./doctor-avatar";
import { DoctorFormDialog } from "./doctor-form-dialog";

const PAGE_SIZE = 10;
const FILTER_KEYS = ["search", "specialization", "hospital", "startDate", "endDate"] as const;
const URL_KEYS = [...FILTER_KEYS, "sortBy", "sortOrder"] as const;

export function DoctorsView() {
  const router = useRouter();
  const { values, page, setFilters } = useUrlFilters(URL_KEYS);
  const [createOpen, setCreateOpen] = useState(false);
  const canCreate = useSession().can("doctors:create");

  const { sortBy: _sb, sortOrder: _so, ...filterValues } = values;
  const sort = readSort(_sb, _so);
  const params: DoctorListParams = { page, limit: PAGE_SIZE, ...filterValues, ...sort };
  const doctors = useQuery({
    queryKey: queryKeys.doctors.list(params),
    queryFn: () => doctorsApi.list(params),
    placeholderData: keepPreviousData,
  });
  const filters = useQuery({ queryKey: queryKeys.doctors.filters, queryFn: doctorsApi.filters, staleTime: 5 * 60_000 });

  const totalPages = doctors.data?.pagination.totalPages ?? 0;
  useEffect(() => {
    if (totalPages > 0 && page > totalPages && !doctors.isFetching) setFilters({ page: totalPages });
  }, [page, totalPages, doctors.isFetching, setFilters]);

  // Sorting is kept when filters are cleared.
  const { hasFilters, panelCount, clear: clearFilters } = filterState(values, FILTER_KEYS, setFilters);
  const toOptions = (list: string[] | undefined) => (list ?? []).map((v) => ({ value: v, label: v }));

  const actions = (d: Doctor) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-lg" aria-label={`Actions for ${d.name}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => router.push(`/doctors/${d._id}`)}>
          <Eye aria-hidden /> View details
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push(`/doctors/${d._id}#patients`)}>
          <Users aria-hidden /> View patients
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const columns: Column<Doctor>[] = [
    {
      id: "doctor",
      header: "Doctor",
      sortKey: "name",
      cell: (d) => (
        <Link href={`/doctors/${d._id}`} className="group flex items-center gap-3">
          <DoctorAvatar name={d.name} />
          <span className="max-w-[200px] truncate font-medium text-foreground group-hover:text-primary group-hover:underline" title={d.name}>
            {d.name}
          </span>
        </Link>
      ),
    },
    { id: "specialization", header: "Specialization", cell: (d) => d.specialization },
    {
      id: "hospital",
      header: "Hospital",
      cell: (d) => <span className="block max-w-[180px] truncate" title={d.hospital}>{d.hospital}</span>,
    },
    { id: "phone", header: "Phone", cell: (d) => <span className="whitespace-nowrap tabular-nums">{d.phone}</span>, className: "hidden xl:table-cell", headerClassName: "hidden xl:table-cell" },
    {
      id: "email",
      header: "Email",
      cell: (d) => (
        <a href={`mailto:${d.email}`} className="block max-w-[200px] truncate text-muted-foreground hover:text-primary" title={d.email}>
          {d.email}
        </a>
      ),
      className: "hidden lg:table-cell",
      headerClassName: "hidden lg:table-cell",
    },
    { id: "patients", header: "Patients", cell: (d) => <span className="tabular-nums">{formatNumber(d.patientCount)}</span>, className: "text-right", headerClassName: "text-right" },
    { id: "created", header: "Created", sortKey: "createdAt", cell: (d) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(d.createdAt)}</span> },
    { id: "actions", header: <span className="sr-only">Actions</span>, cell: actions, className: "w-14 text-right", headerClassName: "w-14" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctors"
        description="Manage doctor information and their associated patients."
        actions={
          canCreate && (
            <Button size="lg" className="h-10 px-4" onClick={() => setCreateOpen(true)}>
              <Plus aria-hidden /> Add doctor
            </Button>
          )
        }
      />

      <section className="overflow-hidden rounded-xl border bg-card" aria-label="Doctors">
        <FilterBar
          search={
            <SearchInput
              label="Search doctors"
              placeholder="Search by name, email, specialization or hospital…"
              value={values.search}
              onSearch={(search) => setFilters({ search })}
            />
          }
          activeCount={panelCount}
          canClear={hasFilters}
          onClear={clearFilters}
        >
          <FilterSelect
            id="filter-specialization"
            label="Specialization"
            allLabel="All specializations"
            value={values.specialization}
            onChange={(specialization) => setFilters({ specialization })}
            options={toOptions(filters.data?.specializations)}
          />
          <FilterSelect
            id="filter-hospital"
            label="Hospital"
            allLabel="All hospitals"
            value={values.hospital}
            onChange={(hospital) => setFilters({ hospital })}
            options={toOptions(filters.data?.hospitals)}
          />
          <DateRangeFilter
            id="filter-created"
            label="Created date"
            startDate={values.startDate}
            endDate={values.endDate}
            onChange={(range) => setFilters(range)}
          />
          <SortSelect
            id="sort-doctors"
            sort={sort}
            onChange={(next) => setFilters({ sortBy: next.sortBy, sortOrder: next.sortOrder, page: 1 })}
          />
        </FilterBar>

        <DataTable
          caption="Doctors"
          columns={columns}
          rows={doctors.data?.data}
          getRowId={(d) => d._id}
          isLoading={doctors.isLoading}
          isFetching={doctors.isFetching}
          error={doctors.error}
          onRetry={() => doctors.refetch()}
          sort={sort}
          onSortChange={(next) => setFilters({ sortBy: next.sortBy, sortOrder: next.sortOrder, page: 1 })}
          renderMobileCard={(d) => (
            <div className="flex items-start gap-3">
              <DoctorAvatar name={d.name} />
              <Link href={`/doctors/${d._id}`} className="min-w-0 flex-1 space-y-1">
                <p className="truncate font-medium">{d.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {d.specialization} · {d.hospital}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(d.patientCount)} patients · Added {formatDate(d.createdAt)}
                </p>
              </Link>
              {actions(d)}
            </div>
          )}
          empty={
            <EmptyState
              icon={Stethoscope}
              title={hasFilters ? "No doctors match your filters" : "No doctors yet"}
              description={hasFilters ? "Try a different search or clear the filters." : "Add your first doctor to get started."}
              action={
                hasFilters ? (
                  <Button variant="outline" size="lg" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : canCreate ? (
                  <Button size="lg" onClick={() => setCreateOpen(true)}>
                    <Plus aria-hidden /> Add doctor
                  </Button>
                ) : undefined
              }
            />
          }
        />
        <Pagination pagination={doctors.data?.pagination} onPageChange={(next) => setFilters({ page: next })} noun="doctors" />
      </section>

      {canCreate && <DoctorFormDialog open={createOpen} onOpenChange={setCreateOpen} />}
    </div>
  );
}
