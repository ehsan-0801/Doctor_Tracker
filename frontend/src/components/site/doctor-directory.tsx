"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Stethoscope } from "lucide-react";
import { FilterSelect } from "@/components/shared/filter-select";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { publicApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { formatNumberFor } from "@/lib/i18n/dictionaries";
import { useLanguage } from "./language-provider";
import { PublicDoctorCard } from "./public-doctor-card";

const KEYS = ["search", "specialization"] as const;

export function DoctorDirectory({ specializations }: { specializations: string[] }) {
  const { t, lang } = useLanguage();
  const d = t.directory;
  const { values, page, setFilters } = useUrlFilters(KEYS);
  const params = { page, search: values.search, specialization: values.specialization };
  const doctors = useQuery({
    queryKey: queryKeys.publicDoctors(params),
    queryFn: () => publicApi.doctors(params),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-6">
      <div className="-mt-20 grid gap-3 rounded-md border bg-white p-4 shadow-[0_20px_40px_-28px_rgba(37,60,72,0.35)] sm:grid-cols-[1fr_260px] sm:items-end sm:p-5">
        <SearchInput
          label={d.searchLabel}
          placeholder={d.searchPlaceholder}
          value={values.search}
          onSearch={(search) => setFilters({ search })}
        />
        <FilterSelect
          id="directory-specialization"
          label={d.speciality}
          allLabel={d.allSpecialities}
          value={values.specialization}
          onChange={(specialization) => setFilters({ specialization })}
          options={specializations.map((s) => ({ value: s, label: s }))}
        />
      </div>

      {doctors.error && !doctors.data ? (
        <div className="rounded-md border bg-white">
          <ErrorState title={d.errorTitle} message={doctors.error.message} onRetry={() => doctors.refetch()} />
        </div>
      ) : doctors.isLoading ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i} className="space-y-3">
              <Skeleton className="aspect-[4/5] rounded-md" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-2/3" />
            </li>
          ))}
        </ul>
      ) : doctors.data?.data.length === 0 ? (
        <div className="rounded-md border bg-white">
          <EmptyState icon={Stethoscope} title={d.noMatch} description={d.noMatchHint} />
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {d.found(doctors.data?.pagination.total ?? 0)}
          </p>
          <ul className={`grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4 transition-opacity ${doctors.isFetching ? "opacity-60" : ""}`}>
            {doctors.data?.data.map((doctor) => (
              <li key={doctor._id}>
                <PublicDoctorCard doctor={doctor} />
              </li>
            ))}
          </ul>
          <div className="overflow-hidden rounded-md border bg-white">
            <Pagination
              pagination={doctors.data?.pagination}
              onPageChange={(next) => setFilters({ page: next })}
              labels={t.pagination}
              formatCount={(n) => formatNumberFor(lang, n)}
            />
          </div>
        </>
      )}
    </div>
  );
}
