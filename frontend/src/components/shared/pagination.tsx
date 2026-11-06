import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import type { Pagination as PaginationMeta } from "@/types/api";

export interface PaginationLabels {
  showing: (from: string, to: string, total: string) => string;
  previous: string;
  next: string;
  page: (page: number, total: number) => string;
}

export function Pagination({
  pagination,
  onPageChange,
  noun = "records",
  labels,
  formatCount = formatNumber,
}: {
  pagination: PaginationMeta | undefined;
  onPageChange: (page: number) => void;
  noun?: string;
  /** Translated labels (public site); defaults to English. */
  labels?: PaginationLabels;
  formatCount?: (n: number) => string;
}) {
  if (!pagination || pagination.total === 0) return null;
  const { page, limit, total, totalPages } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row"
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {labels ? (
          labels.showing(formatCount(from), formatCount(to), formatCount(total))
        ) : (
          <>
            Showing <span className="font-medium text-foreground">{formatNumber(from)}</span>–
            <span className="font-medium text-foreground">{formatNumber(to)}</span> of{" "}
            <span className="font-medium text-foreground">{formatNumber(total)}</span> {noun}
          </>
        )}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="lg"
          className="h-10"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label={labels?.previous ?? "Previous page"}
        >
          <ChevronLeft aria-hidden />
          <span className="hidden sm:inline">{labels?.previous ?? "Previous"}</span>
        </Button>
        <span className="min-w-[90px] text-center text-sm text-muted-foreground">
          {labels ? labels.page(page, Math.max(totalPages, 1)) : `Page ${page} of ${Math.max(totalPages, 1)}`}
        </span>
        <Button
          variant="outline"
          size="lg"
          className="h-10"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label={labels?.next ?? "Next page"}
        >
          <span className="hidden sm:inline">{labels?.next ?? "Next"}</span>
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
