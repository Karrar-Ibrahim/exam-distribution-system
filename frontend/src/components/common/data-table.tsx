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

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100] as const;

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
  // ── عدد الصفوف في الصفحة ──────────────────────────────────────────
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  // ── الحذف المتعدد ──────────────────────────────────────────────────
  selectedIds?: Set<string | number>;
  onSelectionChange?: (ids: Set<string | number>) => void;
}

const SKELETON_ROWS = 5;

// checkbox بسيط مع تنسيق متناسق
function Checkbox({
  checked,
  indeterminate,
  onChange,
  className,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={cn(
        "h-4 w-4 rounded border-border bg-background text-primary cursor-pointer",
        "focus:ring-2 focus:ring-primary/30 focus:ring-offset-0",
        "accent-primary",
        className
      )}
    />
  );
}

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
  pageSize,
  onPageSizeChange,
  selectedIds,
  onSelectionChange,
}: DataTableProps<T>) {
  const showPagination  = (totalPages > 1 || onPageSizeChange) && onPageChange;
  const selectable      = !!onSelectionChange;

  // حساب حالة checkbox الرأس
  const pageIds         = data.map(keyExtractor);
  const allSelected     = pageIds.length > 0 && pageIds.every((id) => selectedIds?.has(id));
  const someSelected    = !allSelected && pageIds.some((id) => selectedIds?.has(id));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (allSelected) {
      pageIds.forEach((id) => next.delete(id));
    } else {
      pageIds.forEach((id) => next.add(id));
    }
    onSelectionChange(next);
  };

  const toggleRow = (id: string | number) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
              {selectable && (
                <TableHead className="w-10 py-3 text-center">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={toggleAll}
                    className="mx-auto"
                  />
                </TableHead>
              )}
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
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="p-0">
                  <ErrorState onRetry={onRetry} />
                </TableCell>
              </TableRow>
            ) : loading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={i} className="border-b border-border/40">
                  {selectable && (
                    <TableCell className="w-10 py-3 text-center">
                      <Skeleton className="h-4 w-4 rounded mx-auto" />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.key} className="py-3">
                      <Skeleton className="h-4 w-full max-w-[120px] rounded-md" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="p-0">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => {
                const id       = keyExtractor(row);
                const isSelected = selectedIds?.has(id) ?? false;
                return (
                  <TableRow
                    key={id}
                    className={cn(
                      "border-b border-border/40 transition-colors",
                      isSelected
                        ? "bg-primary/5 hover:bg-primary/10"
                        : ["hover:bg-muted/30", idx % 2 === 1 && "bg-muted/10"]
                    )}
                  >
                    {selectable && (
                      <TableCell className="w-10 py-3 text-center">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                          className="mx-auto"
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.key} className={cn("py-3", col.className)}>
                        {col.render
                          ? col.render(row)
                          : String((row as Record<string, unknown>)[col.key] ?? "—")}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between px-1 flex-wrap gap-2">
          {/* الجانب الأيمن: إجمالي + عدد الصفوف */}
          <div className="flex items-center gap-3">
            {totalCount !== undefined && (
              <p className="text-xs text-muted-foreground">
                إجمالي النتائج:{" "}
                <span className="font-semibold text-foreground">{totalCount.toLocaleString("ar-EG")}</span>
              </p>
            )}
            {onPageSizeChange && (
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-muted-foreground whitespace-nowrap">عرض</label>
                <select
                  value={pageSize ?? 10}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="h-8 rounded-md border border-border/60 bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                >
                  {PAGE_SIZE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <span className="text-xs text-muted-foreground">صف</span>
              </div>
            )}
          </div>

          {/* الجانب الأيسر: أزرار الصفحات */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-border/60"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5)                    page = i + 1;
                  else if (currentPage <= 3)               page = i + 1;
                  else if (currentPage >= totalPages - 2)  page = totalPages - 4 + i;
                  else                                     page = currentPage - 2 + i;
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
          )}
        </div>
      )}
    </div>
  );
}
