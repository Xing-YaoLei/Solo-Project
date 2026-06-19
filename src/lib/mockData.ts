import {
  DashboardData,
  WorkorderTrendPoint,
  InventoryCategoryData,
  Quote,
  Inspection,
  User,
  REWORK_RATE_CALCULATION,
} from '@/types';

export const MOCK_USER: User = {
  id: 'usr-001',
  email: 'admin@autorepair.com',
  name: '张管理',
  role: 'admin',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
};

export function getMockDashboardData(): DashboardData {
  return {
    lastRefreshedAt: new Date().toISOString(),
    warnings: {
      overloadedStations: 2,
      inventoryGaps: 5,
      qualityAnomalies: 3,
      reworkRateAlert: true,
    },
    reworkRate: {
      value: 8.7,
      threshold: 5,
      calculation: REWORK_RATE_CALCULATION,
    },
  };
}

export function getMockWorkorderTrend(): WorkorderTrendPoint[] {
  const data: WorkorderTrendPoint[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const total = Math.floor(Math.random() * 20) + 15;
    const completed = Math.floor(total * (0.7 + Math.random() * 0.25));
    const reworked = Math.floor(completed * (0.04 + Math.random() * 0.08));
    data.push({
      date: date.toISOString().slice(0, 10),
      total,
      completed,
      reworked,
      reworkRate: Number(((reworked / completed) * 100).toFixed(1)),
    });
  }
  return data;
}

export function getMockInventoryData(): InventoryCategoryData[] {
  return [
    { name: '机油滤清器', value: 45000, count: 120, isGap: false },
    { name: '刹车片', value: 32000, count: 85, isGap: false },
    { name: '轮胎', value: 28000, count: 40, isGap: false },
    { name: '火花塞', value: 15000, count: 60, isGap: false },
    { name: '空调滤芯', value: 12000, count: 90, isGap: false },
    { name: '库存缺口', value: 18000, count: 5, isGap: true },
  ];
}

export function getMockQuotes(): Quote[] {
  return [
    {
      id: 'q-001',
      quoteNo: 'QT20260619001',
      customerName: '李明',
      vehiclePlate: '京A·12345',
      totalAmount: 4580,
      createdAt: '2026-06-18T10:30:00Z',
      status: 'approved',
      items: [
        { id: 'qi-001', description: '前刹车片更换', quantity: 1, unitPrice: 680, partId: 'p-001', partSku: 'SKU-BP-001' },
        { id: 'qi-002', description: '机油更换（全合成）', quantity: 1, unitPrice: 480, partId: 'p-002', partSku: 'SKU-OIL-005' },
        { id: 'qi-003', description: '工时费', quantity: 2, unitPrice: 300 },
        { id: 'qi-004', description: '空调滤芯', quantity: 1, unitPrice: 180, partId: 'p-003', partSku: 'SKU-AC-012' },
        { id: 'qi-005', description: '刹车油', quantity: 1, unitPrice: 260, partId: 'p-004', partSku: 'SKU-BF-003' },
      ],
    },
    {
      id: 'q-002',
      quoteNo: 'QT20260619002',
      customerName: '王芳',
      vehiclePlate: '京B·67890',
      totalAmount: 12800,
      createdAt: '2026-06-18T14:20:00Z',
      status: 'completed',
      items: [
        { id: 'qi-006', description: '轮胎更换（4条）', quantity: 4, unitPrice: 2200, partId: 'p-005', partSku: 'SKU-TYRE-215' },
        { id: 'qi-007', description: '四轮定位', quantity: 1, unitPrice: 600 },
        { id: 'qi-008', description: '动平衡', quantity: 4, unitPrice: 100 },
        { id: 'qi-009', description: '气门嘴', quantity: 4, unitPrice: 50 },
      ],
    },
    {
      id: 'q-003',
      quoteNo: 'QT20260619003',
      customerName: '赵强',
      vehiclePlate: '沪C·54321',
      totalAmount: 2350,
      createdAt: '2026-06-19T09:15:00Z',
      status: 'draft',
      items: [
        { id: 'qi-010', description: '火花塞更换（4支）', quantity: 4, unitPrice: 380, partId: 'p-006', partSku: 'SKU-SP-008' },
        { id: 'qi-011', description: '节气门清洗', quantity: 1, unitPrice: 380 },
        { id: 'qi-012', description: '喷油嘴清洗', quantity: 1, unitPrice: 450 },
      ],
    },
    {
      id: 'q-004',
      quoteNo: 'QT20260619004',
      customerName: '陈静',
      vehiclePlate: '粤D·99999',
      totalAmount: 8650,
      createdAt: '2026-06-19T11:00:00Z',
      status: 'approved',
      items: [
        { id: 'qi-013', description: '变速箱油更换', quantity: 1, unitPrice: 1800, partId: 'p-007', partSku: 'SKU-TF-002' },
        { id: 'qi-014', description: '变速箱滤芯', quantity: 1, unitPrice: 650, partId: 'p-008', partSku: 'SKU-TF-FILT' },
        { id: 'qi-015', description: '防冻液更换', quantity: 1, unitPrice: 480, partId: 'p-009', partSku: 'SKU-COOL-01' },
        { id: 'qi-016', description: '刹车系统深度保养', quantity: 1, unitPrice: 1200 },
        { id: 'qi-017', description: '工时费', quantity: 5, unitPrice: 400 },
      ],
    },
  ];
}

export function getMockInspections(): Inspection[] {
  return [
    {
      id: 'ins-001',
      workorderId: 'wo-001',
      vehiclePlate: '京A·12345',
      photoUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop',
      hasAnomaly: true,
      annotations: [
        { id: 'a-001', type: 'scratch', x: 20, y: 35, width: 25, height: 8, remark: '右前门划痕' },
        { id: 'a-002', type: 'dent', x: 60, y: 50, width: 15, height: 12, remark: '后翼子板凹陷' },
      ],
      createdAt: '2026-06-18T11:00:00Z',
      inspectorId: 'usr-002',
    },
    {
      id: 'ins-002',
      workorderId: 'wo-002',
      vehiclePlate: '京B·67890',
      photoUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop',
      hasAnomaly: false,
      annotations: [],
      createdAt: '2026-06-18T15:30:00Z',
      inspectorId: 'usr-002',
    },
    {
      id: 'ins-003',
      workorderId: 'wo-003',
      vehiclePlate: '沪C·54321',
      photoUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop',
      hasAnomaly: true,
      annotations: [
        { id: 'a-003', type: 'missing_part', x: 45, y: 60, width: 20, height: 20, remark: '发动机护板缺失' },
      ],
      createdAt: '2026-06-19T10:00:00Z',
      inspectorId: 'usr-003',
    },
    {
      id: 'ins-004',
      workorderId: 'wo-004',
      vehiclePlate: '粤D·99999',
      photoUrl: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop',
      hasAnomaly: true,
      annotations: [
        { id: 'a-004', type: 'other', x: 10, y: 80, width: 30, height: 15, remark: '底盘漏油需进一步检查' },
      ],
      createdAt: '2026-06-19T11:45:00Z',
      inspectorId: 'usr-003',
    },
    {
      id: 'ins-005',
      workorderId: 'wo-005',
      vehiclePlate: '津E·88888',
      photoUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop',
      hasAnomaly: false,
      annotations: [],
      createdAt: '2026-06-19T13:20:00Z',
      inspectorId: 'usr-002',
    },
    {
      id: 'ins-006',
      workorderId: 'wo-006',
      vehiclePlate: '渝F·66666',
      photoUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=300&fit=crop',
      hasAnomaly: true,
      annotations: [
        { id: 'a-005', type: 'scratch', x: 70, y: 20, width: 18, height: 6, remark: '前保险杠划痕' },
      ],
      createdAt: '2026-06-19T14:50:00Z',
      inspectorId: 'usr-003',
    },
  ];
}
