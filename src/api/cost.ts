import apiClient from './client';
import type { CostEstimateRequest, CostEstimateResponse } from '@/types';

export const costApi = {
  estimate: (data: CostEstimateRequest) =>
    apiClient.post<CostEstimateResponse>('/cost/estimate', data).then((res) => res.data),
};
