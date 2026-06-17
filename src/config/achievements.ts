import type { Achievement } from '@/types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_win',
    name: '初出茅庐',
    description: '首次完成游戏',
    icon: '🏆',
    condition: {
      type: 'score',
      operator: 'gt',
      value: 0,
    },
    isUnlocked: false,
  },
  {
    id: 'speed_demon',
    name: '闪电侠',
    description: '5分钟内完成游戏',
    icon: '⚡',
    condition: {
      type: 'time',
      operator: 'lt',
      value: 300,
    },
    isUnlocked: false,
  },
  {
    id: 'perfect_accuracy',
    name: '神算子',
    description: '准确率达到100%',
    icon: '🎯',
    condition: {
      type: 'accuracy',
      operator: 'eq',
      value: 100,
    },
    isUnlocked: false,
  },
  {
    id: 'streak_master',
    name: '连胜达人',
    description: '连续3次成功完成游戏',
    icon: '🔥',
    condition: {
      type: 'streak',
      operator: 'gt',
      value: 2,
    },
    isUnlocked: false,
  },
  {
    id: 'high_scorer',
    name: '高分选手',
    description: '单局得分超过800分',
    icon: '⭐',
    condition: {
      type: 'score',
      operator: 'gt',
      value: 800,
    },
    isUnlocked: false,
  },
  {
    id: 'hard_mode_master',
    name: '困难征服者',
    description: '在困难模式下完成游戏',
    icon: '💪',
    condition: {
      type: 'score',
      operator: 'gt',
      value: 500,
    },
    isUnlocked: false,
  },
  {
    id: 'emergency_handler',
    name: '应急专家',
    description: '成功处理5次突发事件',
    icon: '🚨',
    condition: {
      type: 'streak',
      operator: 'gt',
      value: 4,
    },
    isUnlocked: false,
  },
  {
    id: 'no_lag',
    name: '行云流水',
    description: '完成游戏无卡顿点',
    icon: '🌊',
    condition: {
      type: 'score',
      operator: 'gt',
      value: 600,
    },
    isUnlocked: false,
  },
];

export const checkAchievementCondition = (
  condition: Achievement['condition'],
  stats: { score: number; time: number; accuracy: number; streak: number }
): boolean => {
  const { type, operator, value } = condition;
  const statValue = stats[type as keyof typeof stats];

  switch (operator) {
    case 'gt':
      return statValue > value;
    case 'lt':
      return statValue < value;
    case 'eq':
      return Math.abs(statValue - value) < 0.01;
    default:
      return false;
  }
};
