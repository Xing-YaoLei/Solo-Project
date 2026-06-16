'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { followUpApi } from '@/lib/api';
import type { FollowUpTask, TaskStatus, RiskLevel } from '@/lib/types';
import Link from 'next/link';

const statusLabels: Record<TaskStatus, string> = {
  PENDING: '待处理',
  IN_PROGRESS: '进行中',
  VERIFIED: '已核实',
  COMPLETED: '已完成',
  ESCALATED: '已升级',
};

const riskOrder: Record<RiskLevel, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

const riskStyle: Record<RiskLevel, string> = {
  HIGH: 'border-l-red-500 bg-red-500/5',
  MEDIUM: 'border-l-amber-500 bg-amber-500/5',
  LOW: 'border-l-green-500 bg-green-500/5',
};

const riskBadge: Record<RiskLevel, string> = {
  HIGH: 'bg-red-500/15 text-red-400',
  MEDIUM: 'bg-amber-500/15 text-amber-400',
  LOW: 'bg-green-500/15 text-green-400',
};

export default function TasksPage() {
  const { isManager } = useAuth();
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const params: Record<string, string> = {};
        if (filterStatus !== 'ALL') params.status = filterStatus;
        if (filterRisk !== 'ALL') params.riskLevel = filterRisk;
        const res = isManager
          ? await followUpApi.getAllTasks(params)
          : await followUpApi.getMyTasks(params);
        const sorted = res.data.sort((a: FollowUpTask, b: FollowUpTask) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
        setTasks(sorted);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isManager, filterStatus, filterRisk]);

  if (loading) return <div className="animate-pulse text-surface-200 text-lg p-8">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">回访任务</h1>
          <p className="text-surface-200 mt-1">按风险等级排列，高风险优先处理</p>
        </div>
      </div>

      <div className="flex gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-surface-50 focus:outline-none focus:border-primary-500"
        >
          <option value="ALL">全部状态</option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
          className="px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-surface-50 focus:outline-none focus:border-primary-500"
        >
          <option value="ALL">全部风险</option>
          <option value="HIGH">高风险</option>
          <option value="MEDIUM">中风险</option>
          <option value="LOW">低风险</option>
        </select>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="bg-surface-800 rounded-xl border border-surface-700 px-5 py-12 text-center text-surface-200">
            暂无任务
          </div>
        ) : (
          tasks.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className={`block bg-surface-800 rounded-xl border border-surface-700 border-l-4 ${riskStyle[task.riskLevel]} px-5 py-4 hover:bg-surface-700/50 transition-colors`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-surface-50">{task.taskNo}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${riskBadge[task.riskLevel]}`}>
                    {task.riskLevel === 'HIGH' ? '高风险' : task.riskLevel === 'MEDIUM' ? '中风险' : '低风险'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-700 text-surface-200">
                    {statusLabels[task.status]}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-surface-200">
                  <span className={task.hasInsuranceRecord ? 'text-green-400' : ''}>医保</span>
                  <span className={task.hasPrescriptionPhoto ? 'text-green-400' : ''}>处方</span>
                  <span className={task.hasPharmacistOpinion ? 'text-green-400' : ''}>药见</span>
                  <span className={task.hasBatchExpiry ? 'text-green-400' : ''}>批号</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm text-surface-200">
                <span>{task.drugName}</span>
                <span>·</span>
                <span>{task.storeName}</span>
                <span>·</span>
                <span>处理人: {task.assigneeName}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
