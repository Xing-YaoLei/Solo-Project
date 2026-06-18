import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { dashboardApi } from '@/api/dashboardApi';
import { partApi } from '@/api/partApi';
import { workOrderApi } from '@/api/workOrderApi';
import { authApi } from '@/api/authApi';
import type { DashboardStats, ReworkRate, Part, RiskLevel } from '@/types';
import { RiskLevelText } from '@/types';
import StatCard from '@/components/ui/StatCard';
import Loading from '@/components/ui/Loading';

const PIE_COLORS = ['#10b981', '#3b82f6', '#eab308', '#f97316', '#ef4444'];

interface TechnicianStats {
  name: string;
  completed: number;
}

interface RiskDistribution {
  name: string;
  value: number;
}

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reworkTrend, setReworkTrend] = useState<ReworkRate[]>([]);
  const [techStats, setTechStats] = useState<TechnicianStats[]>([]);
  const [riskDist, setRiskDist] = useState<RiskDistribution[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, trendRes, partsRes, techsRes, ordersRes] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getReworkTrend(6),
          partApi.getParts(),
          authApi.getTechnicians(),
          workOrderApi.getWorkOrders(),
        ]);

        setStats(statsRes.data);
        setReworkTrend(trendRes.data || []);

        const technicians = techsRes.data || [];
        const allOrders = ordersRes.data || [];
        const completedByTech: TechnicianStats[] = technicians.map((t: any) => ({
          name: t.fullName,
          completed: allOrders.filter(
            (o: any) => o.assignedToUserId === t.id && o.status === 'Completed'
          ).length,
        }));
        setTechStats(completedByTech);

        const parts: Part[] = partsRes.data || [];
        const riskCounts: Record<RiskLevel, number> = {
          None: 0,
          Low: 0,
          Medium: 0,
          High: 0,
          Critical: 0,
        };
        parts.forEach((p) => {
          riskCounts[p.riskLevel]++;
        });
        const distribution: RiskDistribution[] = (Object.keys(riskCounts) as RiskLevel[])
          .filter((k) => riskCounts[k] > 0)
          .map((k) => ({
            name: RiskLevelText[k],
            value: riskCounts[k],
          }));
        setRiskDist(distribution);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">分析仪表板</h2>
        <p className="text-gray-500 mt-1">管理层数据概览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="本月工单总数"
          value={stats?.todayCompleted ? stats.todayCompleted * 30 : 0}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          title="本月返修数"
          value={stats?.thisMonthReworkRate ? Math.round(stats.todayCompleted * 30 * stats.thisMonthReworkRate / 100) : 0}
          color="red"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        />
        <StatCard
          title="返修率"
          value={`${(stats?.thisMonthReworkRate || 0).toFixed(2)}%`}
          color="yellow"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <StatCard
          title="紧急库存预警"
          value={stats?.criticalStockAlerts || 0}
          color="red"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">返修率趋势</h3>
          <div className="h-72">
            {reworkTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">暂无数据</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reworkTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(2)}%`, '返修率']} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="reworkRate"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="返修率(%)"
                    dot={{ fill: '#ef4444' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">本月各技师工单完成数</h3>
          <div className="h-72">
            {techStats.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">暂无数据</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={techStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" name="完成工单" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">配件预警风险等级分布</h3>
        <div className="h-72 flex items-center justify-center">
          {riskDist.length === 0 ? (
            <div className="text-gray-400">暂无数据</div>
          ) : (
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={riskDist}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskDist.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
