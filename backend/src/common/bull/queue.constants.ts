export const BULL_QUEUES = {
  REMINDER: 'reminder-queue',
  EMAIL: 'email-queue',
  NOTIFICATION: 'notification-queue',
  OVERDUE_CHECK: 'overdue-check-queue',
} as const;

export type BullQueueName = (typeof BULL_QUEUES)[keyof typeof BULL_QUEUES];
