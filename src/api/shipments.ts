import apiClient from './client';
import type { Shipment, ShipmentTimeline, FilterParams, PaginatedResponse } from '@/types';

export const shipmentsApi = {
  getList: (params: FilterParams) =>
    apiClient.get<PaginatedResponse<Shipment>>('/shipments', { params }).then((res) => res.data),

  getById: (id: number) =>
    apiClient.get<Shipment>(`/shipments/${id}`).then((res) => res.data),

  getTimeline: (id: number) =>
    apiClient.get<ShipmentTimeline[]>(`/shipments/${id}/timeline`).then((res) => res.data),

  getCurrentLocation: (id: number) =>
    apiClient.get<{ location: string }>(`/shipments/${id}/current-location`).then((res) => res.data),
};
