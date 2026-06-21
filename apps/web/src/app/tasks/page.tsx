'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  FilterX,
} from 'lucide-react';
import { taskApi, riderApi, Task } from '@/lib/api';
import {
  TASK_STATUS_MAP,
  VERIFICATION_STEP_MAP,
  RISK_LEVEL_MAP,
  formatDate,
  formatMoney,
  cn,
} from '@/lib/utils';
import AuthGuard from '@/components/AuthGuard';

function TasksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    step: searchParams.get('step') || '',
    riderId: '',
    search: '',
  });

  const loadRiders = async () => {
    try {
      const data = await riderApi.list();
      setRiders(data || []);
    } catch {}
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit };
      if (filters.status) params.status = filters.status;
      if (filters.step) params.step = filters.step;
      if (filters.riderId) params.riderId = filters.riderId;
      if (filters.search) params.search = filters.search;
      const res = await taskApi.list(params);
      setTasks(res.items || []);
      setTotal(res.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiders();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [page, filters]);

  const totalPages = Math.ceil(total / limit);
  const hasFilters = filters.status || filters.step || filters.riderId || filters.search;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">核验任务</h2>
          <p className="text-sm text-gray-500 mt-1">共 {total} 条记录 · 第 {page} / {totalPages || 1} 页</p>
        </div>
        <button className="btn-primary">
          <Plus size={18} />
          新建核验任务
        </button>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <div className="md:col-span-1">
            <label className="label">状态筛选</label>
            <select
              value={filters.status}
              onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
              className="input"
            >
              <option value="">全部状态</option>
              {Object.entries(TASK_STATUS_MAP).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="label">处理步骤</label>
            <select
              value={filters.step}
              onChange={(e) => { setFilters({ ...filters, step: e.target.value }); setPage(1); }}
              className="input"
            >
              <option value="">全部步骤</option>
              {Object.entries(VERIFICATION_STEP_MAP).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="label">骑手</label>
            <select
              value={filters.riderId}
              onChange={(e) => { setFilters({ ...filters, riderId: e.target.value }); setPage(1); }}
              className="input"
            >
              <option value="">全部骑手</option>
              {riders.map((r) => (
                <option key={r.userId} value={r.userId}>
                  {r.user?.name} - {r.riderCode}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="label">搜索</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={filters.search}
                onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
                className="input pl-9"
                placeholder="任务/订单号、物品、地址"
              />
            </div>
          </div>
        </div>

        {hasFilters && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Filter size={14} className="text-gray-400" />
            {filters.status && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs">
                状态：{TASK_STATUS_MAP[filters.status]?.label}
              </span>
            )}
            {filters.step && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs">
                步骤：{VERIFICATION_STEP_MAP[filters.step]?.label}
              </span>
            )}
            {filters.riderId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs">
                骑手：{riders.find((r) => r.userId === filters.riderId)?.user?.name || '-'}
              </span>
            )}
            <button
              onClick={() => { setFilters({ status: '', step: '', riderId: '', search: '' }); setPage(1); }}
              className="text-xs text-gray-500 hover:text-danger-600 inline-flex items-center gap-1 ml-2"
            >
              <FilterX size={12} /> 清除筛选
            </button>
          </div>
        )}

        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-6 py-3 font-medium whitespace-nowrap">任务编号</th>
                <th className="px-6 py-3 font-medium whitespace-nowrap">订单号</th>
                <th className="px-6 py-3 font-medium whitespace-nowrap">物品信息</th>
                <th className="px-6 py-3 font-medium whitespace-nowrap">骑手</th>
                <th className="px-6 py-3 font-medium whitespace-nowrap">状态 / 步骤</th>
                <th className="px-6 py-3 font-medium whitespace-nowrap">收寄地址</th>
                <th className="px-6 py-3 font-medium whitespace-nowrap">创建时间</th>
                <th className="px-6 py-3 font-medium whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary-500" />
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-gray-400">
                    暂无任务数据
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/tasks/${task.id}`)}
                  >
                    <td className="px-6 py-4 font-mono text-primary-600 whitespace-nowrap">
                      {task.taskNo}
                      {task.damageReport && (
                        <span
                          className={cn(
                            'ml-2 inline-block w-2 h-2 rounded-full',
                            RISK_LEVEL_MAP[task.damageReport.riskLevel]?.color.replace('text-', 'bg-'),
                          )}
                          title={`存在损坏报告：${RISK_LEVEL_MAP[task.damageReport.riskLevel]?.label}`}
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{task.orderNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{task.itemName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {task.itemQuantity}件 · {formatMoney(task.estimatedAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{(task as any).rider?.user?.name || '-'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{(task as any).rider?.riderCode || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={TASK_STATUS_MAP[task.status].color}>
                        {TASK_STATUS_MAP[task.status].label}
                      </span>
                      {task.currentStep && (
                        <div className="text-xs text-gray-500 mt-1">
                          → {VERIFICATION_STEP_MAP[task.currentStep]?.label}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-[240px]">
                      <div className="text-xs text-gray-600 truncate" title={task.pickupAddress}>
                        📤 {task.pickupAddress}
                      </div>
                      <div className="text-xs text-gray-600 truncate mt-1" title={task.deliveryAddress}>
                        📥 {task.deliveryAddress}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(task.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              显示 {(page - 1) * limit + 1} - {Math.min(page * limit, total)} 条，共 {total} 条
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5 && page > 3) p = page - 2 + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                      p === page
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-gray-100 text-gray-700',
                    )}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <AuthGuard>
      <TasksContent />
    </AuthGuard>
  );
}
