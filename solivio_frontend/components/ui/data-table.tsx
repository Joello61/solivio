"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  cell: (row: T, index: number) => React.ReactNode;
}

interface SortState {
  key: string;
  direction: "asc" | "desc";
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  getRowKey?: (row: T, index: number) => string | number;
  sortKey?: (row: T, key: string) => string | number;
}

function SortIcon({ columnKey, sort }: { columnKey: string; sort: SortState | null }) {
  if (!sort || sort.key !== columnKey) {
    return <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
  }
  return sort.direction === "asc"
    ? <ChevronUp className="h-3.5 w-3.5 text-primary" />
    : <ChevronDown className="h-3.5 w-3.5 text-primary" />;
}

function DataTable<T>({
  data,
  columns,
  pageSize = 10,
  emptyTitle = "Aucun élément",
  emptyDescription,
  className,
  getRowKey,
  sortKey,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sort || !sortKey) return data;
    return [...data].sort((a, b) => {
      const av = sortKey(a, sort.key);
      const bv = sortKey(b, sort.key);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sort.direction === "asc" ? cmp : -cmp;
    });
  }, [data, sort, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  function handleSort(key: string) {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc" ? { key, direction: "desc" } : null;
      }
      return { key, direction: "asc" };
    });
    setPage(1);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-border">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "h-11 px-4 text-left font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                      col.headerClassName,
                    )}
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => handleSort(col.key)}
                        className="inline-flex items-center gap-1.5 uppercase hover:text-foreground transition-colors"
                      >
                        {col.header}
                        <SortIcon columnKey={col.key} sort={sort} />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                      size="sm"
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((row, i) => (
                  <tr
                    key={getRowKey ? getRowKey(row, i) : i}
                    className="border-b border-border last:border-0 hover:bg-muted/60"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn("h-14 px-4 py-2 text-foreground", col.className)}
                      >
                        {col.cell(row, i)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 px-1">
          <p className="text-sm text-muted-foreground">
            {sorted.length} élément{sorted.length !== 1 ? "s" : ""} -{" "}
            page {safePage} sur {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = computePageNum(safePage, totalPages, i);
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === safePage ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => setPage(pageNum)}
                  className="text-xs"
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              aria-label="Page suivante"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function computePageNum(current: number, total: number, index: number): number {
  if (total <= 5) return index + 1;
  if (current <= 3) return index + 1;
  if (current >= total - 2) return total - 4 + index;
  return current - 2 + index;
}

export { DataTable };
