"use client";

import React, { useState } from "react";
import {
  Plus, Pencil, Trash2, Search, Shield, ShieldCheck,
  Activity, UserCheck, UserX, Clock, Monitor,
} from "lucide-react";
import { PageHeader }      from "@/components/common/page-header";
import { DataTable, type Column } from "@/components/common/data-table";
import { ConfirmDialog }   from "@/components/common/confirm-dialog";
import { Button }          from "@/components/ui/button";
import { Input }           from "@/components/ui/input";
import { Badge }           from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth }         from "@/hooks/use-auth";
import {
  useUsers, useCreateUser, useUpdateUser, useDeleteUser, useActivityLogs,
} from "../hooks";
import { UserFormDialog }    from "./user-form-dialog";
import { PermissionsDialog } from "./permissions-dialog";
import type { SystemUser, ActivityLog, SystemUserFormData } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACTION_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  login:      "default",
  logout:     "secondary",
  create:     "default",
  update:     "secondary",
  delete:     "destructive",
  export:     "outline",
  distribute: "outline",
};

const ACTION_ICON: Record<string, React.ReactNode> = {
  login:      <UserCheck className="h-3 w-3" />,
  logout:     <UserX    className="h-3 w-3" />,
  distribute: <Monitor  className="h-3 w-3" />,
  export:     <Monitor  className="h-3 w-3" />,
};

const MODULE_AR: Record<string, string> = {
  auth:                "المصادقة",
  users:               "المستخدمون",
  teaching_management: "التدريسيون",
  distributions:       "التوزيع",
  teachers_divide:     "التوزيع",
  classroom:           "القاعات",
  exams:               "الامتحانات",
};

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({ isSuperUser }: { isSuperUser: boolean }) {
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editing, setEditing]         = useState<SystemUser | null>(null);
  const [deletingId, setDeletingId]   = useState<number | null>(null);
  const [permUser, setPermUser]       = useState<SystemUser | null>(null);

  const { data, isLoading, isError, refetch } = useUsers({ page, search });
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleFormSubmit = (formData: SystemUserFormData) => {
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: formData },
        { onSuccess: () => { setDialogOpen(false); setEditing(null); } }
      );
    } else {
      createMutation.mutate(formData, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleDelete = () => {
    if (deletingId !== null) {
      deleteMutation.mutate(deletingId, { onSuccess: () => setDeletingId(null) });
    }
  };

  const columns: Column<SystemUser>[] = [
    {
      key: "name",
      label: "المستخدم",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.name}</span>
          <span className="text-xs text-muted-foreground">{row.email}</span>
        </div>
      ),
    },
    {
      key: "role",
      label: "الدور",
      render: (row) => (
        <Badge variant={row.role === "super" ? "default" : "secondary"}>
          {row.role === "super"
            ? <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> مدير النظام</span>
            : "مدير"}
        </Badge>
      ),
    },
    {
      key: "is_active",
      label: "الحالة",
      render: (row) => (
        <Badge variant={row.is_active ? "default" : "outline"}>
          {row.is_active ? "نشط" : "معطّل"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      label: "تاريخ الإنشاء",
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.created_at).toLocaleDateString("ar-IQ")}
        </span>
      ),
    },
    {
      key: "actions",
      label: "الإجراءات",
      headerClassName: "text-center",
      className: "text-center",
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            title="إدارة الصلاحيات"
            onClick={() => setPermUser(row)}
          >
            <Shield className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => { setEditing(row); setDialogOpen(true); }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => setDeletingId(row.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px] max-w-sm">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="البحث بالاسم أو البريد..."
            className="flex-1"
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة مستخدم
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.results ?? []}
        loading={isLoading}
        keyExtractor={(r) => r.id}
        totalPages={data?.total_pages}
        currentPage={page}
        onPageChange={setPage}
        totalCount={data?.count}
        emptyTitle="لا يوجد مستخدمون"
        emptyDescription="ابدأ بإضافة مستخدم جديد"
        isError={isError}
        onRetry={refetch}
      />

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null); }}
        editing={editing}
        onSubmit={handleFormSubmit}
        isLoading={isMutating}
        isSuperUser={isSuperUser}
      />

      <PermissionsDialog
        open={permUser !== null}
        onOpenChange={(v) => { if (!v) setPermUser(null); }}
        user={permUser}
      />

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="حذف المستخدم"
        description="هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

// ─── Logs Tab ─────────────────────────────────────────────────────────────────

function LogsTab() {
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [action, setAction]           = useState("");
  const [module, setModule]           = useState("");
  const [dateFrom, setDateFrom]       = useState("");
  const [dateTo, setDateTo]           = useState("");

  const { data, isLoading, isError, refetch } = useActivityLogs({
    page,
    search:    search    || undefined,
    action:    action    || undefined,
    module:    module    || undefined,
    date_from: dateFrom  || undefined,
    date_to:   dateTo    || undefined,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch(""); setSearchInput(""); setAction("");
    setModule(""); setDateFrom(""); setDateTo(""); setPage(1);
  };

  const hasFilters = !!(search || action || module || dateFrom || dateTo);

  const columns: Column<ActivityLog>[] = [
    {
      key: "user_name",
      label: "المستخدم",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.user_name || "—"}</span>
          <span className="text-xs text-muted-foreground">{row.user_email || ""}</span>
        </div>
      ),
    },
    {
      key: "action",
      label: "الإجراء",
      render: (row) => (
        <Badge variant={ACTION_VARIANT[row.action] ?? "outline"} className="gap-1">
          {ACTION_ICON[row.action]}
          {row.action_label}
        </Badge>
      ),
    },
    {
      key: "module",
      label: "الوحدة",
      render: (row) => (
        <span className="text-sm">{MODULE_AR[row.module] ?? row.module}</span>
      ),
    },
    {
      key: "description",
      label: "الوصف",
      render: (row) => (
        <span className="text-sm text-muted-foreground line-clamp-1">{row.description}</span>
      ),
    },
    {
      key: "ip_address",
      label: "IP",
      render: (row) => (
        <span className="text-xs text-muted-foreground font-mono">{row.ip_address ?? "—"}</span>
      ),
    },
    {
      key: "created_at",
      label: "التاريخ والوقت",
      render: (row) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
          <Clock className="h-3 w-3 shrink-0" />
          {new Date(row.created_at).toLocaleString("ar-IQ")}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px] max-w-xs">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="بحث في الوصف أو المستخدم..."
            className="flex-1"
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <Select value={action || "all"} onValueChange={(v) => { setAction(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="الإجراء" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الإجراءات</SelectItem>
            <SelectItem value="login">تسجيل دخول</SelectItem>
            <SelectItem value="logout">تسجيل خروج</SelectItem>
            <SelectItem value="create">إضافة</SelectItem>
            <SelectItem value="update">تعديل</SelectItem>
            <SelectItem value="delete">حذف</SelectItem>
            <SelectItem value="distribute">توزيع</SelectItem>
            <SelectItem value="export">تصدير</SelectItem>
          </SelectContent>
        </Select>

        <Select value={module || "all"} onValueChange={(v) => { setModule(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="الوحدة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الوحدات</SelectItem>
            <SelectItem value="auth">المصادقة</SelectItem>
            <SelectItem value="users">المستخدمون</SelectItem>
            <SelectItem value="teaching_management">التدريسيون</SelectItem>
            <SelectItem value="distributions">التوزيع</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date" value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="w-40"
        />
        <Input
          type="date" value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="w-40"
        />

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>مسح الفلاتر</Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.results ?? []}
        loading={isLoading}
        keyExtractor={(r) => r.id}
        totalPages={data?.total_pages}
        currentPage={page}
        onPageChange={setPage}
        totalCount={data?.count}
        emptyTitle="لا توجد سجلات"
        emptyDescription="لم يتم تسجيل أي نشاط حتى الآن"
        isError={isError}
        onRetry={refetch}
      />
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function UsersView() {
  const { isSuperUser } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة المستخدمين"
        description="إدارة حسابات المستخدمين وصلاحياتهم وسجلات النشاط"
      />

      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            المستخدمون
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Activity className="h-4 w-4" />
            سجل النشاط
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab isSuperUser={isSuperUser} />
        </TabsContent>

        <TabsContent value="logs">
          <LogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
