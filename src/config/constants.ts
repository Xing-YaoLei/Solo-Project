export const GAME_CONFIG = {
  WIDTH: 1280,
  HEIGHT: 720,
  PHYSICS_GRAVITY: 1,
  TUTORIAL_COMPLETE_KEY: 'auto_repair_tutorial_complete',
  LEADERBOARD_KEY: 'auto_repair_leaderboard',
  STORAGE_PREFIX: 'auto_repair_quote_',
  LABOR_RATE_PER_HOUR: 150,
  PRICE_TOLERANCE: 0.15,
  MAX_REPAIR_ITEMS_PER_VEHICLE: 8,
  LEVELS: [
    { id: 1, name: '新手入门', timeLimit: 180, vehicleCount: 1 },
    { id: 2, name: '熟练工', timeLimit: 150, vehicleCount: 2 },
    { id: 3, name: '高级技师', timeLimit: 120, vehicleCount: 3 },
    { id: 4, name: '专家级', timeLimit: 90, vehicleCount: 4 }
  ],
  COLORS: {
    PRIMARY: 0x1E3A5F,
    PRIMARY_LIGHT: 0x2D5A87,
    PRIMARY_DARK: 0x152A45,
    ACCENT: 0xE85D04,
    ACCENT_LIGHT: 0xFF7A29,
    SUCCESS: 0x10B981,
    WARNING: 0xF59E0B,
    DANGER: 0xEF4444,
    METAL: 0x6B7280,
    METAL_LIGHT: 0x9CA3AF,
    METAL_DARK: 0x374151,
    BG: 0x0F172A,
    BG_LIGHT: 0x1E293B,
    SURFACE: 0x334155,
    TEXT: 0xF1F5F9,
    TEXT_DIM: 0x94A3B8
  }
} as const;

export const TUTORIAL_STEPS = [
  { id: 1, title: '欢迎来到汽修厂！', desc: '你将扮演一名汽修技师，为客户的车辆诊断故障并提供维修报价。', target: 'welcome' },
  { id: 2, title: '查看车辆档案', desc: '点击车辆档案卡片，仔细阅读车主描述和故障码信息。这将帮助你判断需要哪些维修项目。', target: 'vehicleCard' },
  { id: 3, title: '分析诊断结果', desc: '诊断面板会显示已检测出的故障项。绿色表示已确认，闪烁表示待排查。', target: 'diagnosisPanel' },
  { id: 4, title: '选择维修项目', desc: '在工单列表中勾选必要的维修项目。注意：漏项会导致返修，多选会引起客户不满！', target: 'workOrderList' },
  { id: 5, title: '提交报价', desc: '确认好维修项目和总价后，点击提交报价按钮完成本次服务。祝你好运！', target: 'submitButton' }
];
