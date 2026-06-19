import { useGameStore } from '@/store/useGameStore';
import { formatMileage, formatPercent } from '@/utils/format';
import { calculateVehicleLevelReworkRate } from '@/utils/rework';
import { motion } from 'framer-motion';
import {
  Car,
  User,
  Gauge,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VehicleArchive() {
  const {
    selectedVehicleId,
    vehicles,
    diagnoses,
    workOrders,
    selectDiagnosis,
    setActivePanel,
  } = useGameStore();

  const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const vehicleDiagnoses = diagnoses.filter((d) => d.vehicleId === selectedVehicleId);
  const vehicleWorkOrders = workOrders.filter((wo) => wo.vehicleId === selectedVehicleId);
  const reworkRate = selectedVehicleId
    ? calculateVehicleLevelReworkRate(selectedVehicleId, workOrders)
    : 0;

  const completedCount = vehicleWorkOrders.filter(
    (wo) => wo.status === 'completed' || wo.status === 'reworked'
  ).length;
  const pendingCount = vehicleDiagnoses.length - completedCount;

  if (!vehicle) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5">
          <Car className="h-10 w-10 text-white/30" />
        </div>
        <div>
          <div className="text-lg font-medium text-white/70">未选中车辆</div>
          <div className="mt-1 text-sm text-white/40">点击车间中的车辆查看档案</div>
        </div>
      </div>
    );
  }

  const handleGoToDiagnosis = (diagnosisId: string) => {
    selectDiagnosis(diagnosisId);
    setActivePanel('diagnosis');
  };

  return (
    <div className="space-y-4 p-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02]"
      >
        <div
          className="h-32 w-full"
          style={{
            background: `linear-gradient(135deg, ${vehicle.color}22 0%, ${vehicle.color}44 100%)`,
          }}
        >
          <div className="flex h-full items-center justify-center">
            <Car className="h-16 w-16 drop-shadow-lg" style={{ color: vehicle.color }} />
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {vehicle.brand} {vehicle.model}
            </h2>
            <div className="mt-1 flex items-center gap-3 text-sm text-white/50">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {vehicle.year}款
              </span>
              <span>·</span>
              <span
                className="rounded-md px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${vehicle.color}33`,
                  color: vehicle.color,
                }}
              >
                {vehicle.color}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/5 p-3">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <FileText className="h-3.5 w-3.5" />
                车牌号
              </div>
              <div className="mt-1 text-base font-semibold text-white">
                {vehicle.plateNumber}
              </div>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Gauge className="h-3.5 w-3.5" />
                里程数
              </div>
              <div className="mt-1 text-base font-semibold text-white">
                {formatMileage(vehicle.mileage)}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
      >
        <div className="mb-3 flex items-center gap-2">
          <User className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">车主描述</span>
        </div>
        <div className="rounded-xl bg-white/5 p-4">
          <p className="text-sm leading-relaxed text-white/80">{vehicle.ownerDescription}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <Wrench className="h-3 w-3" />
            总工序
          </div>
          <div className="mt-1 text-xl font-bold text-white">
            {vehicleDiagnoses.length}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <Clock className="h-3 w-3" />
            待处理
          </div>
          <div className="mt-1 text-xl font-bold text-amber-400">{pendingCount}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            {reworkRate > 0.2 ? (
              <AlertOctagon className="h-3 w-3 text-red-400" />
            ) : (
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            )}
            返修率
          </div>
          <div
            className={cn(
              'mt-1 text-xl font-bold',
              reworkRate > 0.3
                ? 'text-red-400'
                : reworkRate > 0.15
                ? 'text-orange-400'
                : 'text-emerald-400'
            )}
          >
            {formatPercent(reworkRate)}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-semibold text-white">历史记录</span>
          </div>
          <span className="text-xs text-white/40">
            共 {vehicle.historyRecords.length} 条
          </span>
        </div>

        <div className="space-y-2">
          {vehicle.historyRecords.map((record, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl bg-white/5 p-3 transition-all hover:bg-white/[0.08]"
            >
              <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-purple-500/20">
                <Clock className="h-3 w-3 text-purple-400" />
              </div>
              <p className="text-sm text-white/75 line-clamp-2">{record}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">诊断故障</span>
          </div>
          <button
            onClick={() => setActivePanel('diagnosis')}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            查看全部 →
          </button>
        </div>

        <div className="space-y-2">
          {vehicleDiagnoses.slice(0, 3).map((diag) => {
            const order = vehicleWorkOrders.find((wo) => wo.diagnosisId === diag.id);
            const severityColors: Record<string, string> = {
              low: 'bg-green-500/20 text-green-400',
              medium: 'bg-yellow-500/20 text-yellow-400',
              high: 'bg-orange-500/20 text-orange-400',
              critical: 'bg-red-500/20 text-red-400',
            };
            return (
              <button
                key={diag.id}
                onClick={() => handleGoToDiagnosis(diag.id)}
                className="flex w-full items-center gap-3 rounded-xl bg-white/5 p-3 text-left transition-all hover:bg-white/[0.08] active:scale-[0.98]"
              >
                <div
                  className={cn(
                    'h-2 w-2 flex-shrink-0 rounded-full',
                    diag.severity === 'critical' && 'bg-red-400 animate-pulse',
                    diag.severity === 'high' && 'bg-orange-400',
                    diag.severity === 'medium' && 'bg-yellow-400',
                    diag.severity === 'low' && 'bg-green-400'
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">
                    {diag.faultName}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-white/50">
                    <span className={cn('rounded px-1.5 py-0.5', severityColors[diag.severity])}>
                      {diag.severity}
                    </span>
                    <span>{diag.estimatedMinutes}分钟</span>
                  </div>
                </div>
                {order && (
                  <span
                    className={cn(
                      'flex-shrink-0 rounded-md px-2 py-1 text-xs font-medium',
                      order.status === 'completed' && 'bg-emerald-500/20 text-emerald-400',
                      order.status === 'reworked' && 'bg-orange-500/20 text-orange-400',
                      order.status === 'in_progress' && 'bg-blue-500/20 text-blue-400',
                      order.status === 'assigned' && 'bg-cyan-500/20 text-cyan-400',
                      order.status === 'pending' && 'bg-white/10 text-white/60',
                      order.status === 'skipped' && 'bg-red-500/20 text-red-400'
                    )}
                  >
                    {order.status === 'completed' && '已完成'}
                    {order.status === 'reworked' && '已返修'}
                    {order.status === 'in_progress' && '进行中'}
                    {order.status === 'assigned' && '已分配'}
                    {order.status === 'pending' && '待分配'}
                    {order.status === 'skipped' && '已跳过'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
