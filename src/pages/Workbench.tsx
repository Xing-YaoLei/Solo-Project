import React, { useEffect, useState } from 'react';
import { Users, CheckCircle2, Clock, TrendingUp, AlertCircle, BookOpen, Target } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface StudentProgress {
  id: string;
  name: string;
  course: string;
  completion_rate: number;
  total_practice: number;
  last_practice: string;
  trend: 'up' | 'down' | 'stable';
  days_since_last_practice: number;
}

interface WorkbenchOverview {
  myStudents: number;
  myCompletionRate: number;
  avgPracticeCount: number;
  needAttention: number;
}

const Workbench: React.FC = () => {
  const { user } = useAuthStore();
  const [overview, setOverview] = useState<WorkbenchOverview | null>(null);
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const overviewData = await api.dashboard.getOverview();
      const overview = Array.isArray(overviewData) ? null : (overviewData.data || overviewData);
      setOverview({
        myStudents: overview?.totalStudents || 15,
        myCompletionRate: overview?.totalCompletionRate || 68.5,
        avgPracticeCount: overview?.avgPracticeDuration || 120,
        needAttention: 3,
      });
      
      const trendData = await api.dashboard.getTrend(30);
      const mockStudents: StudentProgress[] = [
        { id: '1', name: '王同学', course: 'Java高级开发', completion_rate: 89.5, total_practice: 456, last_practice: '2024-01-15', trend: 'up', days_since_last_practice: 0 },
        { id: '2', name: '李同学', course: 'Java高级开发', completion_rate: 76.2, total_practice: 342, last_practice: '2024-01-15', trend: 'up', days_since_last_practice: 0 },
        { id: '3', name: '张同学', course: '前端全栈开发', completion_rate: 65.8, total_practice: 256, last_practice: '2024-01-14', trend: 'stable', days_since_last_practice: 1 },
        { id: '4', name: '赵同学', course: 'Java高级开发', completion_rate: 52.3, total_practice: 189, last_practice: '2024-01-12', trend: 'down', days_since_last_practice: 3 },
        { id: '5', name: '陈同学', course: '前端全栈开发', completion_rate: 81.7, total_practice: 398, last_practice: '2024-01-15', trend: 'up', days_since_last_practice: 0 },
        { id: '6', name: '刘同学', course: 'Python数据分析', completion_rate: 45.6, total_practice: 134, last_practice: '2024-01-10', trend: 'down', days_since_last_practice: 5 },
        { id: '7', name: '周同学', course: 'Python数据分析', completion_rate: 72.1, total_practice: 287, last_practice: '2024-01-14', trend: 'up', days_since_last_practice: 1 },
        { id: '8', name: '吴同学', course: 'Java高级开发', completion_rate: 38.9, total_practice: 98, last_practice: '2024-01-08', trend: 'down', days_since_last_practice: 7 },
      ];
      setStudents(mockStudents);
    } catch (error) {
      console.error('Failed to fetch workbench data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const statCards = [
    {
      title: '我的学员',
      value: overview?.myStudents || 0,
      icon: Users,
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
      iconBg: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
    },
    {
      title: '我的完成率',
      value: overview?.myCompletionRate?.toFixed(1) || '0',
      suffix: '%',
      icon: CheckCircle2,
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
      iconBg: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    },
    {
      title: '平均练习次数',
      value: overview?.avgPracticeCount || 0,
      icon: BookOpen,
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
      iconBg: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    },
    {
      title: '需关注学员',
      value: overview?.needAttention || 0,
      icon: AlertCircle,
      gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
      iconBg: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
    },
  ];

  const getTrendConfig = (trend: string) => {
    const configs: Record<string, { label: string; icon: any; color: string }> = {
      up: { label: '上升', icon: TrendingUp, color: 'text-green-400' },
      down: { label: '下降', icon: TrendingUp, color: 'text-red-400' },
      stable: { label: '平稳', icon: Target, color: 'text-yellow-400' },
    };
    return configs[trend] || configs.stable;
  };

  const getStatusBadge = (completion: number, daysInactive: number) => {
    if (daysInactive >= 7) {
      return { label: '学习停滞', color: 'bg-red-500/20 text-red-400' };
    }
    if (completion < 50) {
      return { label: '进度落后', color: 'bg-orange-500/20 text-orange-400' };
    }
    if (completion >= 80) {
      return { label: '进度优秀', color: 'bg-green-500/20 text-green-400' };
    }
    return { label: '进度正常', color: 'bg-blue-500/20 text-blue-400' };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">个人工作台</h1>
          <p className="text-dark-400 text-sm">欢迎回来，{user?.name}，查看您负责学员的学习情况</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-stagger">
        {statCards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>

      <div className="card-gradient p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users size={20} className="text-primary-400" />
          我的学员列表
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700/50">
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">学员姓名</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">所属课程</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">完成率</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">练习次数</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">上次练习</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">趋势</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">状态</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const trendConfig = getTrendConfig(student.trend);
                const statusBadge = getStatusBadge(student.completion_rate, student.days_since_last_practice);
                const TrendIcon = trendConfig.icon;
                return (
                  <tr key={student.id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">{student.name.charAt(0)}</span>
                        </div>
                        <span className="text-white font-medium">{student.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-dark-300">{student.course}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-dark-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              student.completion_rate >= 80 ? 'bg-green-500' :
                              student.completion_rate >= 50 ? 'bg-blue-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${student.completion_rate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-white">{student.completion_rate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-white">{student.total_practice}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-dark-300">{student.last_practice}</span>
                        <span className="text-xs text-dark-500">
                          {student.days_since_last_practice === 0 ? '今天' : `${student.days_since_last_practice}天前`}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-sm ${trendConfig.color}`}>
                        <TrendIcon size={14} className={student.trend === 'down' ? 'rotate-180' : ''} />
                        {trendConfig.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-gradient p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-orange-400" />
            需要关注的学员
          </h3>
          <div className="space-y-3">
            {students.filter(s => s.completion_rate < 50 || s.days_since_last_practice >= 3).map((student) => (
              <div key={student.id} className="p-4 bg-dark-800/40 rounded-xl border border-dark-700/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{student.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{student.name}</p>
                      <p className="text-xs text-dark-400">{student.course}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-full">
                    {student.days_since_last_practice >= 7 ? '学习停滞' : '进度落后'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-dark-400">完成率: </span>
                    <span className="text-white font-medium">{student.completion_rate.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-dark-400">未练习: </span>
                    <span className="text-white font-medium">{student.days_since_last_practice}天</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-gradient p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target size={20} className="text-green-400" />
            今日工作提醒
          </h3>
          <div className="space-y-3">
            <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">待批改作业</p>
                  <p className="text-sm text-dark-300 mt-0.5">有 5 份作业等待您的批改</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Clock size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">今日直播课</p>
                  <p className="text-sm text-dark-300 mt-0.5">今晚 19:00-21:00 Java高级开发直播</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <AlertCircle size={20} className="text-yellow-400" />
                </div>
                <div>
                  <p className="text-white font-medium">学员回访</p>
                  <p className="text-sm text-dark-300 mt-0.5">有 3 名学员需要进行学习情况回访</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workbench;
