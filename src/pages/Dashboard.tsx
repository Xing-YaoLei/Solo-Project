import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, TrendingUp, Users, CheckCircle, BarChart3, Zap, PhoneCall } from 'lucide-react';
import KPICard from '../components/KPICard';
import { StatusBadge, SeverityBadge } from '../components/StatusBadge';
import TrendChart from '../components/Charts/TrendChart';
import HeatmapChart from '../components/Charts/HeatmapChart';
import EscalationChart from '../components/Charts/EscalationChart';
import PieChart from '../components/Charts/PieChart';
import { getKPI, getTrend, getHeatmap, getOverdueWarning, getEscalationTimeline, getResponsibility, getCategory, getCallbackStats } from '../services/api';
import type { KPIData, TrendData, HeatmapData, OverdueWarning, EscalationTimelineData, PieDataItem, Complaint } from '../types';
import { useStore } from '../store/useStore';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { filters } = useStore();
  const [kpi, setKPI] = useState<KPIData | null>(null);
  const [trend, setTrend] = useState<TrendData | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [overdueList, setOverdueList] = useState<OverdueWarning[]>([]);
  const [escalationTimeline, setEscalationTimeline] = useState<EscalationTimelineData | null>(null);
  const [responsibilityData, setResponsibilityData] = useState<PieDataItem[]>([]);
  const [categoryData, setCategoryData] = useState<PieDataItem[]>([]);
  const [callbackData, setCallbackData] = useState<PieDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [kpiRes, trendRes, heatmapRes, overdueRes, escalationRes, respRes, catRes, callbackRes] = await Promise.all([
        getKPI(filters),
        getTrend({ period, region: filters.region }),
        getHeatmap(filters),
        getOverdueWarning(filters),
        getEscalationTimeline({ days: parseInt(period), region: filters.region }),
        getResponsibility(filters),
        getCategory(filters),
        getCallbackStats(filters),
      ]);
      setKPI(kpiRes);
      setTrend(trendRes);
      setHeatmap(heatmapRes);
      setOverdueList(overdueRes);
      setEscalationTimeline(escalationRes);
      setResponsibilityData(respRes);
      setCategoryData(catRes);
      setCallbackData(callbackRes.map(c => ({ name: c.result === 'satisfied' ? '满意' : c.result === 'unsatisfied' ? '不满意' : '待回访', value: c.count })));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !kpi) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl animate-pulse">加载中...</div>
      </div>
    );
  }

  const handleOverdueClick = (id: string) => {
    navigate(`/complaints?id=${id}`);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">风险监测总览</h1>
          <p className="text-gray-400">实时监控旅游民宿客诉处理风险变化</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              {p === '7d' ? '近7天' : p === '30d' ? '近30天' : '近90天'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<AlertTriangle className="w-6 h-6" />}
          label="客诉总数"
          value={kpi?.totalComplaints || 0}
          change={kpi?.totalComplaintsYoY || 0}
          changeLabel="同比"
          color="warning"
          loading={loading}
        />
        <KPICard
          icon={<Zap className="w-6 h-6" />}
          label="超时未处理"
          value={kpi?.overdueCount || 0}
          change={kpi?.overdueCountYoY || 0}
          changeLabel="同比"
          color="danger"
          loading={loading}
        />
        <KPICard
          icon={<TrendingUp className="w-6 h-6" />}
          label="升级处理"
          value={kpi?.escalatedCount || 0}
          change={kpi?.escalatedCountYoY || 0}
          changeLabel="同比"
          color="warning"
          loading={loading}
        />
        <KPICard
          icon={<Clock className="w-6 h-6" />}
          label="平均处理时长(分钟)"
          value={kpi?.avgProcessingTime || 0}
          change={kpi?.avgProcessingTimeYoY || 0}
          changeLabel="同比"
          color="info"
          loading={loading}
        />
        <KPICard
          icon={<CheckCircle className="w-6 h-6" />}
          label="已解决"
          value={kpi?.resolvedCount || 0}
          change={12}
          changeLabel="同比"
          color="success"
          loading={loading}
        />
        <KPICard
          icon={<Users className="w-6 h-6" />}
          label="今日新增"
          value={kpi?.newToday || 0}
          change={8}
          changeLabel="较昨日"
          color="info"
          loading={loading}
        />
        <KPICard
          icon={<PhoneCall className="w-6 h-6" />}
          label="客户满意度"
          value={`${kpi?.satisfactionRate || 0}%`}
          change={kpi?.satisfactionRateYoY || 0}
          changeLabel="同比"
          color="success"
          loading={loading}
        />
        <KPICard
          icon={<BarChart3 className="w-6 h-6" />}
          label="关闭率"
          value={`${kpi?.resolvedCount && kpi?.totalComplaints ? Math.round((kpi.resolvedCount / kpi.totalComplaints) * 100) : 0}%`}
          change={5}
          changeLabel="同比"
          color="info"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">客诉趋势分析</h3>
          {trend && <TrendChart data={trend} height={350} />}
        </div>

        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">超时预警列表</h3>
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
            {overdueList.length === 0 ? (
              <div className="text-gray-400 text-center py-8">暂无超时预警</div>
            ) : (
              overdueList.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleOverdueClick(item.id)}
                  className="bg-danger-500/10 border border-danger-500/30 rounded-lg p-3 cursor-pointer hover:bg-danger-500/20 transition-all animate-pulse"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={item.severity} />
                      <span className="text-sm text-white">{item.category}</span>
                    </div>
                    <StatusBadge status={item.status as Complaint['status']} />
                  </div>
                  <p className="text-xs text-gray-400 mb-1">{item.property_name}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{new Date(item.created_at).toLocaleString('zh-CN')}</span>
                    <span className="text-danger-400 font-medium">已超时 {Math.max(0, item.processing_time - item.target_time)} 分钟</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">处理时效热力图</h3>
          {heatmap && <HeatmapChart data={heatmap} height={300} />}
        </div>

        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">升级记录时序</h3>
          {escalationTimeline && <EscalationChart data={escalationTimeline} height={300} />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">责任归属分布</h3>
          <PieChart data={responsibilityData} height={250} />
        </div>

        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">投诉类型分布</h3>
          <PieChart data={categoryData} height={250} />
        </div>

        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">回访结果分布</h3>
          <PieChart data={callbackData} height={250} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
