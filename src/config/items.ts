import type { ItemConfig } from '@/types';

export const ITEMS: ItemConfig[] = [
  {
    id: 'hint',
    name: '提示卡',
    description: '显示当前任务的操作提示',
    icon: '💡',
    cooldown: 15,
    effect: 'show_hint',
  },
  {
    id: 'skip',
    name: '跳过卡',
    description: '跳过当前任务（不获得分数）',
    icon: '⏭️',
    cooldown: 45,
    effect: 'skip_task',
  },
  {
    id: 'freeze',
    name: '冻结卡',
    description: '暂停时间流逝10秒',
    icon: '❄️',
    cooldown: 30,
    effect: 'freeze_time',
  },
  {
    id: 'repair',
    name: '修复卡',
    description: '立即修复一个设备故障',
    icon: '🔧',
    cooldown: 60,
    effect: 'repair_device',
  },
  {
    id: 'discount',
    name: '优惠券',
    description: '为一个账单添加额外折扣',
    icon: '🎟️',
    cooldown: 25,
    effect: 'add_discount',
  },
];

export const getItemById = (id: string): ItemConfig | undefined => {
  return ITEMS.find(item => item.id === id);
};
