'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { followUpApi } from '@/lib/api';
import type { FollowUpTask } from '@/lib/types';
import Link from 'next/link';

const riskStyle: Record<string, string> = {
  HIGH: 'border-l-4 border-l-red-500',
  MEDIUM: 'border-l-4 border-l-amber-500',
  LOW: 'border-l-4 border-l-green-500',
};

const riskBadge: Record<string, string> = {
  HIGH: 'bg-red-500/15 text-red-400 border-red-500/30',
  MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  LOW: 'bg-green-500/15 text-green-400 border-green-500/30',
};

const riskOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export default function VerificationPage() {
  const { isManager } = useAuth();
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = isManager
          ? await followUpApi.getAllTasks()
          : await followUpApi.getMyTasks();
        const withPrescription = res.data.filter(
          (t: FollowUpTask) => t.hasPrescriptionPhoto || t.hasInsuranceRecord
        );
        const sorted = withPrescription.sort(
          (a: FollowUpTask, b: FollowUpTask) =>
            riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
        );
        setTasks(sorted);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isManager]);

  if (loading) return <div className="animate-pulse text-surface-200 text-lg p-8">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">处方核对</h1>
          <p className="text-surface-200 mt-1">
            {isManager ? '全部处方核对任务' : '我的处方核对任务'}，按风险等级排列
          </p>
        </div>
        <span className="text-xs text-surface-200 bg-surface-800 px-3 py-1.5 rounded-full border border-surface-700">
          共 {tasks.length} 项待核对
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.length === 0 ? (
          <div className="col-span-2 bg-surface-800 rounded-xl border border-surface-700 px-5 py-12 text-center text-surface-200">
            暂无待核对的处方
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-surface-800 rounded-xl border border-surface-700 p-5 ${riskStyle[task.riskLevel] || ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-surface-50">{task.taskNo}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${riskBadge[task.riskLevel] || riskBadge.LOW}`}>
                    {task.riskLevel === 'HIGH' ? '高风险' : task.riskLevel === 'MEDIUM' ? '中风险' : '低风险'}
                  </span>
                  {task.prescriptionPhoto && !task.prescriptionPhoto.isClear && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                      处方不清
                    </span>
                  )}
                </div>
                <Link
                  href={`/tasks/${task.id}`}
                  className="text-xs text-primary-400 hover:text-primary-300"
                >
                  查看详情 →
                </Link>
              </div>
              <p className="text-sm text-surface-200 mb-2">
                {task.drugName} · {task.storeName}
              </p>
              <p className="text-xs text-surface-200 mb-3">处理人: {task.assigneeName}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`flex items-center gap-1.5 p-2 rounded ${task.hasInsuranceRecord ? 'bg-green-500/10' : 'bg-surface-700/50'}`}>
                  <span className={`w-2 h-2 rounded-full ${task.hasInsuranceRecord ? 'bg-green-400' : 'bg-surface-200'}`}></span>
                  <span className={task.hasInsuranceRecord ? 'text-green-400' : 'text-surface-200'}>医保流水</span>
                </div>
                <div className={`flex items-center gap-1.5 p-2 rounded ${task.hasPrescriptionPhoto ? 'bg-green-500/10' : 'bg-surface-700/50'}`}>
                  <span className={`w-2 h-2 rounded-full ${task.hasPrescriptionPhoto ? 'bg-green-400' : 'bg-surface-200'}`}></span>
                  <span className={task.hasPrescriptionPhoto ? 'text-green-400' : 'text-surface-200'}>处方照片</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
