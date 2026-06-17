import { ComplaintTag } from '../game/types';

export const complaintTags: ComplaintTag[] = [
  {
    id: 'water_leak',
    name: '漏水',
    category: 'facility',
    color: '#3b82f6',
    description: '房间存在漏水问题'
  },
  {
    id: 'wall_damage',
    name: '墙面损坏',
    category: 'facility',
    color: '#f59e0b',
    description: '墙面有污渍、破损或涂鸦'
  },
  {
    id: 'furniture_damage',
    name: '家具损坏',
    category: 'facility',
    color: '#ef4444',
    description: '家具存在损坏或缺失'
  },
  {
    id: 'appliance_fault',
    name: '电器故障',
    category: 'facility',
    color: '#8b5cf6',
    description: '家电设备存在故障'
  },
  {
    id: 'rent_overdue',
    name: '租金逾期',
    category: 'payment',
    color: '#dc2626',
    description: '租客存在租金逾期未付'
  },
  {
    id: 'utility_arrears',
    name: '水电欠费',
    category: 'payment',
    color: '#ea580c',
    description: '存在水电费用拖欠'
  },
  {
    id: 'abnormal_usage',
    name: '用量异常',
    category: 'payment',
    color: '#d97706',
    description: '水电用量异常偏高'
  },
  {
    id: 'noise_complaint',
    name: '扰民投诉',
    category: 'behavior',
    color: '#0891b2',
    description: '曾有邻居投诉噪音扰民'
  },
  {
    id: 'unauthorized_remodel',
    name: '擅自装修',
    category: 'behavior',
    color: '#65a30d',
    description: '租客未经允许擅自改动房屋结构'
  },
  {
    id: 'missing_keys',
    name: '钥匙缺失',
    category: 'document',
    color: '#475569',
    description: '租客未交还全部钥匙门禁卡'
  },
  {
    id: 'contract_issue',
    name: '合同问题',
    category: 'document',
    color: '#7c3aed',
    description: '合同条款存在争议'
  },
  {
    id: 'pet_damage',
    name: '宠物损坏',
    category: 'facility',
    color: '#b45309',
    description: '违规饲养宠物造成房屋损坏'
  }
];

export function getTagById(id: string): ComplaintTag | undefined {
  return complaintTags.find(tag => tag.id === id);
}

export function getTagsByCategory(category: string): ComplaintTag[] {
  return complaintTags.filter(tag => tag.category === category);
}
