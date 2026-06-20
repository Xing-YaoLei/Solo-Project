'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Send, MessageSquare, User } from 'lucide-react';
import { submitVisitResult } from '@/lib/api/complaints';
import { toast } from '@/components/common/Toast';
import type { Complaint } from '@scenic/shared';
import { usePermission } from '@/hooks/usePermission';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

const visitSchema = z.object({
  satisfaction: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  feedback: z.string().min(1, '请输入回访反馈'),
  needFollowUp: z.boolean().default(false),
});

type VisitFormData = z.infer<typeof visitSchema>;

interface VisitResultFormProps {
  complaint: Complaint;
}

export default function VisitResultForm({ complaint }: VisitResultFormProps) {
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const { canClose } = usePermission();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VisitFormData>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      satisfaction: complaint.visitResult?.satisfaction || 5,
      feedback: complaint.visitResult?.feedback || '',
      needFollowUp: complaint.visitResult?.needFollowUp || false,
    },
  });

  const satisfaction = watch('satisfaction');
  const hasVisitResult = !!complaint.visitResult;

  const mutation = useMutation({
    mutationFn: (data: VisitFormData) =>
      submitVisitResult(complaint.id, {
        ...data,
        visitedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({ queryKey: ['complaint', complaint.id] });
      toast('回访结果已提交', { type: 'success' });
    },
    onError: () => {
      toast('提交失败', { type: 'error' });
    },
  });

  const onSubmit = (data: VisitFormData) => {
    mutation.mutate(data);
  };

  if (hasVisitResult && complaint.visitResult) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-success/5 border border-success/20">
          <div className="flex items-center gap-1.5 mb-3">
            <MessageSquare className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-success">
              已完成回访
            </span>
          </div>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  'w-5 h-5',
                  star <= complaint.visitResult!.satisfaction
                    ? 'text-warning fill-warning'
                    : 'text-slate-300'
                )}
              />
            ))}
            <span className="ml-2 text-sm font-medium text-slate-700">
              {complaint.visitResult.satisfaction}分
            </span>
          </div>
          <p className="text-sm text-slate-600 mb-3">
            {complaint.visitResult.feedback}
          </p>
          {complaint.visitResult.needFollowUp && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-warning/10 text-warning">
              需要跟进
            </span>
          )}
          <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500">
            <User className="w-3 h-3" />
            回访人 ID: {complaint.visitResult.operatorId.slice(0, 8)}
            <span className="ml-2">
              {dayjs(complaint.visitResult.visitedAt).format('YYYY-MM-DD HH:mm')}
            </span>
          </div>
        </div>
        {canClose && (
          <button
            disabled={mutation.isPending}
            onClick={handleSubmit(onSubmit)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-success rounded-lg hover:bg-success/90 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            更新回访结果
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-2">
          满意度评分
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setValue('satisfaction', star as 1 | 2 | 3 | 4 | 5)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  'w-7 h-7 transition-colors',
                  star <= (hoveredStar || satisfaction)
                    ? 'text-warning fill-warning'
                    : 'text-slate-300 hover:text-slate-400'
                )}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-slate-500">
            {satisfaction || 0}/5 分
          </span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          回访反馈
        </label>
        <textarea
          {...register('feedback')}
          rows={4}
          placeholder="请输入回访情况和游客反馈..."
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
        />
        {errors.feedback && (
          <p className="mt-1 text-xs text-danger">{errors.feedback.message}</p>
        )}
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          {...register('needFollowUp')}
          className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
        />
        <span className="text-sm text-slate-600">需要后续跟进</span>
      </label>

      <button
        type="submit"
        disabled={mutation.isPending || !canClose}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-4 h-4" />
        {mutation.isPending ? '提交中...' : '提交回访结果'}
      </button>
    </form>
  );
}
