import type { UtilizationDataPoint, GamePhase, OperationRecord } from '../types';

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const getPhaseName = (phase: GamePhase): string => {
  const names: Record<GamePhase, string> = {
    observe: '观察名单',
    transcript: '处理成绩',
    application: '审核材料',
    complete: '完成评分',
  };
  return names[phase];
};

export const getPhaseColor = (phase: GamePhase): string => {
  const colors: Record<GamePhase, string> = {
    observe: '#2E7D32',
    transcript: '#1976D2',
    application: '#F9A825',
    complete: '#7B1FA2',
  };
  return colors[phase];
};

export const calculateUtilization = (
  totalStudents: number,
  reviewedStudents: number,
  phase: GamePhase
): number => {
  const phaseWeights: Record<GamePhase, number> = {
    observe: 0.3,
    transcript: 0.35,
    application: 0.3,
    complete: 0.05,
  };

  const reviewRatio = totalStudents > 0 ? reviewedStudents / totalStudents : 0;
  const baseUtilization = reviewRatio * 100 * phaseWeights[phase];

  const phaseBonus: Record<GamePhase, number> = {
    observe: 10,
    transcript: 25,
    application: 50,
    complete: 85,
  };

  return Math.min(100, baseUtilization + phaseBonus[phase]);
};

export const getMaterialTypeName = (type: string): string => {
  const names: Record<string, string> = {
    transcript: '成绩单',
    application_form: '申请表',
    id_copy: '身份证复印件',
    recommendation: '推荐信',
    certificate: '获奖证书',
  };
  return names[type] || type;
};

export const getDifficultyLabel = (difficulty: string): string => {
  const labels: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };
  return labels[difficulty] || difficulty;
};

export const getDifficultyColor = (difficulty: string): string => {
  const colors: Record<string, string> = {
    easy: '#4CAF50',
    medium: '#FF9800',
    hard: '#F44336',
  };
  return colors[difficulty] || '#999';
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getOperationDescription = (op: OperationRecord): string => {
  const descriptions: Record<string, (payload: any) => string> = {
    level_start: () => '开始关卡',
    phase_change: (p) => `从${getPhaseName(p.from)}切换到${getPhaseName(p.to)}`,
    select_student: () => '选择学生',
    submit_score: (p) => `提交得分 +${p.score}`,
    check_materials: (p) => p.complete ? '材料审核通过' : '发现材料缺失',
    show_missing_modal: () => '打开材料缺失提示',
    resolve_material: () => '补全材料',
    skip_material: (p) => `跳过材料 (扣分 ${p.penalty})`,
    pause_game: () => '暂停游戏',
    resume_game: () => '继续游戏',
    level_complete: (p) => p.success ? '关卡通过' : '关卡失败',
  };

  const descFn = descriptions[op.type];
  return descFn ? descFn(op.payload) : op.type;
};

export const calculateAverageUtilization = (data: UtilizationDataPoint[]): number => {
  if (data.length === 0) return 0;
  const sum = data.reduce((acc, point) => acc + point.utilization, 0);
  return Math.round(sum / data.length);
};

export const calculatePeakUtilization = (data: UtilizationDataPoint[]): number => {
  if (data.length === 0) return 0;
  return Math.round(Math.max(...data.map((d) => d.utilization)));
};
