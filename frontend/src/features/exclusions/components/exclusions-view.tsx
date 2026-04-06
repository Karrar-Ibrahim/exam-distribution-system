"use client";

import React, { useState } from "react";
import { Plus, Trash2, Search, CalendarX } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, type Column } from "@/components/common/data-table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PermissionGuard } from "@/components/common/permission-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useExclusions, useCreateExclusion, useDeleteExclusion } from "../hooks";
import { ExclusionFormDialog } from "./exclusion-form-dialog";
import type { TeacherExclusion, TeacherExclusionFormData } from "@/types";

const DEGREE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  دكتوراه: "default",
  ماجستير: "secondary",
  بكالوريوس: "outline",
};

export function ExclusionsView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useExclusions({
    page,
    search,
    date: dateFilter || undefined,
  });

  const createMutation = useCreateExclusion();
  const deleteMutation = useDeleteExclusion();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFilter(e.target.value);
    setPage(1);
  };

  const handleFormSubmit = (formData: TeacherExclusionFormData) => {
    createMutation.mutate(formData, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  const handleDelete = () => {
    if (deletingId !== null) {
      deleteMutation.mutate(deletingId, {
        onSuccess: () => setDeletingId(null),
      });
    }
  };

  const columns: Column<TeacherExclusion>[] = [
    {
      key: "teacher_name",
      label: "المراقب",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.teacher_name}</span>
          <span className="text-xs text-muted-foreground">{row.teacher_title}</span>
        </div>
      ),
    },
    {
      key: "teacher_degree",
      label: "الدرجة",
      render: (row) => (
        <Badge variant={DEGREE_VARIANTS[row.teacher_degree] ?? "outline"}>
          {row.teacher_degree}
        </Badge>
      ),
    },
    {
      key: "date",
      label: "تاريخ الاستثناء",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <CalendarX className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{row.date}</span>
        </div>
      ),
    },
    {
      key: "reason",
      label: "السبب",
      render: (row) => (
        <span className="text-muted-foreground">
          {row.reason || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "الإجراءات",
      headerClassName: "text-center",
      className: "text-center",
      render: (row) => (
        <PermissionGuard module="teaching_management" action="delete">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => setDeletingId(row.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </PermissionGuard>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="استثناءات المراقبين"
        description="إدارة المراقبين المستثنَين من التوزيع في تواريخ محددة"
      >
        <PermissionGuard module="teaching_management" action="create">
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة استثناء
          </Button>
        </PermissionGuard>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px] max-w-sm">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="البحث باسم المراقب..."
            className="flex-1"
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        <Input
          type="date"
          value={dateFilter}
          onChange={handleDateChange}
          className="w-44"
        />
        {(dateFilter || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFilter("");
              setSearch("");
              setSearchInput("");
              setPage(1);
            }}
          >
            مسح الفلاتر
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.results ?? []}
        loading={isLoading}
        keyExtractor={(row) => row.id}
        totalPages={data?.total_pages}
        currentPage={page}
        onPageChange={setPage}
        totalCount={data?.count}
        emptyTitle="لا توجد استثناءات"
        emptyDescription="أضف استثناء لمراقب معين في تاريخ محدد لمنعه من الظهور في التوزيع"
        isError={isError}
        onRetry={refetch}
      />

      <ExclusionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending}
      />

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="حذف الاستثناء"
        description="هل أنت متأكد من حذف هذا الاستثناء؟"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
