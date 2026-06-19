import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car,
  AlertCircle,
  CheckCircle2,
  Wrench,
  Play,
  Pause,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/store/useGameStore';
import { levels as defaultLevels } from '@/data/levels';
import { vehicles as allVehicles } from '@/data/vehicles';
import { diagnoses as allDiagnoses } from '@/data/diagnoses';
import { stations as allStations } from '@/data/stations';
import { parts as allParts } from '@/data/parts';
import HUD from '@/components/game/HUD';
import SidePanel from '@/components/game/SidePanel';
import ShortageModal from '@/components/game/ShortageModal';
import WorkshopScene from '@/components/three/WorkshopScene';
import useGameLoop from '@/hooks/useGameLoop';
import useKeyboardControls from '@/hooks/useKeyboardControls';
import type { Vehicle, WorkOrder } from '@/types';

function getVehicleStatus(
  vehicle: Vehicle,
  workOrders: WorkOrder[]
): { total: number; completed: number; pending: number; inProgress: number } {
  const vehicleOrders = workOrders.filter((wo) => wo.vehicleId === vehicle.id);
  const total = vehicle.diagnosisIds?.length ?? 0;
  const completed = vehicleOrders.filter(
    (wo) => wo.status === 'completed' || wo.status === 'reworked' || wo.status === 'skipped'
  ).length;
  const inProgress = vehicleOrders.filter(
    (wo) => wo.status === 'in_progress' || wo.status === 'assigned'
  ).length;
  const pending = Math.max(0, total - completed - inProgress);
  return { total, completed, pending, inProgress };
}

export default function GameScene() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();

  const {
    startLevel,
    loadLevelData,
    levels,
    vehicles,
    diagnoses,
    stations,
    parts,
    workOrders,
    selectedVehicleId,
    selectedStationId,
    selectVehicle,
    selectStation,
    setActivePanel,
    isPaused,
    pauseGame,
    resumeGame,
    isLoading,
    setLoading,
    currentLevelId,
  } = useGameStore();

  useGameLoop();
  useKeyboardControls();

  useEffect(() => {
    if (!levelId) {
      navigate('/levels');
      return;
    }

    setLoading(true, 10);

    const level =
      levels.find((l) => l.id === levelId) ||
      defaultLevels.find((l) => l.id === levelId);

    if (!level) {
      navigate('/levels');
      return;
    }

    setLoading(true, 30);

    const levelVehicles = allVehicles.filter((v) => level.vehicleIds.includes(v.id));
    const levelDiagnoses = allDiagnoses.filter((d) =>
      levelVehicles.some((v) => v.diagnosisIds.includes(d.id))
    );
    const levelStations = allStations.filter((s) => level.stationIds.includes(s.id));
    const levelParts = allParts
      .map((p) => {
        const inv = level.partInventory.find((pi) => pi.partId === p.id);
        return {
          ...p,
          stockCount: inv ? inv.stockCount : p.stockCount ?? 0,
        };
      })
      .filter((p) => {
        const hasInLevel = level.partInventory.some((pi) => pi.partId === p.id);
        const usedInDiagnoses = levelDiagnoses.some((d) => d.requiredParts.includes(p.id));
        const hasAlt = p.alternativePartId &&
          level.partInventory.some((pi) => pi.partId === p.alternativePartId);
        return hasInLevel || usedInDiagnoses || hasAlt;
      });

    setLoading(true, 70);

    loadLevelData(level, levelVehicles, levelDiagnoses, levelStations, levelParts);

    setTimeout(() => {
      startLevel(levelId);
      setLoading(false, 100);
    }, 300);
  }, [levelId, levels, navigate, loadLevelData, startLevel, setLoading]);

  const levelVehicles = useMemo(() => {
    return vehicles.filter((v) => v.levelId === currentLevelId);
  }, [vehicles, currentLevelId]);

  const vehiclePlacements = useMemo(() => {
    const placements: Record<
      string,
      { stationId?: string; positionX?: number; positionZ?: number }
    > = {};
    workOrders.forEach((wo) => {
      if (
        wo.stationId &&
        (wo.status === 'assigned' || wo.status === 'in_progress' || wo.status === 'rework')
      ) {
        placements[wo.vehicleId] = { stationId: wo.stationId };
      }
    });
    return placements;
  }, [workOrders]);

  const handleSelectVehicle = (vehicle: Vehicle) => {
    if (selectedVehicleId === vehicle.id) {
      selectVehicle(null);
    } else {
      selectVehicle(vehicle.id);
      setActivePanel('archive');
    }
  };

  const handleSelectStation = (station: { id: string }) => {
    if (selectedStationId === station.id) {
      selectStation(null);
    } else {
      selectStation(station.id);
    }
  };

  if (isLoading || !currentLevelId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F172A]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
          <div className="text-lg font-medium text-white/80">正在加载关卡...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0F172A]">
      <HUD />

      <div className="flex h-full w-full pt-20">
        <motion.div
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="flex h-full w-72 flex-shrink-0 flex-col gap-3 overflow-hidden border-r border-white/5 bg-slate-900/50 p-4 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                <Car className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">待修车辆</div>
                <div className="text-xs text-white/40">共 {levelVehicles.length} 辆</div>
              </div>
            </div>
            <button
              onClick={isPaused ? resumeGame : pauseGame}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                'bg-white/5 hover:bg-white/10 border border-white/10',
                'active:scale-95'
              )}
            >
              {isPaused ? (
                <Play className="h-4 w-4 text-emerald-400" />
              ) : (
                <Pause className="h-4 w-4 text-white/70" />
              )}
            </button>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
            {levelVehicles.map((vehicle, index) => {
              const status = getVehicleStatus(vehicle, workOrders);
              const isSelected = selectedVehicleId === vehicle.id;
              const isAllDone = status.completed >= status.total && status.total > 0;

              return (
                <motion.button
                  key={vehicle.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.06 }}
                  onClick={() => handleSelectVehicle(vehicle)}
                  className={cn(
                    'group relative w-full overflow-hidden rounded-2xl border p-3.5 text-left transition-all',
                    isSelected
                      ? 'border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                      : isAllDone
                      ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/40 hover:bg-emerald-500/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]',
                    'active:scale-[0.98]'
                  )}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="vehicleSelectedIndicator"
                      className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-400 to-cyan-400"
                    />
                  )}

                  <div className="flex items-start gap-3 pl-1">
                    <div
                      className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${vehicle.color}22`,
                      }}
                    >
                      <div
                        className="h-5 w-5 rounded-full ring-2 ring-white/20"
                        style={{ backgroundColor: vehicle.color }}
                      />
                      {status.inProgress > 0 && (
                        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 ring-2 ring-slate-900">
                          <Wrench className="h-2.5 w-2.5 text-white animate-pulse" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="truncate text-sm font-semibold text-white">
                          {vehicle.brand} {vehicle.model.split(' ')[0]}
                        </h4>
                        <span
                          className={cn(
                            'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums',
                            status.total > 0 && status.pending === status.total
                              ? 'bg-amber-500/20 text-amber-400'
                              : status.inProgress > 0
                              ? 'bg-blue-500/20 text-blue-400'
                              : isAllDone
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-white/10 text-white/70'
                          )}
                        >
                          {status.total - status.completed}
                        </span>
                      </div>

                      <div className="mt-0.5 flex items-center gap-2 text-xs text-white/50">
                        <span className="font-mono tracking-wide">{vehicle.plateNumber}</span>
                      </div>

                      <div className="mt-2 flex items-center gap-1.5">
                        {Array.from({ length: Math.min(status.total, 5) }).map((_, i) => {
                          const isCompleted = i < status.completed;
                          const isCurrent =
                            !isCompleted && i < status.completed + status.inProgress;
                          return (
                            <div
                              key={i}
                              className={cn(
                                'h-1.5 flex-1 rounded-full transition-all',
                                isCompleted
                                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                                  : isCurrent
                                  ? 'bg-gradient-to-r from-blue-400 to-cyan-400 animate-pulse'
                                  : 'bg-white/10'
                              )}
                            />
                          );
                        })}
                      </div>

                      <div className="mt-1.5 flex items-center gap-2">
                        {status.inProgress > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                            <Wrench className="h-2.5 w-2.5" />
                            {status.inProgress} 维修中
                          </span>
                        )}
                        {isAllDone && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            已完成
                          </span>
                        )}
                        {status.pending > 0 && status.inProgress === 0 && !isAllDone && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                            <AlertCircle className="h-2.5 w-2.5" />
                            {status.pending} 待处理
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}

            {levelVehicles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Car className="mb-3 h-10 w-10 text-white/20" />
                <div className="text-sm text-white/40">暂无车辆</div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-white/30">
              快捷键
            </div>
            <div className="space-y-1.5 text-[11px] text-white/50">
              <div className="flex items-center justify-between">
                <span>选择工位</span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white/70">
                  1 - 5
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>暂停 / 继续</span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white/70">
                  Space
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>返回选关</span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white/70">
                  Esc
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="relative flex-1 overflow-hidden">
          <WorkshopScene
            stations={stations.filter((s) => s.levelId === currentLevelId)}
            vehicles={levelVehicles}
            workOrders={workOrders}
            selectedStationId={selectedStationId}
            selectedVehicleId={selectedVehicleId}
            onSelectStation={handleSelectStation}
            onSelectVehicle={handleSelectVehicle}
            vehiclePlacements={vehiclePlacements}
          />

          <AnimatePresence>
            {isPaused && !useGameStore.getState().shortageModal.open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.95, y: 10, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-slate-900/90 px-10 py-8 shadow-2xl backdrop-blur-2xl"
                >
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/30">
                      <Pause className="h-10 w-10 text-amber-400" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white">游戏已暂停</h2>
                    <p className="mt-1 text-sm text-white/50">按空格键或点击按钮继续游戏</p>
                  </div>
                  <button
                    onClick={resumeGame}
                    className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98]"
                  >
                    <Play className="h-4 w-4" />
                    继续游戏
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <SidePanel />
      </div>

      <ShortageModal />
    </div>
  );
}
