'use client';

import ComplaintCard from '@/components/complaint/ComplaintCard';
import type { Complaint } from '@scenic/shared';

interface TodoListProps {
  complaints: Complaint[];
  loading?: boolean;
  type: 'overdue' | 'supplementing' | 'rejected';
}

const EmptyTextMap = {
  overdue: '暂无超时任务',
  supplementing: '暂无待补材料任务',
  rejected: '暂无驳回重提任务',
};

export default function TodoList({ complaints, loading, type }: TodoListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="text-slate-500">{EmptyTextMap[type]}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {complaints.map((complaint) => (
        <ComplaintCard key={complaint.id} complaint={complaint} />
      ))}
    </div>
  );
}
