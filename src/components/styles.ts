export const UI_STYLES = {
  colors: {
    primary: 0x4a90d9,
    secondary: 0x6bb3f0,
    success: 0x52c41a,
    warning: 0xfaad14,
    danger: 0xf5222d,
    info: 0x13c2c2,
    background: 0xffffff,
    surface: 0xfafafa,
    border: 0xd9d9d9,
    text: 0x262626,
    textSecondary: 0x595959,
    textLight: 0x8c8c8c,
    overlay: 0x000000,
    gold: 0xffd700,
    silver: 0xc0c0c0,
    bronze: 0xcd7f32,
  },
  fonts: {
    family: "'PingFang SC', 'Microsoft YaHei', sans-serif",
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      title: 28,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radii: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 999,
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 12px rgba(0,0,0,0.1)',
    lg: '0 8px 24px rgba(0,0,0,0.15)',
    xl: '0 12px 40px rgba(0,0,0,0.2)',
  },
  animation: {
    duration: {
      fast: 150,
      normal: 250,
      slow: 400,
    },
    ease: 'Cubic.easeOut',
  },
};

export const DIFFICULTY_CONFIG = {
  easy: { color: UI_STYLES.colors.success, stars: 1, label: '简单' },
  medium: { color: UI_STYLES.colors.warning, stars: 3, label: '中等' },
  hard: { color: UI_STYLES.colors.danger, stars: 5, label: '困难' },
};

export const CLUE_TYPE_CONFIG = {
  visual: { color: 0x1890ff, icon: '👁️', label: '视觉线索' },
  photo: { color: 0x52c41a, icon: '📷', label: '照片线索' },
  document: { color: 0xfa8c16, icon: '📄', label: '文档线索' },
  measurement: { color: 0x722ed1, icon: '📏', label: '测量线索' },
};

export const ACTION_TYPE_CONFIG = {
  repair: { color: 0x1890ff, icon: '🔧', label: '修复' },
  replace: { color: 0x52c41a, icon: '🔄', label: '更换' },
  redesign: { color: 0x722ed1, icon: '✏️', label: '重新设计' },
  ignore: { color: 0x8c8c8c, icon: '🙈', label: '忽略' },
  report: { color: 0xfa8c16, icon: '📋', label: '报告' },
};

export const PHASE_CONFIG = {
  preparation: { color: 0x1890ff, label: '准备阶段' },
  demolition: { color: 0xf5222d, label: '拆除阶段' },
  water_electric: { color: 0x13c2c2, label: '水电阶段' },
  masonry: { color: 0xfa8c16, label: '泥工阶段' },
  woodwork: { color: 0x722ed1, label: '木工阶段' },
  painting: { color: 0x52c41a, label: '油漆阶段' },
  installation: { color: 0x1890ff, label: '安装阶段' },
  inspection: { color: 0xfaad14, label: '验收阶段' },
  final: { color: 0xeb2f96, label: '竣工验收' },
};
