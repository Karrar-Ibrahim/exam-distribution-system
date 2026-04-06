"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { SystemUser } from "@/types";

const createSchema = z.object({
  name:      z.string().min(2, "الاسم مطلوب (حرفان على الأقل)"),
  email:     z.string().email("البريد الإلكتروني غير صالح"),
  password:  z.string().min(6, "كلمة المرور 6 أحرف على الأقل"),
  role:      z.enum(["super", "admin"]).default("admin"),
  lang:      z.string().default("ar"),
  is_active: z.boolean().default(true),
});

const editSchema = createSchema.extend({
  password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل").or(z.literal("")).optional(),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues   = z.infer<typeof editSchema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: SystemUser | null;
  onSubmit: (data: CreateValues | EditValues) => void;
  isLoading?: boolean;
  isSuperUser: boolean;
}

export function UserFormDialog({ open, onOpenChange, editing, onSubmit, isLoading, isSuperUser }: Props) {
  const isEdit = !!editing;

  const form = useForm<EditValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: {
      name:      "",
      email:     "",
      password:  "",
      role:      "admin",
      lang:      "ar",
      is_active: true,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editing) {
      form.reset({
        name:      editing.name,
        email:     editing.email,
        password:  "",
        role:      editing.role,
        lang:      editing.lang,
        is_active: editing.is_active,
      });
    } else {
      form.reset({ name: "", email: "", password: "", role: "admin", lang: "ar", is_active: true });
    }
  }, [editing, open]);

  function handleClose() {
    form.reset();
    onOpenChange(false);
  }

  function handleSubmit(values: EditValues) {
    // Strip empty password on edit
    if (isEdit && !values.password) {
      const { password, ...rest } = values;
      onSubmit(rest as EditValues);
    } else {
      onSubmit(values);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل مستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

            {/* Name */}
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>الاسم الكامل</FormLabel>
                <FormControl><Input placeholder="أدخل الاسم" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Email */}
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>البريد الإلكتروني</FormLabel>
                <FormControl><Input type="email" dir="ltr" placeholder="user@example.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Password */}
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>{isEdit ? "كلمة المرور الجديدة (اتركها فارغة إن لم تغيّرها)" : "كلمة المرور"}</FormLabel>
                <FormControl><Input type="password" dir="ltr" placeholder="••••••••" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Role — only super can assign super role */}
            {isSuperUser && (
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>الدور</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="اختر الدور" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">مدير</SelectItem>
                      <SelectItem value="super">مدير النظام</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {/* Active toggle (edit only) */}
            {isEdit && (
              <FormField control={form.control} name="is_active" render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <Label className="cursor-pointer" onClick={() => field.onChange(!field.value)}>
                      الحساب نشط
                    </Label>
                  </div>
                </FormItem>
              )} />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>إلغاء</Button>
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
