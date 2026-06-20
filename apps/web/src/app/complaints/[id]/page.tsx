'use client';

import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import ComplaintDetail from '@/components/complaint/ComplaintDetail';
import OperationPanel from '@/components/complaint/OperationPanel';
import { getComplaintById } from '@/lib/api/complaints';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';

export default function ComplaintDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: complaint, isLoading } = useQuery({
    queryKey: ['complaint', params.id],
    queryFn: () => getComplaintById(params.id),
    enabled: !!params.id,
  });

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-lg font-semibold text-slate-800">工单详情</h1>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            加载中...
          </div>
        ) : complaint ? (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <ComplaintDetail complaint={complaint} />
            </div>
            <OperationPanel complaint={complaint} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            工单不存在
          </div>
        )}
      </div>
    </AppLayout>
  );
}
