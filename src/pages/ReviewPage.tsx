import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Star,
  RotateCcw,
  ArrowRight,
  Home,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Circle,
  Car,
  Wrench,
  Trophy,
  Target,
  Timer,
  Percent,
} from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { formatNumber, formatPercent, formatSeconds, formatStars, formatMileage } from '@/utils/format';
import { getStarsDescription } from '@/utils/scoring';
import { cn } from '@/lib/utils';
import type { WorkOrder, VehicleWithDetails } from '@/types';

function CircularProgress({
  value,
  size = 120,
  strokeWidth = 10,
  color = '#10b981',
  trackColor = 'rgba(156, 163, 175, 0.2)',
  children,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(1, Math.max(0, value)) * circumference);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  progressValue,
  color,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  suffix?: string;
  progressValue: number;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center gap-3 rounded-2xl bg-white dark:bg-gray-800/60 p-5 shadow-sm border border-gray-100 dark:border-gray-700/50"
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl',
          color.includes('emerald') && 'bg-emerald-50 dark:bg-emerald-500/10',
          color.includes('amber') && 'bg-amber-50 dark:bg-amber-500/10',
          color.includes('rose') && 'bg-rose-50 dark:bg-rose-500/10',
          color.includes('sky') && 'bg-sky-50 dark:bg-sky-500/10'
        )}
      >
        <Icon className={cn('h-5 w-5', color)} />
      </div>
      <CircularProgress value={progressValue} size={100} strokeWidth={8} color={colorToHex(color)}>
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: delay + 0.3 }}
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            {value}
          </motion.div>
          {suffix && (
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{suffix}</div>
          )}
        </div>
      </CircularProgress>
      <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</div>
    </motion.div>
  );
}

function colorToHex(colorClass: string): string {
  if (colorClass.includes('emerald')) return '#10b981';
  if (colorClass.includes('amber')) return '#f59e0b';
  if (colorClass.includes('rose')) return '#f43f5e';
  if (colorClass.includes('sky')) return '#0ea5e9';
  return '#6366f1';
}

function StarRating({ stars, maxStars = 3 }: { stars: number; maxStars?: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: maxStars }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{
            scale: i < stars ? 1 : 0.8,
            opacity: i < stars ? 1 : 0.3,
            rotate: 0,
          }}
          transition={{
            duration: 0.5,
            delay: 0.8 + i * 0.15,
            type: 'spring',
            stiffness: 200,
          }}
        >
          <Star
            className={cn(
              'h-12 w-12',
              i < stars
                ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                : 'fill-gray-200 dark:fill-gray-700 text-gray-300 dark:text-gray-600'
            )}
          />
        </motion.div>
      ))}
    </div>
  );
}

interface VehicleTimelineProps {
  vehicle: VehicleWithDetails;
  isRework: boolean;
  index: number;
}

function VehicleTimeline({ vehicle, isRework, index }: VehicleTimelineProps) {
  const stations = useGameStore((s) => s.stations);
  const diagnoses = useGameStore((s) => s.diagnoses);
  const workOrders = useGameStore((s) => s.workOrders);

  const vehicleOrders = workOrders
    .filter((wo) => wo.vehicleId === vehicle.id)
    .sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

  const stationName = (id: string | null) => {
    const s = stations.find((st) => st.id === id);
    return s?.name || '未分配';
  };

  const diagnosisName = (id: string) => {
    const d = diagnoses.find((di) => di.id === id);
    return d?.faultName || '未知工序';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 1.4 + index * 0.08 }}
      className={cn(
        'rounded-xl border p-4 transition-all',
        isRework
          ? 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/30'
          : 'bg-white dark:bg-gray-800/40 border-gray-100 dark:border-gray-700/50'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              isRework
                ? 'bg-rose-100 dark:bg-rose-500/20'
                : 'bg-sky-50 dark:bg-sky-500/10'
            )}
          >
            <Car
              className={cn(
                'h-5 w-5',
                isRework ? 'text-rose-500' : 'text-sky-500'
              )}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {vehicle.brand} {vehicle.model}
              </span>
              {isRework && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-500/20 px-2 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-3 w-3" />
                  返修
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {vehicle.plateNumber} · {vehicle.year}年 · {formatMileage(vehicle.mileage)}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {vehicleOrders.filter((o) => o.status === 'completed' || o.status === 'reworked').length}/
            {vehicle.diagnoses.length} 工序
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {vehicleOrders.reduce((acc, o) => acc + (o.actualMinutes || 0), 0)} 分钟
          </div>
        </div>
      </div>

      <div className="relative pl-6 space-y-3 mt-4">
        <div className="absolute left-[11px] top-1 bottom-1 w-px bg-gray-200 dark:bg-gray-700" />
        {vehicle.diagnoses.map((diag) => {
          const order = vehicleOrders.find((wo) => wo.diagnosisId === diag.id);
          const isReworkStep = order?.reworked;
          const statusIcon = getStatusIcon(order);

          return (
            <div key={diag.id} className="relative">
              <div
                className={cn(
                  'absolute -left-[19px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-white dark:bg-gray-900',
                  order?.status === 'completed' && 'border-emerald-500',
                  order?.status === 'reworked' && 'border-rose-500',
                  !order && 'border-gray-300 dark:border-gray-600',
                  order?.status === 'in_progress' && 'border-sky-500',
                  (order?.status === 'assigned' || order?.status === 'pending') && 'border-amber-500'
                )}
              >
                {statusIcon}
              </div>
              <div
                className={cn(
                  'rounded-lg p-3 ml-2',
                  isReworkStep
                    ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20'
                    : 'bg-gray-50 dark:bg-gray-800/60'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Wrench className={cn('h-3.5 w-3.5 flex-shrink-0', isReworkStep ? 'text-rose-500' : 'text-gray-400')} />
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {diagnosisName(diag.id)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{stationName(order?.stationId || null)}</span>
                      <span>预计 {diag.estimatedMinutes}分钟</span>
                      {order?.actualMinutes && (
                        <span>实际 {order.actualMinutes}分钟</span>
                      )}
                    </div>
                    {isReworkStep && order?.reworkReason && (
                      <div className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {order.reworkReason}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function getStatusIcon(order?: WorkOrder) {
  if (!order) {
    return <Circle className="h-2.5 w-2.5 text-gray-300 dark:text-gray-600" />;
  }
  switch (order.status) {
    case 'completed':
      return <CheckCircle2 className="h-3 w-3 text-emerald-500 fill-emerald-500" />;
    case 'reworked':
      return <AlertTriangle className="h-3 w-3 text-rose-500 fill-rose-500" />;
    case 'in_progress':
      return <Clock className="h-2.5 w-2.5 text-sky-500 fill-sky-500" />;
    default:
      return <Circle className="h-2.5 w-2.5 text-amber-500" />;
  }
}

export default function ReviewPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();

  const levels = useGameStore((s) => s.levels);
  const vehicles = useGameStore((s) => s.vehicles);
  const diagnoses = useGameStore((s) => s.diagnoses);
  const workOrders = useGameStore((s) => s.workOrders);
  const gameRecords = useGameStore((s) => s.gameRecords);
  const timeRemaining = useGameStore((s) => s.timeRemaining);
  const startLevel = useGameStore((s) => s.startLevel);
  const resetGameState = useGameStore((s) => s.resetGameState);

  const level = levels.find((l) => l.id === levelId);
  const latestRecord = useMemo(() => {
    return [...gameRecords]
      .filter((r) => r.levelId === levelId)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
  }, [gameRecords, levelId]);

  const vehiclesWithDetails: VehicleWithDetails[] = useMemo(() => {
    return vehicles
      .filter((v) => v.levelId === levelId)
      .map((v) => ({
        ...v,
        diagnoses: diagnoses.filter((d) => d.vehicleId === v.id),
        workOrders: workOrders.filter((wo) => wo.vehicleId === v.id),
      }));
  }, [vehicles, diagnoses, workOrders, levelId]);

  const vehicleHasRework = (v: VehicleWithDetails) => {
    return v.workOrders.some((wo) => wo.reworked);
  };

  const stats = useMemo(() => {
    const totalDiagnoses = vehiclesWithDetails.reduce((acc, v) => acc + v.diagnoses.length, 0);
    const completedOrders = workOrders.filter(
      (wo) => wo.vehicleId && vehicles.some((v) => v.id === wo.vehicleId) &&
        (wo.status === 'completed' || wo.status === 'reworked')
    );
    const reworkCount = completedOrders.filter((o) => o.reworked).length;
    const completionRate = totalDiagnoses > 0 ? completedOrders.length / totalDiagnoses : 0;
    const reworkRate = completedOrders.length > 0 ? reworkCount / completedOrders.length : 0;
    const timeLimit = level?.timeLimitSeconds || 1;
    const timeUsedRate = 1 - timeRemaining / timeLimit;
    const timeUtilization = Math.max(0, Math.min(1, timeUsedRate));

    return {
      totalScore: latestRecord?.score ?? 0,
      completionRate,
      reworkRate,
      timeUtilization,
      stars: latestRecord?.stars ?? 0,
    };
  }, [vehiclesWithDetails, workOrders, vehicles, level, timeRemaining, latestRecord]);

  const handleReplay = () => {
    if (levelId) {
      startLevel(levelId);
      navigate(`/game/${levelId}`);
    }
  };

  const handleNextLevel = () => {
    if (!levelId) return;
    const currentIndex = levels.findIndex((l) => l.id === levelId);
    if (currentIndex >= 0 && currentIndex < levels.length - 1) {
      const nextLevel = levels[currentIndex + 1];
      startLevel(nextLevel.id);
      navigate(`/game/${nextLevel.id}`);
    } else {
      navigate('/levels');
    }
  };

  const handleBackToLevels = () => {
    resetGameState();
    navigate('/levels');
  };

  const hasNextLevel = (() => {
    if (!levelId) return false;
    const currentIndex = levels.findIndex((l) => l.id === levelId);
    return currentIndex >= 0 && currentIndex < levels.length - 1;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-gray-800/60 backdrop-blur px-4 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 shadow-sm border border-gray-100 dark:border-gray-700/50 mb-4">
            <Trophy className="h-4 w-4 text-amber-500" />
            关卡结算
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            {level?.name || '未知关卡'}
          </h1>
          {latestRecord && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-lg text-amber-600 dark:text-amber-400 font-medium"
            >
              {formatStars(stats.stars)} {getStarsDescription(stats.stars)}
            </motion.p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-3xl bg-white/80 dark:bg-gray-800/50 backdrop-blur-xl shadow-xl border border-white/50 dark:border-gray-700/30 p-6 md:p-8 mb-8"
        >
          <div className="flex flex-col items-center mb-8">
            <StarRating stars={stats.stars} />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.4 }}
              className="mt-6 flex items-baseline gap-2"
            >
              <Trophy className="h-8 w-8 text-amber-500" />
              <span className="text-5xl md:text-6xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent tabular-nums">
                {formatNumber(stats.totalScore)}
              </span>
              <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">分</span>
            </motion.div>
            {latestRecord && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
                className="mt-2 text-sm text-gray-500 dark:text-gray-400"
              >
                用时 {formatSeconds(latestRecord.timeUsedSeconds, { withUnit: true })} · 完成 {latestRecord.completedVehicles}/{latestRecord.totalVehicles} 辆车
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Target}
              label="完成率"
              value={formatPercent(stats.completionRate, { decimals: 0 })}
              progressValue={stats.completionRate}
              color="text-emerald-500"
              delay={1.6}
            />
            <StatCard
              icon={AlertTriangle}
              label="返修率"
              value={formatPercent(stats.reworkRate, { decimals: 0 })}
              progressValue={1 - stats.reworkRate}
              color="text-rose-500"
              delay={1.7}
            />
            <StatCard
              icon={Timer}
              label="时间利用率"
              value={formatPercent(stats.timeUtilization, { decimals: 0 })}
              progressValue={stats.timeUtilization}
              color="text-sky-500"
              delay={1.8}
            />
            <StatCard
              icon={Percent}
              label="星级评分"
              value={`${stats.stars}/3`}
              progressValue={stats.stars / 3}
              color="text-amber-500"
              delay={1.9}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 2.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="h-5 w-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">维修详情流水</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
              共 {vehiclesWithDetails.length} 辆车 · {vehiclesWithDetails.filter(vehicleHasRework).length} 辆返修
            </span>
          </div>

          {vehiclesWithDetails.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
              <Car className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">暂无维修记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vehiclesWithDetails.map((v, i) => (
                <VehicleTimeline
                  key={v.id}
                  vehicle={v}
                  isRework={vehicleHasRework(v)}
                  index={i}
                />
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 2.3 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
        >
          <button
            onClick={handleReplay}
            className="group flex items-center justify-center gap-2 rounded-2xl bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white font-semibold px-6 py-3.5 transition-all shadow-lg shadow-gray-900/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <RotateCcw className="h-5 w-5 transition-transform group-hover:rotate-180" />
            重玩本关
          </button>

          {hasNextLevel && (
            <button
              onClick={handleNextLevel}
              className="group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold px-6 py-3.5 transition-all shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              下一关
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          )}

          <button
            onClick={handleBackToLevels}
            className="group flex items-center justify-center gap-2 rounded-2xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold px-6 py-3.5 transition-all shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <Home className="h-5 w-5 transition-transform group-hover:scale-110" />
            返回选关
          </button>
        </motion.div>
      </div>
    </div>
  );
}
