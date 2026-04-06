"use client";

import React from "react";
import { Trash2, FileDown, Eye, Users, DoorOpen, Calendar, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { DistributionBatch } from "@/types";

interface BatchCardProps {
  batch: DistributionBatch;
  onDelete: (id: number) => void;
  onExport: (id: number) => void;
  onViewDetails: (batch: DistributionBatch) => void;
  isDeleting?: boolean;
  isExporting?: boolean;
}

export function BatchCard({
  batch,
  onDelete,
  onExport,
  onViewDetails,
  isDeleting,
  isExporting,
}: BatchCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-200 hover:border-primary/20 group">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Batch ID badge */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-sm border border-primary/10">
            #{batch.id}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Calendar className="h-3.5 w-3.5 text-primary/70" />
                {formatDate(batch.date)}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {batch.time}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <DoorOpen className="h-3.5 w-3.5 text-blue-500" />
                <span className="font-medium text-foreground">{batch.classrooms_count}</span>
                قاعة
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-medium text-foreground">{batch.teachers_count}</span>
                مراقب
              </span>
              {(batch.assignments?.length ?? 0) > 0 && (
                <Badge variant="secondary" className="text-xs h-5">
                  {batch.assignments.length} تعيين
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onViewDetails(batch)}
              title="عرض التفاصيل"
            >
              <Eye className="h-3.5 w-3.5" />
              تفاصيل
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onExport(batch.id)}
              disabled={isExporting}
              title="تصدير Excel"
            >
              <FileDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(batch.id)}
              disabled={isDeleting}
              title="حذف الدفعة"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
