import React, { useEffect, useState } from 'react';
import { Users, CheckCircle2, Clock, Activity } from 'lucide-react';
import StatCard from '@/components/StatCard';
import TrendChart from '@/components/charts/TrendChart';
import { api } from '@/services/api';

interface OverviewData {
  totalStudents: number;
  totalCompletionRate: number;
  avgPracticeDuration: number;
  todayActiveUsers: number;
  completionRateChange: number;
  practiceCountChange: number;
}

interface TrendData {
  date: string;
  completionRate: number;
  practiceCount: number;
}

const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewData, trendResponse] = await Promise.all([
        api.dashboard.getOverview(),
        api.dashboard.getTrend(timeRange),
      ]);
      setOverview(overviewData);
      setTrendData(Array.isArray(trendResponse) ? trendResponse : trendResponse.data || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setOverview({
          totalStudents: 50,
          totalCompletionRate: 72.5,
          avgPracticeDuration: 145,
          todayActiveUsers: 28,
          completionRateChange: 2.3,
          practiceCountChange: 15.6,
        });
        const mockTrend: TrendData[] = [];
        const today = new Date();
        for (let i = timeRange - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          mockTrend.push({
            date: date.toISOString().split('T')[0],
            completionRate: Math.round(65 + Math.random() * 25),
            practiceCount: Math.round(80 + Math.random() * 120),
          });
        }
        setTrendData(mockTrend);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const statCards = [
    {
      title: '总学员数',
      value: overview?.totalStudents || 0,
      icon: Users,
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
      iconBg: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
    },
    {
      title: '总完成率',
      value: overview?.totalCompletionRate?.toFixed(1) || '0',
      change: overview?.completionRateChange,
      suffix: '%',
      icon: CheckCircle2,
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
      iconBg: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    },
    {
      title: '平均练习时长',
      value: formatDuration(overview?.avgPracticeDuration || 0),
      change: overview?.practiceCountChange,
      changeLabel: '练习次数变化',
      icon: Clock,
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
      iconBg: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    },
    {
      title: '今日活跃用户',
      value: overview?.todayActiveUsers || 0,
      icon: Activity,
      gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
      iconBg: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">数据总览</h1>
          <p className="text-dark-400 text-sm">实时追踪题库练习关键指标</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 14, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 text-sm rounded-lg transition-all ${
                timeRange === days
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-800/60 text-dark-300 hover:bg-dark-700/60'
              }`}
            >
              {days}天
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-stagger">
        {statCards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>

      <div className="card-gradient p-6">
        <TrendChart data={trendData} title={`近${timeRange}天完成率与练习次数趋势`} />
      </div>
    </div>
  );
};

export default Dashboard;
