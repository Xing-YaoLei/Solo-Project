export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    'easy': '入门',
    'medium': '进阶',
    'hard': '挑战',
    'expert': '专家'
  };
  return labels[difficulty] || difficulty;
}

export function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    'easy': '#10b981',
    'medium': '#3b82f6',
    'hard': '#f59e0b',
    'expert': '#ef4444'
  };
  return colors[difficulty] || '#6b7280';
}

export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    'full_refund': '全额退还押金',
    'partial_deduction': '部分扣除押金',
    'full_deduction': '全额扣除押金',
    'escalate': '上报上级处理'
  };
  return labels[action] || action;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'normal': '正常',
    'damaged': '损坏',
    'missing': '缺失',
    'dirty': '脏污',
    'paid': '已支付',
    'overdue': '逾期',
    'partial': '部分支付'
  };
  return labels[status] || status;
}

export function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    'minor': '轻微',
    'major': '较严重',
    'critical': '严重'
  };
  return labels[severity] || severity;
}
