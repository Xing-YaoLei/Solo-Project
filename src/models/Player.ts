import type { Difficulty, TrainingRecord } from './index';

export interface GameSettings {
  /** 音效音量 */
  soundVolume: number;
  /** 音乐音量 */
  musicVolume: number;
  /** 游戏难度 */
  difficulty: Difficulty;
  /** 语言设置 */
  language: 'zh-CN';
  /** 是否全屏 */
  fullscreen: boolean;
}

export interface PlayerSave {
  /** 玩家名称 */
  playerName: string;
  /** 累计总分 */
  totalScore: number;
  /** 已完成任务ID列表 */
  completedTasks: string[];
  /** 已解锁关卡ID列表 */
  unlockedLevels: string[];
  /** 已完成关卡ID列表 */
  completedLevels: string[];
  /** 进行中任务ID列表 */
  activeTasks: string[];
  /** 是否已完成新手教程 */
  tutorialCompleted: boolean;
  /** 最佳记录映射（关卡ID -> 训练记录） */
  bestRecords: Record<string, TrainingRecord>;
  /** 游戏设置 */
  settings: GameSettings;
  /** 上次游戏时间戳 */
  lastPlayed: number;
}
