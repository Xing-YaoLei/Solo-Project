import type {
  User,
  MaterialBatch,
  InventoryRecord,
  Supplier,
  UsageRule,
  InventoryThreshold,
  ShortageOrder,
  ShortageActionLog,
  SafetyStockConfig,
  DashboardStats,
  TurnoverAnalysis,
  TrendData,
  TimelineEvent,
} from '@/types';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    username: 'admin',
    name: '系统管理员',
    role: 'admin',
    region: '总部',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    username: 'worker1',
    name: '张三',
    role: 'worker',
    region: '华东区域',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-3',
    username: 'worker2',
    name: '李四',
    role: 'worker',
    region: '华南区域',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-4',
    username: 'worker3',
    name: '王五',
    role: 'worker',
    region: '华北区域',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-5',
    username: 'manager1',
    name: '王经理',
    role: 'manager',
    region: '总部',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export const mockSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: '建材优供有限公司',
    contact: '陈经理',
    phone: '13800138001',
    categories: ['瓷砖', '地板', '石材'],
    level: 'A',
    onTimeRate: 98.5,
    qualityScore: 4.8,
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'sup-2',
    name: '管材世家',
    contact: '刘总',
    phone: '13800138002',
    categories: ['水管', '电线', '五金'],
    level: 'B',
    onTimeRate: 92.0,
    qualityScore: 4.2,
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'sup-3',
    name: '油漆专家',
    contact: '王工',
    phone: '13800138003',
    categories: ['乳胶漆', '腻子', '防水涂料'],
    level: 'A',
    onTimeRate: 96.0,
    qualityScore: 4.7,
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'sup-4',
    name: '木材总汇',
    contact: '赵老板',
    phone: '13800138004',
    categories: ['板材', '龙骨', '线条'],
    level: 'B',
    onTimeRate: 89.5,
    qualityScore: 4.0,
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'sup-5',
    name: '卫浴精品',
    contact: '孙经理',
    phone: '13800138005',
    categories: ['马桶', '花洒', '浴室柜'],
    level: 'C',
    onTimeRate: 85.0,
    qualityScore: 3.8,
    status: 'inactive',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
];

const generateBatchNo = (prefix: string, index: number) => {
  const date = new Date();
  date.setDate(date.getDate() - index * 3);
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `${prefix}${dateStr}${String(index).padStart(4, '0')}`;
};

const materials = [
  { name: '抛光瓷砖', category: '瓷砖', spec: '800x800mm', unit: '片' },
  { name: '实木地板', category: '地板', spec: '910x125x18mm', unit: '平方米' },
  { name: 'PPR水管', category: '水管', spec: 'D25', unit: '米' },
  { name: '铜芯电线', category: '电线', spec: '2.5mm²', unit: '卷' },
  { name: '乳胶漆', category: '乳胶漆', spec: '5L', unit: '桶' },
  { name: '耐水腻子', category: '腻子', spec: '20kg', unit: '袋' },
  { name: '防水涂料', category: '防水涂料', spec: '20kg', unit: '桶' },
  { name: '生态板', category: '板材', spec: '1220x2440x18mm', unit: '张' },
];

const regions = ['华东区域', '华南区域', '华北区域', '西南区域'];

export const mockBatches: MaterialBatch[] = Array.from({ length: 30 }, (_, i) => {
  const material = materials[i % materials.length];
  const supplier = mockSuppliers[i % mockSuppliers.length];
  const person = mockUsers[(i % 3) + 1];
  const statuses: Array<'in_stock' | 'in_use' | 'shortage' | 'closed'> = [
    'in_stock', 'in_stock', 'in_stock', 'in_use', 'in_use', 'shortage', 'closed'
  ];
  const status = statuses[i % statuses.length];
  const inDate = new Date();
  inDate.setDate(inDate.getDate() - i * 2 - 5);

  return {
    id: `batch-${i + 1}`,
    batchNo: generateBatchNo('M', i + 1),
    materialName: material.name,
    specification: material.spec,
    category: material.category,
    quantity: Math.floor(Math.random() * 500) + 50,
    unit: material.unit,
    supplierId: supplier.id,
    supplierName: supplier.name,
    region: regions[i % regions.length],
    responsiblePersonId: person.id,
    responsiblePerson: person.name,
    status,
    inDate: inDate.toISOString().slice(0, 10),
    expectedTurnoverDays: 15 + Math.floor(Math.random() * 20),
    actualTurnoverDays: status === 'closed' ? 10 + Math.floor(Math.random() * 30) : undefined,
    createdAt: inDate.toISOString(),
    updatedAt: new Date().toISOString(),
  };
});

export const mockInventoryRecords: InventoryRecord[] = mockBatches.flatMap((batch, batchIdx) => {
  const records: InventoryRecord[] = [];
  const recordCount = 1 + Math.floor(Math.random() * 4);

  for (let i = 0; i < recordCount; i++) {
    const types: Array<'in' | 'out' | 'transfer' | 'adjust'> = ['in', 'out', 'out', 'transfer'];
    const type = i === 0 ? 'in' : types[i % types.length];
    const operator = mockUsers[Math.floor(Math.random() * mockUsers.length)];
    const date = new Date(batch.inDate);
    date.setDate(date.getDate() + i * 2 + Math.floor(Math.random() * 3));

    records.push({
      id: `record-${batchIdx}-${i}`,
      batchId: batch.id,
      type,
      quantity: type === 'in' ? batch.quantity : Math.floor(Math.random() * Math.min(batch.quantity, 100)) + 10,
      operatorId: operator.id,
      operator: operator.name,
      region: batch.region,
      remark: type === 'in' ? '材料进场入库' : type === 'out' ? '工地领用' : type === 'transfer' ? '区域调拨' : '库存调整',
      createdAt: date.toISOString(),
    });
  }

  return records;
});

export const mockUsageRules: UsageRule[] = [
  {
    id: 'rule-1',
    category: '瓷砖',
    maxQuantityPerDay: 500,
    requiresApproval: true,
    approvalLevel: 2,
    description: '瓷砖单日领用超500需项目经理审批',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'rule-2',
    category: '水管',
    maxQuantityPerDay: 1000,
    requiresApproval: false,
    approvalLevel: 1,
    description: '水管日常领用',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'rule-3',
    category: '乳胶漆',
    maxQuantityPerDay: 50,
    requiresApproval: true,
    approvalLevel: 2,
    description: '油漆类化学品需严格管控',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'rule-4',
    category: '电线',
    maxQuantityPerDay: 200,
    requiresApproval: true,
    approvalLevel: 1,
    description: '电线属于贵重物品，领用需审批',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export const mockThresholds: InventoryThreshold[] = [
  {
    id: 'thresh-1',
    category: '瓷砖',
    allowableErrorRate: 2.0,
    excessWarningThreshold: 1000,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'thresh-2',
    category: '水管',
    allowableErrorRate: 3.0,
    excessWarningThreshold: 2000,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'thresh-3',
    category: '乳胶漆',
    allowableErrorRate: 1.0,
    excessWarningThreshold: 100,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'thresh-4',
    category: '板材',
    allowableErrorRate: 2.5,
    excessWarningThreshold: 500,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export const mockShortageOrders: ShortageOrder[] = [
  {
    id: 'shortage-1',
    batchId: 'batch-6',
    batchNo: mockBatches[5].batchNo,
    materialName: mockBatches[5].materialName,
    shortageQuantity: 120,
    priority: 'high',
    responsiblePersonId: 'user-2',
    responsiblePerson: '张三',
    status: 'pending',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'shortage-2',
    batchId: 'batch-13',
    batchNo: mockBatches[12].batchNo,
    materialName: mockBatches[12].materialName,
    shortageQuantity: 85,
    priority: 'high',
    responsiblePersonId: 'user-3',
    responsiblePerson: '李四',
    status: 'processing',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'shortage-3',
    batchId: 'batch-20',
    batchNo: mockBatches[19].batchNo,
    materialName: mockBatches[19].materialName,
    shortageQuantity: 50,
    priority: 'medium',
    responsiblePersonId: 'user-4',
    responsiblePerson: '王五',
    status: 'supplemented',
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'shortage-4',
    batchId: 'batch-27',
    batchNo: mockBatches[26].batchNo,
    materialName: mockBatches[26].materialName,
    shortageQuantity: 30,
    priority: 'low',
    responsiblePersonId: 'user-2',
    responsiblePerson: '张三',
    status: 'closed',
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockShortageLogs: ShortageActionLog[] = [
  {
    id: 'log-1',
    shortageId: 'shortage-1',
    action: 'create',
    operatorId: 'user-1',
    operator: '系统管理员',
    remark: '系统自动检测到库存短缺，创建工单',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-2',
    shortageId: 'shortage-1',
    action: 'assign',
    operatorId: 'user-5',
    operator: '王经理',
    remark: '分派给张三处理，请尽快补货',
    createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-3',
    shortageId: 'shortage-2',
    action: 'create',
    operatorId: 'user-1',
    operator: '系统管理员',
    remark: '盘点发现短缺，创建工单',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-4',
    shortageId: 'shortage-2',
    action: 'assign',
    operatorId: 'user-5',
    operator: '王经理',
    remark: '分派给李四处理',
    createdAt: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-5',
    shortageId: 'shortage-2',
    action: 'retry',
    operatorId: 'user-3',
    operator: '李四',
    remark: '已联系供应商紧急补货，预计明日到货',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-6',
    shortageId: 'shortage-3',
    action: 'create',
    operatorId: 'user-1',
    operator: '系统管理员',
    remark: '领用检查发现短缺',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-7',
    shortageId: 'shortage-3',
    action: 'supplement',
    operatorId: 'user-4',
    operator: '王五',
    remark: '已从其他区域调拨补充',
    supplementQuantity: 50,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-8',
    shortageId: 'shortage-4',
    action: 'create',
    operatorId: 'user-1',
    operator: '系统管理员',
    remark: '库存预警触发短缺工单',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-9',
    shortageId: 'shortage-4',
    action: 'supplement',
    operatorId: 'user-2',
    operator: '张三',
    remark: '已完成补货',
    supplementQuantity: 30,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-10',
    shortageId: 'shortage-4',
    action: 'close',
    operatorId: 'user-5',
    operator: '王经理',
    remark: '工单已处理完成，关闭',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockSafetyStock: SafetyStockConfig[] = [
  {
    id: 'safety-1',
    materialName: '抛光瓷砖',
    category: '瓷砖',
    region: '华东区域',
    minStock: 200,
    warningStock: 500,
    currentStock: 350,
    consumptionRate: 25,
    estimatedDaysLeft: 14,
    unit: '片',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'safety-2',
    materialName: 'PPR水管',
    category: '水管',
    region: '华东区域',
    minStock: 500,
    warningStock: 1000,
    currentStock: 420,
    consumptionRate: 60,
    estimatedDaysLeft: 7,
    unit: '米',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'safety-3',
    materialName: '乳胶漆',
    category: '乳胶漆',
    region: '华南区域',
    minStock: 20,
    warningStock: 50,
    currentStock: 18,
    consumptionRate: 3,
    estimatedDaysLeft: 6,
    unit: '桶',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'safety-4',
    materialName: '铜芯电线',
    category: '电线',
    region: '华北区域',
    minStock: 50,
    warningStock: 100,
    currentStock: 156,
    consumptionRate: 8,
    estimatedDaysLeft: 19,
    unit: '卷',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'safety-5',
    materialName: '生态板',
    category: '板材',
    region: '华东区域',
    minStock: 30,
    warningStock: 80,
    currentStock: 25,
    consumptionRate: 4,
    estimatedDaysLeft: 6,
    unit: '张',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'safety-6',
    materialName: '实木地板',
    category: '地板',
    region: '西南区域',
    minStock: 100,
    warningStock: 200,
    currentStock: 280,
    consumptionRate: 12,
    estimatedDaysLeft: 23,
    unit: '平方米',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
];

const generateTrendData = (days: number): TrendData[] => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    return {
      date: date.toISOString().slice(0, 10),
      turnoverDays: 18 + Math.sin(i / 3) * 5 + Math.random() * 3,
      shortageCount: Math.floor(Math.random() * 4),
      stockValue: 50000 + Math.sin(i / 5) * 10000 + Math.random() * 5000,
    };
  });
};

export const mockTrendData = generateTrendData(30);

export const mockDashboardStats: DashboardStats = {
  totalBatches: mockBatches.length,
  inStockQuantity: mockBatches.filter(b => b.status === 'in_stock').reduce((sum, b) => sum + b.quantity, 0),
  pendingShortages: mockShortageOrders.filter(s => s.status === 'pending' || s.status === 'processing').length,
  avgTurnoverDays: Math.round(mockBatches.filter(b => b.actualTurnoverDays).reduce((sum, b) => sum + (b.actualTurnoverDays || 0), 0) / mockBatches.filter(b => b.actualTurnoverDays).length * 10) / 10,
  turnoverTrend: mockTrendData.slice(-14).map(d => ({ date: d.date, value: Math.round(d.turnoverDays * 10) / 10 })),
  shortageTrend: mockTrendData.slice(-14).map(d => ({ date: d.date, value: d.shortageCount })),
  regionDistribution: [
    { name: '华东区域', value: 12 },
    { name: '华南区域', value: 8 },
    { name: '华北区域', value: 6 },
    { name: '西南区域', value: 4 },
  ],
  recentAlerts: [
    {
      id: 'alert-1',
      type: 'shortage',
      message: `批次 ${mockShortageOrders[0].batchNo} ${mockShortageOrders[0].materialName} 短缺 ${mockShortageOrders[0].shortageQuantity}`,
      priority: 'high',
      createdAt: mockShortageOrders[0].createdAt,
    },
    {
      id: 'alert-2',
      type: 'low_stock',
      message: 'PPR水管 华东区域库存已低于警戒线',
      priority: 'high',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-3',
      type: 'low_stock',
      message: '乳胶漆 华南区域预计6天后缺货',
      priority: 'medium',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-4',
      type: 'overstock',
      message: '铜芯电线 华北区域库存偏高，建议控制采购',
      priority: 'low',
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

export const mockTurnoverAnalysis: TurnoverAnalysis[] = [
  { dimension: 'material', name: '瓷砖', avgTurnoverDays: 22.5, totalBatches: 8, shortageCount: 2, comparisonLastPeriod: -3.2 },
  { dimension: 'material', name: '水管', avgTurnoverDays: 15.3, totalBatches: 6, shortageCount: 1, comparisonLastPeriod: -1.8 },
  { dimension: 'material', name: '乳胶漆', avgTurnoverDays: 28.7, totalBatches: 5, shortageCount: 3, comparisonLastPeriod: 2.5 },
  { dimension: 'material', name: '电线', avgTurnoverDays: 18.9, totalBatches: 5, shortageCount: 0, comparisonLastPeriod: -0.5 },
  { dimension: 'material', name: '板材', avgTurnoverDays: 25.1, totalBatches: 4, shortageCount: 1, comparisonLastPeriod: 1.2 },
  { dimension: 'region', name: '华东区域', avgTurnoverDays: 19.8, totalBatches: 12, shortageCount: 3, comparisonLastPeriod: -2.1 },
  { dimension: 'region', name: '华南区域', avgTurnoverDays: 22.4, totalBatches: 8, shortageCount: 2, comparisonLastPeriod: 0.8 },
  { dimension: 'region', name: '华北区域', avgTurnoverDays: 24.1, totalBatches: 6, shortageCount: 1, comparisonLastPeriod: -1.3 },
  { dimension: 'region', name: '西南区域', avgTurnoverDays: 26.7, totalBatches: 4, shortageCount: 1, comparisonLastPeriod: 3.2 },
  { dimension: 'person', name: '张三', avgTurnoverDays: 20.5, totalBatches: 10, shortageCount: 2, comparisonLastPeriod: -2.8 },
  { dimension: 'person', name: '李四', avgTurnoverDays: 22.1, totalBatches: 10, shortageCount: 3, comparisonLastPeriod: 1.5 },
  { dimension: 'person', name: '王五', avgTurnoverDays: 25.3, totalBatches: 10, shortageCount: 2, comparisonLastPeriod: -0.6 },
];

export const getBatchTimeline = (batchId: string): TimelineEvent[] => {
  const batch = mockBatches.find(b => b.id === batchId);
  if (!batch) return [];

  const records = mockInventoryRecords.filter(r => r.batchId === batchId);
  const shortages = mockShortageOrders.filter(s => s.batchId === batchId);
  const logs = shortages.flatMap(s => mockShortageLogs.filter(l => l.shortageId === s.id));

  const events: TimelineEvent[] = [
    {
      id: `event-in-${batch.id}`,
      type: 'in',
      title: '材料入库',
      description: `${batch.materialName} ${batch.quantity}${batch.unit} 进场入库`,
      operator: batch.responsiblePerson,
      timestamp: batch.createdAt,
      quantity: batch.quantity,
    },
  ];

  records.forEach(record => {
    if (record.type !== 'in') {
      const typeMap = {
        out: { type: 'out' as const, title: '材料领用' },
        transfer: { type: 'transfer' as const, title: '区域调拨' },
        adjust: { type: 'adjust' as const, title: '库存调整' },
      };
      const map = typeMap[record.type] || typeMap.out;
      events.push({
        id: `event-${record.id}`,
        type: map.type,
        title: map.title,
        description: `${record.remark} - ${record.quantity}${batch.unit}`,
        operator: record.operator,
        timestamp: record.createdAt,
        quantity: record.quantity,
      });
    }
  });

  shortages.forEach(shortage => {
    events.push({
      id: `event-shortage-${shortage.id}`,
      type: 'shortage',
      title: '批次短缺',
      description: `发现短缺 ${shortage.shortageQuantity}${batch.unit}，优先级: ${shortage.priority === 'high' ? '高' : shortage.priority === 'medium' ? '中' : '低'}`,
      operator: shortage.responsiblePerson,
      timestamp: shortage.createdAt,
      quantity: shortage.shortageQuantity,
    });

    const shortageLogs = logs.filter(l => l.shortageId === shortage.id);
    shortageLogs.forEach(log => {
      if (log.action === 'supplement') {
        events.push({
          id: `event-supplement-${log.id}`,
          type: 'supplement',
          title: '补录完成',
          description: `${log.remark} - 补录 ${log.supplementQuantity}${batch.unit}`,
          operator: log.operator,
          timestamp: log.createdAt,
          quantity: log.supplementQuantity,
        });
      }
      if (log.action === 'close') {
        events.push({
          id: `event-close-${log.id}`,
          type: 'close',
          title: '工单关闭',
          description: log.remark,
          operator: log.operator,
          timestamp: log.createdAt,
        });
      }
    });
  });

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

export const mockCurrentUser = mockUsers[0];
