"use client";

import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useTeachers } from "@/features/teachers/hooks";
import type { Teacher } from "@/types";

const schema = z.object({
  teacher_id: z.number({ required_error: "يجب اختيار مراقب" }),
  date: z.string().min(1, "التاريخ مطلوب"),
  reason: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: FormValues) => void;
  isLoading?: boolean;
}

export function ExclusionFormDialog({ open, onOpenChange, onSubmit, isLoading }: Props) {
  const [teacherSearch, setTeacherSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: teachersData } = useTeachers({
    search: teacherSearch,
    itemsPerPage: 20,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: "" },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleClose() {
    form.reset();
    setSelectedTeacher(null);
    setTeacherSearch("");
    setShowDropdown(false);
    onOpenChange(false);
  }

  function handleSubmit(values: FormValues) {
    onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة استثناء مراقب</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

            {/* Teacher picker */}
            <FormField
              control={form.control}
              name="teacher_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المراقب</FormLabel>
                  <FormControl>
                    <div ref={dropdownRef} className="relative">
                      <Input
                        placeholder="ابحث باسم المراقب..."
                        value={selectedTeacher ? selectedTeacher.formatted_name : teacherSearch}
                        onChange={(e) => {
                          setTeacherSearch(e.target.value);
                          setSelectedTeacher(null);
                          field.onChange(undefined);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        autoComplete="off"
                      />
                      {showDropdown && teachersData && teachersData.results.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
                          {teachersData.results.map((teacher) => (
                            <button
                              key={teacher.id}
                              type="button"
                              className="w-full text-right px-3 py-2 text-sm hover:bg-accent cursor-pointer flex flex-col"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setSelectedTeacher(teacher);
                                field.onChange(teacher.id);
                                setTeacherSearch("");
                                setShowDropdown(false);
                              }}
                            >
                              <span className="font-medium">{teacher.formatted_name}</span>
                              <span className="text-xs text-muted-foreground">{teacher.title} — {teacher.degree}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {showDropdown && teacherSearch && teachersData?.results.length === 0 && (
                        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md px-3 py-2 text-sm text-muted-foreground">
                          لا توجد نتائج
                        </div>
                      )}
                    </div>
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
                  <FormLabel>تاريخ الاستثناء</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>السبب (اختياري)</FormLabel>
                  <FormControl>
                    <Input placeholder="سبب الاستثناء..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "جارٍ الحفظ..." : "حفظ"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
