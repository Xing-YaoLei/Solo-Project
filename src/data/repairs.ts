import type { RepairItem } from '@/types';

export const REPAIR_ITEMS: RepairItem[] = [
  {
    id: 'r001',
    name: '更换火花塞',
    description: '更换全部火花塞，解决点火不良问题',
    basePrice: 200,
    laborHours: 1.5,
    partsCost: 320,
    required: false,
    relatedFaultId: 'P0300',
    category: 'engine'
  },
  {
    id: 'r002',
    name: '清洗节气门',
    description: '拆洗节气门阀体，重置怠速学习值',
    basePrice: 120,
    laborHours: 1,
    partsCost: 50,
    required: false,
    relatedFaultId: 'P0171',
    category: 'engine'
  },
  {
    id: 'r003',
    name: '更换氧传感器',
    description: '更换前/后氧传感器',
    basePrice: 180,
    laborHours: 1,
    partsCost: 450,
    required: false,
    relatedFaultId: 'P0171',
    category: 'engine'
  },
  {
    id: 'r004',
    name: '更换前刹车片',
    description: '更换前轴刹车片套装',
    basePrice: 150,
    laborHours: 1,
    partsCost: 380,
    required: false,
    relatedFaultId: 'C0035',
    category: 'brake'
  },
  {
    id: 'r005',
    name: '更换刹车盘',
    description: '更换前刹车盘并做动平衡',
    basePrice: 200,
    laborHours: 1.5,
    partsCost: 680,
    required: false,
    relatedFaultId: 'C0035',
    category: 'brake'
  },
  {
    id: 'r006',
    name: 'ABS传感器更换',
    description: '更换故障轮速传感器',
    basePrice: 160,
    laborHours: 1,
    partsCost: 280,
    required: false,
    relatedFaultId: 'C1223',
    category: 'brake'
  },
  {
    id: 'r007',
    name: '三元催化器修复',
    description: '清洗或更换三元催化器',
    basePrice: 300,
    laborHours: 3,
    partsCost: 1200,
    required: false,
    relatedFaultId: 'P0420',
    category: 'engine'
  },
  {
    id: 'r008',
    name: '更换中控屏幕总成',
    description: '更换故障显示屏幕',
    basePrice: 250,
    laborHours: 2,
    partsCost: 1800,
    required: false,
    relatedFaultId: 'B1000',
    category: 'electrical'
  },
  {
    id: 'r009',
    name: '检查车身线束',
    description: '排查并修复线路故障',
    basePrice: 200,
    laborHours: 3,
    partsCost: 100,
    required: false,
    relatedFaultId: 'U0100',
    category: 'electrical'
  },
  {
    id: 'r010',
    name: '更换气门油封',
    description: '拆解缸盖更换气门油封解决烧机油',
    basePrice: 500,
    laborHours: 6,
    partsCost: 800,
    required: false,
    relatedFaultId: 'P0521',
    category: 'engine'
  },
  {
    id: 'r011',
    name: '更换机油压力传感器',
    description: '更换故障机油压力传感器',
    basePrice: 100,
    laborHours: 0.5,
    partsCost: 180,
    required: false,
    relatedFaultId: 'P0521',
    category: 'engine'
  },
  {
    id: 'r012',
    name: '变速箱油更换',
    description: '更换自动变速箱油',
    basePrice: 200,
    laborHours: 1.5,
    partsCost: 480,
    required: false,
    relatedFaultId: 'P0700',
    category: 'transmission'
  },
  {
    id: 'r013',
    name: '变速箱阀体维修',
    description: '拆解维修或更换变速箱阀体',
    basePrice: 600,
    laborHours: 5,
    partsCost: 1500,
    required: false,
    relatedFaultId: 'P0720',
    category: 'transmission'
  },
  {
    id: 'r014',
    name: '电池健康检测',
    description: '动力电池容量检测与均衡',
    basePrice: 300,
    laborHours: 4,
    partsCost: 0,
    required: false,
    relatedFaultId: 'P1B00',
    category: 'electrical'
  },
  {
    id: 'r015',
    name: '更换减震器',
    description: '更换前/后减震器总成',
    basePrice: 200,
    laborHours: 2,
    partsCost: 680,
    required: false,
    relatedFaultId: 'C10D0',
    category: 'suspension'
  },
  {
    id: 'r016',
    name: '四轮定位',
    description: '做四轮定位调整参数',
    basePrice: 180,
    laborHours: 1,
    partsCost: 0,
    required: false,
    relatedFaultId: null,
    category: 'suspension'
  },
  {
    id: 'r017',
    name: '发动机常规保养',
    description: '更换机油机滤空气滤芯',
    basePrice: 100,
    laborHours: 1,
    partsCost: 350,
    required: false,
    relatedFaultId: null,
    category: 'engine'
  },
  {
    id: 'r018',
    name: '空调系统清洗',
    description: '清洗蒸发器更换空调滤芯',
    basePrice: 150,
    laborHours: 1.5,
    partsCost: 120,
    required: false,
    relatedFaultId: null,
    category: 'body'
  },
  {
    id: 'r019',
    name: '正时链条更换',
    description: '更换正时链条及张紧器',
    basePrice: 500,
    laborHours: 6,
    partsCost: 900,
    required: false,
    relatedFaultId: 'P0011',
    category: 'engine'
  },
  {
    id: 'r020',
    name: '充电系统检修',
    description: '检查OBC车载充电机',
    basePrice: 400,
    laborHours: 3,
    partsCost: 500,
    required: false,
    relatedFaultId: 'P0AA0',
    category: 'electrical'
  }
];

export function getRepairItemsByFaultCodes(faultCodes: string[]): RepairItem[] {
  const relatedItems = REPAIR_ITEMS.filter(item =>
    item.relatedFaultId && faultCodes.includes(item.relatedFaultId)
  );
  const otherItems = REPAIR_ITEMS.filter(item => !item.relatedFaultId);
  const shuffledOthers = otherItems.sort(() => Math.random() - 0.5).slice(0, 4);
  return [...relatedItems, ...shuffledOthers].sort(() => Math.random() - 0.5);
}

export function getRequiredItemsForFaultCodes(faultCodes: string[]): string[] {
  return REPAIR_ITEMS
    .filter(item => item.relatedFaultId && faultCodes.includes(item.relatedFaultId))
    .map(item => item.id);
}
