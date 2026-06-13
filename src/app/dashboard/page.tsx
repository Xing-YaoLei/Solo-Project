'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/Layout/AppLayout';
import MetricCard from '@/components/Charts/MetricCard';
import FunnelChart from '@/components/Charts/FunnelChart';
import TechnicianRank from '@/components/Technician/TechnicianRank';
import {
  DollarSign,
  ClipboardList,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import {
  DashboardMetrics,
  FunnelData,
  TechnicianRank as TechnicianRankType,
} from '@/types';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianRankType[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, funnelRes, techRes] = await Promise.all([
          fetch('/api/dashboard/metrics'),
          fetch('/api/dashboard/funnel'),
          fetch('/api/dashboard/technicians'),
        ]);

        const metricsData = await metricsRes.json();
        const funnelData = await funnelRes.json();
        const techData = await techRes.json();

        setMetrics(metricsData);
        setFunnelData(funnelData);
        setTechnicians(techData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-dark-800 mb-2">
            数据总览
          </h1>
          <p className="text-dark-500">实时追踪门店运营状况与员工绩效</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics && (
            <>
              <MetricCard
                title="今日营收"
                value={metrics.todayRevenue}
                format="currency"
                icon={DollarSign}
                trend={metrics.yoyGrowth}
                trendLabel="较昨日同比增长"
                delay={0}
              />
              <MetricCard
                title="服务人次"
                value={metrics.todayOrders}
                format="number"
                icon={ClipboardList}
                trend={0.05}
                trendLabel="较昨日"
                delay={100}
              />
              <MetricCard
                title="客单价"
                value={metrics.avgOrderValue}
                format="currency"
                icon={TrendingUp}
                trend={0.08}
                trendLabel="较上周"
                delay={200}
              />
              <MetricCard
                title="完成率"
                value={metrics.completionRate}
                format="percent"
                icon={CheckCircle2}
                trend={0.03}
                trendLabel="较昨日"
                delay={300}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {funnelData.length > 0 && (
            <FunnelChart data={funnelData} title="手牌转化漏斗" />
          )}
          {technicians.length > 0 && (
            <TechnicianRank data={technicians} />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
