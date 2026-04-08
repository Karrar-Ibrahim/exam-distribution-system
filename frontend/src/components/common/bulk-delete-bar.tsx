"use client";

import React from "react";
import { Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BulkDeleteBarProps {
  selectedCount: number;
  onDelete: () => void;
  onClear: () => void;
  isDeleting?: boolean;
  className?: string;
}

export function BulkDeleteBar({
  selectedCount,
  onDelete,
  onClear,
  isDeleting = false,
  className,
}: BulkDeleteBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border border-primary/30",
        "bg-primary/5 px-4 py-2.5 animate-in fade-in slide-in-from-top-1 duration-200",
        className
      )}
    >
      {/* عدد المحدَّدين */}
      <div className="flex items-center gap-2 text-sm">
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
          {selectedCount}
        </span>
        <span className="text-foreground font-medium">
          {selectedCount === 1 ? "عنصر محدَّد" : "عناصر محدَّدة"}
        </span>
      </div>

      {/* أزرار */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={onClear}
          disabled={isDeleting}
        >
          <X className="h-3.5 w-3.5" />
          إلغاء التحديد
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          حذف المحدَّدين
        </Button>
      </div>
    </div>
  );
}
