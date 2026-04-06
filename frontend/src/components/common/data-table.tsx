"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button }   from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  keyExtractor: (row: T) => string | number;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  totalCount?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  isError?: boolean;
  onRetry?: () => void;
}

const SKELETON_ROWS = 5;

export function DataTable<T>({
  columns,
  data,
  loading = false,
  keyExtractor,
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  totalCount,
  emptyTitle,
  emptyDescription,
  className,
  isError,
  onRetry,
}: DataTableProps<T>) {
  const showPagination = totalPages > 1 && onPageChange;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3",
                    col.headerClassName
                  )}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isError ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  <ErrorState onRetry={onRetry} />
                </TableCell>
              </TableRow>
            ) : loading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={i} className="border-b border-border/40">
                  {columns.map((col) => (
                    <TableCell key={col.key} className="py-3">
                      <Skeleton className="h-4 w-full max-w-[120px] rounded-md" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => (
                <TableRow
                  key={keyExtractor(row)}
                  className={cn(
                    "border-b border-border/40 transition-colors",
                    "hover:bg-muted/30",
                    idx % 2 === 1 && "bg-muted/10"
                  )}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={cn("py-3", col.className)}>
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            {totalCount !== undefined && (
              <>
                إجمالي النتائج:{" "}
                <span className="font-semibold text-foreground">{totalCount.toLocaleString("ar-EG")}</span>
              </>
            )}
          </p>
          <div className="flex items-center gap-1">
            {/* Prev */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-border/60"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page: number;
                if (totalPages <= 5)            page = i + 1;
                else if (currentPage <= 3)       page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else                             page = currentPage - 2 + i;

                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="icon"
                    className={cn(
                      "h-8 w-8 text-xs border-border/60",
                      page === currentPage && "shadow-sm"
                    )}
                    onClick={() => onPageChange(page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>

            {/* Next */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-border/60"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
