import type { AnalyticsConfig, AnalyticsEventType } from '@/types';

export const ANALYTICS_CONFIG: AnalyticsConfig = {
  enabled: true,
  trackedEvents: [
    'game_start',
    'game_end',
    'task_complete',
    'task_fail',
    'emergency',
    'achievement',
    'payment',
    'patrol_visit',
    'item_use',
    'access_assign',
  ],
};

export const EVENT_DESCRIPTIONS: Record<AnalyticsEventType, string> = {
  game_start: '游戏开始',
  game_end: '游戏结束',
  task_complete: '任务完成',
  task_fail: '任务失败',
  emergency: '突发事件',
  achievement: '成就解锁',
  payment: '支付账单',
  patrol_visit: '巡检点访问',
  item_use: '道具使用',
  access_assign: '门禁分配',
};
