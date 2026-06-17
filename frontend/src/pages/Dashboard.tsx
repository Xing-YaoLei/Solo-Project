import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Bed, HeartPulse, AlertTriangle, Users } from 'lucide-react';
import StatCard from '@/components/StatCard';
import ChartCard from '@/components/ChartCard';
import { dashboardApi } from '@/services/api';
import type { FunnelData, CoreMetrics, RiskEvent } from '@/types';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [metrics, setMetrics] = useState<CoreMetrics | null>(null);
  const [recentRisks, setRecentRisks] = useState<RiskEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [funnel, metricsData, risks] = await Promise.all([
          dashboardApi.getFunnel(),
          dashboardApi.getMetrics(),
          dashboardApi.getRecentRisks(8),
        ]);
        setFunnelData(funnel);
        setMetrics(metricsData);
        setRecentRisks(risks);
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const funnelOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    series: [
      {
        name: '床位排班漏斗',
        type: 'funnel',
        left: '10%',
        top: 40,
        bottom: 40,
        width: '80%',
        min: 0,
        max: funnelData.length > 0 ? funnelData[0].value : 100,
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 4,
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}\n{c}',
          fontSize: 13,
          color: '#fff',
        },
        labelLine: {
          length: 10,
          lineStyle: {
            width: 1,
            type: 'solid',
          },
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
        },
        emphasis: {
          label: {
            fontSize: 15,
          },
        },
        data: funnelData.map((item, index) => ({
          value: item.value,
          name: item.stage,
          itemStyle: {
            color: [
              '#0d9488',
              '#14b8a6',
              '#2dd4bf',
              '#5eead4',
            ][index % 4],
          },
        })),
      },
    ],
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-danger-100 text-danger-700';
      case 'medium':
        return 'bg-warning-100 text-warning-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'high':
        return '高风险';
      case 'medium':
        return '中风险';
      default:
        return '低风险';
    }
  };

  const getTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      fall: '跌倒',
      pressure_ulcer: '压疮',
      wandering: '走失',
      medication_error: '用药失误',
      other: '其他',
    };
    return typeMap[type] || type;
  };

  const handleRiskClick = (risk: RiskEvent) => {
    if (risk.type === 'fall') {
      navigate(`/review/fall/${risk.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="在床人数"
          value={metrics?.bedOccupancy || 0}
          unit="人"
          change={metrics?.bedOccupancyChange}
          icon={<Bed className="w-6 h-6" />}
          variant="primary"
        />
        <StatCard
          title="护理达标率"
          value={metrics?.careComplianceRate || 0}
          unit="%"
          change={metrics?.careComplianceChange}
          icon={<HeartPulse className="w-6 h-6" />}
          variant="primary"
        />
        <StatCard
          title="本周风险事件"
          value={metrics?.riskEventCount || 0}
          unit="起"
          change={metrics?.riskEventChange}
          changeUnit="起"
          icon={<AlertTriangle className="w-6 h-6" />}
          variant="danger"
        />
        <StatCard
          title="活动参与率"
          value={metrics?.activityParticipationRate || 0}
          unit="%"
          change={metrics?.activityChange}
          icon={<Users className="w-6 h-6" />}
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard
          title="床位排班漏斗"
          subtitle="从床位排班到风险预警的转化漏斗"
          className="lg:col-span-2"
        >
          <div className="h-80">
            <ReactECharts option={funnelOption} style={{ height: '100%' }} />
          </div>
        </ChartCard>

        <ChartCard title="最新风险事件" subtitle="点击可查看详情">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentRisks.map((risk) => (
              <div
                key={risk.id}
                onClick={() => handleRiskClick(risk)}
                className="p-3 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(
                          risk.level
                        )}`}
                      >
                        {getLevelText(risk.level)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {getTypeText(risk.type)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 mt-1.5 truncate">
                      {risk.residentName} · {risk.bedNo}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {risk.description}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">{risk.occurTime}</p>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
