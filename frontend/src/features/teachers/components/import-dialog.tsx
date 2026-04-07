"use client";

import React, { useRef, useState, useCallback } from "react";
import {
  FileSpreadsheet, Upload, Download, X, CheckCircle2,
  AlertCircle, AlertTriangle, Loader2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useImportTeachers, useDownloadTemplate } from "../hooks";
import type { ImportResult } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
}

type UploadState = "idle" | "dragging" | "uploading" | "done";

export function ImportDialog({ open, onClose }: ImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const importMutation    = useImportTeachers();
  const templateMutation  = useDownloadTemplate();

  // ── اختيار ملف ─────────────────────────────────────────────────────────────
  const pickFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".xlsx") &&
        !file.name.toLowerCase().endsWith(".xls")) {
      return;          // نتجاهل الملفات غير المدعومة
    }
    setSelectedFile(file);
    setResult(null);
    setUploadState("idle");
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) pickFile(file);
    e.target.value = "";   // أعد تهيئة الـ input
  };

  // ── Drag & Drop ─────────────────────────────────────────────────────────────
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState("dragging");
  }, []);

  const onDragLeave = useCallback(() => {
    setUploadState("idle");
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState("idle");
    const file = e.dataTransfer.files?.[0];
    if (file) pickFile(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── رفع الملف ──────────────────────────────────────────────────────────────
  const handleUpload = () => {
    if (!selectedFile) return;
    setUploadState("uploading");

    importMutation.mutate(selectedFile, {
      onSuccess: (data) => {
        setResult(data);
        setUploadState("done");
      },
      onError: () => {
        setUploadState("idle");
      },
    });
  };

  // ── إعادة تعيين ─────────────────────────────────────────────────────────────
  const handleClose = () => {
    setSelectedFile(null);
    setResult(null);
    setUploadState("idle");
    onClose();
  };

  // ── واجهة النتيجة ──────────────────────────────────────────────────────────
  const ResultPanel = ({ r }: { r: ImportResult }) => (
    <div className="space-y-4">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">تم استيرادهم</p>
            <p className="text-2xl font-bold text-green-500">{r.imported}</p>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-3 rounded-lg border px-4 py-3",
          r.failed > 0
            ? "border-destructive/30 bg-destructive/10"
            : "border-border bg-muted/30",
        )}>
          <AlertCircle className={cn(
            "h-5 w-5 shrink-0",
            r.failed > 0 ? "text-destructive" : "text-muted-foreground",
          )} />
          <div>
            <p className="text-xs text-muted-foreground">صفوف بأخطاء</p>
            <p className={cn(
              "text-2xl font-bold",
              r.failed > 0 ? "text-destructive" : "text-muted-foreground",
            )}>{r.failed}</p>
          </div>
        </div>
      </div>

      {/* تفاصيل الأخطاء */}
      {r.errors.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            تفاصيل الصفوف التي لم تُستورَد:
          </p>
          <div className="h-44 overflow-y-auto rounded-md border border-destructive/20 bg-destructive/5 p-2 scrollbar-thin">
            <div className="space-y-2 p-1">
              {r.errors.map((err, idx) => (
                <div key={idx} className="rounded border border-destructive/20 bg-background p-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="destructive" className="text-xs px-1.5 py-0">
                      صف {err.row}
                    </Badge>
                    <span className="text-sm font-medium">{err.name}</span>
                  </div>
                  <ul className="space-y-0.5">
                    {err.errors.map((e, i) => (
                      <li key={i} className="text-xs text-destructive flex gap-1.5">
                        <span className="shrink-0 mt-0.5">•</span>
                        <span>{e}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {r.imported === 0 && r.failed === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          لم يتم العثور على بيانات في الملف
        </p>
      )}
    </div>
  );

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            استيراد المراقبين من Excel
          </DialogTitle>
          <DialogDescription>
            حمّل ملف القالب، عبّئه بالبيانات، ثم ارفعه هنا
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* ── زر تنزيل القالب ──────────────────────────────────────────── */}
          <div className="flex items-center justify-between rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-3">
            <div className="text-sm">
              <p className="font-medium">ملف القالب الجاهز</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                يحتوي على قوائم منسدلة وورقة تعليمات مفصّلة
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 shrink-0"
              disabled={templateMutation.isPending}
              onClick={() => templateMutation.mutate()}
            >
              {templateMutation.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Download className="h-3.5 w-3.5" />
              }
              تنزيل القالب
            </Button>
          </div>

          {/* ── منطقة رفع الملف ─────────────────────────────────────────── */}
          {uploadState !== "done" && (
            <div
              className={cn(
                "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200",
                uploadState === "dragging"
                  ? "border-primary bg-primary/10 scale-[1.01]"
                  : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40",
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={onFileChange}
              />

              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                uploadState === "dragging" ? "bg-primary/20" : "bg-muted",
              )}>
                <Upload className={cn(
                  "h-6 w-6 transition-colors",
                  uploadState === "dragging" ? "text-primary" : "text-muted-foreground",
                )} />
              </div>

              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center justify-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-green-500" />
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto mt-1"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                  >
                    <X className="h-3 w-3" /> تغيير الملف
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {uploadState === "dragging"
                      ? "أفلت الملف هنا"
                      : "اسحب الملف هنا أو اضغط للاختيار"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ملفات Excel فقط (.xlsx, .xls)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── نتائج الاستيراد ─────────────────────────────────────────── */}
          {uploadState === "done" && result && <ResultPanel r={result} />}

          {/* ── أزرار التحكم ────────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {uploadState === "done" ? (
              <>
                <Button variant="outline" onClick={() => {
                  setSelectedFile(null);
                  setResult(null);
                  setUploadState("idle");
                }}>
                  رفع ملف آخر
                </Button>
                <Button onClick={handleClose}>إغلاق</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={handleClose}>
                  إلغاء
                </Button>
                <Button
                  disabled={!selectedFile || uploadState === "uploading"}
                  onClick={handleUpload}
                  className="gap-2 min-w-28"
                >
                  {uploadState === "uploading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جارٍ الرفع...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      رفع الملف
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
