import dayjs from 'dayjs';
import type {
  Store,
  Vehicle,
  DocumentItem,
  Alert,
  WarningThreshold,
  RuleConfig,
  MatrixBubble,
  PreparationTrendPoint,
  TestDriveDistributionPoint,
  QuoteCandlePoint,
  SyncDelayInfo,
  RiskLevel,
  DocumentType,
  TurnoverStage,
} from '@shared/types';

const now = dayjs();

export const mockStores: Store[] = [
  { id: 's1', name: '北京朝阳旗舰店', code: 'BJ-CY-001', region: '华北', address: '北京市朝阳区建国路88号', lng: 116.4551, lat: 39.9200, riskScore: 72, inStockCount: 58, alertCount: 8 },
  { id: 's2', name: '上海浦东中心店', code: 'SH-PD-001', region: '华东', address: '上海市浦东新区陆家嘴环路1000号', lng: 121.5057, lat: 31.2397, riskScore: 45, inStockCount: 72, alertCount: 5 },
  { id: 's3', name: '广州天河店', code: 'GZ-TH-001', region: '华南', address: '广州市天河区珠江新城华夏路16号', lng: 113.3245, lat: 23.1166, riskScore: 58, inStockCount: 41, alertCount: 6 },
  { id: 's4', name: '深圳南山店', code: 'SZ-NS-001', region: '华南', address: '深圳市南山区科技园南区科苑路15号', lng: 113.9348, lat: 22.5309, riskScore: 85, inStockCount: 63, alertCount: 12 },
  { id: 's5', name: '杭州西湖店', code: 'HZ-XH-001', region: '华东', address: '杭州市西湖区文三路478号', lng: 120.1220, lat: 30.2741, riskScore: 38, inStockCount: 35, alertCount: 3 },
  { id: 's6', name: '成都高新店', code: 'CD-GX-001', region: '西南', address: '成都市高新区天府大道北段1700号', lng: 104.0665, lat: 30.5723, riskScore: 52, inStockCount: 44, alertCount: 4 },
  { id: 's7', name: '武汉江汉店', code: 'WH-JH-001', region: '华中', address: '武汉市江汉区建设大道568号', lng: 114.2710, lat: 30.5928, riskScore: 65, inStockCount: 38, alertCount: 7 },
  { id: 's8', name: '西安高新店', code: 'XA-GX-001', region: '西北', address: '西安市高新区科技路33号', lng: 108.9398, lat: 34.3416, riskScore: 48, inStockCount: 29, alertCount: 3 },
];

const brands = ['宝马', '奔驰', '奥迪', '丰田', '本田', '大众', '特斯拉', '比亚迪', '蔚来', '理想', '小鹏', '沃尔沃'];
const models: Record<string, string[]> = {
  宝马: ['3系', '5系', 'X3', 'X5'],
  奔驰: ['C级', 'E级', 'GLC', 'GLE'],
  奥迪: ['A4L', 'A6L', 'Q5L', 'Q7'],
  丰田: ['凯美瑞', '汉兰达', 'RAV4', '普拉多'],
  本田: ['雅阁', 'CR-V', '思域', '冠道'],
  大众: ['帕萨特', '迈腾', '途观L', '途昂'],
  特斯拉: ['Model 3', 'Model Y', 'Model S'],
  比亚迪: ['汉', '唐', '宋PLUS', '海豹'],
  蔚来: ['ES6', 'ES8', 'ET5', 'ET7'],
  理想: ['L7', 'L8', 'L9'],
  小鹏: ['P7', 'G6', 'G9'],
  沃尔沃: ['S60', 'S90', 'XC60', 'XC90'],
};
const stages: TurnoverStage[] = ['inbound', 'preparation', 'test_drive', 'quoting', 'deal', 'transfer'];
const riskLevels: RiskLevel[] = ['low', 'medium', 'high', 'critical'];
const docTypes: DocumentType[] = ['driving_license', 'registration_cert', 'purchase_tax', 'insurance_policy', 'invoice', 'other'];
const docNames: Record<DocumentType, string> = {
  driving_license: '行驶证',
  registration_cert: '登记证',
  purchase_tax: '购置税完税证明',
  insurance_policy: '交强险保单',
  invoice: '购车发票',
  other: '其他材料',
};
const storeIds = mockStores.map((s) => s.id);

const DOCUMENT_TYPES_SORTED: { key: DocumentType; label: string }[] = [
  { key: 'driving_license', label: '行驶证' },
  { key: 'registration_cert', label: '登记证' },
  { key: 'purchase_tax', label: '购置税完税证明' },
  { key: 'insurance_policy', label: '交强险保单' },
  { key: 'invoice', label: '购车发票' },
  { key: 'other', label: '其他材料' },
];

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function vin(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < 17; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export const mockVehicles: Vehicle[] = Array.from({ length: 30 }, (_, i) => {
  const brand = pick(brands);
  const model = pick(models[brand]);
  const stockDays = rand(0, 60);
  const completion = Math.max(0, Math.min(100, 100 - stockDays * 1.2 - rand(0, 20)));
  let level: RiskLevel;
  if (completion >= 75 && stockDays < 15) level = 'low';
  else if (completion >= 50 && stockDays < 30) level = 'medium';
  else if (completion >= 25 && stockDays < 45) level = 'high';
  else level = 'critical';
  return {
    id: `v${i + 1}`,
    vin: vin(),
    plateNumber: `京${pick(['A', 'B', 'C', 'D'])}${rand(10000, 99999)}`,
    brand,
    model,
    year: rand(2018, 2024),
    mileage: rand(5000, 120000),
    storeId: pick(storeIds),
    inboundDate: now.subtract(stockDays, 'day').format('YYYY-MM-DD'),
    stage: stockDays < 7 ? 'inbound' : stockDays < 15 ? pick(['inbound', 'preparation']) : stockDays < 30 ? pick(['preparation', 'test_drive']) : stockDays < 45 ? pick(['test_drive', 'quoting']) : pick(['quoting', 'deal', 'transfer']),
    stockDays,
    documentCompletion: Math.round(completion),
    riskLevel: level,
  };
});

export const mockDocuments: DocumentItem[] = mockVehicles.flatMap((v) =>
  docTypes.map((dt, idx) => {
    const threshold = v.documentCompletion / 100;
    const randVal = Math.random();
    let status: DocumentItem['status'];
    if (randVal < threshold * 0.85) status = 'present';
    else if (randVal < threshold * 0.95) status = 'pending';
    else if (randVal < threshold) status = 'expired';
    else status = 'missing';
    return {
      id: `doc-${v.id}-${idx}`,
      vehicleId: v.id,
      type: dt,
      name: docNames[dt],
      status,
      uploadedAt: status === 'present' || status === 'expired' ? now.subtract(rand(1, 50), 'day').toISOString() : undefined,
      expireAt: status === 'expired' ? now.subtract(rand(1, 30), 'day').toISOString() : status === 'present' ? now.add(rand(100, 500), 'day').toISOString() : undefined,
      verified: status === 'present',
    };
  })
);

const ruleNames = ['行驶证滞库超期预警', '登记证缺失预警', '购置税到期预警', '交强险过期预警', '购车发票缺失预警', '综合高风险预警'];
const ruleExpressions = [
  'stockDays > params.warningDays AND documents.driving_license.status != "present"',
  'documents.registration_cert.status == "missing" AND stage IN ("test_drive","quoting")',
  'documents.purchase_tax.expireAt < today + 30',
  'documents.insurance_policy.status == "expired"',
  'documents.invoice.status == "missing" AND stockDays > 7',
  'documentCompletion < params.completionThreshold AND stockDays > params.stockDaysThreshold',
];

export const mockRules: RuleConfig[] = ruleNames.map((name, i) => ({
  id: `rule-${i + 1}`,
  name,
  description: `${name}规则描述`,
  expression: ruleExpressions[i],
  level: i === 5 ? 'critical' : i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
  enabled: i !== 2,
  createdAt: now.subtract(rand(30, 200), 'day').toISOString(),
  updatedAt: now.subtract(rand(1, 30), 'day').toISOString(),
}));

function buildAlert(i: number): Alert {
  const v = mockVehicles[i % mockVehicles.length];
  const store = mockStores.find((s) => s.id === v.storeId)!;
  const doc = mockDocuments.filter((d) => d.vehicleId === v.id && d.status !== 'present');
  const missingDoc = doc.length > 0 ? pick(doc) : undefined;
  const triggeredAt = now.subtract(rand(0, 30), 'day').subtract(rand(0, 1440), 'minute');
  const isNew = triggeredAt.isAfter(now.subtract(10, 'minute'));
  return {
    id: `alert-${i + 1}`,
    vehicleId: v.id,
    vin: v.vin,
    storeId: store.id,
    storeName: store.name,
    documentType: missingDoc?.type,
    ruleId: mockRules[i % mockRules.length].id,
    ruleName: mockRules[i % mockRules.length].name,
    level: v.riskLevel,
    message: missingDoc ? `【${store.name}】${v.brand}${v.model}(${v.plateNumber}) ${missingDoc.name}缺失，已滞库${v.stockDays}天` : `【${store.name}】${v.brand}${v.model}(${v.plateNumber}) 综合风险等级${v.riskLevel}`,
    triggeredAt: triggeredAt.toISOString(),
    acknowledged: i % 3 === 0,
    acknowledgedAt: i % 3 === 0 ? triggeredAt.add(rand(1, 180), 'minute').toISOString() : undefined,
    resolved: i % 5 === 0,
    resolvedAt: i % 5 === 0 ? triggeredAt.add(rand(1, 720), 'minute').toISOString() : undefined,
    stockDays: v.stockDays,
  };
}

export const mockAlerts: Alert[] = Array.from({ length: 25 }, (_, i) => buildAlert(i)).sort((a, b) => dayjs(b.triggeredAt).valueOf() - dayjs(a.triggeredAt).valueOf());

export const mockMatrixBubbles: MatrixBubble[] = (() => {
  const stockBuckets = ['0-7', '8-15', '16-30', '31+'];
  const compBuckets = ['0-25', '26-50', '51-75', '76-100'];
  const out: MatrixBubble[] = [];
  for (let si = 0; si < stockBuckets.length; si++) {
    for (let ci = 0; ci < compBuckets.length; ci++) {
      const distFromIdeal = si + (3 - ci);
      let level: RiskLevel;
      if (distFromIdeal <= 1) level = 'low';
      else if (distFromIdeal <= 3) level = 'medium';
      else if (distFromIdeal <= 5) level = 'high';
      else level = 'critical';
      const count = Math.max(0, rand(0, 12) - Math.floor(distFromIdeal * 0.8));
      out.push({
        stockAgeBucket: stockBuckets[si],
        completionBucket: compBuckets[ci],
        count,
        riskLevel: level,
        vehicleIds: mockVehicles.slice(si * 3 + ci, si * 3 + ci + count).map((v) => v.id),
      });
    }
  }
  return out;
})();

export const mockPreparationTrend: PreparationTrendPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = now.subtract(29 - i, 'day').format('YYYY-MM-DD');
  const s = pick(mockStores);
  const completionBase = 65 + Math.sin(i / 5) * 8 + rand(-3, 3);
  const daysBase = 18 - Math.cos(i / 4) * 3 + rand(-1, 2);
  return {
    date,
    storeId: s.id,
    storeName: s.name,
    completionRate: Math.max(30, Math.min(98, Math.round(completionBase))),
    avgDays: Math.max(3, Math.min(45, Math.round(daysBase))),
    documentReadyRate: Math.max(25, Math.min(99, Math.round(completionBase + rand(-5, 5)))),
  };
});

export const mockTestDriveDistribution: TestDriveDistributionPoint[] = Array.from({ length: 12 }, (_, i) => {
  const weekStart = now.subtract((11 - i) * 7, 'day').format('YYYY-MM-DD');
  return {
    weekStart,
    firstTime: rand(15, 40),
    secondTime: rand(8, 22),
    thirdPlus: rand(2, 12),
    conversionRate: Math.round((rand(18, 40)) * 10) / 10,
    withDocumentsRate: Math.round((rand(55, 88)) * 10) / 10,
  };
});

export const mockQuoteCandles: QuoteCandlePoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = now.subtract(29 - i, 'day').format('YYYY-MM-DD');
  const base = 180000 + Math.sin(i / 4) * 15000 + rand(-5000, 5000);
  const open = base;
  const close = base + rand(-8000, 8000);
  const high = Math.max(open, close) + rand(0, 4000);
  const low = Math.min(open, close) - rand(0, 4000);
  const hasDeal = i % 5 === 2;
  return {
    date,
    vehicleId: mockVehicles[i % mockVehicles.length].id,
    open: Math.round(open),
    close: Math.round(close),
    high: Math.round(high),
    low: Math.round(low),
    volume: rand(1, 8),
    dealPrice: hasDeal ? Math.round(close * 0.97) : undefined,
  };
});

export const mockSyncDelayInfo: SyncDelayInfo[] = [
  {
    source: 'vehicle_source',
    sourceName: '车源库',
    lastSyncAt: now.subtract(2, 'hour').toISOString(),
    delayHours: 2,
    affectedFrom: now.subtract(2, 'day').format('YYYY-MM-DD'),
    affectedTo: now.subtract(0, 'day').format('YYYY-MM-DD'),
    isDelayed: false,
  },
  {
    source: 'finance',
    sourceName: '金融系统',
    lastSyncAt: now.subtract(36, 'hour').toISOString(),
    delayHours: 36,
    affectedFrom: now.subtract(3, 'day').format('YYYY-MM-DD'),
    affectedTo: now.subtract(1, 'day').format('YYYY-MM-DD'),
    isDelayed: true,
  },
  {
    source: 'inspector',
    sourceName: '检测仪',
    lastSyncAt: now.subtract(20, 'minute').toISOString(),
    delayHours: 0.3,
    affectedFrom: now.subtract(1, 'day').format('YYYY-MM-DD'),
    affectedTo: now.format('YYYY-MM-DD'),
    isDelayed: false,
  },
];

export const mockReviewTimeline = (() => {
  const v = mockVehicles[0];
  const inbound = dayjs(v.inboundDate);
  return [
    { stage: 'inbound', label: '入库', at: inbound.toISOString(), hasDocIssue: false, note: '车辆入库验收完成' },
    { stage: 'preparation', label: '整备中', at: inbound.add(1, 'day').toISOString(), hasDocIssue: true, note: '登记证缺失，需联系原车主补办' },
    { stage: 'test_drive', label: '试驾中', at: inbound.add(8, 'day').toISOString(), hasDocIssue: false, note: '3批次客户试驾完成' },
    { stage: 'quoting', label: '报价中', at: inbound.add(15, 'day').toISOString(), hasDocIssue: true, note: '购置税完税证明过期，影响报价' },
    { stage: 'deal', label: '已成交', at: inbound.add(22, 'day').toISOString(), hasDocIssue: false, note: '客户签订购车合同' },
    { stage: 'transfer', label: '已过户', at: inbound.add(28, 'day').toISOString(), hasDocIssue: false, note: '过户手续完成' },
  ] as const;
})();

const prepCategories = ['外观修复', '内饰清洁', '机械整备', '电子系统', '轮胎更换', '其他'];
const prepItems = ['喷漆修复', '全车抛光', '深度内饰清洗', '发动机保养', '变速箱检修', '电池检测', '刹车片更换', '四轮定位', '轮胎4条', '导航升级', '空调清洗', '大灯翻新'];

export const mockPreparationRecords = (() => {
  const v = mockVehicles[0];
  const inbound = dayjs(v.inboundDate);
  return prepItems.slice(0, 8).map((name, i) => ({
    itemName: name,
    category: prepCategories[i % prepCategories.length],
    cost: rand(150, 3800),
    status: i < 6 ? 'completed' : i < 7 ? 'in_progress' : 'pending',
    startedAt: inbound.add(i, 'day').toISOString(),
    completedAt: i < 6 ? inbound.add(i + 1, 'day').add(rand(1, 8), 'hour').toISOString() : undefined,
  }));
})();

export const mockTestDriveRecords = (() => {
  const v = mockVehicles[0];
  const inbound = dayjs(v.inboundDate);
  const customerNames = ['张先生', '李女士', '王总', '赵经理', '陈先生'];
  const salesNames = ['刘销售', '周顾问', '吴经理'];
  const feedbacks = ['动力满意，空间够用', '内饰较新，价格再谈', '整体不错，考虑中', '底盘扎实，待决策', '车况良好，已报价'];
  return customerNames.map((cust, i) => ({
    customerName: cust,
    driveAt: inbound.add(8 + i * 2, 'day').add(rand(9, 18), 'hour').toISOString(),
    mileage: rand(5, 45),
    salesPerson: salesNames[i % salesNames.length],
    rating: rand(3, 5),
    feedback: feedbacks[i],
  }));
})();

export const mockQuoteRecords = (() => {
  const v = mockVehicles[0];
  const inbound = dayjs(v.inboundDate);
  return [
    { date: inbound.add(12, 'day').format('YYYY-MM-DD'), amount: 195000, source: '到店客户', isDeal: false },
    { date: inbound.add(16, 'day').format('YYYY-MM-DD'), amount: 188000, source: '线上平台', isDeal: false },
    { date: inbound.add(19, 'day').format('YYYY-MM-DD'), amount: 192000, source: '老客户推荐', isDeal: false },
    { date: inbound.add(22, 'day').format('YYYY-MM-DD'), amount: 189800, source: '到店客户', isDeal: true, dealPrice: 188000 },
  ];
})();

export const mockWarningThresholds: WarningThreshold[] = DOCUMENT_TYPES_SORTED.map((dt, i) => ({
  id: `th-${i + 1}`,
  documentType: dt.key,
  name: dt.label,
  warningDays: [10, 8, 12, 15, 7, 20][i],
  criticalDays: [20, 15, 25, 30, 14, 40][i],
  escalationInterval: [24, 24, 48, 24, 12, 72][i],
  enabled: i !== 5,
  stageRequired: (['preparation', 'preparation', 'test_drive', 'test_drive', 'quoting', 'quoting'] as TurnoverStage[])[i],
}));
