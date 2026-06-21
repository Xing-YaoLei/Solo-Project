'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Star,
  Phone,
  Bike,
  Calendar,
  MapPin,
  ClipboardList,
  Activity,
  Route,
  Loader2,
  User,
  Clock,
} from 'lucide-react';
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
} from 'recharts';
import { riderApi } from '@/lib/api';
import {
  RIDER_STATUS_MAP,
  TASK_STATUS_MAP,
  formatDate,
  formatMoney,
  cn,
} from '@/lib/utils';
import AuthGuard from '@/components/AuthGuard';

function RiderDetailContent() {
  const params = useParams();
  const router = useRouter();
  const riderId = params.id as string;

  const [rider, setRider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<any[]>([]);

  const loadRider = async () => {
    try {
      setLoading(true);
      const [r, t] = await Promise.all([
        riderApi.detail(riderId),
        riderApi.tracks(riderId, { limit: 100 }),
      ]);
      setRider(r);
      setTracks(t || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRider();
  }, [riderId]);

  if (loading || !rider) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin w-10 h-10 text-primary-500" />
      </div>
    );
  }

  const recentTasks = rider.tasks || [];
  const activities = rider.activities || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{rider.user?.name}</h1>
            <span className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium',
              'bg-gray-100',
              RIDER_STATUS_MAP[rider.status].color,
            )}>
              <span className={cn('w-2 h-2 rounded-full bg-current')} />
              {RIDER_STATUS_MAP[rider.status].label}
            </span>
            <span className="inline-flex items-center gap-1 text-warning-600 font-medium">
              <Star size={16} className="fill-warning-500" />
              {rider.rating?.toFixed(1)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            骑手编号：{rider.riderCode} · 入职 {formatDate(rider.joinDate, 'YYYY-MM-DD')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <ClipboardList size={16} className="text-primary-500" />
            累计订单
          </div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{rider.totalOrders}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Activity size={16} className="text-success-500" />
            活跃天数
          </div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {activities.filter((a: any) => a.orderCount > 0).length}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock size={16} className="text-warning-500" />
            近30天工时
          </div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {Math.round(activities.reduce((s: number, a: any) => s + a.workDuration, 0) / 60)}h
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Route size={16} className="text-purple-500" />
            近30天里程
          </div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {Math.round(activities.reduce((s: number, a: any) => s + a.distance, 0))}km
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-5">
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">骑手信息</h3>
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-50">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold">
                {rider.user?.name?.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xl font-bold text-gray-900">{rider.user?.name}</div>
                <div className="text-sm text-gray-500">{USER_ROLE_MAP[rider.user?.role] || '骑手'}</div>
                <div className="text-xs text-gray-400 font-mono mt-1">{rider.riderCode}</div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-gray-600">
                <Phone size={16} className="text-gray-400 shrink-0" />
                <span className="truncate">{rider.user?.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Bike size={16} className="text-gray-400 shrink-0" />
                <span>{rider.vehicleType}</span>
                {rider.vehiclePlate && (
                  <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono text-xs">
                    {rider.vehiclePlate}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <User size={16} className="text-gray-400 shrink-0" />
                <span className="font-mono text-xs">身份证：{rider.idCardNo?.slice(0, 6)}***{rider.idCardNo?.slice(-4)}</span>
              </div>
              <div className="flex items-start gap-3 text-gray-600">
                <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-gray-500">当前位置</div>
                  <div className="font-mono">
                    {rider.currentLat?.toFixed(6)}, {rider.currentLng?.toFixed(6)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar size={16} className="text-gray-400 shrink-0" />
                <span>入职：{formatDate(rider.joinDate, 'YYYY年MM月DD日')}</span>
              </div>
              {rider.lastActiveAt && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Activity size={16} className="text-gray-400 shrink-0" />
                  <span>最近活跃：{formatDate(rider.lastActiveAt)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              每日订单量（近{activities.length}天）
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activities.slice().reverse()} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(val) => val.slice(5)}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip />
                  <Bar dataKey="orderCount" fill="#3b82f6" radius={[3, 3, 0, 0]} name="订单量" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                工作时长与里程趋势
              </h3>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activities.slice().reverse()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(val) => val.slice(5)}
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} name="时长(分)" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} name="里程(km)" />
                  <Tooltip />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="workDuration"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="工作时长(分)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="distance"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="里程(km)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                近期任务 ({recentTasks.length})
              </h3>
              <Link href="/tasks" className="text-xs text-primary-600 hover:underline">
                全部任务
              </Link>
            </div>

            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="px-6 py-2.5 font-medium whitespace-nowrap">任务编号</th>
                    <th className="px-6 py-2.5 font-medium">物品</th>
                    <th className="px-6 py-2.5 font-medium whitespace-nowrap">状态</th>
                    <th className="px-6 py-2.5 font-medium whitespace-nowrap">金额</th>
                    <th className="px-6 py-2.5 font-medium whitespace-nowrap">创建时间</th>
                    <th className="px-6 py-2.5 font-medium whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTasks.map((task: any) => (
                    <tr
                      key={task.id}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/tasks/${task.id}`)}
                    >
                      <td className="px-6 py-3 font-mono text-primary-600 whitespace-nowrap">{task.taskNo}</td>
                      <td className="px-6 py-3 min-w-[150px]">
                        <div className="text-gray-900 font-medium">{task.itemName}</div>
                        <div className="text-xs text-gray-500">×{task.itemQuantity}</div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className={TASK_STATUS_MAP[task.status].color}>
                          {TASK_STATUS_MAP[task.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-gray-700 font-medium">
                        {formatMoney(task.estimatedAmount)}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-gray-500 text-xs">
                        {formatDate(task.createdAt, 'MM-DD HH:mm')}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="text-primary-600 hover:text-primary-700 text-xs font-medium">
                          查看
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const USER_ROLE_MAP: Record<string, string> = {
  ADMIN: '系统管理员',
  MANAGER: '管理层',
  DISPATCHER: '调度员',
  VERIFIER: '核验员',
  RIDER: '骑手',
};

export default function RiderDetailPage() {
  return (
    <AuthGuard>
      <RiderDetailContent />
    </AuthGuard>
  );
}
