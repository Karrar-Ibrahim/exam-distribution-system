"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Teacher, TeacherFormData } from "@/types";

const teacherSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب").trim(),
  title: z.enum(["استاذ", "استاذ مساعد", "مدرس", "مدرس مساعد"], {
    required_error: "اللقب العلمي مطلوب",
  }),
  degree: z.enum(["دكتوراه", "ماجستير", "بكالوريوس"], {
    required_error: "الدرجة العلمية مطلوبة",
  }),
  lang: z.string().default("ar"),
});

type FormValues = z.infer<typeof teacherSchema>;

interface TeacherFormProps {
  defaultValues?: Partial<Teacher>;
  onSubmit: (data: TeacherFormData) => void;
  isLoading?: boolean;
  onCancel: () => void;
}

const TITLES = ["استاذ", "استاذ مساعد", "مدرس", "مدرس مساعد"] as const;
const DEGREES = ["دكتوراه", "ماجستير", "بكالوريوس"] as const;

export function TeacherForm({ defaultValues, onSubmit, isLoading, onCancel }: TeacherFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      title: defaultValues?.title,
      degree: defaultValues?.degree,
      lang: defaultValues?.lang ?? "ar",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الاسم الكامل</FormLabel>
              <FormControl>
                <Input {...field} placeholder="أدخل اسم المدرّس" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اللقب العلمي</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر اللقب العلمي" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TITLES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="degree"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الدرجة العلمية</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الدرجة العلمية" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DEGREES.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
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
