"use client";

import React, { useState } from "react";
import {
  Users,
  CalendarCheck,
  Award,
  Search,
  Download,
  Eye,
  Trophy,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/error-state";
import { EmptyState } from "@/components/common/empty-state";
import { TeacherDetailModal } from "./teacher-detail-modal";
import { useTeacherStats, useExportTeacherStats } from "../hooks";
import { cn } from "@/lib/utils";
import type { TeacherStat } from "@/types";

/* ─── helpers ─────────────────────────────────────────────────────── */
const degreeConfig: Record<string, { label: string; className: string }> = {
  دكتوراه: {
    label: "دكتوراه",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  ماجستير: {
    label: "ماجستير",
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
  بكالوريوس: {
    label: "بكالوريوس",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
};

function CountBadge({ count }: { count: number }) {
  const cls =
    count === 0
      ? "bg-muted text-muted-foreground border-border"
      : count >= 7
      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800"
      : count >= 4
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800"
      : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[2.25rem] h-9 px-3 rounded-lg text-base font-bold border",
        cls
      )}
    >
      {count}
    </span>
  );
}

function RankBadge({ rank, count }: { rank: number; count: number }) {
  // المدرّس الجديد بدون أي مراقبة → شارة "جديد"
  if (count === 0)
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-1.5 h-6 min-w-[1.75rem]">
        جديد
      </span>
    );
  if (rank === 1)
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400">
        <Trophy className="h-4 w-4" />
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold">
        3
      </span>
    );
  return (
    <span className="text-sm text-muted-foreground font-mono w-7 text-center inline-block">
      {rank}
    </span>
  );
}

/* ─── main component ──────────────────────────────────────────────── */
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100] as const;

export function StatisticsView() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherStat | null>(
    null
  );

  const { data, isLoading, isError, refetch } = useTeacherStats({
    page,
    itemsPerPage: pageSize,
    search,
    date: dateFilter || undefined,
  });

  const exportM = useExportTeacherStats();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFilter(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setDateFilter("");
    setPage(1);
  };

  const handleExport = () => {
    exportM.mutate({ search, date: dateFilter || undefined });
  };

  // الأكثر مراقبةً: أول نتيجة لها عدد > 0 (المرتّبون بالتنازل)
  const topTeacher = data?.results?.find((t) => t.total_count > 0);
  const totalPages = data?.total_pages ?? 1;
  const showPagination = totalPages > 1;

  /* ── page offset for rank ── */
  const pageOffset = (page - 1) * pageSize;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <PageHeader
        title="إحصائيات المراقبين"
        description="عدد مرات المراقبة وتفاصيل كل جلسة لكل مراقب"
      >
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exportM.isPending}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {exportM.isPending ? "جاري التحميل..." : "تصدير Excel"}
        </Button>
      </PageHeader>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="إجمالي التدريسيين"
          value={data?.count ?? 0}
          icon={Users}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/10"
          description="كل التدريسيين بمن فيهم الجدد"
          loading={isLoading}
        />
        <StatCard
          title="إجمالي عمليات المراقبة"
          value={data?.total_assignments ?? 0}
          icon={CalendarCheck}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/10"
          description="مجموع كل جلسات المراقبة"
          loading={isLoading}
        />
        <StatCard
          title="الأكثر مراقبةً"
          value={topTeacher?.total_count ?? 0}
          icon={Award}
          iconColor="text-amber-500"
          iconBg="bg-amber-500/10"
          description={topTeacher?.formatted_name ?? "—"}
          loading={isLoading}
        />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <form
          onSubmit={handleSearch}
          className="flex gap-2 flex-1 min-w-[200px] max-w-sm"
        >
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="البحث باسم المراقب..."
            className="flex-1"
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <Input
          type="date"
          value={dateFilter}
          onChange={handleDateChange}
          className="w-44"
          placeholder="تصفية بالتاريخ"
        />

        {(search || dateFilter) && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            مسح الفلاتر
          </Button>
        )}
      </div>

      {/* ── Table ── */}
      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-12 text-center font-semibold text-foreground">
                    #
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    اسم المراقب
                  </TableHead>
                  <TableHead className="font-semibold text-foreground hidden sm:table-cell">
                    اللقب
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    الدرجة
                  </TableHead>
                  <TableHead className="font-semibold text-foreground text-center">
                    عدد المرات
                  </TableHead>
                  <TableHead className="font-semibold text-foreground hidden md:table-cell">
                    آخر مراقبة
                  </TableHead>
                  <TableHead className="font-semibold text-foreground text-center">
                    التفاصيل
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full max-w-[120px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.results?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <EmptyState
                        title="لا توجد بيانات"
                        description="لم يتم تسجيل أي عمليات مراقبة حتى الآن"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.results?.map((teacher, idx) => {
                    const rank = pageOffset + idx + 1;
                    const deg =
                      degreeConfig[teacher.degree] ?? {
                        label: teacher.degree,
                        className: "bg-gray-100 text-gray-700",
                      };
                    return (
                      <TableRow
                        key={teacher.teacher_id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        {/* Rank */}
                        <TableCell className="text-center">
                          <RankBadge rank={rank} count={teacher.total_count} />
                        </TableCell>

                        {/* Name */}
                        <TableCell>
                          <span className="font-semibold text-foreground leading-tight">
                            {teacher.formatted_name}
                          </span>
                        </TableCell>

                        {/* Title */}
                        <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                          {teacher.title}
                        </TableCell>

                        {/* Degree */}
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn("text-xs font-medium", deg.className)}
                          >
                            {deg.label}
                          </Badge>
                        </TableCell>

                        {/* Count */}
                        <TableCell className="text-center">
                          <CountBadge count={teacher.total_count} />
                        </TableCell>

                        {/* Last date */}
                        <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                          {teacher.last_assignment_date ?? "—"}
                        </TableCell>

                        {/* Action */}
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => setSelectedTeacher(teacher)}
                            title="عرض التفاصيل"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {(showPagination || data) && (
            <div className="flex items-center justify-between px-1 flex-wrap gap-2">
              {/* إجمالي + عدد الصفوف */}
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  إجمالي المراقبين:{" "}
                  <span className="font-medium text-foreground">
                    {data?.count}
                  </span>
                </p>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">عرض</label>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="h-8 rounded-md border border-border/60 bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                  >
                    {PAGE_SIZE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <span className="text-xs text-muted-foreground">صف</span>
                </div>
              </div>

              {/* أزرار التنقل */}
              {showPagination && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    السابق
                  </Button>
                  <span className="px-3 text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    التالي
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Detail Modal ── */}
      <TeacherDetailModal
        teacher={selectedTeacher}
        open={!!selectedTeacher}
        onClose={() => setSelectedTeacher(null)}
      />
    </div>
  );
}
