import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { getDashboardStats } from '@/api/admin';
import type { DashboardStats } from '@/types';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('获取统计数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats
    ? [
        {
          label: '总工单数',
          value: stats.total_orders,
          icon: ClipboardList,
          color: 'bg-blue-500',
          bgColor: 'bg-blue-50',
        },
        {
          label: '待处理',
          value: stats.pending_orders,
          icon: Clock,
          color: 'bg-yellow-500',
          bgColor: 'bg-yellow-50',
        },
        {
          label: '处理中',
          value: stats.in_progress_orders,
          icon: BarChart3,
          color: 'bg-indigo-500',
          bgColor: 'bg-indigo-50',
        },
        {
          label: '已完成',
          value: stats.completed_orders,
          icon: CheckCircle2,
          color: 'bg-green-500',
          bgColor: 'bg-green-50',
        },
        {
          label: '复核不通过',
          value: stats.review_failed_orders,
          icon: XCircle,
          color: 'bg-red-500',
          bgColor: 'bg-red-50',
        },
        {
          label: '首次解决率',
          value: `${stats.first_time_resolve_rate}%`,
          icon: TrendingUp,
          color: 'bg-purple-500',
          bgColor: 'bg-purple-50',
        },
      ]
    : [];

  const trendData = stats?.first_time_resolve_trend || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据看板</h1>
          <p className="text-sm text-gray-500 mt-1">工单运营数据概览</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新数据
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-4">加载中...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                className={`${card.bgColor} rounded-xl p-5 border border-gray-100`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}
                  >
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                首次解决率趋势
              </h3>
              <div className="h-80">
                {trendData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    暂无数据
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: '#9ca3af' }}
                        tickFormatter={(value) =>
                          value.slice(5)
                        }
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#9ca3af' }}
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${value}%`, '首次解决率']}
                        labelFormatter={(label) => `日期: ${label}`}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        name="首次解决率"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                每日工单量 & 首次解决数
              </h3>
              <div className="h-80">
                {trendData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    暂无数据
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: '#9ca3af' }}
                        tickFormatter={(value) =>
                          value.slice(5)
                        }
                      />
                      <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
                      <Tooltip
                        labelFormatter={(label) => `日期: ${label}`}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="total"
                        name="总工单量"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="first_time_resolved"
                        name="首次解决数"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                快速概览
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">工单总数</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {stats?.total_orders || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: stats?.total_orders
                        ? `${Math.min(100, (stats.completed_orders / stats.total_orders) * 100)}%`
                        : '0%',
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  已完成 {stats?.completed_orders || 0} / {stats?.total_orders || 0}
                </p>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">首次解决率</span>
                    <span
                      className={`text-lg font-semibold ${
                        (stats?.first_time_resolve_rate || 0) >= 80
                          ? 'text-green-600'
                          : 'text-orange-600'
                      }`}
                    >
                      {stats?.first_time_resolve_rate || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (stats?.first_time_resolve_rate || 0) >= 80
                          ? 'bg-green-500'
                          : 'bg-orange-500'
                      }`}
                      style={{ width: `${stats?.first_time_resolve_rate || 0}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">复核不通过</span>
                    <span className="text-lg font-semibold text-red-600">
                      {stats?.review_failed_orders || 0}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    需要重新处理的工单数量
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                系统说明
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  <strong className="text-gray-900">工单流程：</strong>
                  新建工单 → 派工 → 处理中 → 待复核 → 复核通过/不通过 → 结案/重新处理
                </p>
                <p>
                  <strong className="text-gray-900">首次解决率：</strong>
                  衡量一次性解决问题的能力，即无需返工即可通过复核的工单占比
                </p>
                <p>
                  <strong className="text-gray-900">优先级：</strong>
                  紧急 (4小时) / 高 (4小时) / 中 (24小时) / 低 (72小时)
                </p>
                <p>
                  <strong className="text-gray-900">复核不通过：</strong>
                  工单在列表中以红色边框突出显示，需重新处理后再次提交复核
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
