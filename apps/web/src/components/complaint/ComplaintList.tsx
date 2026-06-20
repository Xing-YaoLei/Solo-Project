'use client';

import ComplaintCard from './ComplaintCard';
import { useComplaintStore } from '@/store/useComplaintStore';
import type { Complaint } from '@scenic/shared';

interface ComplaintListProps {
  complaints: Complaint[];
  loading?: boolean;
  emptyText?: string;
}

export default function ComplaintList({
  complaints,
  loading,
  emptyText = '暂无工单',
}: ComplaintListProps) {
  const { selectedComplaintId, setSelectedComplaint } = useComplaintStore();

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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-slate-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {complaints.map((complaint) => (
        <ComplaintCard
          key={complaint.id}
          complaint={complaint}
          selected={selectedComplaintId === complaint.id}
          onClick={() => setSelectedComplaint(complaint)}
        />
      ))}
    </div>
  );
}
