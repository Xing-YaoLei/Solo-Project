'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  Users,
  MapPin,
  AlertTriangle,
  Clock,
  Camera,
  Tags,
  Route,
  Wallet,
  ChevronRight,
  Plus,
  Search,
  UserCheck,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { taskApi, dashboardApi, damageApi, riderApi, Task } from '@/lib/api';
import {
  TASK_STATUS_MAP,
  RISK_LEVEL_MAP,
  DAMAGE_STATUS_MAP,
  RIDER_STATUS_MAP,
  formatDate,
  formatRelative,
  formatMoney,
  cn,
} from '@/lib/utils';
import AuthGuard from '@/components/AuthGuard';

const DAILY_STEPS = [
  { key: 'PHOTO_UPLOADED', label: '核验照片', icon: Camera, desc: '上传并检查物品照片' },
  { key: 'TAG_REVIEWED', label: '评价标签', icon: Tags, desc: '核对评价标签与订单' },
  { key: 'ADDRESS_CHECKED', label: '地址核对', icon: MapPin, desc: '收寄地址与订单核对' },
  { key: 'TRACKING_CONFIRMED', label: '轨迹追踪', icon: Route, desc: '骑手轨迹补录确认' },
  { key: 'SUBSIDY_APPLIED', label: '补贴核算', icon: Wallet, desc: '按规则计算骑手补贴' },
];

function DashboardContent() {
  const router = useRouter();
  const [overview, setOverview] = useState<any>(null);
  const [taskStats, setTaskStats] = useState<any>(null);
  const [damageStats, setDamageStats] = useState<any>(null);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [inProgressTasks, setInProgressTasks] = useState<Task[]>([]);
  const [activeRiders, setActiveRiders] = useState<any[]>([]);
  const [recentDamages, setRecentDamages] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ov, ts, ds, pt, ip, rd, rs] = await Promise.all([
        dashboardApi.overview().catch(() => null),
        taskApi.dashboardStats().catch(() => null),
        damageApi.stats().catch(() => null),
        taskApi.list({ status: 'PENDING', limit: 8 }).catch(() => ({ items: [] })),
        taskApi.list({ status: 'IN_PROGRESS', limit: 8 }).catch(() => ({ items: [] })),
        damageApi.list({ limit: 5 }).catch(() => ({ items: [] })),
        riderApi.list().catch(() => []),
      ]);
      setOverview(ov);
      setTaskStats(ts);
      setDamageStats(ds);
      setPendingTasks(pt.items || []);
      setInProgressTasks(ip.items || []);
      setRecentDamages(rd.items || []);
      setActiveRiders(Array.isArray(rs) ? rs.filter((r) => r.status !== 'OFFLINE').slice(0, 6) : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin w-10 h-10 text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">今日工作台</h2>
          <p className="text-sm text-gray-500 mt-1">
            按日常处理节奏排列 · {formatDate(new Date(), 'YYYY年MM月DD日 dddd')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 w-64"
              placeholder="搜索任务/订单号"
            />
          </div>
          <Link href="/tasks?status=PENDING" className="btn-primary">
            <Plus size={18} />
            新建任务
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-500">总任务</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{taskStats?.total || 0}</div>
              <div className="text-xs text-gray-400 mt-1">今日新增 {overview?.taskStats?.today || 0}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
              <ClipboardList className="text-primary-600" size={22} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-500">待处理</div>
              <div className="text-3xl font-bold text-warning-600 mt-2">
                {(taskStats?.pending || 0) + (taskStats?.inProgress || 0)}
              </div>
              <div className="text-xs text-gray-400 mt-1">待分派 {taskStats?.pending || 0} · 处理中 {taskStats?.inProgress || 0}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning-50 flex items-center justify-center">
              <Clock className="text-warning-600" size={22} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-500">在线骑手</div>
              <div className="text-3xl font-bold text-success-600 mt-2">{overview?.riderStats?.online || 0}</div>
              <div className="text-xs text-gray-400 mt-1">配送中 {overview?.riderStats?.onDelivery || 0}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center">
              <Users className="text-success-600" size={22} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-500">损坏待处理</div>
              <div className="text-3xl font-bold text-danger-600 mt-2">{damageStats?.total || 0}</div>
              <div className="text-xs text-gray-400 mt-1">待处理 {damageStats?.pending || 0}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-danger-50 flex items-center justify-center">
              <AlertTriangle className="text-danger-600" size={22} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-primary-600" />
              日常处理流程
            </h3>
            <p className="text-sm text-gray-500 mt-1">按顺序处理每个步骤，确保核验质量</p>
          </div>
          <Link href="/tasks" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium">
            查看全部 <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {DAILY_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.key}
                href={`/tasks?step=${step.key}`}
                className="group relative p-4 rounded-xl border-2 border-gray-100 hover:border-primary-300 hover:bg-primary-50/30 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center shrink-0 transition-colors">
                    <Icon size={20} className="text-gray-600 group-hover:text-primary-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400">0{idx + 1}</span>
                      <span className="font-semibold text-gray-900 group-hover:text-primary-700">{step.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
                {idx < DAILY_STEPS.length - 1 && (
                  <ChevronRight
                    size={18}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-gray-300 group-hover:text-primary-300 bg-white rounded-full z-10 hidden md:block"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={20} className="text-warning-600" />
              待分派 & 处理中任务
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                待分派 ({pendingTasks.length})
              </div>
              {pendingTasks.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">暂无待分派任务</div>
              ) : (
                <div className="space-y-2">
                  {pendingTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => router.push(`/tasks/${task.id}`)}
                      className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm text-gray-900">{task.taskNo}</span>
                            <span className={TASK_STATUS_MAP[task.status].color}>
                              {TASK_STATUS_MAP[task.status].label}
                            </span>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs text-gray-500">{formatRelative(task.createdAt)}</span>
                          </div>
                          <div className="mt-2 text-sm text-gray-700">
                            <span className="font-medium">{task.itemName}</span>
                            <span className="text-gray-400 mx-1">×</span>
                            <span>{task.itemQuantity}件</span>
                          </div>
                          <div className="mt-1 text-xs text-gray-500 truncate">
                            {task.pickupAddress} → {task.deliveryAddress}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs text-gray-500">骑手</div>
                          <div className="text-sm font-medium text-gray-900 mt-0.5">
                            {(task as any).rider?.user?.name || '-'}
                          </div>
                          <div className="text-xs text-primary-600 mt-1 font-medium group-hover:translate-x-1 transition-transform">
                            去分派 →
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warning-500" />
                处理中 ({inProgressTasks.length})
              </div>
              {inProgressTasks.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">暂无处理中任务</div>
              ) : (
                <div className="space-y-2">
                  {inProgressTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => router.push(`/tasks/${task.id}`)}
                      className="w-full text-left p-4 rounded-xl border border-warning-100 bg-warning-50/30 hover:bg-warning-50/50 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm text-gray-900">{task.taskNo}</span>
                            <span className={TASK_STATUS_MAP[task.status].color}>
                              {TASK_STATUS_MAP[task.status].label}
                            </span>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs text-gray-500">{formatRelative(task.startedAt || task.createdAt)}</span>
                          </div>
                          <div className="mt-2 text-sm text-gray-700">
                            <span className="font-medium">{task.itemName}</span>
                            <span className="text-gray-400 mx-1">×</span>
                            <span>{task.itemQuantity}件</span>
                            <span className="text-gray-400 mx-2">·</span>
                            <span>{formatMoney(task.estimatedAmount)}</span>
                          </div>
                          {task.currentStep && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              <span className="text-xs px-2 py-0.5 rounded bg-primary-100 text-primary-700">
                                当前步骤：{DAILY_STEPS.find((s) => s.key === task.currentStep)?.label || task.currentStep}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs text-primary-600 font-medium group-hover:translate-x-1 transition-transform">
                            继续核验 →
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UserCheck size={20} className="text-success-600" />
                在线骑手
              </h3>
              <Link href="/riders" className="text-xs text-primary-600 hover:underline">
                全部骑手
              </Link>
            </div>
            <div className="space-y-3">
              {activeRiders.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm">暂无在线骑手</div>
              ) : (
                activeRiders.map((rider) => (
                  <Link
                    key={rider.id}
                    href={`/riders/${rider.userId}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                        {rider.user?.name?.charAt(0)}
                      </div>
                      <span
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
                          RIDER_STATUS_MAP[rider.status].color,
                          'bg-current',
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {rider.user?.name}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span>{rider.riderCode}</span>
                        <span>·</span>
                        <span>{rider.totalOrders}单</span>
                        <span>·</span>
                        <span className={RIDER_STATUS_MAP[rider.status].color}>
                          {RIDER_STATUS_MAP[rider.status].label}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-warning-600 font-medium shrink-0">
                      ★ {rider.rating.toFixed(1)}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle size={20} className="text-danger-600" />
                损坏处理
              </h3>
              <Link href="/damages" className="text-xs text-primary-600 hover:underline">
                全部损坏
              </Link>
            </div>
            <div className="space-y-3">
              {recentDamages.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm">暂无损坏报告</div>
              ) : (
                recentDamages.map((dmg) => {
                  const risk = RISK_LEVEL_MAP[dmg.riskLevel];
                  const status = DAMAGE_STATUS_MAP[dmg.status];
                  return (
                    <Link
                      key={dmg.id}
                      href={`/damages/${dmg.id}`}
                      className={cn(
                        'block p-3 rounded-xl border transition-colors hover:shadow-sm',
                        risk.bg,
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-mono text-xs text-gray-700">{dmg.reportNo}</span>
                        <span className={cn('font-bold text-xs', risk.color)}>
                          {risk.label}
                        </span>
                      </div>
                      <div className="text-sm text-gray-800 font-medium mb-1">{dmg.damageType}</div>
                      <p className="text-xs text-gray-600 line-clamp-2">{dmg.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={status.color}>{status.label}</span>
                        <span className="text-xs text-gray-400">{formatRelative(dmg.createdAt)}</span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DispatchDashboard() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
