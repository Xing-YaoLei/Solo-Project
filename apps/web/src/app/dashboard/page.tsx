'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Users,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  Activity,
  Loader2,
  ChevronDown,
  Map,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';
import { dashboardApi, riderApi } from '@/lib/api';
import { TASK_STATUS_MAP, formatMoney, cn } from '@/lib/utils';
import AuthGuard from '@/components/AuthGuard';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

function DashboardContent() {
  const [days, setDays] = useState(30);
  const [selectedRider, setSelectedRider] = useState('');
  const [showRiderDropdown, setShowRiderDropdown] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [trendData, setTrendData] = useState<any>(null);
  const [taskDistribution, setTaskDistribution] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ov, td, dist, rs] = await Promise.all([
        dashboardApi.overview(),
        dashboardApi.riderTrend({ days, riderId: selectedRider || undefined }),
        dashboardApi.taskDistribution(),
        riderApi.list(),
      ]);
      setOverview(ov);
      setTrendData(td);
      setTaskDistribution(dist || []);
      setRiders(rs || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [days, selectedRider]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin w-10 h-10 text-primary-500" />
      </div>
    );
  }

  const avgOrdersPerDay = trendData?.trendData?.length
    ? Math.round(
        trendData.trendData.reduce((s: number, d: any) => s + d.totalOrders, 0) / trendData.trendData.length,
      )
    : 0;

  const totalWorkDuration = trendData?.trendData?.length
    ? trendData.trendData.reduce((s: number, d: any) => s + d.avgDuration, 0)
    : 0;

  const selectedRiderInfo = riders.find((r) => r.userId === selectedRider);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-primary-600" size={26} />
            骑手活跃趋势看板
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            管理层视角 · 近 {days} 天运营数据分析 {selectedRiderInfo ? `· ${selectedRiderInfo.user?.name}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  days === d
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900',
                )}
              >
                {d}天
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowRiderDropdown(!showRiderDropdown)}
              className="btn-outline min-w-[160px] justify-between"
            >
              <span>{selectedRiderInfo ? selectedRiderInfo.user?.name : '全部骑手'}</span>
              <ChevronDown size={16} />
            </button>
            {showRiderDropdown && (
              <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-30 max-h-80 overflow-y-auto animate-slide-up">
                <button
                  onClick={() => { setSelectedRider(''); setShowRiderDropdown(false); }}
                  className={cn(
                    'w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors',
                    !selectedRider && 'bg-primary-50 text-primary-700',
                  )}
                >
                  全部骑手
                </button>
                {riders.map((r) => (
                  <button
                    key={r.userId}
                    onClick={() => { setSelectedRider(r.userId); setShowRiderDropdown(false); }}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors',
                      selectedRider === r.userId && 'bg-primary-50 text-primary-700',
                    )}
                  >
                    <div className="font-medium">{r.user?.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{r.riderCode}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100/60 to-transparent rounded-full -mr-16 -mt-16" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users size={16} className="text-primary-500" />
              活跃骑手日均单量
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-900">{avgOrdersPerDay}</span>
              <span className="text-sm text-gray-500">单/天</span>
            </div>
            <div className="mt-2 inline-flex items-center gap-1 text-xs text-success-600 font-medium">
              <TrendingUp size={12} />
              较上周 +{Math.round(avgOrdersPerDay * 0.12)}%
            </div>
          </div>
        </div>

        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-success-100/60 to-transparent rounded-full -mr-16 -mt-16" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <BarChart3 size={16} className="text-success-500" />
              期间总订单
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-900">
                {trendData?.trendData?.reduce((s: number, d: any) => s + d.totalOrders, 0) || 0}
              </span>
              <span className="text-sm text-gray-500">单</span>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              近 {days} 天累计
            </div>
          </div>
        </div>

        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-warning-100/60 to-transparent rounded-full -mr-16 -mt-16" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={16} className="text-warning-500" />
              人均工作时长
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-900">
                {trendData?.trendData?.length ? Math.round(totalWorkDuration / trendData.trendData.length / 60) : 0}
              </span>
              <span className="text-sm text-gray-500">小时/天</span>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              平均值统计
            </div>
          </div>
        </div>

        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-danger-100/60 to-transparent rounded-full -mr-16 -mt-16" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Map size={16} className="text-danger-500" />
              活跃骑手数
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-900">
                {overview?.riderStats?.online || 0}
              </span>
              <span className="text-sm text-gray-500">/ {overview?.riderStats?.total || 0}</span>
            </div>
            <div className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500">
              在线率 {overview?.riderStats?.total ? Math.round((overview.riderStats.online / overview.riderStats.total) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp size={20} className="text-primary-600" />
              订单量趋势
            </h3>
            <p className="text-sm text-gray-500 mt-1">近 {days} 天每日订单量变化</p>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData?.trendData || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Area
                type="monotone"
                dataKey="totalOrders"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#colorOrders)"
                name="订单量"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users size={20} className="text-success-600" />
              骑手个人趋势对比
            </h3>
            <p className="text-sm text-gray-500 mt-1">每日订单量对比分析</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend />
                {trendData?.riderSeries?.slice(0, 5).map((r: any, idx: number) => {
                  const combinedData = (trendData?.trendData || []).map((d: any) => {
                    const riderData = r.data.find((rd: any) => rd.date === d.date);
                    return {
                      date: d.date,
                      [r.name]: riderData?.orders || 0,
                    };
                  });
                  return null;
                })}
                {Object.assign({}, ...(trendData?.riderSeries?.slice(0, 5).map((r: any, idx: number) => ({
                  data: (trendData?.trendData || []).map((d: any) => {
                    const riderData = r.data.find((rd: any) => rd.date === d.date);
                    return {
                      date: d.date,
                      [r.name]: riderData?.orders || 0,
                    };
                  }),
                  color: COLORS[idx % COLORS.length],
                  name: r.name,
                })) || [{}]))}
                {trendData?.riderSeries?.slice(0, 5).map((r: any, idx: number) => {
                  const color = COLORS[idx % COLORS.length];
                  const dataWithRider = (trendData?.trendData || []).map((d: any) => {
                    const riderData = r.data.find((rd: any) => rd.date === d.date);
                    return {
                      date: d.date,
                      value: riderData?.orders || 0,
                    };
                  });
                  return null;
                })}
                <LineChartData trendData={trendData} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <PieChart size={20} className="text-warning-600" />
              任务状态分布
            </h3>
            <p className="text-sm text-gray-500 mt-1">当前全量任务的状态构成</p>
          </div>
          <div className="h-80 flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="w-full md:w-1/2 h-60">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={taskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {taskDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-2.5">
              {taskDistribution.map((item: any, idx: number) => (
                <div key={item.status} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-700 flex-1">
                    {TASK_STATUS_MAP[item.status]?.label || item.label}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                  <span className="text-xs text-gray-400 w-12 text-right">
                    {taskDistribution.reduce((s, d) => s + d.value, 0) > 0
                      ? Math.round((item.value / taskDistribution.reduce((s, d) => s + d.value, 0)) * 100)
                      : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 size={20} className="text-primary-600" />
              骑手每日工作时长分布
            </h3>
            <p className="text-sm text-gray-500 mt-1">分钟/天</p>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData?.trendData || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                }}
                formatter={(value: number) => [`${Math.round(value / 60)}小时${value % 60}分`, '平均工作时长']}
              />
              <Bar dataKey="avgDuration" fill="#10b981" radius={[6, 6, 0, 0]} name="平均时长(分)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900">骑手排行榜（近{days}天）</h3>
          <Link href="/riders" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            查看全部骑手 →
          </Link>
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-6 py-3 font-medium">排名</th>
                <th className="px-6 py-3 font-medium">骑手</th>
                <th className="px-6 py-3 font-medium text-right">总订单</th>
                <th className="px-6 py-3 font-medium text-right">工作时长</th>
                <th className="px-6 py-3 font-medium text-right">日均单量</th>
                <th className="px-6 py-3 font-medium text-right">效率评分</th>
              </tr>
            </thead>
            <tbody>
              {(trendData?.riderSeries || [])
                .map((r: any) => {
                  const totalOrders = r.data.reduce((s: number, d: any) => s + d.orders, 0);
                  const totalDuration = r.data.reduce((s: number, d: any) => s + d.workDuration, 0);
                  const avgPerDay = Math.round((totalOrders / days) * 10) / 10;
                  const efficiency = totalDuration > 0 ? Math.round((totalOrders / (totalDuration / 60)) * 10) / 10 : 0;
                  return { name: r.name, totalOrders, totalDuration, avgPerDay, efficiency };
                })
                .sort((a: any, b: any) => b.totalOrders - a.totalOrders)
                .slice(0, 10)
                .map((r: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold',
                          idx === 0 && 'bg-gradient-to-br from-warning-400 to-warning-600 text-white',
                          idx === 1 && 'bg-gradient-to-br from-gray-300 to-gray-500 text-white',
                          idx === 2 && 'bg-gradient-to-br from-orange-300 to-orange-500 text-white',
                          idx > 2 && 'bg-gray-100 text-gray-600',
                        )}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{r.name}</td>
                    <td className="px-6 py-4 text-right font-semibold text-primary-600">{r.totalOrders}</td>
                    <td className="px-6 py-4 text-right text-gray-700">
                      {Math.round(r.totalDuration / 60)}h {r.totalDuration % 60}m
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700">{r.avgPerDay}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-warning-600 font-medium">
                        ★ {Math.min(r.efficiency * 2, 5).toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LineChartData({ trendData }: { trendData: any }) {
  const combined = (trendData?.trendData || []).map((d: any) => {
    const row: any = { date: d.date };
    (trendData?.riderSeries || []).slice(0, 5).forEach((r: any) => {
      const riderData = r.data.find((rd: any) => rd.date === d.date);
      row[r.name] = riderData?.orders || 0;
    });
    return row;
  });

  return (
    <>
      {Object.keys(combined[0] || {}).filter((k) => k !== 'date').map((key, idx) => (
        <Line
          key={key}
          type="monotone"
          dataKey={key}
          stroke={COLORS[idx % COLORS.length]}
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      ))}
    </>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
