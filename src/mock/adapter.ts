import type { AxiosRequestConfig, AxiosResponse, AxiosHeaders } from 'axios';
import type { AuthResponse, PaginatedResponse, Shipment, Alert, Document, ShipmentTimeline } from '@/types';
import {
  mockMetrics,
  mockShipments,
  mockTimelines,
  mockAlerts,
  mockDocuments,
  calcCostEstimate,
  getUsers,
  addUser,
} from './data';

let nextUserId = 3;
let nextDocId = 7;

function ok<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {} as AxiosHeaders,
    config: {} as AxiosRequestConfig,
  };
}

function delay(ms = 200): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function getPath(url: string): string {
  const u = url.replace(/^\/api\/v1/, '');
  return u.split('?')[0];
}

function getQuery(url: string): URLSearchParams {
  const q = url.includes('?') ? url.split('?')[1] : '';
  return new URLSearchParams(q);
}

function parseBody(config: AxiosRequestConfig): any {
  if (typeof config.data === 'string') {
    try { return JSON.parse(config.data); } catch { return {}; }
  }
  return config.data || {};
}

export async function mockAdapter(config: AxiosRequestConfig): Promise<AxiosResponse> {
  await delay(200);

  const method = (config.method || 'get').toLowerCase();
  const path = getPath(config.url || '');
  const query = getQuery(config.url || '');
  const body = parseBody(config);

  // ===== Auth =====
  if (method === 'post' && path === '/auth/login') {
    const { email } = body;
    let user = getUsers().find((u) => u.email === email);
    if (!user) {
      user = getUsers()[0]; // fallback to admin
    }
    const res: AuthResponse = {
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      user,
    };
    return ok(res);
  }

  if (method === 'post' && path === '/auth/register') {
    const { email, password, companyName } = body;
    const newUser = {
      id: nextUserId++,
      email: email || 'new@user.com',
      companyName: companyName || '新公司',
      role: 'customer' as const,
      createdAt: new Date().toISOString(),
    };
    addUser(newUser);
    const res: AuthResponse = {
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      user: newUser,
    };
    return ok(res);
  }

  if (method === 'post' && path === '/auth/refresh') {
    return ok({
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
    });
  }

  if (method === 'post' && path === '/auth/logout') {
    return ok({});
  }

  if (method === 'get' && path === '/auth/me') {
    return ok(getUsers()[0]);
  }

  // ===== Dashboard =====
  if (method === 'get' && path === '/dashboard/metrics') {
    return ok(mockMetrics);
  }

  if (method === 'get' && path === '/dashboard/recent-shipments') {
    const limit = +(query.get('limit') || 5);
    return ok(mockShipments.slice(0, limit));
  }

  if (method === 'get' && path === '/dashboard/recent-alerts') {
    const limit = +(query.get('limit') || 3);
    return ok(mockAlerts.slice(0, limit));
  }

  // ===== Shipments (detail routes first) =====
  const shipmentTimelineMatch = path.match(/^\/shipments\/(\d+)\/timeline$/);
  if (method === 'get' && shipmentTimelineMatch) {
    const id = +shipmentTimelineMatch[1];
    return ok(mockTimelines[id] || []);
  }

  const shipmentLocationMatch = path.match(/^\/shipments\/(\d+)\/current-location$/);
  if (method === 'get' && shipmentLocationMatch) {
    const id = +shipmentLocationMatch[1];
    const s = mockShipments.find((sh) => sh.id === id);
    return ok({ location: s?.currentLocation || '未知' });
  }

  const shipmentDocsMatch = path.match(/^\/shipments\/(\d+)\/documents$/);
  if (method === 'get' && shipmentDocsMatch) {
    const shipmentId = +shipmentDocsMatch[1];
    return ok(mockDocuments.filter((d) => d.shipmentId === shipmentId));
  }

  const shipmentDetailMatch = path.match(/^\/shipments\/(\d+)$/);
  if (method === 'get' && shipmentDetailMatch) {
    const id = +shipmentDetailMatch[1];
    const s = mockShipments.find((sh) => sh.id === id);
    return s ? ok(s) : ok(null as any);
  }

  if (method === 'get' && path === '/shipments') {
    let list = [...mockShipments];
    const status = query.get('status');
    const methodQ = query.get('transportMethod');
    const shipmentId = query.get('shipmentId');
    if (status) list = list.filter((s) => s.status === status);
    if (methodQ) list = list.filter((s) => s.transportMethod === methodQ);
    if (shipmentId) list = list.filter((s) => s.shipmentId.includes(shipmentId));
    const page = +(query.get('page') || 1);
    const size = +(query.get('size') || 10);
    const total = list.length;
    const start = (page - 1) * size;
    const res: PaginatedResponse<Shipment> = {
      data: list.slice(start, start + size),
      total,
      page,
      size,
    };
    return ok(res);
  }

  // ===== Alerts =====
  const alertAckMatch = path.match(/^\/alerts\/(\d+)\/acknowledge$/);
  if (method === 'post' && alertAckMatch) {
    const id = +alertAckMatch[1];
    const alert = mockAlerts.find((a) => a.id === id);
    if (alert) alert.status = 'acknowledged';
    return ok(alert || null);
  }

  const alertResolveMatch = path.match(/^\/alerts\/(\d+)\/resolve$/);
  if (method === 'post' && alertResolveMatch) {
    const id = +alertResolveMatch[1];
    const alert = mockAlerts.find((a) => a.id === id);
    if (alert) alert.status = 'resolved';
    return ok(alert || null);
  }

  if (method === 'get' && path === '/alerts') {
    let list = [...mockAlerts];
    const severity = query.get('severity');
    const status = query.get('status');
    if (severity) list = list.filter((a) => a.severity === severity);
    if (status) list = list.filter((a) => a.status === status);
    const page = +(query.get('page') || 1);
    const size = +(query.get('size') || 10);
    const total = list.length;
    const start = (page - 1) * size;
    const res: PaginatedResponse<Alert> = {
      data: list.slice(start, start + size),
      total,
      page,
      size,
    };
    return ok(res);
  }

  // ===== Cost =====
  if (method === 'post' && path === '/cost/estimate') {
    const { shippingMethod, quantity } = body;
    const breakdown = calcCostEstimate(shippingMethod || 'sea', quantity || 1);
    const totalCost = breakdown.shipping + breakdown.customs + breakdown.handling + breakdown.insurance;
    return ok({
      totalCost: +totalCost.toFixed(2),
      currency: body.currency || 'USD',
      breakdown,
      exchangeRate: 1.0,
    });
  }

  // ===== Documents =====
  const docDetailMatch = path.match(/^\/documents\/(\d+)$/);
  if (method === 'delete' && docDetailMatch) {
    const id = +docDetailMatch[1];
    const idx = mockDocuments.findIndex((d) => d.id === id);
    if (idx >= 0) mockDocuments.splice(idx, 1);
    return ok({});
  }

  const docVerifyMatch = path.match(/^\/documents\/(\d+)\/verify$/);
  if (method === 'put' && docVerifyMatch) {
    const id = +docVerifyMatch[1];
    const doc = mockDocuments.find((d) => d.id === id);
    if (doc) {
      doc.status = 'approved';
      doc.verifiedBy = 1;
      doc.verifiedAt = new Date().toISOString();
    }
    return ok(doc || null);
  }

  if (method === 'post' && path === '/documents/upload') {
    const newDoc: Document = {
      id: nextDocId++,
      shipmentId: body.shipmentId || 1,
      docType: body.docType || 'commercial_invoice',
      fileName: body.fileName || 'new-document.pdf',
      fileUrl: '/docs/new-doc.pdf',
      status: 'uploaded',
      uploadedBy: 2,
      uploadedAt: new Date().toISOString(),
      verifiedBy: null,
      verifiedAt: null,
      expiryDate: null,
    };
    mockDocuments.push(newDoc);
    return ok(newDoc);
  }

  // fallback
  return ok({});
}
