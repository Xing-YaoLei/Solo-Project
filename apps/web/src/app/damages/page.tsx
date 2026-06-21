'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Search,
  FilterX,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  TrendingUp,
} from 'lucide-react';
import { damageApi, Damage } from '@/lib/api';
import {
  RISK_LEVEL_MAP,
  DAMAGE_STATUS_MAP,
  formatDate,
  formatMoney,
  cn,
} from '@/lib/utils';
import AuthGuard from '@/components/AuthGuard';

function DamagesContent() {
  const router = useRouter();
  const [damages, setDamages] = useState<Damage[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [filters, setFilters] = useState({
    status: '',
    riskLevel: '',
    search: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit };
      if (filters.status) params.status = filters.status;
      if (filters.riskLevel) params.riskLevel = filters.riskLevel;
      if (filters.search) params.search = filters.search;

      const [listRes, statsRes] = await Promise.all([
        damageApi.list(params),
        damageApi.stats(),
      ]);
      setDamages(listRes.items || []);
      setTotal(listRes.total || 0);
      setStats(statsRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, filters]);

  const totalPages = Math.ceil(total / limit);
  const hasFilters = filters.status || filters.riskLevel || filters.search;

  const RiskIcon = ({ level }: { level: string }) => {
    switch (level) {
      case 'CRITICAL': return <ShieldX size={18} />;
      case 'HIGH': return <ShieldAlert size={18} />;
      case 'MEDIUM': return <Shield size={18} />;
      default: return <ShieldCheck size={18} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="text-danger-600" size={24} />
            物品损坏处理
          </h2>
          <p className="text-sm text-gray-500 mt-1">共 {total} 条报告 · 待处理 {stats?.pending || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card border-l-4 border-l-gray-400">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-500">报告总数</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{stats?.total || 0}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
              <AlertTriangle size={22} />
            </div>
          </div>
        </div>
        {Object.entries(RISK_LEVEL_MAP).map(([key, val]) => (
          <div
            key={key}
            onClick={() => setFilters({ ...filters, riskLevel: filters.riskLevel === key ? '' : key })}
            className={cn(
              'card border-l-4 cursor-pointer transition-all hover:shadow-md',
              key === 'LOW' && 'border-l-success-500',
              key === 'MEDIUM' && 'border-l-warning-500',
              key === 'HIGH' && 'border-l-danger-500',
              key === 'CRITICAL' && 'border-l-critical',
              filters.riskLevel === key && 'ring-2 ring-primary-500',
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">{val.label}</div>
                <div className={cn('text-3xl font-bold mt-2', val.color)}>
                  {stats?.byRisk?.[key] || 0}
                </div>
              </div>
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', val.color, val.bg)}>
                <RiskIcon level={key} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="md:col-span-1">
            <label className="label">处理状态</label>
            <select
              value={filters.status}
              onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
              className="input"
            >
              <option value="">全部状态</option>
              {Object.entries(DAMAGE_STATUS_MAP).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="label">风险等级</label>
            <select
              value={filters.riskLevel}
              onChange={(e) => { setFilters({ ...filters, riskLevel: e.target.value }); setPage(1); }}
              className="input"
            >
              <option value="">全部等级</option>
              {Object.entries(RISK_LEVEL_MAP).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
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
                placeholder="报告号、类型、描述..."
              />
            </div>
          </div>
        </div>

        {hasFilters && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <TrendingUp size={14} className="text-gray-400" />
            {filters.status && (
              <span className="badge badge-primary">{DAMAGE_STATUS_MAP[filters.status]?.label}</span>
            )}
            {filters.riskLevel && (
              <span className={cn('badge', RISK_LEVEL_MAP[filters.riskLevel]?.bg, RISK_LEVEL_MAP[filters.riskLevel]?.color, 'border')}>
                {RISK_LEVEL_MAP[filters.riskLevel]?.label}
              </span>
            )}
            <button
              onClick={() => { setFilters({ status: '', riskLevel: '', search: '' }); setPage(1); }}
              className="text-xs text-gray-500 hover:text-danger-600 inline-flex items-center gap-1 ml-2"
            >
              <FilterX size={12} /> 清除
            </button>
          </div>
        )}

        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-6 py-3 font-medium whitespace-nowrap">报告编号</th>
                <th className="px-6 py-3 font-medium whitespace-nowrap">风险等级</th>
                <th className="px-6 py-3 font-medium whitespace-nowrap">状态</th>
                <th className="px-6 py-3 font-medium">问题</th>
                <th className="px-6 py-3 font-medium whitespace-nowrap">关联骑手</th>
                <th className="px-6 py-3 font-medium whitespace-nowrap">损失 / 赔偿</th>
                <th className="px-6 py-3 font-medium whitespace-nowrap">上报时间</th>
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
              ) : damages.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-gray-400">
                    暂无损坏报告
                  </td>
                </tr>
              ) : (
                damages.map((dmg) => {
                  const risk = RISK_LEVEL_MAP[dmg.riskLevel];
                  const status = DAMAGE_STATUS_MAP[dmg.status];
                  return (
                    <tr
                      key={dmg.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/damages/${dmg.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-primary-600 font-medium">{dmg.reportNo}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold border',
                          risk.bg,
                          risk.color,
                        )}>
                          <RiskIcon level={dmg.riskLevel} />
                          {risk.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={status.color}>{status.label}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{dmg.damageType}</div>
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{dmg.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{(dmg as any).task?.rider?.user?.name || '-'}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          任务：{(dmg as any).task?.taskNo || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-700">{formatMoney(dmg.estimatedLoss)}</div>
                        {dmg.compensation && (
                          <div className="text-xs text-success-600 mt-0.5">
                            赔偿 {formatMoney(dmg.compensation)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(dmg.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                          处理
                        </button>
                      </td>
                    </tr>
                  );
                })
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
                      p === page ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 text-gray-700',
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

export default function DamagesPage() {
  return (
    <AuthGuard>
      <DamagesContent />
    </AuthGuard>
  );
}
