'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserCheck, Send, ChevronDown } from 'lucide-react';
import { reassignComplaint } from '@/lib/api/complaints';
import { getUsers } from '@/lib/api/users';
import { toast } from '@/components/common/Toast';
import type { Complaint } from '@scenic/shared';
import { usePermission } from '@/hooks/usePermission';

const reassignSchema = z.object({
  toUserId: z.string().min(1, '请选择目标处理人'),
  reason: z.string().optional(),
});

type ReassignFormData = z.infer<typeof reassignSchema>;

interface ReassignFormProps {
  complaint: Complaint;
  onSuccess?: () => void;
}

export default function ReassignForm({ complaint, onSuccess }: ReassignFormProps) {
  const { canAssign } = usePermission();
  const queryClient = useQueryClient();
  const [showUserSelect, setShowUserSelect] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ReassignFormData>({
    resolver: zodResolver(reassignSchema),
    defaultValues: {
      toUserId: '',
      reason: '',
    },
  });

  const selectedUserId = watch('toUserId');
  const selectedUser = users.find((u) => u.id === selectedUserId);

  const mutation = useMutation({
    mutationFn: (data: ReassignFormData) => reassignComplaint(complaint.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({ queryKey: ['complaint', complaint.id] });
      toast('工单已重新分派', { type: 'success' });
      reset();
      onSuccess?.();
    },
    onError: () => {
      toast('分派失败', { type: 'error' });
    },
  });

  const onSubmit = (data: ReassignFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            重新分派
          </span>
        </div>
        <p className="mt-2 text-xs text-blue-700">
          将工单重新分派给其他处理人
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            目标处理人
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserSelect(!showUserSelect)}
              disabled={!canAssign}
              className="w-full px-3 py-2 text-sm text-left border border-slate-200 rounded-lg bg-white flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={selectedUser ? 'text-slate-700' : 'text-slate-400'}>
                {selectedUser ? `${selectedUser.name} (${selectedUser.role})` : '请选择处理人'}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            {showUserSelect && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setValue('toUserId', user.id);
                      setShowUserSelect(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                      user.id === selectedUserId ? 'bg-primary/5 text-primary' : 'text-slate-700'
                    }`}
                  >
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.phone}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.toUserId && (
            <p className="mt-1 text-xs text-danger">{errors.toUserId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            分派原因
          </label>
          <textarea
            {...register('reason')}
            rows={3}
            placeholder="请输入分派原因（可选）..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || !canAssign}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          {mutation.isPending ? '提交中...' : '确认重新分派'}
        </button>
      </form>
    </div>
  );
}
