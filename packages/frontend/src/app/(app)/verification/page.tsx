'use client';

import { useEffect, useState } from 'react';
import { followUpApi } from '@/lib/api';
import type { FollowUpTask } from '@/lib/types';
import Link from 'next/link';

export default function VerificationPage() {
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await followUpApi.getAllTasks({ hasPrescription: 'true' });
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
        <h1 className="text-2xl font-bold text-surface-50">处方核对</h1>
        <p className="text-surface-200 mt-1">医保流水与处方照片核对</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tasks.length === 0 ? (
          <div className="col-span-2 bg-surface-800 rounded-xl border border-surface-700 px-5 py-12 text-center text-surface-200">
            暂无待核对的处方
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-surface-800 rounded-xl border border-surface-700 p-5 ${
                task.prescriptionPhoto && !task.prescriptionPhoto.isClear ? 'border-l-4 border-l-red-500' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-surface-50">{task.taskNo}</span>
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
              <p className="text-sm text-surface-200 mb-2">{task.drugName} · {task.storeName}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${task.hasInsuranceRecord ? 'bg-green-400' : 'bg-surface-200'}`}></span>
                  <span className={task.hasInsuranceRecord ? 'text-green-400' : 'text-surface-200'}>医保流水</span>
                </div>
                <div className="flex items-center gap-1.5">
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
