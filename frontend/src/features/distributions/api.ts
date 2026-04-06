import api from "@/lib/axios";
import { API_ROUTES } from "@/config/api-routes";
import type { DistributionBatch, DistributionBatchParams, DistributionCreateData, PaginatedResponse } from "@/types";

export async function getDistributionBatches(params?: DistributionBatchParams): Promise<PaginatedResponse<DistributionBatch>> {
  const response = await api.get<PaginatedResponse<DistributionBatch>>(
    API_ROUTES.DISTRIBUTIONS.BATCHES,
    { params }
  );
  return response.data;
}

export async function createDistribution(
  data: DistributionCreateData
): Promise<{ success: boolean; message: string; data: DistributionBatch }> {
  const response = await api.post(API_ROUTES.DISTRIBUTIONS.CREATE, data);
  return response.data;
}

export async function deleteDistributionBatch(id: number): Promise<void> {
  await api.delete(API_ROUTES.DISTRIBUTIONS.BATCH_DELETE(id));
}

export async function exportDistributions(batchId?: number): Promise<Blob> {
  const url = batchId
    ? API_ROUTES.DISTRIBUTIONS.EXPORT_BATCH(batchId)
    : API_ROUTES.DISTRIBUTIONS.EXPORT;
  const response = await api.get(url, { responseType: "blob" });
  return response.data;
}
