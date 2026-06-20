'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import ComplaintFilters from '@/components/complaint/ComplaintFilters';
import ComplaintList from '@/components/complaint/ComplaintList';
import OperationPanel from '@/components/complaint/OperationPanel';
import { getComplaints } from '@/lib/api/complaints';
import { useComplaintStore } from '@/store/useComplaintStore';
import { ChevronLeft, ChevronRight, LayoutDashboard } from 'lucide-react';

export default function DashboardPage() {
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const { filters } = useComplaintStore();
  const selectedComplaint = useComplaintStore((s) => s.selectedComplaint);

  const { data, isLoading } = useQuery({
    queryKey: ['complaints', filters],
    queryFn: () => getComplaints(filters),
  });

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                投诉任务分派台
              </h1>
              <p className="text-xs text-slate-500">
                共 {data?.total || 0} 条工单
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div
            className={`h-full transition-all duration-300 overflow-hidden flex-shrink-0 ${
              filtersCollapsed ? 'w-0' : ''
            }`}
          >
            <ComplaintFilters />
          </div>

          <button
            onClick={() => setFiltersCollapsed(!filtersCollapsed)}
            className="w-6 bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-primary transition-colors flex-shrink-0"
            title={filtersCollapsed ? '展开筛选' : '收起筛选'}
          >
            {filtersCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          <div className="flex-1 overflow-y-auto p-4">
            <ComplaintList
              complaints={data?.items || []}
              loading={isLoading}
            />
          </div>

          <OperationPanel complaint={selectedComplaint} />
        </div>
      </div>
    </AppLayout>
  );
}
