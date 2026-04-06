"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, DoorOpen, Clock, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeacherStat } from "@/types";

interface TeacherDetailModalProps {
  teacher: TeacherStat | null;
  open: boolean;
  onClose: () => void;
}

const degreeConfig: Record<
  string,
  { label: string; className: string }
> = {
  دكتوراه: {
    label: "دكتوراه",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
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

function getCountColor(count: number) {
  if (count >= 7) return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  if (count >= 4) return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
}

export function TeacherDetailModal({
  teacher,
  open,
  onClose,
}: TeacherDetailModalProps) {
  if (!teacher) return null;

  const degree = degreeConfig[teacher.degree] ?? {
    label: teacher.degree,
    className: "bg-gray-100 text-gray-700",
  };

  const dates = teacher.assignments.map((a) => a.date).filter(Boolean);
  const firstDate = dates.length > 0 ? dates[dates.length - 1] : null;
  const lastDate = dates.length > 0 ? dates[0] : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30 rounded-t-lg">
          <DialogTitle className="text-lg font-bold leading-snug">
            {teacher.formatted_name}
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">{teacher.title}</span>
            <span className="text-muted-foreground">·</span>
            <Badge
              variant="secondary"
              className={cn("text-xs font-medium", degree.className)}
            >
              {degree.label}
            </Badge>
          </div>
        </DialogHeader>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b">
          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted/40">
            <Award className="h-5 w-5 text-amber-500" />
            <span
              className={cn(
                "text-2xl font-bold",
                teacher.total_count >= 7
                  ? "text-red-600"
                  : teacher.total_count >= 4
                  ? "text-amber-600"
                  : "text-blue-600"
              )}
            >
              {teacher.total_count}
            </span>
            <span className="text-xs text-muted-foreground">إجمالي المرات</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted/40">
            <CalendarDays className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-semibold text-foreground">
              {firstDate ?? "—"}
            </span>
            <span className="text-xs text-muted-foreground">أول مراقبة</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted/40">
            <CalendarDays className="h-5 w-5 text-green-500" />
            <span className="text-sm font-semibold text-foreground">
              {lastDate ?? "—"}
            </span>
            <span className="text-xs text-muted-foreground">آخر مراقبة</span>
          </div>
        </div>

        {/* ── Assignments Table ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {teacher.assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <CalendarDays className="h-10 w-10 opacity-30" />
              <p className="text-sm">لا توجد بيانات مراقبة</p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold text-foreground w-8 text-center">
                      #
                    </TableHead>
                    <TableHead className="font-semibold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        التاريخ
                      </span>
                    </TableHead>
                    <TableHead className="font-semibold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <DoorOpen className="h-3.5 w-3.5" />
                        القاعة
                      </span>
                    </TableHead>
                    <TableHead className="font-semibold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        الوقت
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacher.assignments.map((asgn, idx) => (
                    <TableRow
                      key={asgn.id}
                      className={
                        idx % 2 === 0
                          ? "bg-background"
                          : "bg-muted/20"
                      }
                    >
                      <TableCell className="text-center text-xs text-muted-foreground font-mono">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">{asgn.date}</TableCell>
                      <TableCell>{asgn.room_label}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {asgn.time}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
