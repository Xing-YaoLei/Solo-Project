import type { SubjectInfo, LevelConfig, Subject } from '@/types/game';

export const SUBJECTS: SubjectInfo[] = [
  { id: 'math', name: '数学', color: '#3B82F6', icon: '📐' },
  { id: 'chinese', name: '语文', color: '#EF4444', icon: '📖' },
  { id: 'english', name: '英语', color: '#10B981', icon: '🔤' },
  { id: 'physics', name: '物理', color: '#8B5CF6', icon: '⚡' },
  { id: 'chemistry', name: '化学', color: '#F59E0B', icon: '🧪' },
  { id: 'biology', name: '生物', color: '#06B6D4', icon: '🧬' },
  { id: 'history', name: '历史', color: '#78716C', icon: '📜' },
  { id: 'geography', name: '地理', color: '#84CC16', icon: '🌍' },
];

export const getSubjectInfo = (subjectId: Subject): SubjectInfo => {
  return SUBJECTS.find(s => s.id === subjectId) || SUBJECTS[0];
};

export const getGradeLabel = (grade: number): string => {
  return `${grade}年级`;
};

const ALL_SUBJECTS: Subject[] = ['math', 'chinese', 'english', 'physics', 'chemistry', 'biology', 'history', 'geography'];
const CORE_SUBJECTS: Subject[] = ['math', 'chinese', 'english'];
const SCIENCE_SUBJECTS: Subject[] = ['math', 'chinese', 'english', 'physics', 'chemistry', 'biology'];

export const LEVELS: LevelConfig[] = [
  {
    id: 'formal-easy-1',
    name: '初级教材分发基础',
    mode: 'formal',
    difficulty: 'easy',
    description: '小学低年级教材发放入门训练，适合刚接触的学员。',
    duration: 120,
    textbookCount: 15,
    slotCount: 6,
    subjects: CORE_SUBJECTS.slice(0, 3),
    gradeRange: [1, 3],
    minAccuracy: 0.7,
    minCombo: 3,
    timeBonusMultiplier: 1.0,
    accuracyBonusMultiplier: 1.5,
    comboBonusMultiplier: 1.2,
  },
  {
    id: 'formal-easy-2',
    name: '小学全科基础',
    mode: 'formal',
    difficulty: 'easy',
    description: '小学全科教材发放，三主科加科学。',
    duration: 150,
    textbookCount: 20,
    slotCount: 8,
    subjects: [...CORE_SUBJECTS, 'biology'],
    gradeRange: [1, 6],
    minAccuracy: 0.75,
    minCombo: 4,
    timeBonusMultiplier: 1.0,
    accuracyBonusMultiplier: 1.5,
    comboBonusMultiplier: 1.2,
  },
  {
    id: 'formal-medium-1',
    name: '初中综合训练',
    mode: 'formal',
    difficulty: 'medium',
    description: '初中全科教材发放，科目增多难度提升。',
    duration: 180,
    textbookCount: 28,
    slotCount: 10,
    subjects: SCIENCE_SUBJECTS,
    gradeRange: [7, 9],
    minAccuracy: 0.8,
    minCombo: 5,
    timeBonusMultiplier: 1.2,
    accuracyBonusMultiplier: 1.8,
    comboBonusMultiplier: 1.5,
  },
  {
    id: 'formal-medium-2',
    name: '初中挑战',
    mode: 'formal',
    difficulty: 'medium',
    description: '初中教材发放挑战，文理科混合。',
    duration: 200,
    textbookCount: 35,
    slotCount: 12,
    subjects: ALL_SUBJECTS,
    gradeRange: [7, 9],
    minAccuracy: 0.8,
    minCombo: 6,
    timeBonusMultiplier: 1.3,
    accuracyBonusMultiplier: 2.0,
    comboBonusMultiplier: 1.6,
  },
  {
    id: 'formal-hard-1',
    name: '高中冲刺',
    mode: 'formal',
    difficulty: 'hard',
    description: '高中教材发放，全科目高强度训练。',
    duration: 240,
    textbookCount: 45,
    slotCount: 14,
    subjects: ALL_SUBJECTS,
    gradeRange: [10, 12],
    minAccuracy: 0.85,
    minCombo: 8,
    timeBonusMultiplier: 1.5,
    accuracyBonusMultiplier: 2.2,
    comboBonusMultiplier: 1.8,
  },
  {
    id: 'formal-hard-2',
    name: '专家模式',
    mode: 'formal',
    difficulty: 'hard',
    description: '教学主管考核，全年级全科目终极挑战。',
    duration: 300,
    textbookCount: 60,
    slotCount: 16,
    subjects: ALL_SUBJECTS,
    gradeRange: [1, 12],
    minAccuracy: 0.9,
    minCombo: 10,
    timeBonusMultiplier: 1.8,
    accuracyBonusMultiplier: 2.5,
    comboBonusMultiplier: 2.0,
  },
  {
    id: 'free-easy-1',
    name: '自由练习·入门',
    mode: 'free',
    difficulty: 'easy',
    description: '自由练习模式，语数英三科简单练习。',
    duration: 90,
    textbookCount: 12,
    slotCount: 5,
    subjects: CORE_SUBJECTS,
    gradeRange: [1, 6],
    minAccuracy: 0,
    minCombo: 0,
    timeBonusMultiplier: 0.8,
    accuracyBonusMultiplier: 1.0,
    comboBonusMultiplier: 0.8,
  },
  {
    id: 'free-medium-1',
    name: '自由练习·进阶',
    mode: 'free',
    difficulty: 'medium',
    description: '自由练习模式，中等难度。',
    duration: 120,
    textbookCount: 20,
    slotCount: 8,
    subjects: SCIENCE_SUBJECTS,
    gradeRange: [1, 9],
    minAccuracy: 0,
    minCombo: 0,
    timeBonusMultiplier: 1.0,
    accuracyBonusMultiplier: 1.2,
    comboBonusMultiplier: 1.0,
  },
  {
    id: 'free-hard-1',
    name: '自由练习·高级',
    mode: 'free',
    difficulty: 'hard',
    description: '自由练习模式，高难度挑战。',
    duration: 180,
    textbookCount: 35,
    slotCount: 12,
    subjects: ALL_SUBJECTS,
    gradeRange: [1, 12],
    minAccuracy: 0,
    minCombo: 0,
    timeBonusMultiplier: 1.2,
    accuracyBonusMultiplier: 1.5,
    comboBonusMultiplier: 1.2,
  },
  {
    id: 'free-custom',
    name: '自由练习·自定义',
    mode: 'free',
    difficulty: 'medium',
    description: '自由练习模式，全科目无限制练习。',
    duration: 240,
    textbookCount: 50,
    slotCount: 16,
    subjects: ALL_SUBJECTS,
    gradeRange: [1, 12],
    minAccuracy: 0,
    minCombo: 0,
    timeBonusMultiplier: 1.0,
    accuracyBonusMultiplier: 1.0,
    comboBonusMultiplier: 1.0,
  },
];

export const getLevelsByMode = (mode: 'formal' | 'free'): LevelConfig[] => {
  return LEVELS.filter(l => l.mode === mode);
};

export const getLevelById = (id: string): LevelConfig | undefined => {
  return LEVELS.find(l => l.id === id);
};

export const getDifficultyLabel = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy': return '简单';
    case 'medium': return '中等';
    case 'hard': return '困难';
    default: return difficulty;
  }
};

export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy': return 'bg-green-100 text-green-700';
    case 'medium': return 'bg-yellow-100 text-yellow-700';
    case 'hard': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};
