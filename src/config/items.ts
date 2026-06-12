import type { ItemConfig } from '@/types/config';

export const defaultItemConfig: ItemConfig[] = [
  {
    id: 'clean_tool',
    name: '清洁工具',
    icon: '🧹',
    cooldown: 30,
    effect: '标记设备为已清洁，消除清洁需求',
  },
  {
    id: 'repair_button',
    name: '报修按钮',
    icon: '🔧',
    cooldown: 60,
    effect: '直接提交故障记录，无需选择类型',
  },
  {
    id: 'pause_item',
    name: '暂停道具',
    icon: '⏸️',
    cooldown: 120,
    effect: '暂停倒计时 10 秒',
  },
  {
    id: 'hint_item',
    name: '提示道具',
    icon: '💡',
    cooldown: 45,
    effect: '高亮显示正确判断选项',
  },
];
