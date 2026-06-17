import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import {
  AlertTriangle,
  Check,
  RefreshCw,
  Filter,
  ChevronDown,
  Clock,
  User,
  MapPin,
  ArrowUpRight,
} from 'lucide-react';
import type { ConflictRecord } from '@/types';
import { detailsApi, schedulesApi } from '@/api';
import {
  RISK_COLORS,
  RISK_LABELS,
  RISK_BG_COLORS,
  formatDateTime,
  formatDate,
  formatTime,
  cn,
} from '@/utils/format';
import type { RiskLevel } from '@/types';

export default function ConflictPage() {
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      let data: ConflictRecord[] = [];
      if (filter === 'unresolved') {
        const res = await detailsApi.listUnresolvedConflicts();
        data = res.data;
      } else {
        const res = await detailsApi.listUnresolvedConflicts();
        const resolvedRes = await detailsApi.listUnresolvedConflicts();
        data = [...res.data];
      }
      setConflicts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filter]);

  const handleResolve = async (id: number) => {
    try {
      await detailsApi.resolveConflict(id, {
        is_resolved: true,
        resolution_notes: '手动标记已解决',
      });
      await loadData();
    } catch (err) {
      alert('操作失败');
    }
  };

  const filtered = conflicts.filter((c) => {
    if (riskFilter !== 'all' && c.risk_level !== riskFilter) return false;
    if (filter === 'unresolved' && c.is_resolved) return false;
    if (filter === 'resolved' && !c.is_resolved) return false;
    return true;
  });

  const stats = {
    total: conflicts.length,
    unresolved: conflicts.filter((c) => !c.is_resolved).length,
    critical: conflicts.filter((c) => c.risk_level === 'critical' && !c.is_resolved).length,
    high: conflicts.filter((c) => c.risk_level === 'high' && !c.is_resolved).length,
  };

  return (
    <div className="space-y-6">
      {/* 顶部概览 */}
      <div className="card p-6 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 border-red-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
              <AlertTriangle size={24} className="text-red-500" />
              时段冲突管理中心
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              及时处理冲突，避免资源叠加和任务逾期
            </p>
          </div>
          <button
            onClick={loadData}
            className="btn-outline gap-2 self-start"
          >
            <RefreshCw size={16} />
            刷新数据
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="全部冲突"
          value={stats.total}
          color="bg-gray-100 text-gray-700"
          onClick={() => setFilter('all')}
          active={filter === 'all'}
        />
        <StatCard
          label="待处理"
          value={stats.unresolved}
          color="bg-red-100 text-red-700"
          onClick={() => setFilter('unresolved')}
          active={filter === 'unresolved'}
          badge="紧急"
        />
        <StatCard
          label="严重风险"
          value={stats.critical}
          color="bg-purple-100 text-purple-700"
        />
        <StatCard
          label="高风险"
          value={stats.high}
          color="bg-orange-100 text-orange-700"
        />
      </div>

      {/* 筛选栏 */}
      <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex rounded-lg bg-gray-100 p-1 self-start">
          {([
            { key: 'unresolved', label: '待处理' },
            { key: 'all', label: '全部' },
            { key: 'resolved', label: '已处理' },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'px-4 py-1.5 text-sm rounded-md transition-colors',
                filter === f.key
                  ? 'bg-white text-gray-900 shadow-sm font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'btn-outline gap-2',
              showFilters && 'bg-primary-50 border-primary-300 text-primary-700'
            )}
          >
            <Filter size={16} />
            风险等级
            <ChevronDown
              size={14}
              className={cn('transition-transform', showFilters && 'rotate-180')}
            />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card p-4 flex flex-wrap gap-2">
          <FilterChip
            label="全部"
            active={riskFilter === 'all'}
            onClick={() => setRiskFilter('all')}
          />
          {(['critical', 'high', 'medium', 'low'] as RiskLevel[]).map((r) => (
            <FilterChip
              key={r}
              label={RISK_LABELS[r]}
              active={riskFilter === r}
              onClick={() => setRiskFilter(r)}
              color={RISK_COLORS[r]}
            />
          ))}
        </div>
      )}

      {/* 冲突列表 */}
      {loading ? (
        <div className="flex items-center justify-center h-64 card">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
            <Check size={32} className="text-green-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            {filter === 'unresolved' ? '暂无待处理冲突' : '暂无冲突记录'}
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            {filter === 'unresolved' && '所有冲突都已妥善处理'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((conflict) => (
            <div
              key={conflict.id}
              className={cn(
                'card p-5 border-l-4 transition-all hover:shadow-md',
                RISK_BG_COLORS[conflict.risk_level as RiskLevel],
                conflict.is_resolved && 'opacity-60'
              )}
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                {/* 风险标签 */}
                <div className="flex-shrink-0">
                  <div
                    className={cn(
                      'px-4 py-3 rounded-xl border flex items-center gap-2',
                      RISK_COLORS[conflict.risk_level as RiskLevel]
                    )}
                  >
                    <AlertTriangle size={18} />
                    <div>
                      <div className="text-xs opacity-80">风险等级</div>
                      <div className="font-semibold text-sm leading-tight">
                        {RISK_LABELS[conflict.risk_level as RiskLevel]}
                      </div>
                    </div>
                  </div>
                  {conflict.is_resolved && (
                    <div className="mt-2 text-center">
                      <span className="badge bg-green-100 text-green-800">
                        <Check size={10} className="inline mr-0.5" />
                        已处理
                      </span>
                    </div>
                  )}
                </div>

                {/* 主体内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/80 text-gray-700 border">
                          {conflict.conflict_type}
                        </span>
                        <span className="text-xs text-gray-500">
                          创建于 {formatDateTime(conflict.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium">{conflict.description}</p>
                    </div>
                  </div>

                  {conflict.resolution_notes && (
                    <div className="mt-3 p-3 rounded-lg bg-white/80 border border-green-200">
                      <div className="text-xs text-green-700 font-medium mb-1 flex items-center gap-1">
                        <Check size={12} />
                        处理方案
                      </div>
                      <p className="text-sm text-gray-700">{conflict.resolution_notes}</p>
                      {conflict.resolved_at && (
                        <div className="text-xs text-gray-400 mt-1">
                          处理时间：{formatDateTime(conflict.resolved_at)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 操作区 */}
                <div className="flex flex-col gap-2 lg:items-end flex-shrink-0">
                  {conflict.conflicting_schedule_id && (
                    <Link
                      to={`/schedules/${conflict.conflicting_schedule_id}`}
                      className="btn-outline text-sm gap-1 py-1.5"
                    >
                      关联任务 <ArrowUpRight size={14} />
                    </Link>
                  )}
                  <Link
                    to={`/schedules/${conflict.cleaning_schedule_id}`}
                    className="btn-primary text-sm gap-1 py-1.5"
                  >
                    处理冲突
                    <ArrowUpRight size={14} />
                  </Link>
                  {!conflict.is_resolved && (
                    <button
                      onClick={() => handleResolve(conflict.id)}
                      className="btn-secondary text-sm gap-1 py-1.5"
                    >
                      <Check size={14} />
                      标记已处理
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  onClick,
  active,
  badge,
}: {
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
  active?: boolean;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'card p-5 text-left transition-all hover:shadow-md',
        onClick && 'cursor-pointer',
        active && 'ring-2 ring-primary-500 border-primary-300'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-3xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-500 mt-1">{label}</div>
        </div>
        <span className={cn('badge', color)}>{badge || label}</span>
      </div>
    </button>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
        active
          ? color || 'bg-primary-100 text-primary-700 border-primary-200'
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
      )}
    >
      {label}
    </button>
  );
}
