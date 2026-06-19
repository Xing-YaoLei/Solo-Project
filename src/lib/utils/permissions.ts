type RoleName = 'visitor' | 'ticket_agent' | 'patrol_agent' | 'operator';

const SENSITIVE_FIELDS: Record<RoleName, string[]> = {
  visitor: ['assigneeId', 'assigneeName', 'assigneePhone', 'operatorId', 'operatorName', 'internalNotes', 'processingLogs', 'escalationRecords'],
  ticket_agent: ['visitorPhone'],
  patrol_agent: ['visitorPhone'],
  operator: []
};

export function maskComplaint<T extends Record<string, unknown>>(complaint: T, roleName: string): T {
  const role = roleName as RoleName;
  const fields = SENSITIVE_FIELDS[role] ?? [];
  const masked = { ...complaint };
  for (const field of fields) {
    if (field in masked) {
      (masked as Record<string, unknown>)[field] = '***';
    }
  }
  return masked;
}

export function canExport(roleName: string, permissions: string[]): boolean {
  return permissions.includes('complaint:export') || permissions.includes('report:export');
}

export function canProcess(roleName: string, permissions: string[]): boolean {
  return permissions.includes('complaint:assign') || permissions.includes('complaint:close');
}

export function getVisibleStatuses(roleName: string): string[] {
  switch (roleName) {
    case 'visitor':
      return ['pending', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected', 'resubmitted'];
    case 'ticket_agent':
    case 'patrol_agent':
      return ['pending', 'assigned', 'in_progress', 'escalated', 'resolved', 'closed', 'rejected', 'resubmitted'];
    case 'operator':
      return ['pending', 'assigned', 'in_progress', 'escalated', 'resolved', 'closed', 'rejected', 'resubmitted'];
    default:
      return [];
  }
}

export const STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  assigned: '已分配',
  in_progress: '处理中',
  escalated: '已升级',
  resolved: '已解决',
  closed: '已关闭',
  rejected: '已驳回',
  resubmitted: '已重提',
  overdue: '已超时'
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  escalated: 'bg-red-100 text-red-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-600',
  rejected: 'bg-rose-100 text-rose-700',
  resubmitted: 'bg-purple-100 text-purple-700',
  overdue: 'bg-red-200 text-red-800'
};
