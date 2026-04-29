export const API_BASE_URL = '/api/v1';

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  TRACKING: '/tracking',
  TRACKING_DETAIL: '/tracking/:id',
  COST_CALCULATOR: '/cost-calculator',
  DOCUMENTS: '/documents',
  RISK_ALERTS: '/risk-alerts',
  SETTINGS: '/settings',
} as const;

export const SHIPMENT_STATUS = {
  pending: { label: '待处理', color: 'default' },
  in_transit: { label: '运输中', color: 'processing' },
  delayed: { label: '已延误', color: 'error' },
  delivered: { label: '已交付', color: 'success' },
} as const;

export const ALERT_SEVERITY = {
  high: { label: '高风险', color: 'red' },
  medium: { label: '中风险', color: 'orange' },
  low: { label: '低风险', color: 'blue' },
} as const;

export const DOC_TYPES = {
  commercial_invoice: '商业发票',
  packing_list: '装箱单',
  battery_msds: '电池MSDS',
  un38_3: 'UN38.3检测报告',
  coo: '原产地证明',
  bill_of_lading: '提单',
} as const;

export const TRANSPORT_METHODS = ['Sea Freight', 'Air Freight', 'Rail Freight', 'Truck'] as const;

export const CURRENCIES = ['USD', 'CNY', 'EUR'] as const;

export const MOTORCYCLE_TYPES = ['electric', 'petrol'] as const;
