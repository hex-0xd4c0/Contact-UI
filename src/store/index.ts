import { create } from 'zustand';
import type { User, Shipment, Alert, DashboardMetrics, FilterParams } from '@/types';
import { dashboardApi } from '@/api/dashboard';
import { shipmentsApi } from '@/api/shipments';
import { alertsApi } from '@/api/alerts';

interface AppState {
  // User
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;

  // Dashboard
  metrics: DashboardMetrics | null;
  recentShipments: Shipment[];
  recentAlerts: Alert[];
  dashboardLoading: boolean;
  fetchDashboard: () => Promise<void>;

  // Shipments
  shipments: Shipment[];
  shipmentsTotal: number;
  shipmentsLoading: boolean;
  currentShipment: Shipment | null;
  fetchShipments: (params: FilterParams) => Promise<void>;
  fetchShipmentDetail: (id: number) => Promise<void>;

  // Alerts
  alerts: Alert[];
  alertsTotal: number;
  alertsLoading: boolean;
  fetchAlerts: (params: FilterParams) => Promise<void>;
  acknowledgeAlert: (id: number) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // User
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  // Dashboard
  metrics: null,
  recentShipments: [],
  recentAlerts: [],
  dashboardLoading: false,
  fetchDashboard: async () => {
    set({ dashboardLoading: true });
    try {
      const [metrics, recentShipments, recentAlerts] = await Promise.all([
        dashboardApi.getMetrics(),
        dashboardApi.getRecentShipments(),
        dashboardApi.getRecentAlerts(),
      ]);
      set({ metrics, recentShipments, recentAlerts });
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      set({ dashboardLoading: false });
    }
  },

  // Shipments
  shipments: [],
  shipmentsTotal: 0,
  shipmentsLoading: false,
  currentShipment: null,
  fetchShipments: async (params) => {
    set({ shipmentsLoading: true });
    try {
      const response = await shipmentsApi.getList(params);
      set({ shipments: response.data, shipmentsTotal: response.total });
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
    } finally {
      set({ shipmentsLoading: false });
    }
  },
  fetchShipmentDetail: async (id) => {
    try {
      const shipment = await shipmentsApi.getById(id);
      set({ currentShipment: shipment });
    } catch (error) {
      console.error('Failed to fetch shipment detail:', error);
    }
  },

  // Alerts
  alerts: [],
  alertsTotal: 0,
  alertsLoading: false,
  fetchAlerts: async (params) => {
    set({ alertsLoading: true });
    try {
      const response = await alertsApi.getList(params);
      set({ alerts: response.data, alertsTotal: response.total });
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      set({ alertsLoading: false });
    }
  },
  acknowledgeAlert: async (id) => {
    try {
      await alertsApi.acknowledge(id);
      const { alerts } = get();
      set({
        alerts: alerts.map((a) =>
          a.id === id ? { ...a, status: 'acknowledged' as const } : a
        ),
      });
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  },
}));
