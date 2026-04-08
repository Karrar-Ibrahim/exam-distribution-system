"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileDown, CalendarCheck, ArrowRight, ChevronLeft, ChevronRight, Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { BulkDeleteBar } from "@/components/common/bulk-delete-bar";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  useDistributionBatches,
  useDeleteDistributionBatch,
  useBulkDeleteDistributionBatches,
  useExportDistributions,
} from "../hooks";
import { BatchCard } from "./batch-card";
import { BatchDetailModal } from "./batch-detail-modal";
import type { DistributionBatch } from "@/types";

export function HistoryView() {
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [detailBatch, setDetailBatch] = useState<DistributionBatch | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const { data, isLoading } = useDistributionBatches({
    page,
    date: dateFilter || undefined,
  });
  const deleteM      = useDeleteDistributionBatch();
  const bulkDeleteM  = useBulkDeleteDistributionBatches();
  const exportM      = useExportDistributions();

  const batches = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalCount = data?.count ?? 0;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFilter(e.target.value);
    setPage(1);
  };

  const toggleBatch = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllPage = () => {
    const pageIds = batches.map((b) => b.id);
    const allSel  = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSel) pageIds.forEach((id) => next.delete(id));
      else         pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleBulkDelete = () => {
    bulkDeleteM.mutate(Array.from(selectedIds), {
      onSuccess: () => { setSelectedIds(new Set()); setBulkConfirm(false); },
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <PageHeader
        title="سجل التوزيعات"
        description={`جميع دفعات توزيع المراقبين — ${totalCount} دفعة`}
      >
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link href="/distributions">
            <ArrowRight className="h-4 w-4" />
            العودة للرئيسية
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => exportM.mutate(undefined)}
          disabled={exportM.isPending || totalCount === 0}
        >
          <FileDown className="h-4 w-4" />
          تصدير الكل
        </Button>
      </PageHeader>

      {/* ── Date filter ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground shrink-0">تصفية بالتاريخ:</label>
          <Input
            type="date"
            value={dateFilter}
            onChange={handleDateChange}
            className="w-44 h-9 text-sm"
          />
        </div>
        {dateFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs text-muted-foreground"
            onClick={() => { setDateFilter(""); setPage(1); }}
          >
            مسح التصفية ×
          </Button>
        )}
        {!isLoading && (
          <span className="text-xs text-muted-foreground ms-auto">
            {totalCount} نتيجة
          </span>
        )}
      </div>

      {/* ── شريط الحذف المتعدد ── */}
      <BulkDeleteBar
        selectedCount={selectedIds.size}
        onDelete={() => setBulkConfirm(true)}
        onClear={() => setSelectedIds(new Set())}
        isDeleting={bulkDeleteM.isPending}
      />

      {/* ── Batches list ── */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
          ))}
        </div>
      ) : batches.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={CalendarCheck}
              title="لا توجد توزيعات"
              description={
                dateFilter
                  ? "لا توجد دفعات بهذا التاريخ. جرب تاريخاً آخر أو امسح التصفية."
                  : "لم يتم إنشاء أي توزيعات بعد."
              }
            >
              <Button size="sm" asChild>
                <Link href="/distributions">إنشاء توزيع جديد</Link>
              </Button>
            </EmptyState>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Select-all row */}
          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              checked={batches.length > 0 && batches.every((b) => selectedIds.has(b.id))}
              ref={(el) => {
                if (el) el.indeterminate = batches.some((b) => selectedIds.has(b.id)) && !batches.every((b) => selectedIds.has(b.id));
              }}
              onChange={toggleAllPage}
              className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
            />
            <span className="text-xs text-muted-foreground">تحديد الكل في الصفحة</span>
          </div>
          {batches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              onDelete={setDeletingId}
              onExport={(id) => exportM.mutate(id)}
              onViewDetails={setDetailBatch}
              isDeleting={deleteM.isPending && deletingId === batch.id}
              isExporting={exportM.isPending}
              selected={selectedIds.has(batch.id)}
              onToggleSelect={toggleBatch}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            صفحة <span className="font-medium text-foreground">{page}</span> من{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => { setPage((p) => p - 1); setSelectedIds(new Set()); }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8 text-xs"
                    onClick={() => { setPage(p); setSelectedIds(new Set()); }}
                  >
                    {p}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => { setPage((p) => p + 1); setSelectedIds(new Set()); }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {detailBatch && (
        <BatchDetailModal
          batch={detailBatch}
          open={!!detailBatch}
          onClose={() => setDetailBatch(null)}
          onExport={(id) => exportM.mutate(id)}
          isExporting={exportM.isPending}
        />
      )}

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() =>
          deleteM.mutate(deletingId!, { onSuccess: () => setDeletingId(null) })
        }
        title="حذف الدفعة"
        description="هل أنت متأكد من حذف هذه الدفعة؟ سيتم حذف جميع التعيينات المرتبطة بها ولا يمكن التراجع."
        loading={deleteM.isPending}
      />

      <ConfirmDialog
        open={bulkConfirm}
        onClose={() => setBulkConfirm(false)}
        onConfirm={handleBulkDelete}
        title={`حذف ${selectedIds.size} دفعة`}
        description={`هل أنت متأكد من حذف ${selectedIds.size} دفعة؟ سيتم حذف جميع التعيينات المرتبطة بها ولا يمكن التراجع.`}
        loading={bulkDeleteM.isPending}
      />
    </div>
  );
}
