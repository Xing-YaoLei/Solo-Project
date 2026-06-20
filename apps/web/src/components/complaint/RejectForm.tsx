'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { XCircle, Send } from 'lucide-react';
import { rejectComplaint } from '@/lib/api/complaints';
import { toast } from '@/components/common/Toast';
import type { Complaint } from '@scenic/shared';
import { usePermission } from '@/hooks/usePermission';

const rejectSchema = z.object({
  reason: z.string().min(1, '请输入驳回原因'),
});

type RejectFormData = z.infer<typeof rejectSchema>;

interface RejectFormProps {
  complaint: Complaint;
  onSuccess?: () => void;
}

export default function RejectForm({ complaint, onSuccess }: RejectFormProps) {
  const { canAssign } = usePermission();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RejectFormData>({
    resolver: zodResolver(rejectSchema),
    defaultValues: {
      reason: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: RejectFormData) => rejectComplaint(complaint.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({ queryKey: ['complaint', complaint.id] });
      toast('工单已驳回', { type: 'success' });
      reset();
      onSuccess?.();
    },
    onError: () => {
      toast('驳回失败', { type: 'error' });
    },
  });

  const onSubmit = (data: RejectFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-red-50 border border-red-200">
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium text-red-800">
            驳回重提
          </span>
        </div>
        <p className="mt-2 text-xs text-red-700">
          驳回当前工单，要求重新提交或补充信息
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            驳回原因
          </label>
          <textarea
            {...register('reason')}
            rows={4}
            placeholder="请输入驳回原因和说明..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
          {errors.reason && (
            <p className="mt-1 text-xs text-danger">{errors.reason.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || !canAssign}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          {mutation.isPending ? '提交中...' : '确认驳回'}
        </button>
      </form>
    </div>
  );
}
