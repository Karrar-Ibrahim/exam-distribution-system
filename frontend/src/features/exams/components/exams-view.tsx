"use client";

import React, { useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, type Column } from "@/components/common/data-table";
import { BulkDeleteBar } from "@/components/common/bulk-delete-bar";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PermissionGuard } from "@/components/common/permission-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useExams, useCreateExam, useUpdateExam, useDeleteExam, useBulkDeleteExams } from "../hooks";
import { ExamForm } from "./exam-form";
import type { Exam, ExamFormData } from "@/types";

export function ExamsView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const { data, isLoading, isError, refetch } = useExams({ page, search, date: dateFilter || undefined });
  const createM     = useCreateExam();
  const updateM     = useUpdateExam();
  const deleteM     = useDeleteExam();
  const bulkDeleteM = useBulkDeleteExams();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFilter(e.target.value);
    setPage(1);
  };

  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const handleBulkDelete = () => {
    bulkDeleteM.mutate([...selectedIds] as number[], {
      onSuccess: () => { setSelectedIds(new Set()); setBulkConfirm(false); },
    });
  };

  const handleSubmit = (fd: ExamFormData) => {
    if (editing) {
      // For update: time is always sent as string (first element if array)
      const time = Array.isArray(fd.time) ? fd.time[0] : fd.time;
      updateM.mutate({ id: editing.id, data: { ...fd, time } }, { onSuccess: closeDialog });
    } else {
      createM.mutate(fd, { onSuccess: closeDialog });
    }
  };

  const columns: Column<Exam>[] = [
    {
      key: "exam",
      label: "الامتحان / المادة",
      render: (r) => <span className="font-medium">{r.exam}</span>,
    },
    { key: "date", label: "التاريخ" },
    { key: "time", label: "الوقت" },
    {
      key: "room_number",
      label: "القاعة",
      render: (r) => r.room_number ? (
        <span className="text-sm">{r.room_number}</span>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      ),
    },
    {
      key: "actions",
      label: "الإجراءات",
      headerClassName: "text-center",
      className: "text-center",
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <PermissionGuard module="exams" action="update">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => { setEditing(row); setDialogOpen(true); }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </PermissionGuard>
          <PermissionGuard module="exams" action="delete">
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

  return (
    <div className="space-y-6">
      <PageHeader title="الامتحانات" description="إدارة سجلات الامتحانات">
        <PermissionGuard module="exams" action="create">
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />إضافة امتحان
          </Button>
        </PermissionGuard>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px] max-w-sm">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="البحث باسم الامتحان..."
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
          placeholder="تصفية بالتاريخ"
        />
        {dateFilter && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setDateFilter(""); setPage(1); }}
          >
            مسح التاريخ
          </Button>
        )}
      </div>

      <PermissionGuard module="exams" action="delete">
        <BulkDeleteBar
          selectedCount={selectedIds.size}
          onDelete={() => setBulkConfirm(true)}
          onClear={() => setSelectedIds(new Set())}
          isDeleting={bulkDeleteM.isPending}
        />
      </PermissionGuard>

      <DataTable
        columns={columns}
        data={data?.results ?? []}
        loading={isLoading}
        keyExtractor={(r) => r.id}
        totalPages={data?.total_pages}
        currentPage={page}
        onPageChange={(p) => { setPage(p); setSelectedIds(new Set()); }}
        totalCount={data?.count}
        emptyTitle="لا توجد امتحانات"
        emptyDescription="ابدأ بإضافة امتحان جديد"
        isError={isError}
        onRetry={refetch}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل الامتحان" : "إضافة امتحان جديد"}</DialogTitle>
          </DialogHeader>
          <ExamForm
            defaultValues={editing ?? undefined}
            isEditing={!!editing}
            onSubmit={handleSubmit}
            isLoading={createM.isPending || updateM.isPending}
            onCancel={closeDialog}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deleteM.mutate(deletingId!, { onSuccess: () => setDeletingId(null) })}
        title="حذف الامتحان"
        description="هل أنت متأكد من حذف هذا الامتحان؟"
        loading={deleteM.isPending}
      />

      <ConfirmDialog
        open={bulkConfirm}
        onClose={() => setBulkConfirm(false)}
        onConfirm={handleBulkDelete}
        title={`حذف ${selectedIds.size} امتحان`}
        description={`هل أنت متأكد من حذف ${selectedIds.size} امتحان؟ لا يمكن التراجع عن هذا الإجراء.`}
        loading={bulkDeleteM.isPending}
      />
    </div>
  );
}
