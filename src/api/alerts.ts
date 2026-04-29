import apiClient from './client';
import type { Alert, FilterParams, PaginatedResponse } from '@/types';

export const alertsApi = {
  getList: (params: FilterParams) =>
    apiClient.get<PaginatedResponse<Alert>>('/alerts', { params }).then((res) => res.data),

  acknowledge: (id: number) =>
    apiClient.post<Alert>(`/alerts/${id}/acknowledge`).then((res) => res.data),

  resolve: (id: number) =>
    apiClient.post<Alert>(`/alerts/${id}/resolve`).then((res) => res.data),
};
