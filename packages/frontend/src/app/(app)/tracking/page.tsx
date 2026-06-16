'use client';

import { useEffect, useState } from 'react';
import { followUpApi } from '@/lib/api';
import type { FollowUpTask } from '@/lib/types';
import Link from 'next/link';

export default function TrackingPage() {
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await followUpApi.getAllTasks({ status: 'IN_PROGRESS' });
        setTasks(res.data);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="animate-pulse text-surface-200 text-lg p-8">加载中...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-50">回访追踪</h1>
        <p className="text-surface-200 mt-1">追踪进行中的回访，补充药师意见与批号效期</p>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="bg-surface-800 rounded-xl border border-surface-700 px-5 py-12 text-center text-surface-200">
            暂无进行中的回访
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="bg-surface-800 rounded-xl border border-surface-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-surface-50">{task.taskNo}</span>
                  <span className="text-xs text-surface-200">{task.drugName}</span>
                </div>
                <Link href={`/tasks/${task.id}`} className="text-xs text-primary-400 hover:text-primary-300">
                  详情 →
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className={`p-3 rounded-lg border ${task.hasPharmacistOpinion ? 'bg-green-500/5 border-green-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                  <p className="text-xs text-surface-200 mb-1">药师意见</p>
                  <p className={`text-sm font-medium ${task.hasPharmacistOpinion ? 'text-green-400' : 'text-amber-400'}`}>
                    {task.hasPharmacistOpinion ? '已提交' : '待补充'}
                  </p>
                </div>
                <div className={`p-3 rounded-lg border ${task.hasBatchExpiry ? 'bg-green-500/5 border-green-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                  <p className="text-xs text-surface-200 mb-1">批号效期</p>
                  <p className={`text-sm font-medium ${task.hasBatchExpiry ? 'text-green-400' : 'text-amber-400'}`}>
                    {task.hasBatchExpiry ? '已录入' : '待补录'}
                  </p>
                </div>
                <div className={`p-3 rounded-lg border ${task.hasInsuranceRecord ? 'bg-green-500/5 border-green-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                  <p className="text-xs text-surface-200 mb-1">医保流水</p>
                  <p className={`text-sm font-medium ${task.hasInsuranceRecord ? 'text-green-400' : 'text-amber-400'}`}>
                    {task.hasInsuranceRecord ? '已核对' : '待核对'}
                  </p>
                </div>
                <div className={`p-3 rounded-lg border ${task.hasPrescriptionPhoto ? 'bg-green-500/5 border-green-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                  <p className="text-xs text-surface-200 mb-1">处方照片</p>
                  <p className={`text-sm font-medium ${task.hasPrescriptionPhoto ? 'text-green-400' : 'text-amber-400'}`}>
                    {task.hasPrescriptionPhoto ? '已上传' : '待上传'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
