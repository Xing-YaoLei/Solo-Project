import { LevelConfig } from '../types/game'

export const levels: LevelConfig[] = [
  {
    id: 'level_1',
    name: '新手入门',
    description: '熟悉基本操作，处理简单的用药提醒和活动签到。',
    difficulty: 1,
    duration: 120,
    elderlyCount: 3,
    taskFrequency: 12,
    maxConcurrentTasks: 2,
    targetAccuracy: 0.7,
    unlocked: true,
    starThresholds: [1000, 2000, 3000]
  },
  {
    id: 'level_2',
    name: '渐入佳境',
    description: '增加任务频率，开始出现风险事件。',
    difficulty: 2,
    duration: 150,
    elderlyCount: 4,
    taskFrequency: 10,
    maxConcurrentTasks: 3,
    targetAccuracy: 0.75,
    unlocked: false,
    starThresholds: [2000, 3500, 5000]
  },
  {
    id: 'level_3',
    name: '独当一面',
    description: '更高的任务密度，需要同时处理多个事件。',
    difficulty: 3,
    duration: 180,
    elderlyCount: 5,
    taskFrequency: 8,
    maxConcurrentTasks: 4,
    targetAccuracy: 0.8,
    unlocked: false,
    starThresholds: [3500, 5000, 7000]
  },
  {
    id: 'level_4',
    name: '资深护理',
    description: '高难度关卡，危急事件频繁出现。',
    difficulty: 4,
    duration: 210,
    elderlyCount: 6,
    taskFrequency: 6,
    maxConcurrentTasks: 5,
    targetAccuracy: 0.85,
    unlocked: false,
    starThresholds: [5000, 7500, 10000]
  },
  {
    id: 'level_5',
    name: '护理专家',
    description: '最高难度，考验你的专业能力和心理素质。',
    difficulty: 5,
    duration: 240,
    elderlyCount: 6,
    taskFrequency: 4,
    maxConcurrentTasks: 6,
    targetAccuracy: 0.9,
    unlocked: false,
    starThresholds: [8000, 12000, 16000]
  }
]
