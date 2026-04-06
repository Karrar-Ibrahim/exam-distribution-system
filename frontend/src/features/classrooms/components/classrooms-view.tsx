"use client";

import React, { useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, type Column } from "@/components/common/data-table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PermissionGuard } from "@/components/common/permission-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useClassrooms, useCreateClassroom, useUpdateClassroom, useDeleteClassroom } from "../hooks";
import { ClassroomForm } from "./classroom-form";
import type { Classroom, ClassroomFormData } from "@/types";

export function ClassroomsView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Classroom | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useClassrooms({ page, search });
  const createM = useCreateClassroom();
  const updateM = useUpdateClassroom();
  const deleteM = useDeleteClassroom();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const handleSubmit = (fd: ClassroomFormData) => {
    if (editing) {
      updateM.mutate({ id: editing.id, data: fd }, { onSuccess: closeDialog });
    } else {
      createM.mutate(fd, { onSuccess: closeDialog });
    }
  };

  const columns: Column<Classroom>[] = [
    {
      key: "room_number",
      label: "رقم القاعة",
      render: (r) => <span className="font-medium">{r.room_number}</span>,
    },
    {
      key: "capacity",
      label: "السعة الاستيعابية",
      render: (r) => <span>{r.capacity} طالب</span>,
    },
    {
      key: "num_invigilators",
      label: "عدد المراقبين",
      render: (r) => <span>{r.num_invigilators} مراقب</span>,
    },
    {
      key: "actions",
      label: "الإجراءات",
      headerClassName: "text-center",
      className: "text-center",
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <PermissionGuard module="classroom" action="update">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => { setEditing(row); setDialogOpen(true); }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </PermissionGuard>
          <PermissionGuard module="classroom" action="delete">
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
      <PageHeader title="القاعات" description="إدارة قاعات الامتحانات">
        <PermissionGuard module="classroom" action="create">
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />إضافة قاعة
          </Button>
        </PermissionGuard>
      </PageHeader>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="البحث برقم القاعة..."
          className="flex-1"
        />
        <Button type="submit" variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      <DataTable
        columns={columns}
        data={data?.results ?? []}
        loading={isLoading}
        keyExtractor={(r) => r.id}
        totalPages={data?.total_pages}
        currentPage={page}
        onPageChange={setPage}
        totalCount={data?.count}
        emptyTitle="لا توجد قاعات"
        emptyDescription="ابدأ بإضافة قاعة جديدة"
        isError={isError}
        onRetry={refetch}
      />

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل القاعة" : "إضافة قاعة جديدة"}</DialogTitle>
          </DialogHeader>
          <ClassroomForm
            defaultValues={editing ?? undefined}
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
        title="حذف القاعة"
        description="هل أنت متأكد من حذف هذه القاعة؟ لا يمكن التراجع عن هذه العملية."
        loading={deleteM.isPending}
      />
    </div>
  );
}
