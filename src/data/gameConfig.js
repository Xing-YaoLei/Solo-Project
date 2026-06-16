export const TASK_TYPE_LABELS = {
  prescription: '处方审核',
  pharmacist: '药师意见',
  batch: '批号效期',
}

export const TASK_TYPE_ICONS = {
  prescription: '📋',
  pharmacist: '👨‍⚕️',
  batch: '📦',
}

export const DECISION_LABELS = {
  approve: '通过',
  reject: '拒绝',
  escalate: '升级',
}

export const DECISION_COLORS = {
  approve: '#10b981',
  reject: '#ef4444',
  escalate: '#f59e0b',
}

export const getDifficultyColor = (level) => {
  if (level <= 1) return '#10b981'
  if (level <= 2) return '#3b82f6'
  if (level <= 3) return '#f59e0b'
  return '#ef4444'
}

export const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
