import { create } from 'zustand';
import type { AssetItem, RewardConfig, OpenSchedule, TrainingMode, QuestionBankItem, Badge } from '@/types/config';
import type { Level } from '@/types/game';
import { ConfigStorage } from '@/utils/storage';
import { LEVELS, QUESTIONS } from '@/mock/levels';

const DEFAULT_REWARDS: RewardConfig = {
  pointsPerCorrectAnswer: 10,
  bonusForPerfectScore: 50,
  bonusForFastCompletion: 30,
  starsThresholds: [60, 80, 95],
  badges: [
    { id: 'badge-001', name: '新手毕业', description: '完成第一个训练关卡', icon: '🎓', condition: '完成第1关', points: 20, unlocked: false },
    { id: 'badge-002', name: '规则大师', description: '规则类题目正确率100%', icon: '📜', condition: '规则题全对', points: 50, unlocked: false },
    { id: 'badge-003', name: '证据侦探', description: '证据类题目正确率100%', icon: '🔍', condition: '证据题全对', points: 50, unlocked: false },
    { id: 'badge-004', name: '闪电调度', description: '300秒内完成任意关卡', icon: '⚡', condition: '用时<300s', points: 40, unlocked: false },
    { id: 'badge-005', name: '完美通关', description: '获得任意关卡三星评价', icon: '🌟', condition: '3星通关', points: 100, unlocked: false },
  ],
};

const DEFAULT_SCHEDULES: OpenSchedule[] = [
  { id: 'sched-001', name: '工作日训练', startTime: '09:00', endTime: '18:00', daysOfWeek: [1, 2, 3, 4, 5], levelIds: ['level-001', 'level-002'], active: true },
  { id: 'sched-002', name: '周末开放', startTime: '10:00', endTime: '20:00', daysOfWeek: [6, 0], levelIds: ['level-001', 'level-002', 'level-003'], active: true },
];

const DEFAULT_MODES: TrainingMode[] = [
  { id: 'mode-001', name: '限时挑战', description: '时间压缩，得分加倍', icon: '⏱️', questionTypes: ['rule', 'evidence', 'settlement', 'compensation'], difficultyRange: [1, 5], timeMultiplier: 0.7, scoreMultiplier: 1.5 },
  { id: 'mode-002', name: '新手引导', description: '有提示辅助，轻松入门', icon: '🌱', questionTypes: ['rule', 'evidence'], difficultyRange: [1, 2], timeMultiplier: 1.5, scoreMultiplier: 1.0 },
  { id: 'mode-003', name: '专家模式', description: '无提示无辅助，硬核挑战', icon: '🔥', questionTypes: ['rule', 'evidence', 'settlement', 'compensation'], difficultyRange: [3, 5], timeMultiplier: 0.8, scoreMultiplier: 2.0 },
];

const buildQuestionBank = (): QuestionBankItem[] => {
  return QUESTIONS.map(q => ({
    id: q.id,
    type: q.type,
    title: q.title,
    difficulty: q.difficulty,
    score: q.score,
    status: 'published' as const,
    updatedAt: Date.now(),
    usageCount: Math.floor(Math.random() * 100),
    correctRate: 0.5 + Math.random() * 0.4,
  }));
};

const DEFAULT_ASSETS: AssetItem[] = [
  { id: 'asset-001', type: 'image', name: '骑手配送示意图', url: '/images/rider-demo.png', tag: 'demo', uploadedAt: Date.now(), size: 102400 },
  { id: 'asset-002', type: 'image', name: '城市地图俯视图', url: '/images/city-map.png', tag: 'map', uploadedAt: Date.now(), size: 2048000 },
  { id: 'asset-003', type: 'model', name: '城市建筑低模包', url: '/models/buildings.glb', tag: '3d', uploadedAt: Date.now(), size: 5120000 },
];

interface ConfigState {
  questionBank: QuestionBankItem[];
  assets: AssetItem[];
  rewards: RewardConfig;
  openSchedules: OpenSchedule[];
  trainingModes: TrainingMode[];
  levels: Level[];

  loadAll: () => void;
  saveAll: () => void;
  saveQuestion: (q: QuestionBankItem) => void;
  deleteQuestion: (id: string) => void;
  updateRewards: (r: RewardConfig) => void;
  updateBadge: (badgeId: string, updates: Partial<Badge>) => void;
  addBadge: (badge: Badge) => void;
  removeBadge: (badgeId: string) => void;
  saveSchedule: (s: OpenSchedule) => void;
  deleteSchedule: (id: string) => void;
  toggleScheduleActive: (id: string) => void;
  saveAsset: (a: AssetItem) => void;
  deleteAsset: (id: string) => void;
  saveTrainingMode: (m: TrainingMode) => void;
  deleteTrainingMode: (id: string) => void;
  saveLevel: (l: Level) => void;
  toggleLevelUnlock: (id: string) => void;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  questionBank: [],
  assets: [],
  rewards: DEFAULT_REWARDS,
  openSchedules: DEFAULT_SCHEDULES,
  trainingModes: DEFAULT_MODES,
  levels: [],

  loadAll: () => {
    const savedRewards = ConfigStorage.getRewards<RewardConfig | null>(null);
    const savedLevels = ConfigStorage.getLevels<Level[] | null>(null);
    const savedSchedules = ConfigStorage.getSchedules<OpenSchedule[] | null>(null);
    const savedModes = ConfigStorage.getModes<TrainingMode[] | null>(null);
    const savedAssets = ConfigStorage.getAssets<AssetItem[] | null>(null);
    const savedQuestions = ConfigStorage.getQuestions<QuestionBankItem>();
    set({
      questionBank: savedQuestions.length > 0 ? savedQuestions : buildQuestionBank(),
      assets: savedAssets && savedAssets.length > 0 ? savedAssets : DEFAULT_ASSETS,
      rewards: savedRewards || DEFAULT_REWARDS,
      openSchedules: savedSchedules && savedSchedules.length > 0 ? savedSchedules : DEFAULT_SCHEDULES,
      trainingModes: savedModes && savedModes.length > 0 ? savedModes : DEFAULT_MODES,
      levels: savedLevels && savedLevels.length > 0 ? savedLevels : LEVELS,
    });
  },

  saveAll: () => {
    const { questionBank, rewards, levels, openSchedules, trainingModes, assets } = get();
    ConfigStorage.saveQuestions(questionBank);
    ConfigStorage.saveRewards(rewards);
    ConfigStorage.saveLevels(levels);
    ConfigStorage.saveSchedules(openSchedules);
    ConfigStorage.saveModes(trainingModes);
    ConfigStorage.saveAssets(assets);
  },

  saveQuestion: (q) => {
    const { questionBank } = get();
    const idx = questionBank.findIndex(i => i.id === q.id);
    const newBank = idx >= 0
      ? questionBank.map(i => i.id === q.id ? { ...q, updatedAt: Date.now() } : i)
      : [...questionBank, { ...q, id: `q-new-${Date.now()}`, updatedAt: Date.now(), usageCount: 0, correctRate: 0, status: 'draft' as const }];
    ConfigStorage.saveQuestions(newBank);
    set({ questionBank: newBank });
  },

  deleteQuestion: (id) => {
    const newBank = get().questionBank.filter(q => q.id !== id);
    ConfigStorage.saveQuestions(newBank);
    set({ questionBank: newBank });
  },

  updateRewards: (r) => {
    ConfigStorage.saveRewards(r);
    set({ rewards: r });
  },

  updateBadge: (badgeId, updates) => {
    const { rewards } = get();
    const newBadges = rewards.badges.map(b => b.id === badgeId ? { ...b, ...updates } : b);
    const newRewards = { ...rewards, badges: newBadges };
    ConfigStorage.saveRewards(newRewards);
    set({ rewards: newRewards });
  },

  addBadge: (badge) => {
    const { rewards } = get();
    const newRewards = { ...rewards, badges: [...rewards.badges, badge] };
    ConfigStorage.saveRewards(newRewards);
    set({ rewards: newRewards });
  },

  removeBadge: (badgeId) => {
    const { rewards } = get();
    const newRewards = { ...rewards, badges: rewards.badges.filter(b => b.id !== badgeId) };
    ConfigStorage.saveRewards(newRewards);
    set({ rewards: newRewards });
  },

  saveSchedule: (s) => {
    const { openSchedules } = get();
    const idx = openSchedules.findIndex(i => i.id === s.id);
    const newSchedules = idx >= 0
      ? openSchedules.map(i => i.id === s.id ? s : i)
      : [...openSchedules, { ...s, id: `sched-${Date.now()}` }];
    ConfigStorage.saveSchedules(newSchedules);
    set({ openSchedules: newSchedules });
  },

  deleteSchedule: (id) => {
    const newSchedules = get().openSchedules.filter(s => s.id !== id);
    ConfigStorage.saveSchedules(newSchedules);
    set({ openSchedules: newSchedules });
  },

  toggleScheduleActive: (id) => {
    const { openSchedules } = get();
    const newSchedules = openSchedules.map(s => s.id === id ? { ...s, active: !s.active } : s);
    ConfigStorage.saveSchedules(newSchedules);
    set({ openSchedules: newSchedules });
  },

  saveAsset: (a) => {
    const { assets } = get();
    const idx = assets.findIndex(i => i.id === a.id);
    const newAssets = idx >= 0
      ? assets.map(i => i.id === a.id ? a : i)
      : [...assets, { ...a, id: `asset-${Date.now()}`, uploadedAt: Date.now() }];
    ConfigStorage.saveAssets(newAssets);
    set({ assets: newAssets });
  },

  deleteAsset: (id) => {
    const newAssets = get().assets.filter(a => a.id !== id);
    ConfigStorage.saveAssets(newAssets);
    set({ assets: newAssets });
  },

  saveTrainingMode: (m) => {
    const { trainingModes } = get();
    const idx = trainingModes.findIndex(i => i.id === m.id);
    const newModes = idx >= 0
      ? trainingModes.map(i => i.id === m.id ? m : i)
      : [...trainingModes, { ...m, id: `mode-${Date.now()}` }];
    ConfigStorage.saveModes(newModes);
    set({ trainingModes: newModes });
  },

  deleteTrainingMode: (id) => {
    const newModes = get().trainingModes.filter(m => m.id !== id);
    ConfigStorage.saveModes(newModes);
    set({ trainingModes: newModes });
  },

  saveLevel: (l) => {
    const { levels } = get();
    const idx = levels.findIndex(i => i.id === l.id);
    const newLevels = idx >= 0
      ? levels.map(i => i.id === l.id ? l : i)
      : [...levels, { ...l, id: `level-${Date.now()}` }];
    ConfigStorage.saveLevels(newLevels);
    set({ levels: newLevels });
  },

  toggleLevelUnlock: (id) => {
    const { levels } = get();
    const newLevels = levels.map(l => l.id === id ? { ...l, unlocked: !l.unlocked } : l);
    ConfigStorage.saveLevels(newLevels);
    set({ levels: newLevels });
  },
}));
