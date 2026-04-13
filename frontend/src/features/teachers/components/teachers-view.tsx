"use client";

import React, { useState } from "react";
import { Plus, Pencil, Trash2, Search, FileSpreadsheet, ShieldOff, ShieldCheck, FileDown } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, type Column } from "@/components/common/data-table";
import { BulkDeleteBar } from "@/components/common/bulk-delete-bar";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PermissionGuard } from "@/components/common/permission-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher, useBulkDeleteTeachers, useToggleTeacherExclusion, useExportTeachers } from "../hooks";
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
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);

  // Exclusion reason dialog
  const [excludeDialogTeacher, setExcludeDialogTeacher] = useState<Teacher | null>(null);
  const [exclusionReason, setExclusionReason] = useState("");

  const { data, isLoading, isError, refetch } = useTeachers({ page, search, itemsPerPage: pageSize });
  const createMutation      = useCreateTeacher();
  const updateMutation      = useUpdateTeacher();
  const deleteMutation      = useDeleteTeacher();
  const bulkDeleteMutation      = useBulkDeleteTeachers();
  const toggleExclusionMutation = useToggleTeacherExclusion();
  const exportMutation          = useExportTeachers();

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
    bulkDeleteMutation.mutate(Array.from(selectedIds) as number[], {
      onSuccess: () => { setSelectedIds(new Set()); setBulkConfirm(false); },
    });
  };

  // When clicking the shield button on a NON-excluded teacher → open reason dialog
  const handleExcludeClick = (teacher: Teacher) => {
    setExcludeDialogTeacher(teacher);
    setExclusionReason("");
  };

  // Confirm exclusion with reason
  const handleConfirmExclusion = () => {
    if (!excludeDialogTeacher) return;
    toggleExclusionMutation.mutate(
      { id: excludeDialogTeacher.id, is_excluded: true, exclusion_reason: exclusionReason.trim() },
      { onSuccess: () => { setExcludeDialogTeacher(null); setExclusionReason(""); } },
    );
  };

  // Remove exclusion immediately (no dialog needed)
  const handleRemoveExclusion = (teacher: Teacher) => {
    toggleExclusionMutation.mutate({ id: teacher.id, is_excluded: false, exclusion_reason: "" });
  };

  const columns: Column<Teacher>[] = [
    {
      key: "formatted_name",
      label: "الاسم",
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className={row.is_excluded ? "text-muted-foreground line-through" : "font-medium"}>
              {row.formatted_name}
            </span>
            {row.is_excluded && (
              <Badge variant="destructive" className="text-xs h-4 px-1.5 gap-1 shrink-0">
                <ShieldOff className="h-2.5 w-2.5" />
                مستثنى
              </Badge>
            )}
          </div>
          {row.is_excluded && row.exclusion_reason && (
            <span className="text-xs text-muted-foreground pr-0.5">
              {row.exclusion_reason}
            </span>
          )}
        </div>
      ),
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
            {/* زر الاستثناء الدائم */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${row.is_excluded
                ? "text-destructive hover:text-muted-foreground"
                : "text-muted-foreground hover:text-destructive"}`}
              title={row.is_excluded ? "إلغاء الاستثناء الدائم" : "استثناء دائم من التوزيع"}
              disabled={toggleExclusionMutation.isPending}
              onClick={() =>
                row.is_excluded ? handleRemoveExclusion(row) : handleExcludeClick(row)
              }
            >
              {row.is_excluded
                ? <ShieldCheck className="h-3.5 w-3.5" />
                : <ShieldOff className="h-3.5 w-3.5" />}
            </Button>
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
        <div className="flex items-center gap-2 flex-wrap">
          {/* أزرار التصدير */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
            disabled={exportMutation.isPending}
            onClick={() => exportMutation.mutate("active")}
            title="تحميل قائمة المراقبين الفعّالين (غير المستثنَين)"
          >
            <FileDown className="h-4 w-4" />
            تحميل الفعّالين
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
            disabled={exportMutation.isPending}
            onClick={() => exportMutation.mutate("excluded")}
            title="تحميل قائمة المراقبين المستثنَين دائماً"
          >
            <ShieldOff className="h-4 w-4" />
            تحميل المستثنَين
          </Button>

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
        pageSize={pageSize}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); setSelectedIds(new Set()); }}
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

      {/* Exclusion reason dialog */}
      <Dialog
        open={excludeDialogTeacher !== null}
        onOpenChange={(open) => { if (!open) { setExcludeDialogTeacher(null); setExclusionReason(""); } }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldOff className="h-4 w-4 text-destructive" />
              استثناء دائم من التوزيع
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            {excludeDialogTeacher && (
              <p className="text-sm text-muted-foreground">
                سيتم استثناء{" "}
                <span className="font-semibold text-foreground">
                  {excludeDialogTeacher.formatted_name}
                </span>{" "}
                بشكل دائم من جميع عمليات التوزيع.
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="exclusion-reason" className="text-sm">
                سبب الاستثناء{" "}
                <span className="text-muted-foreground font-normal">(اختياري)</span>
              </Label>
              <Textarea
                id="exclusion-reason"
                value={exclusionReason}
                onChange={(e) => setExclusionReason(e.target.value)}
                placeholder="أدخل سبب الاستثناء هنا..."
                className="resize-none h-24 text-sm"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setExcludeDialogTeacher(null); setExclusionReason(""); }}
              disabled={toggleExclusionMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmExclusion}
              disabled={toggleExclusionMutation.isPending}
              className="gap-1.5"
            >
              <ShieldOff className="h-3.5 w-3.5" />
              تأكيد الاستثناء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
