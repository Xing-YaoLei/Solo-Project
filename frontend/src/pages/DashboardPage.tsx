import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ClipboardList,
  CheckCircle,
  PlayCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import type { DashboardStats, StaffPerformance, AttendanceTrendPoint } from '@/types';
import { reportsApi, schedulesApi } from '@/api';
import { useAuthStore } from '@/store/auth';
import { formatPercent, STATUS_COLORS, STATUS_LABELS, formatTime, formatDate } from '@/utils/format';
import type { CleaningSchedule, TodoItem } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [todaySchedules, setTodaySchedules] = useState<CleaningSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = useAuthStore((s) => s.currentUser);
  const hasRole = useAuthStore((s) => s.hasRole);

  const loadData = async () => {
    setLoading(true);
    try {
      const promises: any[] = [];
      
      if (hasRole('admin', 'supervisor')) {
        promises.push(reportsApi.getDashboard().then((r) => r.data));
      }
      
      const today = new Date().toISOString().split('T')[0];
      promises.push(
        schedulesApi.list({
          date_from: today,
          date_to: today,
          scope: currentUser?.role === 'cleaner' ? 'mine' : undefined,
        }).then((r) => r.data)
      );
      
      promises.push(reportsApi.getTodos().then((r) => r.data));

      const results = await Promise.all(promises);
      
      let idx = 0;
      if (hasRole('admin', 'supervisor')) {
        setStats(results[idx++]);
      }
      setTodaySchedules(results[idx++]);
      setTodos(results[idx++]);
    } catch (err) {
      console.error('加载数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 欢迎区 */}
      <div className="card p-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white border-none">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              你好，{currentUser?.full_name} 👋
            </h2>
            <p className="mt-1 text-primary-100 text-sm">
              {formatDate(new Date().toISOString())}，今天有 {todaySchedules.length} 项任务需要关注
            </p>
          </div>
          {hasRole('admin', 'supervisor') && (
            <Link
              to="/schedules/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-medium transition-colors self-start"
            >
              <Calendar size={18} />
              创建排班任务
            </Link>
          )}
        </div>
      </div>

      {/* 管理层统计卡片 */}
      {hasRole('admin', 'supervisor') && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<ClipboardList className="text-primary-600" />}
            label="今日任务"
            value={stats.today_schedules}
            color="from-blue-50 to-white border-blue-100"
            sub={`待处理 ${stats.today_pending} 项`}
          />
          <StatCard
            icon={<PlayCircle className="text-purple-600" />}
            label="进行中"
            value={stats.today_in_progress}
            color="from-purple-50 to-white border-purple-100"
            sub={`已完成 ${stats.today_completed} 项`}
          />
          <StatCard
            icon={<AlertTriangle className="text-orange-600" />}
            label="待处理冲突"
            value={stats.conflicts_count}
            color="from-orange-50 to-white border-orange-100"
            subLink={stats.conflicts_count > 0 ? { label: '立即处理', to: '/conflicts' } : undefined}
          />
          <StatCard
            icon={<TrendingUp className="text-green-600" />}
            label="本周到场率"
            value={formatPercent(stats.week_attendance_rate)}
            color="from-green-50 to-white border-green-100"
            sub={`月到场率 ${formatPercent(stats.month_attendance_rate)}`}
          />
        </div>
      )}

      {/* 保洁员个人统计 */}
      {currentUser?.role === 'cleaner' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<ClipboardList className="text-primary-600" />}
            label="今日任务"
            value={todaySchedules.length}
            color="from-blue-50 to-white border-blue-100"
          />
          <StatCard
            icon={<PlayCircle className="text-purple-600" />}
            label="进行中"
            value={todaySchedules.filter((s) => s.status === 'in_progress').length}
            color="from-purple-50 to-white border-purple-100"
          />
          <StatCard
            icon={<CheckCircle className="text-green-600" />}
            label="已完成"
            value={todaySchedules.filter((s) => s.status === 'completed').length}
            color="from-green-50 to-white border-green-100"
          />
          <StatCard
            icon={<Clock className="text-gray-600" />}
            label="待开始"
            value={todaySchedules.filter((s) => ['pending', 'confirmed'].includes(s.status)).length}
            color="from-gray-50 to-white border-gray-200"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 我的待办 */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">我的待办</h3>
              <Link
                to="/todos"
                className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-0.5"
              >
                全部 <ChevronRight size={14} />
              </Link>
            </div>
            <div className="p-2 max-h-96 overflow-y-auto">
              {todos.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">暂无待办事项</div>
              ) : (
                todos.slice(0, 8).map((todo) => (
                  <Link
                    key={todo.id}
                    to={todo.schedule_id ? `/schedules/${todo.schedule_id}` : '/todos'}
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          todo.priority >= 3
                            ? 'bg-red-500'
                            : todo.priority >= 2
                            ? 'bg-orange-500'
                            : todo.priority >= 1
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-primary-700 truncate">
                          {todo.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 truncate">{todo.description}</p>
                        {todo.due_time && (
                          <p className="mt-1 text-xs text-gray-400">
                            截止: {formatTime(todo.due_time)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 到场率趋势图 */}
        {hasRole('admin', 'supervisor') && stats && (
          <div className="lg:col-span-2">
            <div className="card">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">近两周到场率趋势</h3>
                <p className="text-sm text-gray-500 mt-1">实时追踪每日保洁人员到场情况</p>
              </div>
              <div className="p-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.attendance_trend.slice(-14)}>
                    <defs>
                      <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorOntime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
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
          </div>
        )}

        {/* 今日任务时间线 */}
        {currentUser?.role === 'cleaner' && (
          <div className="lg:col-span-2">
            <div className="card">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">今日任务时间线</h3>
                <p className="text-sm text-gray-500 mt-1">按时段查看今日保洁安排</p>
              </div>
              <div className="p-5 max-h-96 overflow-y-auto">
                {todaySchedules.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">今日暂无任务安排</div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200" />
                    {todaySchedules
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((schedule, idx) => (
                        <div key={schedule.id} className="relative pl-10 pb-6 last:pb-0">
                          <div
                            className={`absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium border-4 border-white ${
                              schedule.status === 'completed'
                                ? 'bg-green-500'
                                : schedule.status === 'in_progress'
                                ? 'bg-purple-500'
                                : schedule.status === 'no_show'
                                ? 'bg-red-500'
                                : 'bg-gray-300'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <div className="card p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {schedule.apartment?.apartment_code || '公寓信息'}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                </p>
                              </div>
                              <span className={`badge ${STATUS_COLORS[schedule.status]}`}>
                                {STATUS_LABELS[schedule.status]}
                              </span>
                            </div>
                            {schedule.apartment && (
                              <p className="text-xs text-gray-500 mt-2">
                                {schedule.apartment.building} {schedule.apartment.unit} {schedule.apartment.room_number || ''}
                              </p>
                            )}
                            <div className="mt-3">
                              <Link
                                to={`/schedules/${schedule.id}`}
                                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                              >
                                查看详情 →
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 人员绩效 */}
      {hasRole('admin', 'supervisor') && stats && (
        <div className="card">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">人员绩效榜</h3>
              <p className="text-sm text-gray-500 mt-1">近30天保洁人员表现统计</p>
            </div>
            <Link
              to="/reports"
              className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-0.5"
            >
              查看详细报表 <ChevronRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">保洁员</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase">任务数</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase">完成数</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase">到场率</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase">准时率</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase">平均质量分</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.staff_performance.map((staff) => (
                  <tr key={staff.staff_id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {staff.staff_name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{staff.staff_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center text-sm text-gray-900">{staff.total_schedules}</td>
                    <td className="px-5 py-4 text-center text-sm text-gray-900">{staff.completed}</td>
                    <td className="px-5 py-4 text-center">
                      <PerformanceBar value={staff.attendance_rate} color="bg-blue-500" />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <PerformanceBar value={staff.on_time_rate} color="bg-green-500" />
                    </td>
                    <td className="px-5 py-4 text-center text-sm text-gray-900">
                      {staff.avg_quality_score ? staff.avg_quality_score.toFixed(1) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  subLink,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
  subLink?: { label: string; to: string };
}) {
  return (
    <div className={`card p-5 bg-gradient-to-br ${color || 'from-gray-50 to-white border-gray-100'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
          {subLink && (
            <Link to={subLink.to} className="mt-1 text-xs text-primary-600 hover:text-primary-700 font-medium inline-block">
              {subLink.label} →
            </Link>
          )}
        </div>
        <div className="p-2.5 rounded-xl bg-white shadow-sm">{icon}</div>
      </div>
    </div>
  );
}

function PerformanceBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 w-12 text-right">{value.toFixed(1)}%</span>
    </div>
  );
}
