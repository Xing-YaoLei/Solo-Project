import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  Users,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import type { DashboardStats, AttendanceTrendPoint, StaffPerformance } from '@/types';
import { reportsApi } from '@/api';
import { useAuthStore } from '@/store/auth';
import { formatPercent, formatDate, cn } from '@/utils/format';

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month');
  const hasRole = useAuthStore((s) => s.hasRole);

  const load = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getDashboard();
      setStats(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!stats) return null;

  // 状态统计
  const statusData = [
    { name: '已完成', value: stats.today_completed, color: '#10b981' },
    { name: '进行中', value: stats.today_in_progress, color: '#8b5cf6' },
    { name: '待处理', value: stats.today_pending, color: '#f59e0b' },
    { name: '未到场', value: stats.conflicts_count, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  // 人员绩效排行
  const topPerformance = [...stats.staff_performance]
    .sort((a, b) => b.attendance_rate - a.attendance_rate)
    .slice(0, 10);

  const overallStats = [
    {
      label: '本月到场率',
      value: formatPercent(stats.month_attendance_rate),
      trend: '+2.3%',
      positive: true,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-600',
    },
    {
      label: '本周到场率',
      value: formatPercent(stats.week_attendance_rate),
      trend: '+1.5%',
      positive: true,
      icon: TrendingUp,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      label: '今日任务完成率',
      value: stats.today_schedules > 0
        ? formatPercent((stats.today_completed / stats.today_schedules) * 100)
        : '0%',
      trend: stats.today_schedules > 0 ? `${stats.today_completed}/${stats.today_schedules}` : '0/0',
      positive: true,
      icon: BarChart3,
      color: 'from-purple-500 to-pink-600',
    },
    {
      label: '待处理冲突',
      value: String(stats.conflicts_count),
      trend: stats.conflicts_count > 0 ? '需处理' : '正常',
      positive: stats.conflicts_count === 0,
      icon: XCircle,
      color: stats.conflicts_count > 0
        ? 'from-red-500 to-orange-600'
        : 'from-gray-500 to-slate-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 size={24} />
            数据报表中心
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            多维度分析保洁运营数据，到场率趋势和人员绩效
          </p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <div className="inline-flex rounded-lg bg-gray-100 p-1">
            {([
              { k: 'week', l: '近一周' },
              { k: 'month', l: '近一月' },
              { k: 'quarter', l: '近三月' },
            ] as const).map((r) => (
              <button
                key={r.k}
                onClick={() => setDateRange(r.k)}
                className={cn(
                  'px-4 py-1.5 text-sm rounded-md transition-colors',
                  dateRange === r.k
                    ? 'bg-white text-gray-900 shadow-sm font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {r.l}
              </button>
            ))}
          </div>
          <button className="btn-outline gap-2">
            <Download size={16} />
            导出报表
          </button>
        </div>
      </div>

      {/* 关键指标卡 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overallStats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="card overflow-hidden">
              <div className={cn('h-1.5 bg-gradient-to-r', s.color)} />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{s.label}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{s.value}</p>
                  </div>
                  <div
                    className={cn(
                      'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white',
                      s.color
                    )}
                  >
                    <Icon size={20} />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  <span
                    className={cn(
                      'text-xs font-medium',
                      s.positive ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {s.trend}
                  </span>
                  <span className="text-xs text-gray-400">较前期</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 到场率趋势 */}
        <div className="lg:col-span-2 card">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-primary-600" />
                到场率与准时率趋势
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                近两周的日度数据跟踪
              </p>
            </div>
          </div>
          <div className="p-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.attendance_trend.slice(-14)}>
                <defs>
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOntime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`]}
                  labelFormatter={(v) => formatDate(v)}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="attendance_rate"
                  name="到场率"
                  stroke="#3b82f6"
                  fill="url(#colorAttendance)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="on_time_rate"
                  name="准时率"
                  stroke="#10b981"
                  fill="url(#colorOntime)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 今日任务分布 */}
        <div className="card">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={18} className="text-primary-600" />
              今日任务状态分布
            </h3>
          </div>
          <div className="p-5 h-80 flex flex-col">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {statusData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: d.color }}
                    />
                    <span className="text-gray-600">{d.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 日度任务量柱状图 */}
      <div className="card">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 size={18} className="text-primary-600" />
            日度任务量统计明细
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            每日任务的到达、准时、迟到、未到场对比
          </p>
        </div>
        <div className="p-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.attendance_trend.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={(v) => formatDate(v)} />
              <Legend />
              <Bar dataKey="arrived" name="已到场" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="on_time" name="准时" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="late" name="迟到" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="no_show" name="未到场" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 人员绩效排行榜 */}
      <div className="card">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users size={18} className="text-primary-600" />
              人员绩效排行榜
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              近30天保洁人员表现综合评估
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">
                  排名
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  保洁员
                </th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  任务数
                </th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  完成数
                </th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase w-48">
                  到场率
                </th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase w-48">
                  准时率
                </th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  平均质量分
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topPerformance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-gray-400">
                    暂无绩效数据
                  </td>
                </tr>
              ) : (
                topPerformance.map((staff, idx) => (
                  <tr key={staff.staff_id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                          idx === 0 && 'bg-yellow-100 text-yellow-700',
                          idx === 1 && 'bg-gray-100 text-gray-700',
                          idx === 2 && 'bg-orange-100 text-orange-700',
                          idx > 2 && 'bg-gray-50 text-gray-500'
                        )}
                      >
                        {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white flex items-center justify-center font-semibold text-sm">
                          {staff.staff_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{staff.staff_name}</div>
                          <div className="text-xs text-gray-500">
                            完成率: {staff.total_schedules > 0
                              ? formatPercent((staff.completed / staff.total_schedules) * 100)
                              : '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center font-semibold text-gray-900">
                      {staff.total_schedules}
                    </td>
                    <td className="px-5 py-4 text-center font-semibold text-green-600">
                      {staff.completed}
                    </td>
                    <td className="px-5 py-4">
                      <ProgressBar value={staff.attendance_rate} color="bg-blue-500" />
                    </td>
                    <td className="px-5 py-4">
                      <ProgressBar value={staff.on_time_rate} color="bg-green-500" />
                    </td>
                    <td className="px-5 py-4 text-center">
                      {staff.avg_quality_score !== null ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-lg font-bold text-yellow-500">★</span>
                          <span className="font-semibold text-gray-900">
                            {staff.avg_quality_score?.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 justify-end">
      <div className="w-20 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-14 text-right">
        {value.toFixed(1)}%
      </span>
    </div>
  );
}
