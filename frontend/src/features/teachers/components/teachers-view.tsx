"use client";

import React, { useState } from "react";
import { Plus, Pencil, Trash2, Search, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, type Column } from "@/components/common/data-table";
import { BulkDeleteBar } from "@/components/common/bulk-delete-bar";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PermissionGuard } from "@/components/common/permission-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher, useBulkDeleteTeachers } from "../hooks";
import { TeacherForm } from "./teacher-form";
import { ImportDialog } from "./import-dialog";
import type { Teacher, TeacherFormData } from "@/types";

const DEGREE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  دكتوراه: "default",
  ماجستير: "secondary",
  بكالوريوس: "outline",
};

export function TeachersView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const { data, isLoading, isError, refetch } = useTeachers({ page, search });
  const createMutation      = useCreateTeacher();
  const updateMutation      = useUpdateTeacher();
  const deleteMutation      = useDeleteTeacher();
  const bulkDeleteMutation  = useBulkDeleteTeachers();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const openCreate = () => {
    setEditingTeacher(null);
    setDialogOpen(true);
  };

  const openEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingTeacher(null);
  };

  const handleFormSubmit = (formData: TeacherFormData) => {
    if (editingTeacher) {
      updateMutation.mutate(
        { id: editingTeacher.id, data: formData },
        { onSuccess: closeDialog }
      );
    } else {
      createMutation.mutate(formData, { onSuccess: closeDialog });
    }
  };

  const handleDelete = () => {
    if (deletingId !== null) {
      deleteMutation.mutate(deletingId, {
        onSuccess: () => setDeletingId(null),
      });
    }
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate([...selectedIds] as number[], {
      onSuccess: () => { setSelectedIds(new Set()); setBulkConfirm(false); },
    });
  };

  const columns: Column<Teacher>[] = [
    {
      key: "formatted_name",
      label: "الاسم",
      render: (row) => <span className="font-medium">{row.formatted_name}</span>,
    },
    { key: "title", label: "اللقب العلمي" },
    {
      key: "degree",
      label: "الدرجة",
      render: (row) => (
        <Badge variant={DEGREE_VARIANTS[row.degree] ?? "outline"}>
          {row.degree}
        </Badge>
      ),
    },
    {
      key: "type",
      label: "النوع",
      render: (row) => (
        <Badge variant={row.type === 2 ? "default" : "secondary"}>
          {row.type === 2 ? "أستاذ" : "مدرّس"}
        </Badge>
      ),
    },
    {
      key: "distribution_count",
      label: "عدد التوزيعات",
      render: (row) => (
        <span className="text-muted-foreground">{row.distribution_count}</span>
      ),
    },
    {
      key: "actions",
      label: "الإجراءات",
      headerClassName: "text-center",
      className: "text-center",
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <PermissionGuard module="teaching_management" action="update">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => openEdit(row)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </PermissionGuard>
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
        </div>
      ),
    },
  ];

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader title="التدريسيون" description="إدارة أعضاء هيئة التدريس">
        <div className="flex items-center gap-2">
          <PermissionGuard module="teaching_management" action="create">
            <Button
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              استيراد Excel
            </Button>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة تدريسي
            </Button>
          </PermissionGuard>
        </div>
      </PageHeader>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="البحث بالاسم..."
          className="flex-1"
        />
        <Button type="submit" variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      <PermissionGuard module="teaching_management" action="delete">
        <BulkDeleteBar
          selectedCount={selectedIds.size}
          onDelete={() => setBulkConfirm(true)}
          onClear={() => setSelectedIds(new Set())}
          isDeleting={bulkDeleteMutation.isPending}
        />
      </PermissionGuard>

      <DataTable
        columns={columns}
        data={data?.results ?? []}
        loading={isLoading}
        keyExtractor={(row) => row.id}
        totalPages={data?.total_pages}
        currentPage={page}
        onPageChange={(p) => { setPage(p); setSelectedIds(new Set()); }}
        totalCount={data?.count}
        emptyTitle="لا يوجد تدريسيون"
        emptyDescription="ابدأ بإضافة تدريسي جديد"
        isError={isError}
        onRetry={refetch}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTeacher ? "تعديل بيانات التدريسي" : "إضافة تدريسي جديد"}
            </DialogTitle>
          </DialogHeader>
          <TeacherForm
            defaultValues={editingTeacher ?? undefined}
            onSubmit={handleFormSubmit}
            isLoading={isMutating}
            onCancel={closeDialog}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="حذف التدريسي"
        description="هل أنت متأكد من حذف هذا التدريسي؟ سيتم حذف جميع بياناته."
        loading={deleteMutation.isPending}
      />

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />

      <ConfirmDialog
        open={bulkConfirm}
        onClose={() => setBulkConfirm(false)}
        onConfirm={handleBulkDelete}
        title={`حذف ${selectedIds.size} تدريسي`}
        description={`هل أنت متأكد من حذف ${selectedIds.size} تدريسي؟ لا يمكن التراجع عن هذا الإجراء.`}
        loading={bulkDeleteMutation.isPending}
      />
    </div>
  );
}
