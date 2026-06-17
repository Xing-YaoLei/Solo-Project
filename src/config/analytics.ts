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
  ],
};

export const EVENT_DESCRIPTIONS: Record<AnalyticsEventType, string> = {
  game_start: '游戏开始',
  game_end: '游戏结束',
  task_complete: '任务完成',
  task_fail: '任务失败',
  emergency: '突发事件',
  achievement: '成就解锁',
};
