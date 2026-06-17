export const CARE_LEVELS = [
  { id: 1, name: '自理', color: 0x6bcb77, description: '生活完全自理' },
  { id: 2, name: '半自理', color: 0xffd93d, description: '部分生活需要协助' },
  { id: 3, name: '不能自理', color: 0xff9f43, description: '日常生活需要全面照护' },
  { id: 4, name: '特护', color: 0xff6b6b, description: '24小时专业医疗护理' }
];

export const MEDICINES = [
  { id: 'aspirin', name: '阿司匹林', icon: '💊', color: 0xffffff },
  { id: 'insulin', name: '胰岛素', icon: '💉', color: 0x87ceeb },
  { id: 'blood_pressure', name: '降压药', icon: '💊', color: 0xffa500 },
  { id: 'sleeping', name: '安眠药', icon: '🌙', color: 0x9370db },
  { id: 'painkiller', name: '止痛药', icon: '💊', color: 0xff6347 },
  { id: 'vitamin', name: '维生素', icon: '🍊', color: 0xffd700 },
  { id: 'heart', name: '心脏病药', icon: '❤️', color: 0xdc143c },
  { id: 'diabetes', name: '降糖药', icon: '💊', color: 0x20b2aa }
];

export const ELDERLY_NAMES = [
  '王爷爷', '李奶奶', '张爷爷', '刘奶奶', '陈爷爷',
  '赵奶奶', '孙爷爷', '周奶奶', '吴爷爷', '郑奶奶',
  '冯爷爷', '许奶奶', '何爷爷', '黄奶奶', '朱爷爷'
];

export const ELDERLY_AVATARS = [
  '👴', '👵', '🧓', '👴🏻', '👵🏻',
  '👴🏼', '👵🏼', '👴🏽', '👵🏽', '🧓🏻'
];

export const CONDITIONS = [
  '高血压', '糖尿病', '心脏病', '关节炎', '失眠',
  '老年痴呆', '骨质疏松', '慢性胃炎', '支气管炎', '白内障'
];

export class GameConfig {
  public static readonly GAME_WIDTH = 1080;
  public static readonly GAME_HEIGHT = 720;

  public static readonly COLORS = {
    primary: 0x4a90d9,
    secondary: 0x67b26f,
    accent: 0xff6b6b,
    warning: 0xffd93d,
    background: 0x1a1a2e,
    panel: 0x16213e,
    text: 0xeaeaea,
    textDim: 0x9a9a9a,
    success: 0x6bcb77,
    error: 0xff6b6b,
    bedEmpty: 0x2d3a4e,
    bedOccupied: 0x4a6b8a,
    level1: 0x6bcb77,
    level2: 0xffd93d,
    level3: 0xff9f43,
    level4: 0xff6b6b
  };

  public static readonly CARE_LEVELS = CARE_LEVELS;
  public static readonly MEDICINES = MEDICINES;
  public static readonly ELDERLY_NAMES = ELDERLY_NAMES;
  public static readonly ELDERLY_AVATARS = ELDERLY_AVATARS;
  public static readonly CONDITIONS = CONDITIONS;
}

export interface Settings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  animationIntensity: 'off' | 'low' | 'medium' | 'high';
}

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  vibrationEnabled: true,
  animationIntensity: 'medium'
};
