"use client";

import React from "react";
import {
  Users,
  DoorOpen,
  BookOpen,
  CalendarCheck,
  ArrowLeft,
  TrendingUp,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/common/stat-card";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "../hooks";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, cn } from "@/lib/utils";
import type { DegreeBreakdown } from "@/types";

/** Time-aware greeting in Arabic */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return "صباح الخير";
  if (h >= 12 && h < 18) return "مساء الخير";
  return "أهلاً وسهلاً";
}

// ── إعدادات الألوان لكل شهادة ──────────────────────────────────────────────
const DEGREE_CONFIG: Record<string, {
  gradient: string;
  badge: string;
  bar: string;
  icon: string;
  ring: string;
  text: string;
  softBg: string;
}> = {
  "دكتوراه": {
    gradient: "from-indigo-600 to-indigo-800",
    badge:    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    bar:      "bg-indigo-500",
    icon:     "text-indigo-500",
    ring:     "ring-indigo-200 dark:ring-indigo-800",
    text:     "text-indigo-700 dark:text-indigo-300",
    softBg:   "bg-indigo-50 dark:bg-indigo-950/30",
  },
  "ماجستير": {
    gradient: "from-emerald-600 to-emerald-800",
    badge:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    bar:      "bg-emerald-500",
    icon:     "text-emerald-500",
    ring:     "ring-emerald-200 dark:ring-emerald-800",
    text:     "text-emerald-700 dark:text-emerald-300",
    softBg:   "bg-emerald-50 dark:bg-emerald-950/30",
  },
  "بكالوريوس": {
    gradient: "from-amber-500 to-amber-700",
    badge:    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    bar:      "bg-amber-500",
    icon:     "text-amber-500",
    ring:     "ring-amber-200 dark:ring-amber-800",
    text:     "text-amber-700 dark:text-amber-300",
    softBg:   "bg-amber-50 dark:bg-amber-950/30",
  },
};

// ── بطاقة شهادة واحدة ──────────────────────────────────────────────────────
function DegreeCard({ item, totalTeachers }: { item: DegreeBreakdown; totalTeachers: number }) {
  const cfg = DEGREE_CONFIG[item.degree] ?? DEGREE_CONFIG["بكالوريوس"];
  const pct = totalTeachers > 0 ? Math.round((item.total / totalTeachers) * 100) : 0;

  return (
    <Card className={cn("overflow-hidden ring-1 shadow-sm", cfg.ring)}>
      {/* ── رأس البطاقة ── */}
      <div className={cn("bg-gradient-to-l p-5 text-white", cfg.gradient)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-white/70 mb-1">الشهادة العلمية</p>
            <h3 className="text-xl font-bold tracking-wide">{item.degree}</h3>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* العدد الإجمالي */}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <span className="text-4xl font-extrabold">{item.total}</span>
            <span className="text-sm text-white/60 ms-2">مراقب</span>
          </div>
          <span className="text-sm font-semibold bg-white/20 px-2.5 py-1 rounded-lg">
            {pct}٪ من الكل
          </span>
        </div>

        {/* شريط النسبة */}
        <div className="mt-3 h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-white/70 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* ── جسم البطاقة: تفصيل الألقاب ── */}
      <CardContent className={cn("p-4 space-y-2.5", cfg.softBg)}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          تفصيل الألقاب العلمية
        </p>

        {item.titles.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">لا يوجد</p>
        ) : (
          item.titles.map((t) => {
            const titlePct = item.total > 0 ? Math.round((t.count / item.total) * 100) : 0;
            return (
              <div key={t.title} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{t.title}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      cfg.badge
                    )}>
                      {t.count}
                    </span>
                    <span className="text-xs text-muted-foreground w-8 text-end">
                      {titlePct}٪
                    </span>
                  </div>
                </div>
                {/* شريط التقدم */}
                <div className="h-1.5 w-full rounded-full bg-border/60 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", cfg.bar)}
                    style={{ width: `${titlePct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// ── skeleton لبطاقة الشهادة ────────────────────────────────────────────────
function DegreeCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="p-5 bg-muted/40 space-y-3">
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-28" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DashboardView() {
  const { data, isLoading } = useDashboard();
  const { user } = useAuth();
  const greeting = getGreeting();

  return (
    <div className="space-y-6">

      {/* ── Welcome banner ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-blue-600 to-blue-800 p-6 text-white shadow-lg">
        <div className="relative z-10">
          <p className="text-sm text-blue-100/80">{greeting},</p>
          <h2 className="mt-1 text-2xl font-bold">
            {user?.fullName ?? "بالنظام"}
          </h2>
          <p className="mt-2 text-sm text-blue-100/70 max-w-md">
            مرحباً بك في لوحة التحكم. يمكنك من هنا إدارة المدرّسين والقاعات والامتحانات وإجراء عمليات التوزيع.
          </p>
        </div>
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-8 -end-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-12 -end-4 h-56 w-56 rounded-full bg-white/5" />
      </div>

      {/* ── Stat cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="التدريسيون"
          value={data?.total_teachers ?? 0}
          icon={Users}
          description="إجمالي أعضاء هيئة التدريس"
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          loading={isLoading}
        />
        <StatCard
          title="القاعات"
          value={data?.total_classrooms ?? 0}
          icon={DoorOpen}
          description="قاعات الامتحانات المتاحة"
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          loading={isLoading}
        />
        <StatCard
          title="الامتحانات"
          value={data?.total_exams ?? 0}
          icon={BookOpen}
          description="سجلات الامتحانات المضافة"
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-100 dark:bg-amber-900/30"
          loading={isLoading}
        />
        <StatCard
          title="عمليات التوزيع"
          value={data?.batches?.length ?? 0}
          icon={CalendarCheck}
          description="دفعات التوزيع المنفّذة"
          iconColor="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          loading={isLoading}
        />
      </div>

      {/* ── Teacher breakdown by degree ─────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            تفصيل هيئة التدريس حسب الشهادة
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {isLoading ? (
            <>
              <DegreeCardSkeleton />
              <DegreeCardSkeleton />
              <DegreeCardSkeleton />
            </>
          ) : !data?.teacher_breakdown?.length ? (
            <div className="md:col-span-3 flex flex-col items-center justify-center py-12 text-center">
              <GraduationCap className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">لا توجد بيانات تدريسيين حتى الآن</p>
            </div>
          ) : (
            data.teacher_breakdown.map((item) => (
              <DegreeCard
                key={item.degree}
                item={item}
                totalTeachers={data.total_teachers}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Quick actions + Recent batches (side by side on lg) ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Quick actions */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "إنشاء توزيع جديد",  href: "/distributions", color: "bg-blue-600"   },
              { label: "إضافة تدريسي",       href: "/teachers",     color: "bg-emerald-600" },
              { label: "إضافة قاعة",         href: "/classrooms",   color: "bg-amber-600"   },
              { label: "إضافة امتحان",       href: "/exams",        color: "bg-purple-600"  },
            ].map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${action.color}`} />
                    <span className="text-sm font-medium">{action.label}</span>
                  </div>
                  <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors rtl:rotate-180" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent batches */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">آخر عمليات التوزيع</CardTitle>
            <Button variant="ghost" size="sm" asChild className="h-7 text-xs gap-1">
              <Link href="/distributions">
                عرض الكل
                <ArrowLeft className="h-3 w-3 rtl:rotate-180" />
              </Link>
            </Button>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : !data?.batches?.length ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <TrendingUp className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">لا توجد عمليات توزيع حتى الآن</p>
                <Button size="sm" className="mt-3 gap-1.5" asChild>
                  <Link href="/distributions">
                    <CalendarCheck className="h-3.5 w-3.5" />
                    إنشاء أول توزيع
                  </Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border -mx-1">
                {data.batches.slice(0, 6).map((batch) => (
                  <li
                    key={batch.id}
                    className="flex items-center gap-3 px-1 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                      #{batch.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {formatDate(batch.date)}
                        <span className="text-muted-foreground font-normal ms-2">
                          — {batch.time}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {batch.classrooms_count} قاعة
                        <span className="mx-1">·</span>
                        {batch.teachers_count} مراقب
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {batch.assignments?.length ?? 0} تعيين
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
