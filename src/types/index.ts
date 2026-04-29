// User & Auth
export interface User {
  id: number;
  email: string;
  companyName: string;
  role: 'admin' | 'customer';
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  companyName: string;
  role?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Shipment
export type ShipmentStatus = 'pending' | 'in_transit' | 'delayed' | 'delivered';
export type TransportMethod = 'Sea Freight' | 'Air Freight' | 'Rail Freight' | 'Truck';

export interface Shipment {
  id: number;
  shipmentId: string;
  origin: string;
  destination: string;
  quantity: number;
  transportMethod: TransportMethod;
  carrier: string;
  weightKg: number;
  status: ShipmentStatus;
  currentLocation: string;
  eta: string;
  departureDate: string;
  createdBy: number;
  createdAt: string;
}

export interface ShipmentTimeline {
  id: number;
  shipmentId: number;
  stage: string;
  status: 'completed' | 'current' | 'pending';
  location: string;
  eventTime: string;
  notes: string;
}

// Cost
export interface CostEstimateRequest {
  origin: string;
  destination: string;
  motorcycleType: string;
  quantity: number;
  shippingMethod: string;
  currency: string;
}

export interface CostBreakdown {
  shipping: number;
  customs: number;
  handling: number;
  insurance: number;
}

export interface CostEstimateResponse {
  totalCost: number;
  currency: string;
  breakdown: CostBreakdown;
  exchangeRate: number;
}

// Document
export type DocType = 'commercial_invoice' | 'packing_list' | 'battery_msds' | 'un38_3' | 'coo' | 'bill_of_lading';
export type DocStatus = 'pending' | 'uploaded' | 'approved' | 'expired';

export interface Document {
  id: number;
  shipmentId: number;
  docType: DocType;
  fileName: string;
  fileUrl: string;
  status: DocStatus;
  uploadedBy: number;
  uploadedAt: string;
  verifiedBy: number | null;
  verifiedAt: string | null;
  expiryDate: string | null;
}

// Alert
export type AlertSeverity = 'high' | 'medium' | 'low';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Alert {
  id: number;
  shipmentId: number;
  alertType: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  detectedAt: string;
  relatedStage: string;
  status: AlertStatus;
  resolvedBy: number | null;
}

// Dashboard
export interface DashboardMetrics {
  totalShipments: number;
  inTransit: number;
  delayed: number;
  delivered: number;
  percentChange: number;
}

// Common
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}

export interface FilterParams {
  page?: number;
  size?: number;
  status?: string;
  transportMethod?: string;
  origin?: string;
  destination?: string;
  shipmentId?: string;
  severity?: string;
}
