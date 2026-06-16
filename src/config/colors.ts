export const COLORS = {
  primary: '#1E88E5',
  primaryLight: '#64B5F6',
  primaryDark: '#1565C0',
  success: '#43A047',
  successLight: '#81C784',
  warning: '#FB8C00',
  warningLight: '#FFB74D',
  error: '#E53935',
  errorLight: '#E57373',
  info: '#8E24AA',
  infoLight: '#BA68C8',
  neutral: {
    900: '#263238',
    800: '#37474F',
    700: '#455A64',
    600: '#546E7A',
    500: '#607D8B',
    400: '#78909C',
    300: '#90A4AE',
    200: '#B0BEC5',
    100: '#CFD8DC',
    50: '#ECEFF1',
  },
  white: '#FAFAFA',
  background: '#F5F7FA',
  card: '#FFFFFF',
  border: '#E0E0E0',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

export type ColorKey = keyof typeof COLORS;

export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: COLORS.success,
  medium: COLORS.warning,
  hard: COLORS.error,
};

export const CATEGORY_COLORS: Record<string, string> = {
  archive: COLORS.primary,
  frontdesk: COLORS.info,
  nurse: COLORS.warning,
};

export const MODE_COLORS: Record<string, string> = {
  training: COLORS.primary,
  practice: COLORS.success,
  challenge: COLORS.error,
};
