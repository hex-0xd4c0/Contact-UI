import type {
  Shipment,
  ShipmentTimeline,
  Alert,
  Document,
  DashboardMetrics,
  User,
} from '@/types';

// ===== User =====
let mockUsers: User[] = [
  {
    id: 1,
    email: 'admin@ebike.com',
    companyName: '电摩跨境物流平台',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    email: 'customer@ebike.com',
    companyName: '深圳电摩科技有限公司',
    role: 'customer',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

export const getUsers = () => mockUsers;
export const addUser = (user: User) => {
  mockUsers.push(user);
};

// ===== Dashboard =====
export const mockMetrics: DashboardMetrics = {
  totalShipments: 5128,
  inTransit: 324,
  delayed: 18,
  delivered: 4786,
  percentChange: 12.5,
};

// ===== Shipments =====
export const mockShipments: Shipment[] = [
  {
    id: 1,
    shipmentId: 'EB-2024-0001',
    origin: '深圳, 中国',
    destination: '洛杉矶, 美国',
    quantity: 500,
    transportMethod: 'Sea Freight',
    carrier: 'COSCO',
    weightKg: 2500,
    status: 'in_transit',
    currentLocation: '太平洋, 北纬25°, 东经140°',
    eta: '2024-03-15T10:00:00.000Z',
    departureDate: '2024-02-20T08:00:00.000Z',
    createdBy: 2,
    createdAt: '2024-02-19T08:00:00.000Z',
  },
  {
    id: 2,
    shipmentId: 'EB-2024-0002',
    origin: '深圳, 中国',
    destination: '汉堡, 德国',
    quantity: 200,
    transportMethod: 'Air Freight',
    carrier: 'DHL',
    weightKg: 800,
    status: 'in_transit',
    currentLocation: '法兰克福机场',
    eta: '2024-03-10T14:00:00.000Z',
    departureDate: '2024-03-01T06:00:00.000Z',
    createdBy: 2,
    createdAt: '2024-02-28T06:00:00.000Z',
  },
  {
    id: 3,
    shipmentId: 'EB-2024-0003',
    origin: '深圳, 中国',
    destination: '迪拜, 阿联酋',
    quantity: 300,
    transportMethod: 'Sea Freight',
    carrier: 'MSC',
    weightKg: 1500,
    status: 'pending',
    currentLocation: '深圳盐田港',
    eta: '2024-03-20T09:00:00.000Z',
    departureDate: '',
    createdBy: 2,
    createdAt: '2024-03-05T09:00:00.000Z',
  },
  {
    id: 4,
    shipmentId: 'EB-2024-0004',
    origin: '深圳, 中国',
    destination: '新加坡, 新加坡',
    quantity: 150,
    transportMethod: 'Air Freight',
    carrier: 'FedEx',
    weightKg: 450,
    status: 'delivered',
    currentLocation: '新加坡樟宜机场',
    eta: '2024-02-28T16:00:00.000Z',
    departureDate: '2024-02-25T10:00:00.000Z',
    createdBy: 2,
    createdAt: '2024-02-24T10:00:00.000Z',
  },
  {
    id: 5,
    shipmentId: 'EB-2024-0005',
    origin: '深圳, 中国',
    destination: '鹿特丹, 荷兰',
    quantity: 1000,
    transportMethod: 'Sea Freight',
    carrier: 'CMA CGM',
    weightKg: 5000,
    status: 'delayed',
    currentLocation: '马六甲海峡',
    eta: '2024-03-05T08:00:00.000Z',
    departureDate: '2024-02-15T12:00:00.000Z',
    createdBy: 2,
    createdAt: '2024-02-14T12:00:00.000Z',
  },
];

// ===== Shipment Timelines =====
export const mockTimelines: Record<number, ShipmentTimeline[]> = {
  1: [
    { id: 1, shipmentId: 1, stage: '已揽收', status: 'completed', location: '深圳', eventTime: '2024-02-20T08:00:00.000Z', notes: '货物已揽收' },
    { id: 2, shipmentId: 1, stage: '已出关', status: 'completed', location: '深圳盐田港', eventTime: '2024-02-22T14:00:00.000Z', notes: '海关放行' },
    { id: 3, shipmentId: 1, stage: '运输中', status: 'current', location: '太平洋', eventTime: '2024-02-25T10:00:00.000Z', notes: '船舶航行中' },
    { id: 4, shipmentId: 1, stage: '到港清关', status: 'pending', location: '洛杉矶港', eventTime: '', notes: '预计3月15日到港' },
    { id: 5, shipmentId: 1, stage: '末端配送', status: 'pending', location: '洛杉矶', eventTime: '', notes: '' },
  ],
  2: [
    { id: 6, shipmentId: 2, stage: '已揽收', status: 'completed', location: '深圳', eventTime: '2024-03-01T06:00:00.000Z', notes: '货物已揽收' },
    { id: 7, shipmentId: 2, stage: '已出关', status: 'completed', location: '深圳宝安机场', eventTime: '2024-03-02T09:00:00.000Z', notes: '海关放行' },
    { id: 8, shipmentId: 2, stage: '清关中', status: 'current', location: '法兰克福机场', eventTime: '2024-03-03T11:00:00.000Z', notes: '等待海关查验' },
  ],
  3: [
    { id: 9, shipmentId: 3, stage: '已揽收', status: 'completed', location: '深圳', eventTime: '2024-03-05T09:00:00.000Z', notes: '货物已揽收' },
    { id: 10, shipmentId: 3, stage: '等待装船', status: 'current', location: '深圳盐田港', eventTime: '2024-03-06T08:00:00.000Z', notes: '等待船期' },
  ],
  4: [
    { id: 11, shipmentId: 4, stage: '已揽收', status: 'completed', location: '深圳', eventTime: '2024-02-25T10:00:00.000Z', notes: '货物已揽收' },
    { id: 12, shipmentId: 4, stage: '已出关', status: 'completed', location: '深圳宝安机场', eventTime: '2024-02-26T08:00:00.000Z', notes: '海关放行' },
    { id: 13, shipmentId: 4, stage: '运输中', status: 'completed', location: '飞行中', eventTime: '2024-02-26T10:00:00.000Z', notes: '航班正常' },
    { id: 14, shipmentId: 4, stage: '已签收', status: 'completed', location: '新加坡', eventTime: '2024-02-28T16:00:00.000Z', notes: '客户已签收' },
  ],
  5: [
    { id: 15, shipmentId: 5, stage: '已揽收', status: 'completed', location: '深圳', eventTime: '2024-02-15T12:00:00.000Z', notes: '货物已揽收' },
    { id: 16, shipmentId: 5, stage: '已出关', status: 'completed', location: '深圳盐田港', eventTime: '2024-02-17T10:00:00.000Z', notes: '海关放行' },
    { id: 17, shipmentId: 5, stage: '运输中', status: 'current', location: '马六甲海峡', eventTime: '2024-02-20T08:00:00.000Z', notes: '因天气原因延误' },
  ],
};

// ===== Alerts =====
export const mockAlerts: Alert[] = [
  {
    id: 1,
    shipmentId: 5,
    alertType: 'delay',
    severity: 'high',
    title: '运单 EB-2024-0005 严重延误',
    description: '预计到达时间延迟5天，当前ETA: 2024-03-10',
    detectedAt: '2024-02-20T08:00:00.000Z',
    relatedStage: '运输中',
    status: 'active',
    resolvedBy: null,
  },
  {
    id: 2,
    shipmentId: 2,
    alertType: 'customs_issue',
    severity: 'high',
    title: '运单 EB-2024-0002 海关查验',
    description: '货物在法兰克福海关被抽查，预计延迟2-3天',
    detectedAt: '2024-03-03T11:00:00.000Z',
    relatedStage: '清关中',
    status: 'active',
    resolvedBy: null,
  },
  {
    id: 3,
    shipmentId: 1,
    alertType: 'weather',
    severity: 'medium',
    title: '运单 EB-2024-0001 航线天气预警',
    description: '太平洋航线预计有热带风暴，可能影响航行速度',
    detectedAt: '2024-02-25T10:00:00.000Z',
    relatedStage: '运输中',
    status: 'active',
    resolvedBy: null,
  },
  {
    id: 4,
    shipmentId: 4,
    alertType: 'document_missing',
    severity: 'low',
    title: '运单 EB-2024-0004 文件待补充',
    description: '原产地证明文件即将到期，请及时更新',
    detectedAt: '2024-02-28T16:00:00.000Z',
    relatedStage: '已签收',
    status: 'acknowledged',
    resolvedBy: null,
  },
];

// ===== Documents =====
export const mockDocuments: Document[] = [
  { id: 1, shipmentId: 1, docType: 'commercial_invoice', fileName: '商业发票-EB-2024-0001.pdf', fileUrl: '/docs/invoice-0001.pdf', status: 'approved', uploadedBy: 2, uploadedAt: '2024-02-19T08:00:00.000Z', verifiedBy: 1, verifiedAt: '2024-02-19T10:00:00.000Z', expiryDate: null },
  { id: 2, shipmentId: 1, docType: 'packing_list', fileName: '装箱单-EB-2024-0001.pdf', fileUrl: '/docs/packing-0001.pdf', status: 'approved', uploadedBy: 2, uploadedAt: '2024-02-19T08:00:00.000Z', verifiedBy: 1, verifiedAt: '2024-02-19T10:00:00.000Z', expiryDate: null },
  { id: 3, shipmentId: 1, docType: 'battery_msds', fileName: '电池MSDS-0001.pdf', fileUrl: '/docs/msds-0001.pdf', status: 'approved', uploadedBy: 2, uploadedAt: '2024-02-19T08:00:00.000Z', verifiedBy: 1, verifiedAt: '2024-02-19T10:00:00.000Z', expiryDate: '2025-02-19T10:00:00.000Z' },
  { id: 4, shipmentId: 1, docType: 'un38_3', fileName: 'UN38.3检测报告-0001.pdf', fileUrl: '/docs/un38-0001.pdf', status: 'approved', uploadedBy: 2, uploadedAt: '2024-02-19T08:00:00.000Z', verifiedBy: 1, verifiedAt: '2024-02-19T10:00:00.000Z', expiryDate: '2025-02-19T10:00:00.000Z' },
  { id: 5, shipmentId: 2, docType: 'commercial_invoice', fileName: '商业发票-EB-2024-0002.pdf', fileUrl: '/docs/invoice-0002.pdf', status: 'uploaded', uploadedBy: 2, uploadedAt: '2024-02-28T06:00:00.000Z', verifiedBy: null, verifiedAt: null, expiryDate: null },
  { id: 6, shipmentId: 4, docType: 'coo', fileName: '原产地证明-0004.pdf', fileUrl: '/docs/coo-0004.pdf', status: 'expired', uploadedBy: 2, uploadedAt: '2024-02-24T10:00:00.000Z', verifiedBy: 1, verifiedAt: '2024-02-24T12:00:00.000Z', expiryDate: '2024-05-24T12:00:00.000Z' },
];

// ===== Cost Estimate (dynamic) =====
export function calcCostEstimate(method: string, quantity: number) {
  const rateMap: Record<string, { shipping: number; customs: number; handling: number; insurance: number }> = {
    sea: { shipping: 3.5, customs: 0.8, handling: 1.2, insurance: 0.5 },
    air: { shipping: 12, customs: 1.5, handling: 2.0, insurance: 1.0 },
    rail: { shipping: 5.0, customs: 1.0, handling: 1.5, insurance: 0.6 },
    truck: { shipping: 6.0, customs: 0.9, handling: 1.3, insurance: 0.7 },
  };
  const rates = rateMap[method] || rateMap.sea;
  return {
    shipping: +(rates.shipping * quantity).toFixed(2),
    customs: +(rates.customs * quantity).toFixed(2),
    handling: +(rates.handling * quantity).toFixed(2),
    insurance: +(rates.insurance * quantity).toFixed(2),
  };
}
