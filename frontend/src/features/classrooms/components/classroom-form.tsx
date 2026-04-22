"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Classroom, ClassroomFormData } from "@/types";

const schema = z.object({
  room_number: z.string().min(1, "رقم القاعة مطلوب"),
  location: z.string().default(""),
  capacity: z.coerce.number().min(1, "السعة يجب أن تكون أكبر من 0"),
  num_invigilators: z.coerce.number().min(1, "عدد المراقبين يجب أن يكون 1 على الأقل"),
  lang: z.string().default("ar"),
});

type FormValues = z.infer<typeof schema>;

interface ClassroomFormProps {
  defaultValues?: Partial<Classroom>;
  onSubmit: (data: ClassroomFormData) => void;
  isLoading?: boolean;
  onCancel: () => void;
}

export function ClassroomForm({ defaultValues, onSubmit, isLoading, onCancel }: ClassroomFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      room_number: defaultValues?.room_number ?? "",
      location: defaultValues?.location ?? "",
      capacity: defaultValues?.capacity ?? 30,
      num_invigilators: defaultValues?.num_invigilators ?? 2,
      lang: defaultValues?.lang ?? "ar",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="room_number" render={({ field }) => (
          <FormItem>
            <FormLabel>رقم القاعة / الاسم</FormLabel>
            <FormControl><Input {...field} placeholder="مثال: A101" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="location" render={({ field }) => (
          <FormItem>
            <FormLabel>مكان القاعة</FormLabel>
            <FormControl><Input {...field} placeholder="مثال: الطابق الثاني - بناية العلوم" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="capacity" render={({ field }) => (
            <FormItem>
              <FormLabel>السعة الاستيعابية</FormLabel>
              <FormControl><Input {...field} type="number" min={1} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="num_invigilators" render={({ field }) => (
            <FormItem>
              <FormLabel>عدد المراقبين</FormLabel>
              <FormControl><Input {...field} type="number" min={1} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>إلغاء</Button>
          <Button type="submit" disabled={isLoading}>{isLoading ? "جارٍ الحفظ..." : "حفظ"}</Button>
        </div>
      </form>
    </Form>
  );
}
