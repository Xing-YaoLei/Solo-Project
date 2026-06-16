'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { followUpApi, dashboardApi } from '@/lib/api';
import type { FollowUpTask, DashboardStats } from '@/lib/types';
import Link from 'next/link';

const statusLabels: Record<string, string> = {
  PENDING: '待处理',
  IN_PROGRESS: '进行中',
  VERIFIED: '已核实',
  COMPLETED: '已完成',
  ESCALATED: '已升级',
};

const riskLabels: Record<string, { text: string; cls: string }> = {
  HIGH: { text: '高风险', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  MEDIUM: { text: '中风险', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  LOW: { text: '低风险', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
};

export default function DashboardPage() {
  const { user, isManager } = useAuth();
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tasksRes, statsRes] = await Promise.all([
          isManager ? followUpApi.getAllTasks() : followUpApi.getMyTasks(),
          dashboardApi.getStats(),
        ]);
        setTasks(tasksRes.data);
        setStats(statsRes.data);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isManager]);

  if (loading) {
    return <div className="animate-pulse text-surface-200 text-lg p-8">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">工作台</h1>
          <p className="text-surface-200 mt-1">欢迎回来，{user?.name}</p>
        </div>
        <Link
          href="/tasks"
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          查看所有任务
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: '待处理', value: stats.pendingTasks, color: 'text-amber-400' },
            { label: '进行中', value: stats.inProgressTasks, color: 'text-blue-400' },
            { label: '已完成', value: stats.completedTasks, color: 'text-green-400' },
            { label: '已升级', value: stats.escalatedTasks, color: 'text-red-400' },
            { label: '完成率', value: `${stats.completionRate}%`, color: 'text-purple-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface-800 rounded-xl p-4 border border-surface-700">
              <p className="text-xs text-surface-200 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-surface-800 rounded-xl border border-surface-700">
        <div className="px-5 py-4 border-b border-surface-700 flex items-center justify-between">
          <h2 className="font-semibold text-surface-50">
            {isManager ? '全部回访任务' : '我的回访任务'}
          </h2>
          <span className="text-xs text-surface-200">按风险等级排列</span>
        </div>
        <div className="divide-y divide-surface-700">
          {tasks.length === 0 ? (
            <div className="px-5 py-12 text-center text-surface-200">暂无任务</div>
          ) : (
            tasks.map((task) => {
              const risk = riskLabels[task.riskLevel] || riskLabels.LOW;
              return (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className={`flex items-center gap-4 px-5 py-3.5 hover:bg-surface-700/50 transition-colors ${
                    task.riskLevel === 'HIGH' ? 'risk-high' : task.riskLevel === 'MEDIUM' ? 'risk-medium' : 'risk-low'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-surface-50">{task.taskNo}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${risk.cls}`}>{risk.text}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-700 text-surface-200">
                        {statusLabels[task.status] || task.status}
                      </span>
                    </div>
                    <p className="text-sm text-surface-200 mt-1">{task.drugName} · {task.storeName}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-surface-200">
                    <span className={task.hasInsuranceRecord ? 'text-green-400' : 'text-surface-200'}>医保</span>
                    <span className={task.hasPrescriptionPhoto ? 'text-green-400' : 'text-surface-200'}>处方</span>
                    <span className={task.hasPharmacistOpinion ? 'text-green-400' : 'text-surface-200'}>药见</span>
                    <span className={task.hasBatchExpiry ? 'text-green-400' : 'text-surface-200'}>批号</span>
                  </div>
                  <svg className="w-4 h-4 text-surface-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
