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
import { mockStore } from './mockStore';

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

const SERVICE_ITEMS = ['深层补水护理', '抗衰紧致护理', '美白亮肤护理', '清洁祛痘护理', '眼部护理', '颈部护理', '面部按摩', 'SPA水疗'];
const CUSTOMERS = ['王女士', '李女士', '张女士', '刘女士', '陈女士', '杨女士', '赵女士', '黄女士', '周女士', '吴女士'];

function ensureSeedData(): void {
  if (mockStore.orders.length > 0) return;

  const HAND_NOS = [
    'H20240601001', 'H20240601002', 'H20240601003', 'H20240601004', 'H20240601005',
    'H20240601006', 'H20240601007', 'H20240601008', 'H20240601009', 'H20240601010',
    'H20240601011', 'H20240601012', 'H20240601013', 'H20240601014', 'H20240601015',
    'H20240601016', 'H20240601017', 'H20240601018', 'H20240601019', 'H20240601020',
  ];
  const statuses: Array<'CREATED' | 'IN_SERVICE' | 'COMPLETED' | 'PAID' | 'REVIEWED'> = [
    'REVIEWED', 'PAID', 'REVIEWED', 'PAID', 'REVIEWED',
    'COMPLETED', 'REVIEWED', 'PAID', 'REVIEWED', 'COMPLETED',
    'REVIEWED', 'PAID', 'REVIEWED', 'COMPLETED', 'REVIEWED',
    'PAID', 'COMPLETED', 'IN_SERVICE', 'CREATED', 'CREATED',
  ];

  const seedTransactions: Transaction[] = HAND_NOS.map((handNo, index) => {
    const tech = MOCK_TECHNICIANS[index % 3];
    const amount = [398, 598, 798, 1280, 1680, 2180, 880, 1080][index % 8];
    return {
      id: `trans-seed-${index}`,
      batchId: 'batch-seed',
      orderNo: `ORD2024060100${index + 1}`,
      handNo,
      technicianId: tech.id,
      serviceItem: SERVICE_ITEMS[index % 8],
      amount,
      paymentMethod: ['微信', '支付宝', '银行卡', '储值卡'][index % 4],
      transactionTime: new Date(2024, 5, 1, 10 + (index % 10), (index * 7) % 60),
      status: 'PAID' as const,
      technician: tech,
    };
  });
  mockStore.addTransactions(seedTransactions);

  const seedReviews: Review[] = HAND_NOS.slice(0, 16).map((_, index) => ({
    id: `review-seed-${index}`,
    batchId: 'batch-seed',
    orderNo: `ORD2024060100${index + 1}`,
    rating: [5, 5, 4, 5, 3, 5, 4, 5, 5, 4, 5, 5, 4, 3, 5, 4][index],
    content: ['服务非常专业，效果很好！', '技师手法娴熟，环境舒适', '整体满意，会再来', '效果超出预期', '还可以，希望下次更好', '强烈推荐！', '很满意的一次体验', '产品很好用', '服务态度特别好', '做完皮肤水嫩嫩的', '效果明显', '性价比高', '值得信赖', '一般般吧', '非常好的服务', '下次还来'][index],
    hasBeforePhoto: [true, true, false, true, true, false, true, true, false, true, true, true, false, true, true, false][index],
    hasAfterPhoto: [true, true, true, false, true, true, true, false, true, true, true, false, true, true, false, true][index],
    followUpScript: ['V1-关心回访', 'V2-效果询问', 'V1-关心回访', 'V3-满意度调查', 'V2-效果询问', 'V1-关心回访', 'V3-满意度调查', 'V2-效果询问', 'V1-关心回访', 'V3-满意度调查', 'V2-效果询问', 'V1-关心回访', 'V3-满意度调查', 'V2-效果询问', 'V1-关心回访', 'V3-满意度调查'][index],
    responded: [true, true, false, true, true, false, true, true, false, true, true, false, true, true, false, true][index],
    reviewedAt: new Date(2024, 5, 1, 15 + (index % 5), (index * 11) % 60),
  }));
  mockStore.addReviews(seedReviews);

  const seedOrders: HandOrder[] = HAND_NOS.map((handNo, index) => {
    const tech = MOCK_TECHNICIANS[index % 3];
    const trans = seedTransactions[index];
    const review = index < 16 ? seedReviews[index] : undefined;
    const invItems: InventoryUsage[] = [
      {
        id: `usage-seed-${index * 2 + 1}`,
        orderId: `order-seed-${index}`,
        inventoryId: MOCK_INVENTORIES[index % 4].id,
        quantity: [1, 1, 2, 1, 1, 3, 1, 1][index % 8],
        isAbnormal: index % 7 === 0,
        abnormalNote: index % 7 === 0 ? '产品临近保质期' : undefined,
        inventory: MOCK_INVENTORIES[index % 4],
      },
      {
        id: `usage-seed-${index * 2 + 2}`,
        orderId: `order-seed-${index}`,
        inventoryId: MOCK_INVENTORIES[(index + 2) % 8].id,
        quantity: 1,
        isAbnormal: false,
        inventory: MOCK_INVENTORIES[(index + 2) % 8],
      },
    ];

    return {
      id: `order-seed-${index}`,
      handNo,
      technicianId: tech.id,
      customerName: CUSTOMERS[index % 10],
      serviceItems: [trans.serviceItem],
      totalAmount: trans.amount,
      status: statuses[index],
      createdAt: new Date(2024, 5, 1, 9 + (index % 10), (index * 5) % 60),
      completedAt: index < 18 ? new Date(2024, 5, 1, 11 + (index % 10), (index * 8) % 60) : undefined,
      technician: tech,
      transactions: [trans],
      inventoryItems: invItems,
      review,
    };
  });

  for (const order of seedOrders) {
    mockStore.upsertOrder(order);
  }

  for (const inv of seedOrders.flatMap(o => o.inventoryItems || [])) {
    mockStore.addInventoryUsage(inv);
  }

  const seedBatches: ImportBatch[] = [
    { id: 'batch-seed-inv', batchNo: 'I-20240601100000-SEED', type: 'INVENTORY', fileName: 'inventory_seed.csv', recordCount: 8, importedBy: '1', importedAt: new Date(2024, 5, 1, 10, 0), status: 'COMPLETED' },
    { id: 'batch-seed-trans', batchNo: 'T-20240601140000-SEED', type: 'TRANSACTION', fileName: 'transaction_seed.csv', recordCount: 20, importedBy: '1', importedAt: new Date(2024, 5, 1, 14, 0), status: 'COMPLETED' },
    { id: 'batch-seed-rev', batchNo: 'R-20240601180000-SEED', type: 'REVIEW', fileName: 'review_seed.csv', recordCount: 16, importedBy: '1', importedAt: new Date(2024, 5, 1, 18, 0), status: 'COMPLETED' },
  ];
  for (const b of seedBatches) {
    mockStore.addBatch(b);
  }
}

export function generateMockTransactions(): Transaction[] {
  ensureSeedData();
  return mockStore.transactions;
}

export function generateMockReviews(): Review[] {
  ensureSeedData();
  return mockStore.reviews;
}

export function generateMockHandOrders(): HandOrder[] {
  ensureSeedData();
  return mockStore.orders;
}

export function getDashboardMetrics(): DashboardMetrics {
  ensureSeedData();
  const orders = mockStore.orders;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const paidOrders = orders.filter(o => o.status === 'PAID' || o.status === 'REVIEWED').length;
  const totalOrders = orders.length;
  return {
    todayRevenue: totalRevenue,
    todayOrders: totalOrders,
    avgOrderValue: paidOrders > 0 ? totalRevenue / paidOrders : 0,
    completionRate: totalOrders > 0 ? paidOrders / totalOrders : 0,
    yoyGrowth: 0.125,
  };
}

export function getFunnelData(): FunnelData[] {
  ensureSeedData();
  const orders = mockStore.orders;
  const stages = [
    { status: 'CREATED', label: '开单' },
    { status: 'IN_SERVICE', label: '服务中' },
    { status: 'COMPLETED', label: '服务完成' },
    { status: 'PAID', label: '已支付' },
    { status: 'REVIEWED', label: '已点评' },
  ];
  const statusOrder = ['CREATED', 'IN_SERVICE', 'COMPLETED', 'PAID', 'REVIEWED'];
  const result: FunnelData[] = [];
  let prevValue = orders.length;
  stages.forEach((stage, index) => {
    const value = orders.filter(o => {
      const si = statusOrder.indexOf(o.status);
      return si >= index;
    }).length;
    result.push({
      stage: stage.label,
      value,
      conversionRate: prevValue > 0 ? value / prevValue : 0,
    });
    prevValue = value;
  });
  return result;
}

export function getTechnicianRank(): TechnicianRank[] {
  ensureSeedData();
  const techs = mockStore.users.filter(u => u.role === 'TECHNICIAN');
  return techs.map(tech => {
    const techOrders = mockStore.orders.filter(o => o.technicianId === tech.id);
    const totalRevenue = techOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const ratedOrders = techOrders.filter(o => o.review);
    const avgRating = ratedOrders.length > 0
      ? ratedOrders.reduce((sum, o) => sum + (o.review?.rating || 0), 0) / ratedOrders.length
      : 0;
    return {
      id: tech.id,
      name: tech.name,
      totalRevenue,
      orderCount: techOrders.length,
      avgRating,
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export function getConsumptionData(dimension: 'item' | 'amount' | 'time'): ConsumptionData[] {
  ensureSeedData();
  const transactions = mockStore.transactions;

  if (dimension === 'item') {
    const grouped: Record<string, number> = {};
    transactions.forEach(t => {
      grouped[t.serviceItem] = (grouped[t.serviceItem] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([name, count]) => ({ name, value: count, count }))
      .sort((a, b) => b.value - a.value);
  }

  if (dimension === 'amount') {
    const ranges = [
      { name: '0-500元', min: 0, max: 500 },
      { name: '500-1000元', min: 500, max: 1000 },
      { name: '1000-1500元', min: 1000, max: 1500 },
      { name: '1500-2000元', min: 1500, max: 2000 },
      { name: '2000元以上', min: 2000, max: Infinity },
    ];
    return ranges.map(range => {
      const count = transactions.filter(t => t.amount >= range.min && t.amount < range.max).length;
      return { name: range.name, value: count, count };
    });
  }

  const timeRanges = [
    { name: '10:00前', min: 0, max: 10 },
    { name: '10:00-12:00', min: 10, max: 12 },
    { name: '12:00-14:00', min: 12, max: 14 },
    { name: '14:00-16:00', min: 14, max: 16 },
    { name: '16:00-18:00', min: 16, max: 18 },
    { name: '18:00后', min: 18, max: 24 },
  ];
  return timeRanges.map(range => {
    const count = transactions.filter(t => {
      const hour = t.transactionTime.getHours();
      return hour >= range.min && hour < range.max;
    }).length;
    return { name: range.name, value: count, count };
  });
}

export function getPhotoFunnelData(): PhotoFunnelData[] {
  ensureSeedData();
  const reviews = mockStore.reviews;
  const stages = [
    { stage: '服务订单', value: reviews.length },
    { stage: '上传术前照', value: reviews.filter(r => r.hasBeforePhoto).length },
    { stage: '上传术后照', value: reviews.filter(r => r.hasAfterPhoto).length },
    { stage: '形成对比案例', value: reviews.filter(r => r.hasBeforePhoto && r.hasAfterPhoto).length },
  ];
  return stages.map((item, index) => ({
    ...item,
    conversionRate: index === 0 ? 1 : stages[index - 1].value > 0 ? item.value / stages[index - 1].value : 0,
  }));
}

export function getInventoryRank(): InventoryRank[] {
  ensureSeedData();
  const grouped: Record<string, { product: Inventory; totalUsed: number; abnormalCount: number }> = {};
  mockStore.inventoryUsages.forEach(u => {
    const inv = u.inventory || mockStore.getInventoryById(u.inventoryId);
    if (!inv) return;
    if (!grouped[inv.id]) {
      grouped[inv.id] = { product: inv, totalUsed: 0, abnormalCount: 0 };
    }
    grouped[inv.id].totalUsed += u.quantity;
    if (u.isAbnormal) grouped[inv.id].abnormalCount += 1;
  });
  return Object.values(grouped)
    .map(item => ({
      id: item.product.id,
      productName: item.product.productName,
      category: item.product.category,
      totalUsed: item.totalUsed,
      abnormalCount: item.abnormalCount,
      abnormalRate: item.totalUsed > 0 ? item.abnormalCount / item.totalUsed : 0,
    }))
    .sort((a, b) => b.totalUsed - a.totalUsed);
}

export function getFollowupTrend(): FollowupTrend[] {
  ensureSeedData();
  const reviews = mockStore.reviews.filter(r => r.followUpScript);
  const grouped: Record<string, Record<string, { total: number; responded: number }>> = {};
  reviews.forEach(review => {
    const date = review.reviewedAt.toISOString().slice(5, 10);
    const script = review.followUpScript!;
    if (!grouped[date]) grouped[date] = {};
    if (!grouped[date][script]) grouped[date][script] = { total: 0, responded: 0 };
    grouped[date][script].total += 1;
    if (review.responded) grouped[date][script].responded += 1;
  });

  const result: FollowupTrend[] = [];
  Object.entries(grouped).forEach(([date, scripts]) => {
    Object.entries(scripts).forEach(([script, data]) => {
      result.push({
        date,
        script,
        responseRate: data.total > 0 ? data.responded / data.total : 0,
        count: data.total,
      });
    });
  });
  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

export function getTechnicianMetrics(technicianId: string): TechnicianMetrics {
  ensureSeedData();
  const techOrders = mockStore.orders.filter(o => o.technicianId === technicianId);
  const totalRevenue = techOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const completedOrders = techOrders.filter(o => o.status !== 'CREATED').length;
  const ratedOrders = techOrders.filter(o => o.review);
  const avgRating = ratedOrders.length > 0
    ? ratedOrders.reduce((sum, o) => sum + (o.review?.rating || 0), 0) / ratedOrders.length
    : 0;
  return {
    totalRevenue,
    orderCount: techOrders.length,
    avgOrderValue: techOrders.length > 0 ? totalRevenue / techOrders.length : 0,
    avgRating,
    completionRate: techOrders.length > 0 ? completedOrders / techOrders.length : 0,
  };
}

export function getBatches(): ImportBatch[] {
  ensureSeedData();
  return mockStore.batches;
}
