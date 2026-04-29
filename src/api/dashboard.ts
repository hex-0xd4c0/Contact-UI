import apiClient from './client';
import type { DashboardMetrics, Shipment, Alert } from '@/types';

export const dashboardApi = {
  getMetrics: () =>
    apiClient.get<DashboardMetrics>('/dashboard/metrics').then((res) => res.data),

  getRecentShipments: (limit = 5) =>
    apiClient.get<Shipment[]>('/dashboard/recent-shipments', { params: { limit } }).then((res) => res.data),

  getRecentAlerts: (limit = 3) =>
    apiClient.get<Alert[]>('/dashboard/recent-alerts', { params: { limit } }).then((res) => res.data),
};
