export const GAME_CONFIG = {
  width: 1280,
  height: 720,
  backgroundColor: '#F5F7FA',
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: 1,
    autoCenter: 2,
  },
  dom: {
    createContainer: true,
  },
} as const;

export const SCENE_KEYS = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  MAIN_MENU: 'MainMenuScene',
  LEVEL_SELECT: 'LevelSelectScene',
  GAME: 'GameScene',
  RESULT: 'ResultScene',
  TUTORIAL: 'TutorialScene',
} as const;

export const ANIMATION_CONFIG = {
  pageTransition: 300,
  buttonHover: 150,
  scorePopup: 500,
  feedback: 300,
  imageTransition: 300,
  timerWarning: 30000,
} as const;

export const SCORING_CONFIG = {
  comboMultiplier: 0.1,
  maxComboMultiplier: 0.5,
  timeBonusRatio: 0.5,
  errorPenaltyRatio: 0.3,
  stars: {
    three: 0.9,
    two: 0.7,
    one: 0.5,
  },
} as const;

export const TUTORIAL_CONFIG = {
  enabled: true,
  storageKey: 'dental_archive_tutorial_completed',
} as const;

export const STORAGE_KEYS = {
  progress: 'dental_archive_progress',
  settings: 'dental_archive_settings',
  highScores: 'dental_archive_high_scores',
} as const;
