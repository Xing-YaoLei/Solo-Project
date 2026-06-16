import type { Level } from '../types/game';

export const LEVELS: Level[] = [
  {
    id: 'level_001',
    name: '影像归档基础',
    description: '学习基本的影像归档流程，判断资料是否完整',
    category: 'archive',
    mode: 'training',
    difficulty: 'easy',
    tasks: ['task_001', 'task_007'],
    timeLimit: 180,
    passingScore: 150,
    unlocked: true,
    stars: 0,
    bestScore: 0,
  },
  {
    id: 'level_002',
    name: '随访任务识别',
    description: '学习识别治疗计划中的随访任务，设置正确的提醒',
    category: 'archive',
    mode: 'training',
    difficulty: 'easy',
    tasks: ['task_002', 'task_009'],
    timeLimit: 180,
    passingScore: 150,
    unlocked: false,
    stars: 0,
    bestScore: 0,
  },
  {
    id: 'level_003',
    name: '影像质量判断',
    description: '学习判断影像质量，识别需要重拍的情况',
    category: 'archive',
    mode: 'training',
    difficulty: 'medium',
    tasks: ['task_003'],
    timeLimit: 120,
    passingScore: 100,
    unlocked: false,
    stars: 0,
    bestScore: 0,
  },
  {
    id: 'level_004',
    name: '资料完整性检查',
    description: '学习检查治疗计划各步骤的影像资料是否完整',
    category: 'archive',
    mode: 'training',
    difficulty: 'medium',
    tasks: ['task_004'],
    timeLimit: 120,
    passingScore: 100,
    unlocked: false,
    stars: 0,
    bestScore: 0,
  },
  {
    id: 'level_005',
    name: '跨部门协作',
    description: '学习识别需要转发给其他部门处理的情况',
    category: 'archive',
    mode: 'training',
    difficulty: 'medium',
    tasks: ['task_005', 'task_008'],
    timeLimit: 180,
    passingScore: 150,
    unlocked: false,
    stars: 0,
    bestScore: 0,
  },
  {
    id: 'level_006',
    name: '患者爽约处理',
    description: '学习处理患者爽约的情况，这是高难度挑战',
    category: 'archive',
    mode: 'challenge',
    difficulty: 'hard',
    tasks: ['task_006', 'task_010'],
    timeLimit: 120,
    passingScore: 300,
    unlocked: false,
    stars: 0,
    bestScore: 0,
  },
  {
    id: 'level_007',
    name: '综合训练',
    description: '综合应用所学知识，处理各种归档情况',
    category: 'archive',
    mode: 'training',
    difficulty: 'hard',
    tasks: ['task_001', 'task_002', 'task_003', 'task_004', 'task_005'],
    timeLimit: 300,
    passingScore: 400,
    unlocked: false,
    stars: 0,
    bestScore: 0,
  },
  {
    id: 'level_008',
    name: '自由练习-简单',
    description: '随机抽取简单难度任务进行练习',
    category: 'archive',
    mode: 'practice',
    difficulty: 'easy',
    tasks: ['task_001', 'task_002', 'task_007'],
    timeLimit: 300,
    passingScore: 0,
    unlocked: true,
    stars: 0,
    bestScore: 0,
  },
  {
    id: 'level_009',
    name: '自由练习-中等',
    description: '随机抽取中等难度任务进行练习',
    category: 'archive',
    mode: 'practice',
    difficulty: 'medium',
    tasks: ['task_003', 'task_004', 'task_005', 'task_007', 'task_008'],
    timeLimit: 300,
    passingScore: 0,
    unlocked: true,
    stars: 0,
    bestScore: 0,
  },
  {
    id: 'level_010',
    name: '自由练习-困难',
    description: '随机抽取困难难度任务进行练习',
    category: 'archive',
    mode: 'practice',
    difficulty: 'hard',
    tasks: ['task_006', 'task_009', 'task_010'],
    timeLimit: 300,
    passingScore: 0,
    unlocked: true,
    stars: 0,
    bestScore: 0,
  },
  {
    id: 'level_011',
    name: '前台岗位-预约管理',
    description: '学习前台岗位的预约管理和爽约处理',
    category: 'frontdesk',
    mode: 'training',
    difficulty: 'easy',
    tasks: ['task_006'],
    timeLimit: 120,
    passingScore: 100,
    unlocked: true,
    stars: 0,
    bestScore: 0,
  },
  {
    id: 'level_012',
    name: '护士岗位-治疗协助',
    description: '学习护士岗位的影像资料整理和质量检查',
    category: 'nurse',
    mode: 'training',
    difficulty: 'easy',
    tasks: ['task_003', 'task_007'],
    timeLimit: 120,
    passingScore: 150,
    unlocked: true,
    stars: 0,
    bestScore: 0,
  },
];

export const TUTORIAL_LEVEL: Level = {
  id: 'tutorial',
  name: '新手引导',
  description: '跟随引导学习游戏玩法',
  category: 'archive',
  mode: 'training',
  difficulty: 'easy',
  tasks: ['task_001', 'task_002'],
  timeLimit: 600,
  passingScore: 0,
  unlocked: true,
  stars: 0,
  bestScore: 0,
};

export const getLevelById = (id: string): Level | undefined => {
  return LEVELS.find(level => level.id === id);
};

export const getLevelsByCategory = (category: string): Level[] => {
  return LEVELS.filter(level => level.category === category);
};

export const getLevelsByMode = (mode: string): Level[] => {
  return LEVELS.filter(level => level.mode === mode);
};

export const getLevelsByDifficulty = (difficulty: string): Level[] => {
  return LEVELS.filter(level => level.difficulty === difficulty);
};

export const unlockNextLevel = (completedLevelId: string): Level | null => {
  const completedIndex = LEVELS.findIndex(l => l.id === completedLevelId);
  if (completedIndex >= 0 && completedIndex < LEVELS.length - 1) {
    const nextLevel = LEVELS[completedIndex + 1];
    if (!nextLevel.unlocked) {
      nextLevel.unlocked = true;
      return nextLevel;
    }
  }
  return null;
};

export const updateLevelProgress = (levelId: string, score: number, stars: number): void => {
  const level = LEVELS.find(l => l.id === levelId);
  if (level) {
    if (score > level.bestScore) {
      level.bestScore = score;
    }
    if (stars > level.stars) {
      level.stars = stars;
    }
  }
};
