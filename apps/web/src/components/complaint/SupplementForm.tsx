'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Send } from 'lucide-react';
import { supplementComplaint } from '@/lib/api/complaints';
import { toast } from '@/components/common/Toast';
import type { Complaint } from '@scenic/shared';
import { usePermission } from '@/hooks/usePermission';

const supplementSchema = z.object({
  content: z.string().min(1, '请输入补充材料内容'),
});

type SupplementFormData = z.infer<typeof supplementSchema>;

interface SupplementFormProps {
  complaint: Complaint;
  onSuccess?: () => void;
}

export default function SupplementForm({ complaint, onSuccess }: SupplementFormProps) {
  const { canAssign } = usePermission();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SupplementFormData>({
    resolver: zodResolver(supplementSchema),
    defaultValues: {
      content: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: SupplementFormData) => supplementComplaint(complaint.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({ queryKey: ['complaint', complaint.id] });
      toast('补充材料已提交', { type: 'success' });
      reset();
      onSuccess?.();
    },
    onError: () => {
      toast('提交失败', { type: 'error' });
    },
  });

  const onSubmit = (data: SupplementFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">
            补充材料
          </span>
        </div>
        <p className="mt-2 text-xs text-amber-700">
          要求处理人补充相关材料或说明
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            补充说明
          </label>
          <textarea
            {...register('content')}
            rows={4}
            placeholder="请输入需要补充的材料或说明..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
          {errors.content && (
            <p className="mt-1 text-xs text-danger">{errors.content.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || !canAssign}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          {mutation.isPending ? '提交中...' : '提交补充材料'}
        </button>
      </form>
    </div>
  );
}
