'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Clock, Calendar, Edit3, Save, X } from 'lucide-react';
import CountdownTimer from '@/components/common/CountdownTimer';
import { updateComplaintDeadline } from '@/lib/api/complaints';
import { toast } from '@/components/common/Toast';
import type { Complaint } from '@scenic/shared';
import { usePermission } from '@/hooks/usePermission';

interface DeadlineManagerProps {
  complaint: Complaint;
}

export default function DeadlineManager({ complaint }: DeadlineManagerProps) {
  const [editing, setEditing] = useState(false);
  const [newDeadline, setNewDeadline] = useState(
    dayjs(complaint.deadlineAt).format('YYYY-MM-DDTHH:mm')
  );
  const [reason, setReason] = useState('');
  const { canUpgrade } = usePermission();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: { deadlineAt: string; reason?: string }) =>
      updateComplaintDeadline(complaint.id, { deadlineAt: data.deadlineAt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({ queryKey: ['complaint', complaint.id] });
      toast('时限已更新', { type: 'success' });
      setEditing(false);
      setReason('');
    },
    onError: () => {
      toast('更新失败', { type: 'error' });
    },
  });

  const handleSave = () => {
    if (!newDeadline) {
      toast('请选择时限', { type: 'warning' });
      return;
    }
    mutation.mutate({
      deadlineAt: newDeadline,
      reason: reason || undefined,
    });
  };

  const handleCancel = () => {
    setEditing(false);
    setNewDeadline(dayjs(complaint.deadlineAt).format('YYYY-MM-DDTHH:mm'));
    setReason('');
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-slate-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">当前时限</span>
          {canUpgrade && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              修改
            </button>
          )}
        </div>
        <CountdownTimer
          deadline={complaint.deadlineAt}
          className="text-base font-semibold"
        />
        <p className="text-xs text-slate-400 mt-1">
          {dayjs(complaint.deadlineAt).format('YYYY-MM-DD HH:mm')}
        </p>
      </div>

      {editing && (
        <div className="space-y-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              <Calendar className="w-3 h-3 inline mr-1" />
              新时限
            </label>
            <input
              type="datetime-local"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              修改原因
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="请输入修改原因..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={mutation.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {mutation.isPending ? '保存中...' : '保存'}
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              取消
            </button>
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-slate-100">
        <h4 className="text-xs font-medium text-slate-500 uppercase mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          快速调整
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '+1小时', hours: 1 },
            { label: '+2小时', hours: 2 },
            { label: '+4小时', hours: 4 },
            { label: '+24小时', hours: 24 },
          ].map((item) => (
            <button
              key={item.label}
              disabled={!canUpgrade}
              onClick={() => {
                const newTime = dayjs(complaint.deadlineAt)
                  .add(item.hours, 'hour')
                  .format('YYYY-MM-DDTHH:mm');
                mutation.mutate({
                  deadlineAt: newTime,
                  reason: `快速延长${item.label}`,
                });
              }}
              className="px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
