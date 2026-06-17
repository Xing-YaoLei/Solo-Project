import type {
  DashboardMetrics,
  MeterReading,
  InspectionItem,
  PaymentFlow,
  ComplaintTag,
  PropertyRanking,
  User,
} from '../../shared/types';
import { maintenanceCaliber } from '../../shared/types';

const now = new Date().toISOString();

export const mockUsers: User[] = [
  {
    id: '1',
    name: '张运营',
    role: 'operation_manager',
    permissions: ['view_all', 'export_all'],
  },
  {
    id: '2',
    name: '李区域',
    role: 'area_manager',
    area: '华东区',
    permissions: ['view_area', 'export_area'],
  },
  {
    id: '3',
    name: '王维修',
    role: 'repair_manager',
    permissions: ['view_repair', 'export_repair'],
  },
  {
    id: '4',
    name: '赵客服',
    role: 'service_manager',
    permissions: ['view_service', 'export_service'],
  },
];

export const mockMetrics: DashboardMetrics = {
  moveOutRate: 8.5,
  inspectionPassRate: 76.2,
  avgRepairDuration: 3.2,
  complaintRate: 12.3,
  updateTime: now,
};

const properties = [
  { id: 'p1', name: '阳光花园A座', area: '华东区' },
  { id: 'p2', name: '翠湖天地B栋', area: '华东区' },
  { id: 'p3', name: '金色家园C座', area: '华北区' },
  { id: 'p4', name: '水岸华庭D栋', area: '华南区' },
  { id: 'p5', name: '林语轩E座', area: '华东区' },
];

const generateDate = (monthsAgo: number): string => {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return d.toISOString().split('T')[0];
};

export const mockMeterReadings: MeterReading[] = properties.flatMap((prop) =>
  Array.from({ length: 6 }, (_, i) => {
    const monthIdx = 5 - i;
    const baseWater = 120 + monthIdx * 8;
    const baseElec = 280 + monthIdx * 15;
    const isAnomaly = monthIdx === 2 && prop.id === 'p1';
    return {
      id: `${prop.id}-m${i}`,
      propertyId: prop.id,
      propertyName: prop.name,
      date: generateDate(monthIdx),
      waterReading: baseWater + Math.random() * 20,
      electricityReading: isAnomaly ? baseElec + 200 : baseElec + Math.random() * 30,
      waterUsage: 8 + Math.random() * 5,
      electricityUsage: isAnomaly ? 180 : 35 + Math.random() * 20,
      isAnomaly,
      updateTime: now,
    };
  })
);

export const mockInspectionItems: InspectionItem[] = [
  { id: 'i1', category: '墙面', itemName: '墙面污渍', count: 45, percentage: 22.5, severity: 'low', updateTime: now },
  { id: 'i2', category: '墙面', itemName: '墙面破损', count: 18, percentage: 9.0, severity: 'medium', updateTime: now },
  { id: 'i3', category: '地面', itemName: '地板划痕', count: 32, percentage: 16.0, severity: 'low', updateTime: now },
  { id: 'i4', category: '地面', itemName: '地砖破损', count: 12, percentage: 6.0, severity: 'high', updateTime: now },
  { id: 'i5', category: '家电', itemName: '空调故障', count: 28, percentage: 14.0, severity: 'high', updateTime: now },
  { id: 'i6', category: '家电', itemName: '冰箱故障', count: 15, percentage: 7.5, severity: 'medium', updateTime: now },
  { id: 'i7', category: '家具', itemName: '衣柜损坏', count: 22, percentage: 11.0, severity: 'medium', updateTime: now },
  { id: 'i8', category: '家具', itemName: '桌椅破损', count: 18, percentage: 9.0, severity: 'low', updateTime: now },
  { id: 'i9', category: '水电', itemName: '水龙头漏水', count: 10, percentage: 5.0, severity: 'high', updateTime: now },
];

const tenants = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
const paymentTypes = ['押金退还', '违约金', '水电费结算', '维修费扣除', '其他扣款'];
const sources = ['支付宝', '微信支付', '银行转账', 'POS机'];

export const mockPaymentFlows: PaymentFlow[] = Array.from({ length: 50 }, (_, i) => {
  const prop = properties[i % properties.length];
  return {
    id: `f${i + 1}`,
    flowNo: `FL${String(202400001 + i)}`,
    propertyId: prop.id,
    propertyName: prop.name,
    tenantName: tenants[i % tenants.length],
    amount: Math.round((100 + Math.random() * 4900) * 100) / 100,
    paymentType: paymentTypes[i % paymentTypes.length],
    paymentTime: new Date(Date.now() - i * 86400000 * 2).toISOString(),
    source: sources[i % sources.length],
    updateTime: now,
  };
});

const complaintTags = [
  '服务态度差', '维修不及时', '房间异味', '噪音扰民', '设施老化',
  '安全问题', '卫生不达标', '合同纠纷', '押金不退', '涨价争议',
  '邻里矛盾', '停车问题', '网络故障', '空调不制冷', '漏水问题',
];

export const mockComplaintTags: ComplaintTag[] = complaintTags.map((tag, i) => {
  const count = Math.floor(Math.random() * 50) + 5;
  const amount = count * (Math.random() * 800 + 200);
  const isAbnormal = count > 35 || amount > 15000;
  return {
    id: `t${i + 1}`,
    tagName: tag,
    count,
    amount: Math.round(amount * 100) / 100,
    isAbnormal,
    x: count + Math.random() * 5,
    y: amount / 1000 + Math.random() * 2,
    updateTime: now,
  };
});

export const mockPropertyRanking: PropertyRanking[] = properties.map((prop, i) => {
  const repairCount = Math.floor(Math.random() * 80) + 10;
  const complaintCount = Math.floor(Math.random() * 30) + 2;
  return {
    id: prop.id,
    propertyName: prop.name,
    area: prop.area,
    repairCount,
    complaintCount,
    repairRate: Math.round((repairCount / 200) * 10000) / 100,
    complaintRate: Math.round((complaintCount / 200) * 10000) / 100,
    photoUrl: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`现代长租公寓建筑外观，${prop.name}，高清摄影`)}&image_size=square`,
    updateTime: now,
  };
}).sort((a, b) => b.repairCount - a.repairCount);

export { maintenanceCaliber } from '../../shared/types';

export const filterByRole = <T>(
  data: T[],
  role: string,
  userArea?: string
): T[] => {
  if (role === 'operation_manager') {
    return data;
  }
  if (role === 'area_manager' && userArea) {
    return data.filter(
      (item) => (item as unknown as { area?: string }).area === userArea
    );
  }
  if (role === 'repair_manager') {
    return data;
  }
  if (role === 'service_manager') {
    return data;
  }
  return data;
};
