import type { ActionOption } from '../types/game';

export const ACTION_OPTIONS: ActionOption[] = [
  {
    type: 'archive',
    label: '正常归档',
    icon: 'archive',
    description: '资料完整，符合归档要求',
    color: '#43A047',
  },
  {
    type: 'forward_doctor',
    label: '转发医生',
    icon: 'user-md',
    description: '需要医生确认或补充',
    color: '#1E88E5',
  },
  {
    type: 'forward_front',
    label: '转发前台',
    icon: 'building',
    description: '涉及费用或预约问题',
    color: '#FF9800',
  },
  {
    type: 'return_missing',
    label: '退回-缺资料',
    icon: 'file-x',
    description: '缺少必要的影像或文档',
    color: '#E53935',
  },
  {
    type: 'return_quality',
    label: '退回-质量差',
    icon: 'image-off',
    description: '影像质量不符合要求',
    color: '#E53935',
  },
  {
    type: 'follow_up',
    label: '随访提醒',
    icon: 'calendar-clock',
    description: '需要设置随访提醒',
    color: '#8E24AA',
  },
  {
    type: 'missed_appointment',
    label: '爽约处理',
    icon: 'user-x',
    description: '患者未按时就诊',
    color: '#795548',
  },
];

export const ACTION_LABELS: Record<string, string> = {
  archive: '正常归档',
  forward_doctor: '转发医生',
  forward_front: '转发前台',
  return_missing: '退回-缺资料',
  return_quality: '退回-质量差',
  follow_up: '随访提醒',
  missed_appointment: '爽约处理',
};

export const ERROR_CATEGORIES: Record<string, { code: string; label: string; description: string }> = {
  WRONG_ARCHIVE: {
    code: 'wrong_archive',
    label: '误归档',
    description: '资料不完整或有问题时不应直接归档',
  },
  MISSED_FOLLOWUP: {
    code: 'missed_followup',
    label: '遗漏随访',
    description: '有随访任务时应设置随访提醒',
  },
  WRONG_FORWARD: {
    code: 'wrong_forward',
    label: '转发错误',
    description: '转发给了错误的岗位',
  },
  UNNECESSARY_RETURN: {
    code: 'unnecessary_return',
    label: '不必要退回',
    description: '资料完整时不应退回',
  },
  MISSED_MISSED_APPOINTMENT: {
    code: 'missed_missed_appointment',
    label: '未识别爽约',
    description: '患者爽约时应按爽约流程处理',
  },
  QUALITY_ISSUE: {
    code: 'quality_issue',
    label: '质量问题',
    description: '影像质量差但未退回',
  },
  MISSING_DOCUMENTS: {
    code: 'missing_documents',
    label: '缺失资料',
    description: '缺少必要资料但未退回',
  },
};
