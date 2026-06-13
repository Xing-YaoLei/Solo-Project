import {
  User,
  ImportBatch,
  Inventory,
  Transaction,
  Review,
  HandOrder,
  InventoryUsage,
  DashboardMetrics,
  FunnelData,
  TechnicianRank,
  ConsumptionData,
  PhotoFunnelData,
  InventoryRank,
  FollowupTrend,
  TechnicianMetrics,
} from '@/types';

export const MOCK_TECHNICIANS: User[] = [
  { id: '2', email: 'tech1@beauty.com', name: '李美容师', role: 'TECHNICIAN', createdAt: new Date() },
  { id: '3', email: 'tech2@beauty.com', name: '王美容师', role: 'TECHNICIAN', createdAt: new Date() },
  { id: '4', email: 'tech3@beauty.com', name: '陈美容师', role: 'TECHNICIAN', createdAt: new Date() },
];

export const MOCK_INVENTORIES: Inventory[] = [
  { id: 'inv1', batchId: 'batch1', skuCode: 'SKU001', productName: '玻尿酸精华液', category: '护肤精华', unit: '瓶', stockQuantity: 100, unitPrice: 298, importedAt: new Date() },
  { id: 'inv2', batchId: 'batch1', skuCode: 'SKU002', productName: '烟酰胺原液', category: '护肤精华', unit: '瓶', stockQuantity: 80, unitPrice: 198, importedAt: new Date() },
  { id: 'inv3', batchId: 'batch1', skuCode: 'SKU003', productName: '补水保湿面膜', category: '面膜', unit: '片', stockQuantity: 500, unitPrice: 38, importedAt: new Date() },
  { id: 'inv4', batchId: 'batch1', skuCode: 'SKU004', productName: '胶原蛋白面霜', category: '面霜', unit: '瓶', stockQuantity: 60, unitPrice: 458, importedAt: new Date() },
  { id: 'inv5', batchId: 'batch1', skuCode: 'SKU005', productName: '清洁洁面乳', category: '洁面', unit: '支', stockQuantity: 120, unitPrice: 128, importedAt: new Date() },
  { id: 'inv6', batchId: 'batch1', skuCode: 'SKU006', productName: '抗皱眼霜', category: '眼部护理', unit: '瓶', stockQuantity: 45, unitPrice: 598, importedAt: new Date() },
  { id: 'inv7', batchId: 'batch1', skuCode: 'SKU007', productName: '舒缓爽肤水', category: '化妆水', unit: '瓶', stockQuantity: 90, unitPrice: 188, importedAt: new Date() },
  { id: 'inv8', batchId: 'batch1', skuCode: 'SKU008', productName: '防晒隔离霜', category: '防晒', unit: '瓶', stockQuantity: 70, unitPrice: 268, importedAt: new Date() },
];

const HAND_NOS = ['H20240601001', 'H20240601002', 'H20240601003', 'H20240601004', 'H20240601005', 'H20240601006', 'H20240601007', 'H20240601008', 'H20240601009', 'H20240601010', 'H20240601011', 'H20240601012', 'H20240601013', 'H20240601014', 'H20240601015', 'H20240601016', 'H20240601017', 'H20240601018', 'H20240601019', 'H20240601020'];

const SERVICE_ITEMS = ['深层补水护理', '抗衰紧致护理', '美白亮肤护理', '清洁祛痘护理', '眼部护理', '颈部护理', '面部按摩', 'SPA水疗'];

const CUSTOMERS = ['王女士', '李女士', '张女士', '刘女士', '陈女士', '杨女士', '赵女士', '黄女士', '周女士', '吴女士'];

export function generateMockTransactions(): Transaction[] {
  return HAND_NOS.map((handNo, index) => {
    const technicianId = MOCK_TECHNICIANS[index % 3].id;
    const amount = [398, 598, 798, 1280, 1680, 2180, 880, 1080][index % 8];
    return {
      id: `trans${index + 1}`,
      batchId: 'batch2',
      orderNo: `ORD2024060100${index + 1}`,
      handNo,
      technicianId,
      serviceItem: SERVICE_ITEMS[index % 8],
      amount,
      paymentMethod: ['微信', '支付宝', '银行卡', '储值卡'][index % 4],
      transactionTime: new Date(2024, 5, 1, 10 + (index % 10), (index * 7) % 60),
      status: 'PAID',
    };
  });
}

export function generateMockReviews(): Review[] {
  return HAND_NOS.slice(0, 16).map((handNo, index) => ({
    id: `review${index + 1}`,
    batchId: 'batch3',
    orderNo: `ORD2024060100${index + 1}`,
    rating: [5, 5, 4, 5, 3, 5, 4, 5, 5, 4, 5, 5, 4, 3, 5, 4][index],
    content: ['服务非常专业，效果很好！', '技师手法娴熟，环境舒适', '整体满意，会再来', '效果超出预期', '还可以，希望下次更好', '强烈推荐！', '很满意的一次体验', '产品很好用', '服务态度特别好', '做完皮肤水嫩嫩的', '效果明显', '性价比高', '值得信赖', '一般般吧', '非常好的服务', '下次还来'][index],
    hasBeforePhoto: [true, true, false, true, true, false, true, true, false, true, true, true, false, true, true, false][index],
    hasAfterPhoto: [true, true, true, false, true, true, true, false, true, true, true, false, true, true, false, true][index],
    followUpScript: ['V1-关心回访', 'V2-效果询问', 'V1-关心回访', 'V3-满意度调查', 'V2-效果询问', 'V1-关心回访', 'V3-满意度调查', 'V2-效果询问', 'V1-关心回访', 'V3-满意度调查', 'V2-效果询问', 'V1-关心回访', 'V3-满意度调查', 'V2-效果询问', 'V1-关心回访', 'V3-满意度调查'][index],
    responded: [true, true, false, true, true, false, true, true, false, true, true, false, true, true, false, true][index],
    reviewedAt: new Date(2024, 5, 1, 15 + (index % 5), (index * 11) % 60),
  }));
}

export function generateMockHandOrders(): HandOrder[] {
  const transactions = generateMockTransactions();
  const reviews = generateMockReviews();

  return HAND_NOS.map((handNo, index) => {
    const technician = MOCK_TECHNICIANS[index % 3];
    const transaction = transactions[index];
    const review = reviews[index];
    const statuses: Array<'CREATED' | 'IN_SERVICE' | 'COMPLETED' | 'PAID' | 'REVIEWED'> = ['REVIEWED', 'PAID', 'REVIEWED', 'PAID', 'REVIEWED', 'COMPLETED', 'REVIEWED', 'PAID', 'REVIEWED', 'COMPLETED', 'REVIEWED', 'PAID', 'REVIEWED', 'COMPLETED', 'REVIEWED', 'PAID', 'COMPLETED', 'IN_SERVICE', 'CREATED', 'CREATED'];

    const inventoryItems: InventoryUsage[] = [
      {
        id: `usage${index * 2 + 1}`,
        orderId: `order${index + 1}`,
        inventoryId: MOCK_INVENTORIES[index % 4].id,
        quantity: [1, 1, 2, 1, 1, 3, 1, 1][index % 8],
        isAbnormal: index % 7 === 0,
        abnormalNote: index % 7 === 0 ? '产品临近保质期' : undefined,
        inventory: MOCK_INVENTORIES[index % 4],
      },
      {
        id: `usage${index * 2 + 2}`,
        orderId: `order${index + 1}`,
        inventoryId: MOCK_INVENTORIES[(index + 2) % 8].id,
        quantity: 1,
        isAbnormal: false,
        inventory: MOCK_INVENTORIES[(index + 2) % 8],
      },
    ];

    return {
      id: `order${index + 1}`,
      handNo,
      technicianId: technician.id,
      customerName: CUSTOMERS[index % 10],
      serviceItems: [SERVICE_ITEMS[index % 8]],
      totalAmount: transaction.amount,
      status: statuses[index],
      createdAt: new Date(2024, 5, 1, 9 + (index % 10), (index * 5) % 60),
      completedAt: index < 18 ? new Date(2024, 5, 1, 11 + (index % 10), (index * 8) % 60) : undefined,
      technician,
      transactions: [transaction],
      inventoryItems,
      review,
    };
  });
}

export function getDashboardMetrics(): DashboardMetrics {
  return {
    todayRevenue: 18650,
    todayOrders: 20,
    avgOrderValue: 932.5,
    completionRate: 0.85,
    yoyGrowth: 0.125,
  };
}

export function getFunnelData(): FunnelData[] {
  return [
    { stage: '开单', value: 20, conversionRate: 1.0 },
    { stage: '服务中', value: 18, conversionRate: 0.9 },
    { stage: '服务完成', value: 17, conversionRate: 0.94 },
    { stage: '已支付', value: 16, conversionRate: 0.94 },
    { stage: '已点评', value: 12, conversionRate: 0.75 },
  ];
}

export function getTechnicianRank(): TechnicianRank[] {
  return [
    { id: '2', name: '李美容师', totalRevenue: 7580, orderCount: 7, avgRating: 4.86 },
    { id: '3', name: '王美容师', totalRevenue: 6280, orderCount: 7, avgRating: 4.57 },
    { id: '4', name: '陈美容师', totalRevenue: 4790, orderCount: 6, avgRating: 4.67 },
  ];
}

export function getConsumptionData(dimension: 'item' | 'amount' | 'time'): ConsumptionData[] {
  if (dimension === 'item') {
    return [
      { name: '深层补水护理', value: 5, count: 5 },
      { name: '抗衰紧致护理', value: 4, count: 4 },
      { name: '美白亮肤护理', value: 3, count: 3 },
      { name: '清洁祛痘护理', value: 3, count: 3 },
      { name: '眼部护理', value: 2, count: 2 },
      { name: '其他', value: 3, count: 3 },
    ];
  }
  if (dimension === 'amount') {
    return [
      { name: '0-500元', value: 3, count: 3 },
      { name: '500-1000元', value: 8, count: 8 },
      { name: '1000-1500元', value: 5, count: 5 },
      { name: '1500-2000元', value: 3, count: 3 },
      { name: '2000元以上', value: 1, count: 1 },
    ];
  }
  return [
    { name: '10:00前', value: 2, count: 2 },
    { name: '10:00-12:00', value: 5, count: 5 },
    { name: '12:00-14:00', value: 3, count: 3 },
    { name: '14:00-16:00', value: 4, count: 4 },
    { name: '16:00-18:00', value: 3, count: 3 },
    { name: '18:00后', value: 3, count: 3 },
  ];
}

export function getPhotoFunnelData(): PhotoFunnelData[] {
  return [
    { stage: '服务订单', value: 20 },
    { stage: '上传术前照', value: 10 },
    { stage: '上传术后照', value: 8 },
    { stage: '形成对比案例', value: 6 },
  ];
}

export function getInventoryRank(): InventoryRank[] {
  return [
    { id: 'inv3', productName: '补水保湿面膜', category: '面膜', totalUsed: 45, abnormalCount: 2, abnormalRate: 0.044 },
    { id: 'inv1', productName: '玻尿酸精华液', category: '护肤精华', totalUsed: 28, abnormalCount: 1, abnormalRate: 0.036 },
    { id: 'inv7', productName: '舒缓爽肤水', category: '化妆水', totalUsed: 22, abnormalCount: 0, abnormalRate: 0 },
    { id: 'inv2', productName: '烟酰胺原液', category: '护肤精华', totalUsed: 18, abnormalCount: 1, abnormalRate: 0.056 },
    { id: 'inv5', productName: '清洁洁面乳', category: '洁面', totalUsed: 15, abnormalCount: 0, abnormalRate: 0 },
    { id: 'inv4', productName: '胶原蛋白面霜', category: '面霜', totalUsed: 12, abnormalCount: 0, abnormalRate: 0 },
  ];
}

export function getFollowupTrend(): FollowupTrend[] {
  const dates = ['06-01', '06-02', '06-03', '06-04', '06-05', '06-06', '06-07'];
  const scripts = ['V1-关心回访', 'V2-效果询问', 'V3-满意度调查'];
  const result: FollowupTrend[] = [];

  dates.forEach(date => {
    scripts.forEach(script => {
      const baseRate = script === 'V1' ? 0.75 : script === 'V2' ? 0.68 : 0.82;
      const variance = (Math.random() - 0.5) * 0.1;
      result.push({
        date,
        script,
        responseRate: Math.max(0.5, Math.min(0.95, baseRate + variance)),
        count: Math.floor(8 + Math.random() * 12),
      });
    });
  });

  return result;
}

export function getTechnicianMetrics(technicianId: string): TechnicianMetrics {
  const techData: Record<string, TechnicianMetrics> = {
    '2': { totalRevenue: 7580, orderCount: 7, avgOrderValue: 1082.86, avgRating: 4.86, completionRate: 0.92 },
    '3': { totalRevenue: 6280, orderCount: 7, avgOrderValue: 897.14, avgRating: 4.57, completionRate: 0.88 },
    '4': { totalRevenue: 4790, orderCount: 6, avgOrderValue: 798.33, avgRating: 4.67, completionRate: 0.90 },
  };
  return techData[technicianId] || { totalRevenue: 0, orderCount: 0, avgOrderValue: 0, avgRating: 0, completionRate: 0 };
}

export function getBatches(): ImportBatch[] {
  return [
    {
      id: 'batch1',
      batchNo: 'I-20240601100000-ABCD',
      type: 'INVENTORY',
      fileName: 'inventory_20240601.csv',
      recordCount: 8,
      importedBy: '1',
      importedAt: new Date(2024, 5, 1, 10, 0),
      status: 'COMPLETED',
    },
    {
      id: 'batch2',
      batchNo: 'T-20240601140000-EFGH',
      type: 'TRANSACTION',
      fileName: 'transaction_20240601.csv',
      recordCount: 20,
      importedBy: '1',
      importedAt: new Date(2024, 5, 1, 14, 0),
      status: 'COMPLETED',
    },
    {
      id: 'batch3',
      batchNo: 'R-20240601180000-IJKL',
      type: 'REVIEW',
      fileName: 'review_20240601.csv',
      recordCount: 16,
      importedBy: '1',
      importedAt: new Date(2024, 5, 1, 18, 0),
      status: 'COMPLETED',
    },
  ];
}
