import { useEffect, useState } from 'react';
import {
  LogOut,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import ChartCard from '../components/ChartCard';
import MeterReadingChart from '../components/charts/MeterReadingChart';
import InspectionPieChart from '../components/charts/InspectionPieChart';
import { api } from '../utils/api';
import { useCurrentRole, useCurrentArea } from '../store';
import type {
  DashboardMetrics,
  MeterReading,
  InspectionItem,
} from '../../shared/types';

export default function Dashboard() {
  const role = useCurrentRole();
  const area = useCurrentArea();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>([]);
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsData, meterData, inspectionData] = await Promise.all([
        api.getMetrics(role, area),
        api.getMeterReadings(undefined, 6, role, area),
        api.getInspectionItems(role, area),
      ]);
      setMetrics(metricsData);
      setMeterReadings(meterData);
      setInspectionItems(inspectionData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, area]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">仪表盘概览</h1>
          <p className="text-sm text-slate-500 mt-1">
            实时监控退租验房核心指标
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="退租率"
          value={metrics?.moveOutRate.toFixed(1) || '0'}
          unit="%"
          change={0.8}
          changeType="increase"
          icon={<LogOut className="w-6 h-6" />}
          gradient="linear-gradient(135deg, #6366F1, #8B5CF6)"
          updateTime={metrics?.updateTime}
        />
        <MetricCard
          title="验房通过率"
          value={metrics?.inspectionPassRate.toFixed(1) || '0'}
          unit="%"
          change={2.3}
          changeType="decrease"
          icon={<CheckCircle2 className="w-6 h-6" />}
          gradient="linear-gradient(135deg, #10B981, #059669)"
          updateTime={metrics?.updateTime}
        />
        <MetricCard
          title="平均维修时长"
          value={metrics?.avgRepairDuration.toFixed(1) || '0'}
          unit="天"
          change={0.5}
          changeType="decrease"
          icon={<Clock className="w-6 h-6" />}
          gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)"
          updateTime={metrics?.updateTime}
        />
        <MetricCard
          title="投诉率"
          value={metrics?.complaintRate.toFixed(1) || '0'}
          unit="%"
          change={1.2}
          changeType="increase"
          icon={<AlertTriangle className="w-6 h-6" />}
          gradient="linear-gradient(135deg, #F97316, #EA580C)"
          updateTime={metrics?.updateTime}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="水电读数趋势"
          subtitle="近6个月退租房源水电使用情况"
          updateTime={meterReadings[0]?.updateTime}
          onRefresh={loadData}
          isLoading={loading}
          className="lg:col-span-2"
        >
          <MeterReadingChart data={meterReadings} height="380px" />
        </ChartCard>

        <ChartCard
          title="验房清单构成"
          subtitle="按类别统计验房问题分布"
          updateTime={inspectionItems[0]?.updateTime}
          onRefresh={loadData}
          isLoading={loading}
        >
          <InspectionPieChart data={inspectionItems} height="350px" />
        </ChartCard>

        <ChartCard
          title="验房问题明细"
          subtitle="高风险问题优先级处理"
          updateTime={inspectionItems[0]?.updateTime}
        >
          <div className="space-y-3 max-h-[350px] overflow-y-auto">
            {inspectionItems
              .filter((item) => item.severity === 'high' || item.severity === 'medium')
              .sort((a, b) => {
                const severityOrder = { high: 0, medium: 1, low: 2 };
                return severityOrder[a.severity] - severityOrder[b.severity];
              })
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-md ${
                        item.severity === 'high'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {item.severity === 'high' ? '高风险' : '中风险'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {item.itemName}
                      </p>
                      <p className="text-xs text-slate-500">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.count} 起
                    </p>
                    <p className="text-xs text-slate-500">
                      占比 {item.percentage}%
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
