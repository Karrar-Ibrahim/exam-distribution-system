"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, DoorOpen, Zap, RefreshCcw, CalendarDays, Clock4 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useClassroomOptions } from "@/features/classrooms/hooks";
import type { ClassroomOption, DistributionCreateData } from "@/types";
import { cn } from "@/lib/utils";

const schema = z.object({
  date: z.string().min(1, "التاريخ مطلوب"),
  time: z.string().min(1, "الفترة / الوقت مطلوب"),
  classroom_ids: z.array(z.number()).default([]),
  lang: z.string().default("ar"),
  periodic_distribution: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

interface DistributionFormProps {
  onSubmit: (data: DistributionCreateData) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function DistributionForm({ onSubmit, isLoading, onCancel }: DistributionFormProps) {
  const { data: classroomOptions = [] } = useClassroomOptions();
  const [selectedRooms, setSelectedRooms] = useState<ClassroomOption[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: "",
      time: "",
      classroom_ids: [],
      lang: "ar",
      periodic_distribution: true,
    },
  });

  const periodicMode = form.watch("periodic_distribution");

  const toggleRoom = (room: ClassroomOption) => {
    setSelectedRooms((prev) => {
      const exists = prev.find((r) => r.id === room.id);
      return exists ? prev.filter((r) => r.id !== room.id) : [...prev, room];
    });
  };

  const selectAll = () => setSelectedRooms([...classroomOptions]);
  const clearAll = () => setSelectedRooms([]);
  const isRoomSelected = (id: number) => selectedRooms.some((r) => r.id === id);

  const handleSubmit = (values: FormValues) => {
    onSubmit({
      ...values,
      classroom_ids: selectedRooms.map((r) => r.id),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">

        {/* ── Section 1: Date + Time ── */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            الجدول الزمني
          </p>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">التاريخ</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" className="text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
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
              )}
            />
          </div>
        </div>

        <Separator />

        {/* ── Section 2: Distribution mode ── */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            نمط التوزيع
          </p>
          <FormField
            control={form.control}
            name="periodic_distribution"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-3 rounded-xl border p-3 bg-muted/30">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
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
                          <RefreshCcw className="h-2.5 w-2.5" />
                          عشوائي
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
            )}
          />
        </div>

        <Separator />

        {/* ── Section 3: Classrooms ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <DoorOpen className="h-3.5 w-3.5" />
              القاعات
            </p>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={selectAll}
                className="text-primary hover:underline font-medium"
              >
                تحديد الكل
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-muted-foreground hover:text-foreground hover:underline"
              >
                إلغاء الكل
              </button>
            </div>
          </div>

          {/* Selected chips */}
          {selectedRooms.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
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

          {/* Classroom grid */}
          <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto rounded-xl border p-2 bg-muted/20">
            {classroomOptions.length === 0 ? (
              <div className="col-span-3 flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
                <DoorOpen className="h-6 w-6 opacity-40" />
                <p className="text-xs">لا توجد قاعات مضافة</p>
              </div>
            ) : (
              classroomOptions.map((room) => {
                const selected = isRoomSelected(room.id);
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => toggleRoom(room)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-all",
                      selected
                        ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                        : "border-border hover:border-primary/40 hover:bg-muted/60 text-muted-foreground"
                    )}
                  >
                    <DoorOpen className={cn("h-4 w-4", selected ? "text-primary" : "")} />
                    <span className="truncate w-full text-center">{room.room_number}</span>
                  </button>
                );
              })
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {selectedRooms.length === 0
              ? "إذا لم تختر قاعات، سيتم التوزيع على جميع القاعات المتاحة"
              : `تم اختيار ${selectedRooms.length} من ${classroomOptions.length} قاعة`}
          </p>
        </div>

        {/* ── Submit ── */}
        <div className={cn("flex gap-2 pt-1", onCancel ? "justify-end" : "")}>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              إلغاء
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className={cn(!onCancel && "w-full")}
          >
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
  );
}
