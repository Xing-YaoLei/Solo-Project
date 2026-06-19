import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Calendar,
  Users,
  Sparkles,
  FileText,
  Wallet,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Home,
  DoorOpen,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import api from '@/lib/api';
import { cn, formatDate, getRiskLevelClass, getRiskLevelText } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

interface OverviewData {
  totalProperties: number;
  totalRooms: number;
  todayArrivals: number;
  todayDepartures: number;
  inHouseGuests: number;
  occupancyRate: number;
  pendingCleaning: number;
  pendingConflicts: number;
  highRiskConflicts: number;
  pendingDocuments: number;
}

interface TaskItem {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  priority: string;
  riskLevel?: string;
}

interface CalendarDay {
  date: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';
  roomNumber?: string;
}

interface HighRiskConflict {
  id: number;
  room: { roomNumber: string; property: { name: string } };
  conflictType: string;
  description: string;
  riskLevel: 'HIGH' | 'CRITICAL' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
  createdBy?: { fullName: string };
  createdAt: string;
  communications: { id: number }[];
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'OCCUPIED':
      return 'bg-blue-500';
    case 'CLEANING':
      return 'bg-yellow-400';
    case 'MAINTENANCE':
      return 'bg-gray-400';
    default:
      return 'bg-green-500';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'OCCUPIED':
      return '占用';
    case 'CLEANING':
      return '清洁';
    case 'MAINTENANCE':
      return '维护';
    default:
      return '可用';
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [todayTasks, setTodayTasks] = useState<{ total: number; tasks: TaskItem[] }>({ total: 0, tasks: [] });
  const [highRiskConflicts, setHighRiskConflicts] = useState<HighRiskConflict[]>([]);
  const [calendarData, setCalendarData] = useState<{ date: string; status: string }[][]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [overviewRes, tasksRes, conflictsRes, propertiesRes] = await Promise.all([
        api.get('/dashboard/overview'),
        api.get('/dashboard/today-tasks'),
        api.get('/conflicts/high-risk'),
        api.get('/properties'),
      ]);
      setOverview(overviewRes.data);
      setTodayTasks(tasksRes.data);
      setHighRiskConflicts(conflictsRes.data || []);

      if (propertiesRes.data && propertiesRes.data.length > 0) {
        const propertyId = propertiesRes.data[0].id;
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        try {
          const calendarRes = await api.get(`/calendar/property/${propertyId}?year=${year}&month=${month}`);
          setCalendarData(calendarRes.data?.matrix || []);
        } catch (e) {
          // ignore calendar error
        }
      }
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() - 1);
    setCurrentMonth(d);
  };

  const nextMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + 1);
    setCurrentMonth(d);
  };

  const statCards = overview
    ? [
        {
          label: '今日入住',
          value: overview.todayArrivals,
          icon: LogIn,
          color: 'text-green-600 bg-green-50',
          path: '/orders?status=CONFIRMED',
        },
        {
          label: '今日退房',
          value: overview.todayDepartures,
          icon: LogOut,
          color: 'text-orange-600 bg-orange-50',
          path: '/orders?status=CHECKED_IN',
        },
        {
          label: '在住客人',
          value: overview.inHouseGuests,
          icon: Users,
          color: 'text-blue-600 bg-blue-50',
          path: '/orders?status=CHECKED_IN',
        },
        {
          label: '入住率',
          value: `${overview.occupancyRate}%`,
          icon: TrendingUp,
          color: 'text-purple-600 bg-purple-50',
          path: '/reports',
        },
        {
          label: '待清洁房间',
          value: overview.pendingCleaning,
          icon: Sparkles,
          color: 'text-yellow-600 bg-yellow-50',
          path: '/cleaning?status=PENDING',
        },
        {
          label: '待审证件',
          value: overview.pendingDocuments,
          icon: FileText,
          color: 'text-indigo-600 bg-indigo-50',
          path: '/documents?status=PENDING',
        },
        {
          label: '待处理冲突',
          value: overview.pendingConflicts,
          icon: AlertTriangle,
          color: 'text-red-600 bg-red-50',
          badge: overview.highRiskConflicts > 0 ? `${overview.highRiskConflicts}个高风险` : null,
          path: '/conflicts?status=OPEN',
        },
        {
          label: '总房间数',
          value: overview.totalRooms,
          icon: DoorOpen,
          color: 'text-gray-600 bg-gray-50',
          path: '/properties',
        },
      ]
    : [];

  const workflowSteps = [
    {
      title: '房源日历',
      description: '查看和管理房态',
      icon: Calendar,
      path: '/calendar',
      count: overview?.totalRooms || 0,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: '渠道订单',
      description: '核对订单信息',
      icon: Users,
      path: '/orders',
      count: overview?.todayArrivals || 0,
      color: 'from-green-500 to-green-600',
    },
    {
      title: '保洁任务',
      description: '安排清洁工作',
      icon: Sparkles,
      path: '/cleaning',
      count: overview?.pendingCleaning || 0,
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      title: '入住证件',
      description: '证件审核追踪',
      icon: FileText,
      path: '/documents',
      count: overview?.pendingDocuments || 0,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: '押金明细',
      description: '押金收支管理',
      icon: Wallet,
      path: '/deposits',
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      title: '房态冲突',
      description: '异常处理',
      icon: AlertTriangle,
      path: '/conflicts',
      count: overview?.highRiskConflicts || 0,
      highlight: (overview?.highRiskConflicts || 0) > 0,
      color: 'from-red-500 to-red-600',
    },
  ];

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'arrival':
        return <LogIn className="w-5 h-5 text-green-600" />;
      case 'departure':
        return <LogOut className="w-5 h-5 text-orange-600" />;
      case 'cleaning':
        return <Sparkles className="w-5 h-5 text-yellow-600" />;
      case 'conflict':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Calendar className="w-5 h-5 text-blue-600" />;
    }
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const displayMonth = currentMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
  const todayStr = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            欢迎回来，{user?.fullName}
          </h1>
          <p className="text-gray-500 mt-1">
            今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.slice(0, 4).map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              onClick={() => router.push(card.path)}
              className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {card.value}
                  </p>
                </div>
                <div className={cn('p-2 rounded-lg', card.color)}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          日常处理流程
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                onClick={() => router.push(step.path)}
                className={cn(
                  'relative p-4 rounded-lg cursor-pointer transition-all hover:shadow-md border-2',
                  step.highlight
                    ? 'border-red-400 bg-red-50'
                    : 'border-transparent bg-gray-50 hover:border-primary-200'
                )}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center text-white mb-3',
                    step.color
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-gray-800">{step.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                {(step.count ?? 0) > 0 && (
                  <span
                    className={cn(
                      'absolute top-2 right-2 px-2 py-0.5 text-xs font-medium rounded-full',
                      step.highlight
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-primary-100 text-primary-700'
                    )}
                  >
                    {step.count}
                  </span>
                )}
                <div className="mt-3 flex items-center text-xs text-primary-600">
                  <span>进入处理</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">房源日历概览</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevMonth}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-[100px] text-center">
                  {displayMonth}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="mb-3 flex items-center gap-4 text-xs text-gray-500 flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>可用</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>占用</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-400" />
                <span>清洁</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-gray-400" />
                <span>维护</span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekDays.map((d) => (
                <div key={d} className="text-xs text-center text-gray-500 py-1">
                  {d}
                </div>
              ))}
            </div>

            {calendarData.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                暂无日历数据
              </div>
            ) : (
              <div className="space-y-1">
                {calendarData.map((row: any[], rowIdx: number) => (
                  <div key={rowIdx} className="grid grid-cols-7 gap-1">
                    {row.map((cell: any, cellIdx: number) => {
                      if (!cell) {
                        return <div key={cellIdx} className="aspect-square" />;
                      }
                      const isToday = cell.date === todayStr;
                      return (
                        <div
                          key={cellIdx}
                          className={cn(
                            'aspect-square rounded flex items-center justify-center text-xs relative',
                            getStatusClass(cell.status),
                            'text-white font-medium',
                            isToday && 'ring-2 ring-offset-1 ring-primary-500'
                          )}
                          title={`${cell.date} ${getStatusText(cell.status)}`}
                        >
                          {parseInt(cell.date.split('-')[2])}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => router.push('/calendar')}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
              >
                查看完整日历 <ArrowRight className="w-3 h-3 ml-1" />
              </button>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                今日待办任务
              </h2>
              <span className="text-sm text-gray-500">
                共 {todayTasks.total} 项
              </span>
            </div>
            <div className="space-y-3">
              {todayTasks.tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  暂无待办任务
                </div>
              ) : (
                todayTasks.tasks.map((task: TaskItem) => (
                  <div
                    key={task.id}
                    className={cn(
                      'flex items-center gap-4 p-3 rounded-lg border transition-colors',
                      task.riskLevel
                        ? getRiskLevelClass(task.riskLevel)
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getTaskIcon(task.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">
                          {task.title}
                        </span>
                        {task.riskLevel && (
                          <span className="text-xs font-medium text-red-700">
                            {getRiskLevelText(task.riskLevel)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {task.description}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (task.type === 'conflict') {
                          router.push(`/conflicts`);
                        } else if (task.type === 'cleaning') {
                          router.push('/cleaning');
                        } else {
                          router.push('/orders');
                        }
                      }}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      处理
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  highRiskConflicts.length > 0 ? 'bg-red-100' : 'bg-gray-100'
                )}>
                  <AlertTriangle className={cn(
                    'w-5 h-5',
                    highRiskConflicts.length > 0 ? 'text-red-600' : 'text-gray-500'
                  )} />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">高风险冲突</h2>
              </div>
              {highRiskConflicts.length > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full animate-pulse">
                  {highRiskConflicts.length}
                </span>
              )}
            </div>

            {highRiskConflicts.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">暂无高风险冲突</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {highRiskConflicts.map((conflict) => (
                  <div
                    key={conflict.id}
                    onClick={() => router.push(`/conflicts`)}
                    className={cn(
                      'p-3 rounded-lg cursor-pointer transition-all border',
                      getRiskLevelClass(conflict.riskLevel)
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-gray-800 text-sm">
                        {conflict.room?.property?.name} · {conflict.room?.roomNumber}
                      </span>
                      <span className="text-xs font-bold text-red-700">
                        {getRiskLevelText(conflict.riskLevel)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {conflict.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDate(conflict.createdAt)}</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {conflict.communications?.length || 0} 条沟通
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {highRiskConflicts.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => router.push('/conflicts')}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                >
                  查看全部冲突 <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              快速统计
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">总房源数</span>
                <span className="font-semibold text-gray-900">
                  {overview?.totalProperties || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">总房间数</span>
                <span className="font-semibold text-gray-900">
                  {overview?.totalRooms || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">入住率</span>
                <span className="font-semibold text-green-600">
                  {overview?.occupancyRate || 0}%
                </span>
              </div>
              <div className="h-px bg-gray-200" />
              <div className="flex items-center justify-between">
                <span className="text-gray-600">待处理冲突</span>
                <span className="font-semibold text-red-600">
                  {overview?.pendingConflicts || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">高风险冲突</span>
                <span className={cn(
                  'font-semibold',
                  (overview?.highRiskConflicts || 0) > 0 ? 'text-red-600 animate-pulse' : 'text-gray-500'
                )}>
                  {overview?.highRiskConflicts || 0}
                </span>
              </div>
            </div>
          </div>

          <div
            className="card p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/reports')}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800">入住率趋势</h3>
            </div>
            <p className="text-sm text-gray-500">
              查看详细的入住率分析和渠道数据
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
