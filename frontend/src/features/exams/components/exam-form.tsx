"use client";

import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useClassroomOptions } from "@/features/classrooms/hooks";
import type { Exam, ExamFormData } from "@/types";

const timeEntrySchema = z.object({
  value: z.string().min(1, "الوقت مطلوب"),
});

const schema = z.object({
  exam: z.string().min(1, "اسم الامتحان مطلوب"),
  date: z.string().min(1, "التاريخ مطلوب"),
  times: z.array(timeEntrySchema).min(1, "يجب إضافة وقت واحد على الأقل"),
  classroom: z.coerce.number().optional().nullable(),
  lang: z.string().default("ar"),
});

type FormValues = z.infer<typeof schema>;

interface ExamFormProps {
  defaultValues?: Partial<Exam>;
  isEditing?: boolean;
  onSubmit: (data: ExamFormData) => void;
  isLoading?: boolean;
  onCancel: () => void;
}

export function ExamForm({ defaultValues, isEditing = false, onSubmit, isLoading, onCancel }: ExamFormProps) {
  const { data: classroomOptions } = useClassroomOptions();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      exam: defaultValues?.exam ?? "",
      date: defaultValues?.date ?? "",
      times: defaultValues?.time
        ? [{ value: defaultValues.time }]
        : [{ value: "" }],
      classroom: defaultValues?.classroom_id ?? null,
      lang: defaultValues?.lang ?? "ar",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "times",
  });

  const handleFormSubmit = (values: FormValues) => {
    const timeValues = values.times.map((t) => t.value);
    onSubmit({
      exam: values.exam,
      date: values.date,
      // Edit: single string; Create: array (backend creates one row per time)
      time: isEditing ? timeValues[0] : timeValues,
      classroom: values.classroom ?? null,
      lang: values.lang,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Exam name */}
        <FormField
          control={form.control}
          name="exam"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم الامتحان / المادة</FormLabel>
              <FormControl>
                <Input {...field} placeholder="مثال: رياضيات — المرحلة الثانية" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>التاريخ</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Times (multi in create mode, single in edit mode) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <FormLabel>
              {isEditing ? "الوقت" : "أوقات الامتحان"}
            </FormLabel>
            {!isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => append({ value: "" })}
              >
                <Plus className="h-3 w-3" />
                إضافة وقت
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {fields.map((field, index) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`times.${index}.value`}
                render={({ field: inputField }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input {...inputField} type="time" className="flex-1" />
                      </FormControl>
                      {!isEditing && fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>

          {!isEditing && fields.length > 1 && (
            <p className="text-xs text-muted-foreground">
              سيتم إنشاء سجل امتحان منفصل لكل وقت
            </p>
          )}
        </div>

        {/* Classroom */}
        <FormField
          control={form.control}
          name="classroom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>القاعة (اختياري)</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))}
                defaultValue={field.value ? String(field.value) : "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر قاعة" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">بدون قاعة</SelectItem>
                  {classroomOptions?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      قاعة {c.room_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            إلغاء
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "جارٍ الحفظ..." : "حفظ"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
