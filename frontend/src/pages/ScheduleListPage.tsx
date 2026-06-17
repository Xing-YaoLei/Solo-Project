import { useState, useEffect } from 'react';
import { Link, useSearch, useNavigate } from '@tanstack/react-router';
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  AlertTriangle,
  MapPin,
  User,
  Clock,
} from 'lucide-react';
import type { CleaningSchedule, User } from '@/types';
import { schedulesApi, usersApi, apartmentsApi } from '@/api';
import { useAuthStore } from '@/store/auth';
import {
  STATUS_COLORS,
  STATUS_LABELS,
  ATTENDANCE_COLORS,
  ATTENDANCE_LABELS,
  formatDateTime,
  formatTime,
  formatDate,
  RISK_COLORS,
  RISK_LABELS,
  cn,
} from '@/utils/format';
import type { CleaningStatus, RiskLevel } from '@/types';

export default function ScheduleListPage() {
  const search = useSearch();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<CleaningSchedule[]>([]);
  const [cleaners, setCleaners] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: (search as any).status || '',
    date_from: (search as any).date_from || '',
    date_to: (search as any).date_to || '',
    cleaner_id: (search as any).cleaner_id ? Number((search as any).cleaner_id) : undefined,
    apartment_id: (search as any).apartment_id
      ? Number((search as any).apartment_id)
      : undefined,
    has_conflict: (search as any).has_conflict || '',
    risk_level: (search as any).risk_level || '',
    search: (search as any).search || '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const hasRole = useAuthStore((s) => s.hasRole);
  const currentUser = useAuthStore((s) => s.currentUser);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const params: any = { ...filters };
      Object.keys(params).forEach((key) => {
        if (!params[key] && params[key] !== 0) delete params[key];
      });
      if (currentUser?.role === 'cleaner') {
        params.scope = 'mine';
      }
      const res = await schedulesApi.list(params);
      setSchedules(res.data);
    } catch (err) {
      console.error('加载排班列表失败', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCleaners = async () => {
    if (hasRole('admin', 'supervisor')) {
      try {
        const res = await usersApi.getCleaners();
        setCleaners(res.data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    loadCleaners();
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [filters]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      date_from: '',
      date_to: '',
      cleaner_id: undefined,
      apartment_id: undefined,
      has_conflict: '',
      risk_level: '',
      search: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* 搜索和工具栏 */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="搜索排班编号、公寓信息..."
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'btn-outline gap-2',
                showFilters && 'bg-primary-50 border-primary-200 text-primary-700'
              )}
            >
              <Filter size={16} />
              筛选条件
              <ChevronDown
                size={16}
                className={cn('transition-transform', showFilters && 'rotate-180')}
              />
            </button>
            {hasRole('admin', 'supervisor') && (
              <Link to="/schedules/create" className="btn-primary gap-2">
                <Plus size={16} />
                新建排班
              </Link>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">任务状态</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input"
              >
                <option value="">全部状态</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">开始日期</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">结束日期</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="input"
              />
            </div>
            {hasRole('admin', 'supervisor') && (
              <div>
                <label className="label">保洁员</label>
                <select
                  value={filters.cleaner_id || ''}
                  onChange={(e) =>
                    handleFilterChange('cleaner_id', e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="input"
                >
                  <option value="">全部保洁员</option>
                  {cleaners.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="label">是否有冲突</label>
              <select
                value={filters.has_conflict}
                onChange={(e) => handleFilterChange('has_conflict', e.target.value)}
                className="input"
              >
                <option value="">全部</option>
                <option value="true">有冲突</option>
                <option value="false">无冲突</option>
              </select>
            </div>
            <div>
              <label className="label">风险等级</label>
              <select
                value={filters.risk_level}
                onChange={(e) => handleFilterChange('risk_level', e.target.value)}
                className="input"
              >
                <option value="">全部</option>
                {Object.entries(RISK_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-2 flex items-end">
              <button onClick={resetFilters} className="btn-secondary">
                重置筛选
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="flex items-center justify-center h-64 card">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    排班编号
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    日期/时段
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    公寓信息
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    保洁员
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    任务状态
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    到场状态
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    风险
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center text-gray-400">
                      暂无排班记录
                    </td>
                  </tr>
                ) : (
                  schedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-mono text-sm font-medium text-gray-900">
                          {schedule.schedule_code}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          创建于 {formatDate(schedule.created_at)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(schedule.scheduled_date)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <Clock size={12} />
                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {schedule.apartment?.apartment_code || '-'}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {schedule.apartment?.building} {schedule.apartment?.unit}{' '}
                              {schedule.apartment?.room_number || ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {schedule.cleaner ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                              {schedule.cleaner.full_name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm text-gray-900">
                                {schedule.cleaner.full_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {schedule.cleaner.phone || ''}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-red-500">待分配</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn('badge', STATUS_COLORS[schedule.status])}>
                          {STATUS_LABELS[schedule.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn('badge', ATTENDANCE_COLORS[schedule.attendance_status])}
                        >
                          {ATTENDANCE_LABELS[schedule.attendance_status]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {schedule.has_conflict && schedule.risk_level ? (
                          <span
                            className={cn(
                              'badge border',
                              RISK_COLORS[schedule.risk_level as RiskLevel]
                            )}
                          >
                            <AlertTriangle size={10} className="inline mr-1 -mt-0.5" />
                            {RISK_LABELS[schedule.risk_level as RiskLevel]}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">正常</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/schedules/${schedule.id}`}
                          className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          查看详情
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
