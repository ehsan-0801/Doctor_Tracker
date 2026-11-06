"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ErrorState } from "./states";

export interface Column<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  caption: string;
  columns: Column<T>[];
  rows: T[] | undefined;
  getRowId: (row: T) => string;
  /** Card presentation used below the `md` breakpoint instead of the table. */
  renderMobileCard: (row: T) => React.ReactNode;
  isLoading: boolean;
  isFetching?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  empty: React.ReactNode;
  skeletonRows?: number;
}

export function DataTable<T>({
  caption,
  columns,
  rows,
  getRowId,
  renderMobileCard,
  isLoading,
  isFetching,
  error,
  onRetry,
  empty,
  skeletonRows = 6,
}: DataTableProps<T>) {
  if (error && !rows) return <ErrorState message={error.message} onRetry={onRetry} />;
  if (!isLoading && rows?.length === 0) return <>{empty}</>;

  return (
    <div aria-busy={isLoading || isFetching} className={cn("transition-opacity", isFetching && !isLoading && "opacity-60")}>
      {/* Tablet and desktop */}
      <div className="hidden md:block">
        <Table>
          <caption className="sr-only">{caption}</caption>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  scope="col"
                  className={cn("h-11 px-4 text-xs font-semibold text-muted-foreground", column.headerClassName)}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: skeletonRows }, (_, i) => (
                  <TableRow key={i}>
                    {columns.map((column) => (
                      <TableCell key={column.id} className="h-14 px-4">
                        <Skeleton className="h-4 w-full max-w-[160px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : rows?.map((row) => (
                  <TableRow key={getRowId(row)}>
                    {columns.map((column) => (
                      <TableCell key={column.id} className={cn("h-14 px-4 text-[13px]", column.className)}>
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <ul className="divide-y md:hidden" aria-label={caption}>
        {isLoading
          ? Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="space-y-2 p-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </li>
            ))
          : rows?.map((row) => (
              <li key={getRowId(row)} className="p-4">
                {renderMobileCard(row)}
              </li>
            ))}
      </ul>
    </div>
  );
}
