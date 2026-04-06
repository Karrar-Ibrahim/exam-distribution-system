"use client";

import React from "react";
import {
  Calendar, Clock, DoorOpen, Users, FileDown,
  CheckCircle2, Circle, GraduationCap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import type { DistributionBatch, DistributionAssignment } from "@/types";

interface BatchDetailModalProps {
  batch: DistributionBatch;
  open: boolean;
  onClose: () => void;
  onExport: (id: number) => void;
  isExporting?: boolean;
}

function groupByRoom(
  assignments: DistributionAssignment[]
): Record<string, DistributionAssignment[]> {
  return assignments.reduce<Record<string, DistributionAssignment[]>>(
    (acc, a) => {
      const key = a.room_label || "بدون قاعة";
      if (!acc[key]) acc[key] = [];
      acc[key].push(a);
      return acc;
    },
    {}
  );
}

export function BatchDetailModal({
  batch,
  open,
  onClose,
  onExport,
  isExporting,
}: BatchDetailModalProps) {
  const byRoom = groupByRoom(batch.assignments ?? []);
  const roomKeys = Object.keys(byRoom);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                #{batch.id}
              </div>
              <div>
                <DialogTitle className="text-lg">تفاصيل دفعة التوزيع</DialogTitle>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(batch.date)}
                  </span>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {batch.time}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              onClick={() => onExport(batch.id)}
              disabled={isExporting}
            >
              <FileDown className="h-4 w-4" />
              تصدير Excel
            </Button>
          </div>

          {/* Summary badges */}
          <div className="flex items-center gap-3 pt-3 flex-wrap">
            <div className="flex items-center gap-1.5 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm">
              <DoorOpen className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{batch.classrooms_count}</span>
              <span className="text-muted-foreground">قاعة</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm">
              <Users className="h-4 w-4 text-emerald-500" />
              <span className="font-medium">{batch.teachers_count}</span>
              <span className="text-muted-foreground">مراقب</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm">
              <GraduationCap className="h-4 w-4 text-purple-500" />
              <span className="font-medium">{batch.assignments?.length ?? 0}</span>
              <span className="text-muted-foreground">تعيين</span>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* ── Body ── */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-6 py-4 space-y-5">
            {roomKeys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <DoorOpen className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">لا توجد تعيينات في هذه الدفعة</p>
              </div>
            ) : (
              roomKeys.map((room) => {
                const assignments = byRoom[room];
                const activeCount = assignments.filter((a) => a.active).length;

                return (
                  <div key={room} className="rounded-xl border overflow-hidden">
                    {/* Room header */}
                    <div className="flex items-center justify-between bg-muted/40 px-4 py-3 border-b">
                      <div className="flex items-center gap-2">
                        <DoorOpen className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">قاعة {room}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeCount > 0 && (
                          <Badge variant="success" className="gap-1 text-xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {activeCount} نشط
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {assignments.length} مراقب
                        </Badge>
                      </div>
                    </div>

                    {/* Teachers list */}
                    <div className="divide-y divide-border">
                      {assignments.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {a.active ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {a.teacher_formatted_name || a.teacher_name}
                              </p>
                              {a.degree && (
                                <p className="text-xs text-muted-foreground">
                                  {a.degree}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ms-3">
                            <Badge
                              variant={a.type === 2 ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {a.type === 2 ? "أستاذ" : "مدرّس"}
                            </Badge>
                            {a.count > 0 && (
                              <span className="text-xs text-muted-foreground tabular-nums">
                                ×{a.count}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
