'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { dashboardApi } from '@/lib/api';
import type { DashboardStats } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function AnalyticsPage() {
  const { user, isManager, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isManager) {
      router.replace('/dashboard');
      return;
    }
    if (!authLoading && isManager) {
      const load = async () => {
        try {
          const res = await dashboardApi.getStats();
          setStats(res.data);
        } catch {
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [authLoading, isManager, router]);

  if (authLoading || (isManager && loading)) {
    return <div className="animate-pulse text-surface-200 text-lg p-8">加载中...</div>;
  }

  if (!isManager) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-50">回访完成趋势</h1>
        <p className="text-surface-200 mt-1">管理层回访数据概览 · {user?.storeName}</p>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: '总任务', value: stats.totalTasks, color: 'text-surface-50' },
              { label: '待处理', value: stats.pendingTasks, color: 'text-amber-400' },
              { label: '进行中', value: stats.inProgressTasks, color: 'text-blue-400' },
              { label: '已完成', value: stats.completedTasks, color: 'text-green-400' },
              { label: '完成率', value: `${stats.completionRate}%`, color: 'text-purple-400' },
            ].map((stat) => (
              <div key={stat.label} className="bg-surface-800 rounded-xl p-5 border border-surface-700">
                <p className="text-xs text-surface-200 mb-1">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface-800 rounded-xl border border-surface-700 p-5">
              <h2 className="text-sm font-semibold text-surface-50 mb-4">完成趋势</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="completed" stroke="#22c55e" name="完成" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="created" stroke="#3b82f6" name="新增" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-surface-800 rounded-xl border border-surface-700 p-5">
              <h2 className="text-sm font-semibold text-surface-50 mb-4">新增 vs 完成</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                  />
                  <Legend />
                  <Bar dataKey="created" fill="#3b82f6" name="新增" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="#22c55e" name="完成" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
