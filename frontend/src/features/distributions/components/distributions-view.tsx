"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileDown, RefreshCw, CalendarCheck, Users, DoorOpen,
  TrendingUp, ArrowLeft, History, CheckCircle2, Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  useDistributionBatches,
  useCreateDistribution,
  useDeleteDistributionBatch,
  useExportDistributions,
} from "../hooks";
import { DistributionForm } from "./distribution-form";
import { BatchCard } from "./batch-card";
import { BatchDetailModal } from "./batch-detail-modal";
import type { DistributionBatch, DistributionCreateData } from "@/types";
import { formatDate } from "@/lib/utils";

export function DistributionsView() {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [detailBatch, setDetailBatch] = useState<DistributionBatch | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [justCreated, setJustCreated] = useState(false);

  const { data, isLoading, refetch } = useDistributionBatches({ page: 1 });
  const createM = useCreateDistribution();
  const deleteM = useDeleteDistributionBatch();
  const exportM = useExportDistributions();

  const batches = data?.results ?? [];
  const totalBatches = data?.count ?? 0;
  const lastBatch = batches[0] ?? null;
  const totalTeachers = batches.reduce((s, b) => s + b.teachers_count, 0);
  const totalRooms = batches.reduce((s, b) => s + b.classrooms_count, 0);

  const handleCreate = (fd: DistributionCreateData) => {
    setJustCreated(false);
    createM.mutate(fd, {
      onSuccess: (res) => {
        setFormKey((k) => k + 1);
        setJustCreated(true);
        setDetailBatch(res.data);
      },
    });
  };

  const stats = [
    {
      label: "إجمالي الدفعات",
      value: totalBatches,
      display: String(totalBatches),
      icon: CalendarCheck,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "آخر توزيع",
      value: lastBatch ? 1 : 0,
      display: lastBatch ? formatDate(lastBatch.date) : "—",
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/30",
      small: true,
    },
    {
      label: "المراقبون (أحدث)",
      value: totalTeachers,
      display: String(totalTeachers),
      icon: Users,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      label: "القاعات (أحدث)",
      value: totalRooms,
      display: String(totalRooms),
      icon: DoorOpen,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <PageHeader
        title="توزيع المراقبين"
        description="إنشاء وإدارة توزيعات مراقبي الامتحانات تلقائياً"
      >
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-4 w-4" />
          تحديث
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => exportM.mutate(undefined)}
          disabled={exportM.isPending || totalBatches === 0}
        >
          <FileDown className="h-4 w-4" />
          تصدير الكل
        </Button>
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link href="/distributions/history">
            <History className="h-4 w-4" />
            السجل الكامل
          </Link>
        </Button>
      </PageHeader>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground mb-2 leading-tight">{stat.label}</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    <p className={`font-bold text-foreground ${stat.small ? "text-base mt-1" : "text-2xl"}`}>
                      {stat.display}
                    </p>
                  )}
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Two-panel: form + recent batches ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

        {/* Create form */}
        <div className="lg:col-span-2">
          <Card className="lg:sticky lg:top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                إنشاء توزيع جديد
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {justCreated && (
                <div className="flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2.5 mb-4 text-sm text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>تم التوزيع بنجاح! انقر على &quot;تفاصيل&quot; لعرض النتيجة.</span>
                </div>
              )}
              <DistributionForm
                key={formKey}
                onSubmit={handleCreate}
                isLoading={createM.isPending}
              />
            </CardContent>
          </Card>
        </div>

        {/* Recent batches */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">آخر الدفعات</p>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-1 h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <Link href="/distributions/history">
                عرض الكل
                <ArrowLeft className="h-3 w-3 rtl:rotate-180" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
              ))}
            </div>
          ) : batches.length === 0 ? (
            <Card>
              <CardContent className="p-0">
                <EmptyState
                  icon={CalendarCheck}
                  title="لا توجد توزيعات بعد"
                  description="أنشئ أول توزيع باستخدام النموذج على اليمين"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {batches.slice(0, 6).map((batch) => (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                  onDelete={setDeletingId}
                  onExport={(id) => exportM.mutate(id)}
                  onViewDetails={setDetailBatch}
                  isDeleting={deleteM.isPending && deletingId === batch.id}
                  isExporting={exportM.isPending}
                />
              ))}
              {totalBatches > 6 && (
                <>
                  <Separator />
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="gap-1.5 text-xs text-muted-foreground"
                    >
                      <Link href="/distributions/history">
                        عرض جميع الدفعات ({totalBatches})
                        <ArrowLeft className="h-3 w-3 rtl:rotate-180" />
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Batch detail modal ── */}
      {detailBatch && (
        <BatchDetailModal
          batch={detailBatch}
          open={!!detailBatch}
          onClose={() => setDetailBatch(null)}
          onExport={(id) => exportM.mutate(id)}
          isExporting={exportM.isPending}
        />
      )}

      {/* ── Delete confirmation ── */}
      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() =>
          deleteM.mutate(deletingId!, { onSuccess: () => setDeletingId(null) })
        }
        title="حذف الدفعة"
        description="هل أنت متأكد من حذف هذه الدفعة؟ سيتم حذف جميع التعيينات المرتبطة بها ولا يمكن التراجع عن ذلك."
        loading={deleteM.isPending}
      />
    </div>
  );
}
