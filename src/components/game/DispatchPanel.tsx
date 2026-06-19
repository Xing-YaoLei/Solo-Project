import { useGameStore } from '@/store/useGameStore';
import {
  checkSkillMatch,
  checkDispatchConstraints,
  getStationWorkload,
  recommendStations,
} from '@/utils/dispatch';
import { calculateReworkRisk, getRiskLevel } from '@/utils/rework';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Wrench,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Link2,
  Star,
  ChevronLeft,
  Stethoscope,
  Users,
  BarChart3,
  AlertOctagon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SkillTag } from '@/types';

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

export default function DispatchPanel() {
  const {
    selectedDiagnosisId,
    selectDiagnosis,
    setActivePanel,
    diagnoses,
    stations,
    workOrders,
    assignWorkOrder,
    vehicles,
    selectedVehicleId,
  } = useGameStore();

  const selectedDiagnosis = diagnoses.find((d) => d.id === selectedDiagnosisId);
  const completedOrders = workOrders.filter(
    (wo) => wo.status === 'completed' || wo.status === 'reworked'
  );
  const currentTime = Date.now();

  const selectedVehicle = selectedDiagnosis
    ? vehicles.find((v) => v.id === selectedDiagnosis.vehicleId)
    : selectedVehicleId
    ? vehicles.find((v) => v.id === selectedVehicleId)
    : null;

  const recommendMap = recommendStations(
    selectedDiagnosis ? [selectedDiagnosis] : [],
    stations,
    workOrders,
    completedOrders,
    currentTime
  );
  const recommendations = selectedDiagnosis
    ? recommendMap.get(selectedDiagnosis.id) || []
    : [];

  const handleAssign = (stationId: string) => {
    if (!selectedDiagnosisId) return;
    assignWorkOrder(selectedDiagnosisId, stationId);
  };

  if (!selectedDiagnosis) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5">
          <ClipboardList className="h-10 w-10 text-white/30" />
        </div>
        <div>
          <div className="text-lg font-medium text-white/70">未选择工序</div>
          <div className="mt-1 text-sm text-white/40">从诊断面板中选择一个工序进行分配</div>
          <button
            onClick={() => setActivePanel('diagnosis')}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-500/20 px-4 py-2 text-sm text-blue-400 transition-all hover:bg-blue-500/30"
          >
            <Stethoscope className="h-4 w-4" />
            前往诊断
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-5">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 p-5"
      >
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20">
            <Wrench className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-white/50">当前选中工序</div>
            <div className="text-base font-semibold text-white">{selectedDiagnosis.faultName}</div>
          </div>
          <button
            onClick={() => {
              selectDiagnosis(null);
              setActivePanel('diagnosis');
            }}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/70 transition-all hover:bg-white/20"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>返回诊断</span>
          </button>
        </div>

        {selectedVehicle && (
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${selectedVehicle.color}22` }}
            >
              <div
                className="h-5 w-5 rounded-full"
                style={{ backgroundColor: selectedVehicle.color }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">
                {selectedVehicle.brand} {selectedVehicle.model}
              </div>
              <div className="text-xs text-white/50">{selectedVehicle.plateNumber}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <Clock className="h-3 w-3" />
              预计工时
            </div>
            <div className="mt-1 text-lg font-bold text-white">
              {selectedDiagnosis.estimatedMinutes}分钟
            </div>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <Wrench className="h-3 w-3" />
              所需技能
            </div>
            <div className="mt-1 text-lg font-bold text-white">
              {selectedDiagnosis.requiredSkill
                ? skillTextMap[selectedDiagnosis.requiredSkill] || selectedDiagnosis.requiredSkill
                : selectedDiagnosis.requiredSkills
                    .map((s) => skillTextMap[s] || s)
                    .slice(0, 2)
                    .join('、')}
            </div>
          </div>
        </div>

        {selectedDiagnosis.dependencies.length > 0 && (
          <div className="mt-3 rounded-xl bg-amber-500/10 p-3">
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <Link2 className="h-3.5 w-3.5" />
              <span className="font-medium">前置依赖工序</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedDiagnosis.dependencies.map((depId) => {
                const depDiag = diagnoses.find((d) => d.id === depId);
                const isDone = completedOrders.some((o) => o.diagnosisId === depId);
                return (
                  <span
                    key={depId}
                    className={cn(
                      'flex items-center gap-1 rounded-md border px-2 py-1 text-xs',
                      isDone
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                    )}
                  >
                    {isDone ? (
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
      </motion.div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20">
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">可用工位</div>
            <div className="text-xs text-white/50">
              共 {stations.length} 个工位 · 推荐按匹配度排序
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, idx) => {
          const { station, score, warnings } = rec;
          const constraints = checkDispatchConstraints({
            station,
            diagnosis: selectedDiagnosis,
            allDiagnoses: diagnoses,
            stationOrders: workOrders,
            completedOrders,
            currentTime,
          });
          const skillCheck = checkSkillMatch(station, selectedDiagnosis);
          const workload = getStationWorkload(station, workOrders, currentTime);
          const workloadPercent = Math.min(100, (workload / 120) * 100);

          const reworkRisk = calculateReworkRisk({
            diagnosis: selectedDiagnosis,
            skillMatched: skillCheck.matched,
            usedAlternative: false,
            skippedSteps: false,
          });
          const riskLevel = getRiskLevel(reworkRisk.reworkProbability);

          const matchGrade =
            score >= 90 ? { label: '完美', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30', stars: 3 } :
            score >= 70 ? { label: '优秀', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30', stars: 2 } :
            score >= 50 ? { label: '一般', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30', stars: 1 } :
            { label: '不推荐', color: 'text-red-400 bg-red-500/20 border-red-500/30', stars: 0 };

          const canAssign = constraints.valid;

          return (
            <motion.div
              key={station.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div
                className={cn(
                  'relative overflow-hidden rounded-2xl border p-4 transition-all',
                  canAssign
                    ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                    : 'border-red-500/20 bg-red-500/5 opacity-70'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-2xl',
                      station.busy
                        ? 'bg-amber-500/20'
                        : skillCheck.matched
                        ? 'bg-emerald-500/20'
                        : 'bg-white/10'
                    )}>
                      <Wrench
                        className={cn(
                          'h-7 w-7',
                          station.busy
                            ? 'text-amber-400'
                            : skillCheck.matched
                            ? 'text-emerald-400'
                            : 'text-white/50'
                        )}
                      />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white">{station.name}</h3>
                        <p className="mt-0.5 line-clamp-1 text-xs text-white/50">
                          {station.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={cn(
                            'flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold',
                            matchGrade.color
                          )}
                        >
                          {matchGrade.label}
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'h-3 w-3',
                                  i < matchGrade.stars ? 'fill-current' : 'opacity-30'
                                )}
                              />
                            ))}
                          </div>
                        </span>
                        <span className="text-[10px] text-white/40 tabular-nums">
                          匹配度 {score}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {station.skills.slice(0, 4).map((skill) => {
                        const skillName = skillTextMap[skill] || skill;
                        const isRequired =
                          selectedDiagnosis.requiredSkill === skill ||
                          selectedDiagnosis.requiredSkills.includes(skill);
                        return (
                          <span
                            key={skill}
                            className={cn(
                              'rounded-md border px-2 py-0.5 text-xs',
                              isRequired
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                : 'border-white/10 bg-white/5 text-white/60'
                            )}
                          >
                            {skillName}
                            {isRequired && <CheckCircle2 className="ml-1 inline h-2.5 w-2.5" />}
                          </span>
                        );
                      })}
                      {station.skills.length > 4 && (
                        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/40">
                          +{station.skills.length - 4}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-2">
                      <div>
                        <div className="mb-1 flex items-center justify-between text-[10px]">
                          <span className="flex items-center gap-1 text-white/40">
                            <BarChart3 className="h-3 w-3" />
                            工位负载
                          </span>
                          <span
                            className={cn(
                              'tabular-nums',
                              workloadPercent > 80
                                ? 'text-red-400'
                                : workloadPercent > 50
                                ? 'text-yellow-400'
                                : 'text-white/60'
                            )}
                          >
                            {workload > 0 ? `${Math.round(workload)}分钟` : '空闲'}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            className={cn(
                              'h-full rounded-full',
                              workloadPercent > 80
                                ? 'bg-gradient-to-r from-red-500 to-orange-500'
                                : workloadPercent > 50
                                ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${workloadPercent}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[10px]">
                          <AlertTriangle className={cn('h-3 w-3', riskLevel.color)} />
                          <span className="text-white/40">返修风险：</span>
                          <span className={cn('font-medium', riskLevel.color)}>
                            {riskLevel.label}
                          </span>
                        </div>
                        {station.busy && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-400">
                            <Zap className="h-3 w-3 animate-pulse" />
                            正在工作
                          </div>
                        )}
                      </div>
                    </div>

                    {constraints.reasons.length > 0 && (
                      <div className="mt-3 space-y-1 rounded-xl bg-red-500/10 p-2.5">
                        {constraints.reasons.map((reason, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-1.5 text-[10px] text-red-400"
                          >
                            <AlertOctagon className="mt-0.5 h-3 w-3 flex-shrink-0" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {warnings.length > 0 && constraints.reasons.length === 0 && (
                      <div className="mt-3 space-y-1 rounded-xl bg-amber-500/10 p-2.5">
                        {warnings.slice(0, 2).map((warning, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-1.5 text-[10px] text-amber-400"
                          >
                            <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                            <span>{warning}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4">
                      <button
                        onClick={() => handleAssign(station.id)}
                        disabled={!canAssign}
                        className={cn(
                          'w-full rounded-xl py-2.5 text-sm font-semibold transition-all',
                          canAssign
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-400 hover:to-cyan-400 active:scale-[0.98] shadow-lg shadow-blue-500/20'
                            : 'bg-white/5 text-white/30 cursor-not-allowed'
                        )}
                      >
                        {canAssign ? '分配到此工位' : constraints.timeConflict ? '工位繁忙中' : '前置未完成'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {stations.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02]">
          <Users className="h-12 w-12 text-white/20" />
          <div className="text-center">
            <div className="text-sm font-medium text-white/50">暂无可用工位</div>
            <div className="mt-1 text-xs text-white/30">请检查关卡配置</div>
          </div>
        </div>
      )}
    </div>
  );
}
