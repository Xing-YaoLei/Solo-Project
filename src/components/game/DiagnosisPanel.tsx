import { useGameStore } from '@/store/useGameStore';
import { checkDependencies } from '@/utils/dispatch';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  Clock,
  Package,
  Link2,
  AlertOctagon,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Car,
  Zap,
  Gauge,
  Wrench,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Severity, SkillTag } from '@/types';

const severityStyles: Record<Severity, { bar: string; badge: string; label: string }> = {
  low: {
    bar: 'bg-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    label: '轻微',
  },
  medium: {
    bar: 'bg-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    label: '一般',
  },
  high: {
    bar: 'bg-orange-400',
    badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    label: '严重',
  },
  critical: {
    bar: 'bg-red-400',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    label: '致命',
  },
};

const skillTextMap: Record<SkillTag, string> = {
  engine: '发动机',
  transmission: '变速箱',
  brakes: '刹车',
  brake: '刹车',
  suspension: '悬挂',
  electrical: '电器',
  body: '车身',
  tires: '轮胎',
  ac: '空调',
  exhaust: '排气',
  cooling: '冷却',
  fuel: '燃油',
  diagnosis: '诊断',
};

export default function DiagnosisPanel() {
  const {
    selectedVehicleId,
    selectedDiagnosisId,
    selectDiagnosis,
    diagnoses,
    vehicles,
    parts,
    workOrders,
    setActivePanel,
  } = useGameStore();

  const completedOrders = workOrders.filter(
    (wo) => wo.status === 'completed' || wo.status === 'reworked'
  );

  const filteredDiagnoses = selectedVehicleId
    ? diagnoses.filter((d) => d.vehicleId === selectedVehicleId)
    : diagnoses;

  const sortedDiagnoses = [...filteredDiagnoses].sort((a, b) => {
    const severityOrder: Record<Severity, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const handleSelectDiagnosis = (diagnosisId: string) => {
    selectDiagnosis(diagnosisId);
    setActivePanel('dispatch');
  };

  return (
    <div className="space-y-4 p-5">
      {selectedVehicle && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${selectedVehicle.color}22` }}
          >
            <Car className="h-6 w-6" style={{ color: selectedVehicle.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">
              {selectedVehicle.brand} {selectedVehicle.model}
            </div>
            <div className="text-xs text-white/50">{selectedVehicle.plateNumber}</div>
          </div>
          <button
            onClick={() => setActivePanel('archive')}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/70 transition-all hover:bg-white/20"
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>查看档案</span>
          </button>
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20">
            <Stethoscope className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">诊断故障列表</div>
            <div className="text-xs text-white/50">
              共 {sortedDiagnoses.length} 项故障
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1">
          <button className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white">
            <Filter className="h-3.5 w-3.5" />
            <span>筛选</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {sortedDiagnoses.map((diagnosis, idx) => {
          const order = workOrders.find((wo) => wo.diagnosisId === diagnosis.id);
          const requiredParts = parts.filter((p) => diagnosis.requiredParts.includes(p.id));
          const depCheck = checkDependencies(diagnosis, diagnoses, completedOrders);
          const style = severityStyles[diagnosis.severity];
          const isSelected = selectedDiagnosisId === diagnosis.id;
          const isCompleted = order && (order.status === 'completed' || order.status === 'reworked');
          const isInProgress = order && order.status === 'in_progress';
          const isAssigned = order && order.status === 'assigned';

          return (
            <motion.div
              key={diagnosis.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <button
                onClick={() => !isCompleted && handleSelectDiagnosis(diagnosis.id)}
                disabled={!!isCompleted}
                className={cn(
                  'relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all',
                  isSelected
                    ? 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]',
                  isCompleted && 'opacity-60 cursor-not-allowed'
                )}
              >
                <div className={cn(
                  'absolute left-0 top-0 h-full w-1',
                  style.bar,
                  diagnosis.severity === 'critical' && 'animate-pulse'
                )} />

                <div className="pl-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-white">
                          {diagnosis.faultName}
                        </h3>
                        {diagnosis.faultCode && (
                          <span className="flex-shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-xs text-white/50">
                            {diagnosis.faultCode}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-white/60">
                        {diagnosis.description}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={cn(
                          'flex-shrink-0 rounded-lg border px-2 py-1 text-xs font-medium',
                          style.badge
                        )}
                      >
                        {style.label}
                      </span>
                      {isCompleted && (
                        <span className={cn(
                          'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
                          order?.status === 'reworked'
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        )}>
                          {order?.status === 'reworked' ? (
                            <AlertOctagon className="h-3 w-3" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {order?.status === 'reworked' ? '已返修' : '已完成'}
                        </span>
                      )}
                      {isInProgress && (
                        <span className="flex items-center gap-1 rounded-md bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-400">
                          <Zap className="h-3 w-3 animate-pulse" />
                          进行中
                        </span>
                      )}
                      {isAssigned && (
                        <span className="flex items-center gap-1 rounded-md bg-cyan-500/20 px-2 py-1 text-xs font-medium text-cyan-400">
                          <Gauge className="h-3 w-3" />
                          已分配
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 rounded-xl bg-white/5 p-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20">
                        <Clock className="h-3.5 w-3.5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-white/40">工时</div>
                        <div className="text-xs font-semibold text-white">
                          {diagnosis.estimatedMinutes}分钟
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl bg-white/5 p-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20">
                        <Wrench className="h-3.5 w-3.5 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-white/40">技能</div>
                        <div className="text-xs font-semibold text-white">
                          {diagnosis.requiredSkill
                            ? skillTextMap[diagnosis.requiredSkill] || diagnosis.requiredSkill
                            : diagnosis.requiredSkills
                                .map((s) => skillTextMap[s] || s)
                                .slice(0, 1)
                                .join('、')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl bg-white/5 p-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20">
                        <Package className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-white/40">配件</div>
                        <div className="text-xs font-semibold text-white">
                          {requiredParts.length}件
                        </div>
                      </div>
                    </div>
                  </div>

                  {requiredParts.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-1.5 flex items-center gap-1 text-[10px] text-white/40">
                        <Package className="h-3 w-3" />
                        <span>所需配件</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {requiredParts.map((part) => {
                          const outOfStock = (part.stockCount ?? 0) <= 0;
                          return (
                            <span
                              key={part.id}
                              className={cn(
                                'flex items-center gap-1 rounded-md border px-2 py-1 text-xs',
                                outOfStock
                                  ? 'border-red-500/30 bg-red-500/10 text-red-400'
                                  : 'border-white/10 bg-white/5 text-white/70'
                              )}
                            >
                              {outOfStock && <AlertOctagon className="h-3 w-3" />}
                              {part.name}
                              {!outOfStock && (
                                <span className="text-white/40">×{part.stockCount}</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {diagnosis.dependencies.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-1.5 flex items-center gap-1 text-[10px] text-white/40">
                        <Link2 className="h-3 w-3" />
                        <span>前置依赖</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {diagnosis.dependencies.map((depId) => {
                          const depDiag = diagnoses.find((d) => d.id === depId);
                          const isDepMet = depCheck.met;
                          return (
                            <span
                              key={depId}
                              className={cn(
                                'flex items-center gap-1 rounded-md border px-2 py-1 text-xs',
                                isDepMet
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                  : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                              )}
                            >
                              {isDepMet ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              {depDiag?.faultName || depId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!isCompleted && (
                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                      <span className="text-xs text-white/40">点击分配工序</span>
                      <ChevronRight className="h-4 w-4 text-white/30" />
                    </div>
                  )}
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {sortedDiagnoses.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02]">
          <Stethoscope className="h-12 w-12 text-white/20" />
          <div className="text-center">
            <div className="text-sm font-medium text-white/50">暂无诊断数据</div>
            <div className="mt-1 text-xs text-white/30">选择车辆查看诊断信息</div>
          </div>
        </div>
      )}
    </div>
  );
}
