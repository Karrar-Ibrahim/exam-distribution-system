import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getDistributionBatches,
  createDistribution,
  deleteDistributionBatch,
  exportDistributions,
} from "./api";
import type { DistributionBatchParams, DistributionCreateData } from "@/types";

export const DISTRIBUTIONS_KEY = ["distributions"] as const;

export function useDistributionBatches(params: DistributionBatchParams = {}) {
  return useQuery({
    queryKey: [...DISTRIBUTIONS_KEY, params],
    queryFn: () => getDistributionBatches(params),
  });
}

export function useCreateDistribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DistributionCreateData) => createDistribution(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: DISTRIBUTIONS_KEY });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(res.message || "تم التوزيع بنجاح");
    },
    onError: () => toast.error("فشلت عملية التوزيع"),
  });
}

export function useDeleteDistributionBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDistributionBatch(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DISTRIBUTIONS_KEY });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("تم حذف الدفعة بنجاح");
    },
    onError: () => toast.error("فشل حذف الدفعة"),
  });
}

export function useExportDistributions() {
  return useMutation({
    mutationFn: (batchId?: number) => exportDistributions(batchId),
    onSuccess: (blob, batchId) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = batchId
        ? `distribution_batch_${batchId}.xlsx`
        : "distributions_all.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("جارٍ تنزيل الملف...");
    },
    onError: () => toast.error("فشل تصدير الملف"),
  });
}
