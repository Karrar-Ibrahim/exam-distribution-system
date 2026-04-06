"use client";

import React, { useEffect, useState } from "react";
import { Shield, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useUserPermissions, useUpdateUserPermissions } from "../hooks";
import type { SystemUser, ModulePermission } from "@/types";

const MODULE_LABELS: Record<string, string> = {
  Dashboards:          "لوحة التحكم",
  classroom:           "القاعات",
  exams:               "الامتحانات",
  teaching_management: "التدريسيون",
  teachers_divide:     "التوزيع",
  users:               "المستخدمون",
  setting:             "الإعدادات",
};

const PERM_COLS: { key: keyof ModulePermission; label: string }[] = [
  { key: "can_show",   label: "عرض"   },
  { key: "can_add",    label: "إضافة"  },
  { key: "can_edit",   label: "تعديل"  },
  { key: "can_delete", label: "حذف"   },
  { key: "can_posted", label: "نشر"   },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: SystemUser | null;
}

export function PermissionsDialog({ open, onOpenChange, user }: Props) {
  const { data: serverPerms, isLoading } = useUserPermissions(open && user ? user.id : null);
  const updateMutation = useUpdateUserPermissions();

  const [perms, setPerms] = useState<ModulePermission[]>([]);

  useEffect(() => {
    if (serverPerms) setPerms(serverPerms);
  }, [serverPerms]);

  function toggle(moduleName: string, key: keyof ModulePermission) {
    setPerms((prev) =>
      prev.map((p) =>
        p.name === moduleName ? { ...p, [key]: !p[key as string] } : p
      )
    );
  }

  function toggleRow(moduleName: string, checked: boolean) {
    setPerms((prev) =>
      prev.map((p) =>
        p.name === moduleName
          ? { ...p, can_show: checked, can_add: checked, can_edit: checked, can_delete: checked, can_posted: checked }
          : p
      )
    );
  }

  function handleSave() {
    if (!user) return;
    updateMutation.mutate(
      { userId: user.id, permissions: perms },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  const boolVal = (p: ModulePermission, key: keyof ModulePermission) => p[key] as boolean;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            صلاحيات: {user?.name}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-2 pe-4 font-semibold text-muted-foreground w-40">الوحدة</th>
                  <th className="text-center py-2 px-2 font-semibold text-muted-foreground w-16">الكل</th>
                  {PERM_COLS.map((col) => (
                    <th key={col.key} className="text-center py-2 px-2 font-semibold text-muted-foreground w-16">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {perms.map((perm) => {
                  const allOn = PERM_COLS.every((c) => boolVal(perm, c.key));
                  return (
                    <tr key={perm.name} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-3 pe-4 font-medium">
                        {MODULE_LABELS[perm.name] ?? perm.name}
                      </td>
                      {/* Toggle all */}
                      <td className="text-center py-3 px-2">
                        <div className="flex justify-center">
                          <Switch
                            checked={allOn}
                            onCheckedChange={(v) => toggleRow(perm.name, v)}
                            className="scale-90"
                          />
                        </div>
                      </td>
                      {PERM_COLS.map((col) => (
                        <td key={col.key} className="text-center py-3 px-2">
                          <div className="flex justify-center">
                            <Switch
                              checked={boolVal(perm, col.key)}
                              onCheckedChange={() => toggle(perm.name, col.key)}
                              className="scale-90"
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updateMutation.isPending}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={isLoading || updateMutation.isPending}>
            {updateMutation.isPending ? "جارٍ الحفظ..." : "حفظ الصلاحيات"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
