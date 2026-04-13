"use client";

import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X, DoorOpen, Zap, GraduationCap, CalendarDays, Clock4,
  Settings2, RefreshCcw, CheckSquare, Square, Search,
  Users, LayoutGrid, CheckCheck,
} from "lucide-react";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useClassroomOptions } from "@/features/classrooms/hooks";
import type { ClassroomOption, DistributionCreateData } from "@/types";
import { cn } from "@/lib/utils";

// ─── Schema ──────────────────────────────────────────────────────────────────
const schema = z.object({
  date:                   z.string().min(1, "التاريخ مطلوب"),
  time:                   z.string().min(1, "الفترة / الوقت مطلوب"),
  classroom_ids:          z.array(z.number()).default([]),
  lang:                   z.string().default("ar"),
  periodic_distribution:  z.boolean().default(true),
  require_phd_first_slot: z.boolean().default(true),
});
type FormValues = z.infer<typeof schema>;

// ─── Props ───────────────────────────────────────────────────────────────────
interface DistributionFormProps {
  onSubmit:   (data: DistributionCreateData) => void;
  isLoading?: boolean;
  onCancel?:  () => void;
}

// ─── Classroom Picker Dialog ─────────────────────────────────────────────────
interface ClassroomPickerProps {
  open:        boolean;
  onClose:     () => void;
  classrooms:  ClassroomOption[];
  selectedIds: Set<number>;
  onToggle:    (room: ClassroomOption) => void;
  onSelectAll: () => void;
  onClearAll:  () => void;
}

function ClassroomPickerDialog({
  open, onClose, classrooms, selectedIds, onToggle, onSelectAll, onClearAll,
}: ClassroomPickerProps) {
  const [search, setSearch] = useState("");

  // ترتيب أبجدي مع دعم الأرقام + فلترة البحث
  const sorted = useMemo(() =>
    [...classrooms]
      .sort((a, b) =>
        a.room_number.localeCompare(b.room_number, "ar", { numeric: true, sensitivity: "base" })
      )
      .filter((r) => r.room_number.toLowerCase().includes(search.toLowerCase())),
    [classrooms, search]
  );

  const allSelected   = classrooms.length > 0 && classrooms.every((r) => selectedIds.has(r.id));
  const selectedCount = selectedIds.size;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl w-full p-0 gap-0 overflow-hidden flex flex-col" style={{ maxHeight: "88vh" }}>

        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b bg-muted/30 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <LayoutGrid className="h-5 w-5 text-primary" />
            اختيار القاعات
            {selectedCount > 0 && (
              <Badge variant="default" className="text-xs px-2">
                {selectedCount} مختار
              </Badge>
            )}
          </DialogTitle>

          {/* بحث + تحديد الكل */}
          <div className="flex items-center gap-3 mt-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث عن رقم قاعة..."
                className="pr-9 h-9 text-sm"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              type="button"
              variant={allSelected ? "secondary" : "outline"}
              size="sm"
              onClick={allSelected ? onClearAll : onSelectAll}
              className="shrink-0 gap-1.5 text-xs h-9"
            >
              {allSelected ? (
                <><X className="h-3.5 w-3.5" />إلغاء الكل</>
              ) : (
                <><CheckCheck className="h-3.5 w-3.5" />تحديد الكل</>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-1.5">
            {classrooms.length} قاعة إجمالاً
            {search && ` · ${sorted.length} نتيجة`}
            {selectedCount > 0 && ` · ${selectedCount} مختارة`}
          </p>
        </DialogHeader>

        {/* ── شبكة القاعات ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <DoorOpen className="h-12 w-12 opacity-20" />
              <p className="text-sm font-medium">
                {search ? "لا توجد قاعات بهذا الرقم" : "لا توجد قاعات مضافة"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {sorted.map((room) => {
                const selected = selectedIds.has(room.id);
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => onToggle(room)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-sm transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected
                        ? "border-primary bg-primary/10 shadow-sm shadow-primary/15"
                        : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    {/* مربع الاختيار */}
                    <span className="absolute top-2 right-2">
                      {selected ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground/30" />
                      )}
                    </span>

                    {/* أيقونة القاعة */}
                    <DoorOpen className={cn(
                      "h-8 w-8 mt-1",
                      selected ? "text-primary" : "text-muted-foreground/60"
                    )} />

                    {/* رقم القاعة */}
                    <span className={cn(
                      "font-bold text-lg leading-none text-center",
                      selected ? "text-primary" : "text-foreground"
                    )}>
                      {room.room_number}
                    </span>

                    {/* تفاصيل صغيرة */}
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={cn(
                        "text-xs flex items-center gap-1",
                        selected ? "text-primary/70" : "text-muted-foreground"
                      )}>
                        <Users className="h-2.5 w-2.5" />
                        {room.capacity} طالب
                      </span>
                      <span className={cn(
                        "text-xs",
                        selected ? "text-primary/70" : "text-muted-foreground"
                      )}>
                        {room.num_invigilators} مراقب
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t bg-muted/20 flex items-center justify-between gap-3 shrink-0">
          <p className="text-sm text-muted-foreground">
            {selectedCount === 0
              ? "لم تُختَر قاعات — سيتم التوزيع على جميع القاعات"
              : `تم اختيار ${selectedCount} من ${classrooms.length} قاعة`}
          </p>
          <Button onClick={onClose} className="gap-1.5">
            <CheckCheck className="h-4 w-4" />
            تأكيد الاختيار
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Distribution Form ────────────────────────────────────────────────────────
export function DistributionForm({ onSubmit, isLoading, onCancel }: DistributionFormProps) {
  const { data: classroomOptions = [] } = useClassroomOptions();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [pickerOpen, setPickerOpen]   = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: "", time: "", classroom_ids: [], lang: "ar",
      periodic_distribution: true, require_phd_first_slot: true,
    },
  });

  const periodicMode = form.watch("periodic_distribution");
  const requirePhd   = form.watch("require_phd_first_slot");

  const toggleRoom = (room: ClassroomOption) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(room.id) ? next.delete(room.id) : next.add(room.id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(classroomOptions.map((r) => r.id)));
  const clearAll  = () => setSelectedIds(new Set());

  // القاعات المختارة مرتبة أبجدياً للعرض في الـ chips
  const selectedRooms = useMemo(() =>
    classroomOptions
      .filter((r) => selectedIds.has(r.id))
      .sort((a, b) => a.room_number.localeCompare(b.room_number, "ar", { numeric: true })),
    [classroomOptions, selectedIds]
  );

  const handleSubmit = (values: FormValues) => {
    onSubmit({ ...values, classroom_ids: Array.from(selectedIds) });
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">

          {/* ── Section 1: Date + Time ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              الجدول الزمني
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">التاريخ</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" className="text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="time" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs flex items-center gap-1">
                    <Clock4 className="h-3 w-3" />
                    الفترة
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="صباحي أو 09:00" className="text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          <Separator />

          {/* ── Section 2: Options ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Settings2 className="h-3.5 w-3.5" />
              خيارات التوزيع
            </p>

            <FormField control={form.control} name="periodic_distribution" render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-3 rounded-xl border p-3 bg-muted/30">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                  </FormControl>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {periodicMode ? "توزيع دوري" : "توزيع عشوائي"}
                      </span>
                      {periodicMode ? (
                        <Badge variant="default" className="text-xs h-4 px-1.5">دوري</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs h-4 px-1.5 gap-1">
                          <RefreshCcw className="h-2.5 w-2.5" />عشوائي
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {periodicMode
                        ? "يختار المراقبين حسب الأقل توزيعاً — لضمان التوزيع العادل"
                        : "يختار المراقبين بشكل عشوائي من القائمة"}
                    </p>
                  </div>
                </div>
              </FormItem>
            )} />

            <FormField control={form.control} name="require_phd_first_slot" render={({ field }) => (
              <FormItem>
                <div className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 transition-colors",
                  requirePhd ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"
                )}>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                  </FormControl>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <GraduationCap className={cn("h-4 w-4", requirePhd ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-sm font-medium">دكتوراه في الخانة الأولى</span>
                      <Badge variant={requirePhd ? "default" : "outline"} className="text-xs h-4 px-1.5">
                        {requirePhd ? "مفعّل" : "معطّل"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {requirePhd
                        ? "يُعيَّن مراقب بدرجة دكتوراه في الخانة الأولى من كل قاعة"
                        : "يُختار المراقب الأول بحرية دون اشتراط الدكتوراه"}
                    </p>
                  </div>
                </div>
              </FormItem>
            )} />
          </div>

          <Separator />

          {/* ── Section 3: Classrooms ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <DoorOpen className="h-3.5 w-3.5" />
              القاعات
            </p>

            {/* زر فتح نافذة الاختيار */}
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className={cn(
                "w-full flex items-center justify-between gap-3 rounded-xl border-2 border-dashed px-4 py-3.5 transition-all text-sm",
                selectedIds.size > 0
                  ? "border-primary/50 bg-primary/5 hover:bg-primary/8"
                  : "border-border hover:border-primary/40 hover:bg-muted/40"
              )}
            >
              <div className="flex items-center gap-2.5">
                <LayoutGrid className={cn(
                  "h-5 w-5",
                  selectedIds.size > 0 ? "text-primary" : "text-muted-foreground"
                )} />
                <div className="text-start">
                  <p className={cn(
                    "font-medium",
                    selectedIds.size > 0 ? "text-primary" : "text-muted-foreground"
                  )}>
                    {selectedIds.size > 0
                      ? `${selectedIds.size} قاعة مختارة`
                      : "اختيار القاعات"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedIds.size > 0
                      ? `من إجمالي ${classroomOptions.length} قاعة`
                      : "اضغط لفتح نافذة الاختيار"}
                  </p>
                </div>
              </div>
              <Badge variant={selectedIds.size > 0 ? "default" : "outline"} className="shrink-0">
                {selectedIds.size > 0 ? selectedIds.size : "الكل"}
              </Badge>
            </button>

            {/* القاعات المختارة كـ chips */}
            {selectedRooms.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-muted/30 rounded-lg border max-h-28 overflow-y-auto">
                {selectedRooms.map((r) => (
                  <Badge key={r.id} variant="secondary" className="gap-1 pe-1 text-xs font-medium">
                    {r.room_number}
                    <button
                      type="button"
                      onClick={() => toggleRoom(r)}
                      className="hover:text-destructive transition-colors ms-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {selectedIds.size === 0
                ? "إذا لم تختر قاعات، سيتم التوزيع على جميع القاعات المتاحة"
                : `تم اختيار ${selectedIds.size} من ${classroomOptions.length} قاعة`}
            </p>
          </div>

          {/* ── Submit ── */}
          <div className={cn("flex gap-2 pt-1", onCancel ? "justify-end" : "")}>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                إلغاء
              </Button>
            )}
            <Button type="submit" disabled={isLoading} className={cn(!onCancel && "w-full")}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  جارٍ التوزيع...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  تنفيذ التوزيع
                </span>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* ── نافذة اختيار القاعات ── */}
      <ClassroomPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        classrooms={classroomOptions}
        selectedIds={selectedIds}
        onToggle={toggleRoom}
        onSelectAll={selectAll}
        onClearAll={clearAll}
      />
    </>
  );
}
