'use client';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { ReminderStatusBadge, ReminderTypeBadge } from '@/components/ui/Badge';
import type { Reminder, Hearing } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { mockHearings } from '@/data/mockData';

interface ReminderListProps {
  reminders: Reminder[];
}

export function ReminderList({ reminders }: ReminderListProps) {
  const getHearingInfo = (hearingId: string): Hearing | undefined => {
    return mockHearings.find((h) => h.id === hearingId);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>收件人</TableHead>
              <TableHead>关联案件</TableHead>
              <TableHead>提醒方式</TableHead>
              <TableHead>发送时间</TableHead>
              <TableHead>发送状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reminders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                  当前筛选范围内暂无提醒记录
                </TableCell>
              </TableRow>
            ) : (
              reminders.map((reminder) => {
                const hearing = getHearingInfo(reminder.hearingId);
                return (
                  <TableRow key={reminder.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">{reminder.recipient}</p>
                        <p className="text-xs text-slate-500">
                          {reminder.recipientType === 'CLIENT' ? '当事人' : reminder.recipientType}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {hearing ? (
                        <div>
                          <p className="text-sm text-slate-900">{hearing.case?.caseName}</p>
                          <p className="text-xs text-slate-500">
                            {hearing.case?.caseNumber} · {formatDateTime(hearing.hearingDate)} {hearing.hearingTime}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ReminderTypeBadge type={reminder.reminderType} />
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {formatDateTime(reminder.sentAt)}
                    </TableCell>
                    <TableCell>
                      <ReminderStatusBadge status={reminder.status} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
