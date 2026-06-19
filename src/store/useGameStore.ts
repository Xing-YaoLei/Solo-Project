import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Level,
  Vehicle,
  Diagnosis,
  Station,
  Part,
  WorkOrder,
  GameRecord,
  ShortageModalState,
  ActivePanel,
  ShortageSolution,
  WorkOrderStatus,
} from '../types';

interface GameState {
  isLoading: boolean;
  loadingProgress: number;

  currentLevelId: string | null;
  levels: Level[];
  timeRemaining: number;
  isPaused: boolean;
  levelStartTime: number | null;

  score: number;
  reworkCount: number;
  completedCount: number;
  totalWorkOrders: number;

  selectedVehicleId: string | null;
  selectedDiagnosisId: string | null;
  selectedStationId: string | null;
  activePanel: ActivePanel;

  shortageModal: ShortageModalState;

  vehicles: Vehicle[];
  diagnoses: Diagnosis[];
  stations: Station[];
  parts: Part[];
  workOrders: WorkOrder[];

  gameRecords: GameRecord[];

  setLoading: (loading: boolean, progress?: number) => void;

  startLevel: (levelId: string) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  tickTime: () => void;

  selectVehicle: (vehicleId: string | null) => void;
  selectDiagnosis: (diagnosisId: string | null) => void;
  selectStation: (stationId: string | null) => void;
  setActivePanel: (panel: ActivePanel) => void;

  assignWorkOrder: (diagnosisId: string, stationId: string) => void;
  unassignWorkOrder: (workOrderId: string) => void;
  updateWorkOrderStatus: (workOrderId: string, status: WorkOrderStatus) => void;
  startWorkOrder: (workOrderId: string) => void;
  completeWorkOrder: (workOrderId: string, reworked?: boolean, reworkReason?: string) => void;

  openShortageModal: (partId: string, workOrderId: string, partName?: string) => void;
  closeShortageModal: () => void;
  handleShortage: (solution: ShortageSolution) => void;

  addScore: (points: number) => void;
  deductScore: (points: number) => void;

  finishLevel: () => GameRecord | null;
  resetGameState: () => void;
  resetAllProgress: () => void;

  loadLevelData: (
    level: Level,
    vehicles: Vehicle[],
    diagnoses: Diagnosis[],
    stations: Station[],
    parts: Part[]
  ) => void;

  unlockLevel: (levelId: string) => void;
  updateLevelBest: (levelId: string, stars: number, score: number) => void;

  addGameRecord: (record: GameRecord) => void;

  updatePartStock: (partId: string, delta: number) => void;
  setStationBusy: (stationId: string, busy: boolean, workOrderId?: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

const initialShortageModal: ShortageModalState = {
  open: false,
  partId: null,
  workOrderId: null,
  partName: undefined,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      isLoading: false,
      loadingProgress: 0,

      currentLevelId: null,
      levels: [],
      timeRemaining: 0,
      isPaused: false,
      levelStartTime: null,

      score: 0,
      reworkCount: 0,
      completedCount: 0,
      totalWorkOrders: 0,

      selectedVehicleId: null,
      selectedDiagnosisId: null,
      selectedStationId: null,
      activePanel: null,

      shortageModal: { ...initialShortageModal },

      vehicles: [],
      diagnoses: [],
      stations: [],
      parts: [],
      workOrders: [],

      gameRecords: [],

      setLoading: (loading, progress) =>
        set({ isLoading: loading, loadingProgress: progress ?? (loading ? 0 : 100) }),

      startLevel: (levelId) => {
        const level = get().levels.find((l) => l.id === levelId);
        if (!level) return;

        set({
          currentLevelId: levelId,
          timeRemaining: level.timeLimitSeconds,
          isPaused: false,
          levelStartTime: Date.now(),
          score: 0,
          reworkCount: 0,
          completedCount: 0,
          totalWorkOrders: 0,
          selectedVehicleId: null,
          selectedDiagnosisId: null,
          selectedStationId: null,
          activePanel: null,
          shortageModal: { ...initialShortageModal },
          workOrders: [],
        });
      },

      pauseGame: () => set({ isPaused: true }),
      resumeGame: () => set({ isPaused: false }),

      tickTime: () => {
        const { isPaused, timeRemaining } = get();
        if (isPaused || timeRemaining <= 0) return;
        set({ timeRemaining: Math.max(0, timeRemaining - 1) });
      },

      selectVehicle: (vehicleId) => {
        set({
          selectedVehicleId: vehicleId,
          selectedDiagnosisId: null,
          activePanel: vehicleId ? 'archive' : null,
        });
      },

      selectDiagnosis: (diagnosisId) => {
        set({
          selectedDiagnosisId: diagnosisId,
          activePanel: diagnosisId ? 'diagnosis' : get().activePanel,
        });
      },

      selectStation: (stationId) => set({ selectedStationId: stationId }),

      setActivePanel: (panel) => set({ activePanel: panel }),

      assignWorkOrder: (diagnosisId, stationId) => {
        const state = get();
        const diagnosis = state.diagnoses.find((d) => d.id === diagnosisId);
        if (!diagnosis) return;

        const existing = state.workOrders.find(
          (wo) => wo.diagnosisId === diagnosisId && wo.status !== 'completed' && wo.status !== 'reworked'
        );

        if (existing) {
          set({
            workOrders: state.workOrders.map((wo) =>
              wo.id === existing.id
                ? { ...wo, stationId, status: 'assigned' as WorkOrderStatus }
                : wo
            ),
          });
          return;
        }

        const newWorkOrder: WorkOrder = {
          id: generateId(),
          vehicleId: diagnosis.vehicleId,
          diagnosisId,
          stationId,
          status: 'assigned',
          startTime: null,
          endTime: null,
          reworked: false,
          reworkReason: null,
          actualMinutes: null,
        };

        set({
          workOrders: [...state.workOrders, newWorkOrder],
          totalWorkOrders: state.totalWorkOrders + 1,
        });
      },

      unassignWorkOrder: (workOrderId) => {
        const state = get();
        const workOrder = state.workOrders.find((wo) => wo.id === workOrderId);
        if (!workOrder || workOrder.status === 'in_progress') return;

        set({
          workOrders: state.workOrders.map((wo) =>
            wo.id === workOrderId
              ? { ...wo, stationId: null, status: 'pending' as WorkOrderStatus }
              : wo
          ),
        });
      },

      updateWorkOrderStatus: (workOrderId, status) =>
        set({
          workOrders: get().workOrders.map((wo) =>
            wo.id === workOrderId ? { ...wo, status } : wo
          ),
        }),

      startWorkOrder: (workOrderId) => {
        const state = get();
        const workOrder = state.workOrders.find((wo) => wo.id === workOrderId);
        if (!workOrder || !workOrder.stationId) return;

        const diagnosis = state.diagnoses.find((d) => d.id === workOrder.diagnosisId);
        if (!diagnosis) return;

        const usedAlternative = workOrder.shortageSolution === 'alternative' && workOrder.usedAlternativePartId;
        const shortageResolved = workOrder.shortageHandled && (
          workOrder.shortageSolution === 'wait' || workOrder.shortageSolution === 'alternative'
        );

        if (!usedAlternative && !shortageResolved) {
          let shortagePartId: string | null = null;
          let shortagePartName: string | undefined;

          for (const partId of diagnosis.requiredParts) {
            const part = state.parts.find((p) => p.id === partId);
            if (!part || part.stockCount <= 0) {
              shortagePartId = partId;
              shortagePartName = part?.name;
              break;
            }
          }

          if (shortagePartId) {
            if (workOrder.stationId) {
              get().setStationBusy(workOrder.stationId, true, workOrderId);
            }
            get().openShortageModal(shortagePartId, workOrderId, shortagePartName);
            return;
          }

          for (const partId of diagnosis.requiredParts) {
            get().updatePartStock(partId, -1);
          }
        }

        if (usedAlternative && workOrder.usedAlternativePartId) {
          const altPart = state.parts.find((p) => p.id === workOrder.usedAlternativePartId);
          if (altPart && altPart.stockCount > 0) {
            get().updatePartStock(workOrder.usedAlternativePartId, -1);
          }
        }

        if (workOrder.stationId) {
          get().setStationBusy(workOrder.stationId, true, workOrderId);
        }

        set({
          workOrders: state.workOrders.map((wo) =>
            wo.id === workOrderId
              ? { ...wo, status: 'in_progress' as WorkOrderStatus, startTime: Date.now() }
              : wo
          ),
        });
      },

      completeWorkOrder: (workOrderId, reworked = false, reworkReason) => {
        const state = get();
        const workOrder = state.workOrders.find((wo) => wo.id === workOrderId);
        if (!workOrder) return;

        if (workOrder.stationId) {
          get().setStationBusy(workOrder.stationId, false);
        }

        const baseScore = 100;
        const penalty = reworked ? 50 : 0;
        const finalScore = Math.max(0, baseScore - penalty);

        const newCompletedCount = state.completedCount + 1;
        const newReworkCount = reworked ? state.reworkCount + 1 : state.reworkCount;

        if (reworked) {
          get().deductScore(penalty);
        } else {
          get().addScore(finalScore);
        }

        set({
          workOrders: state.workOrders.map((wo) =>
            wo.id === workOrderId
              ? {
                  ...wo,
                  status: reworked ? ('reworked' as WorkOrderStatus) : ('completed' as WorkOrderStatus),
                  endTime: Date.now(),
                  reworked,
                  reworkReason: reworkReason ?? null,
                  actualMinutes: wo.startTime
                    ? Math.max(1, Math.round((Date.now() - wo.startTime) / 60000))
                    : null,
                }
              : wo
          ),
          completedCount: newCompletedCount,
          reworkCount: newReworkCount,
        });
      },

      openShortageModal: (partId, workOrderId, partName) =>
        set({
          shortageModal: {
            open: true,
            partId,
            workOrderId,
            partName,
          },
          isPaused: true,
        }),

      closeShortageModal: () =>
        set({
          shortageModal: { ...initialShortageModal },
          isPaused: false,
        }),

      handleShortage: (solution) => {
        const state = get();
        const { partId, workOrderId } = state.shortageModal;
        if (!partId || !workOrderId) {
          get().closeShortageModal();
          return;
        }

        const workOrder = state.workOrders.find((wo) => wo.id === workOrderId);
        const stationId = workOrder?.stationId;
        const part = state.parts.find((p) => p.id === partId);

        const releaseStation = () => {
          if (stationId) {
            get().setStationBusy(stationId, false);
          }
        };

        switch (solution) {
          case 'wait':
            if (partId) {
              get().updatePartStock(partId, 1);
            }
            set({
              timeRemaining: Math.max(0, state.timeRemaining - 30),
              workOrders: state.workOrders.map((wo) =>
                wo.id === workOrderId
                  ? {
                      ...wo,
                      shortageHandled: true,
                      shortageSolution: 'wait',
                      shortagePartId: partId,
                      stationId: null,
                      status: 'pending' as WorkOrderStatus,
                      startTime: null,
                    }
                  : wo
              ),
            });
            get().deductScore(20);
            releaseStation();
            break;

          case 'alternative': {
            const altPartId = part?.isAlternativeAvailable ? part.alternativePartId : undefined;
            set({
              workOrders: state.workOrders.map((wo) =>
                wo.id === workOrderId
                  ? {
                      ...wo,
                      shortageHandled: true,
                      shortageSolution: 'alternative',
                      usedAlternativePartId: altPartId ?? null,
                      shortagePartId: partId,
                      stationId: null,
                      status: 'pending' as WorkOrderStatus,
                      startTime: null,
                    }
                  : wo
              ),
            });
            get().deductScore(10);
            releaseStation();
            break;
          }

          case 'skip':
            set({
              workOrders: state.workOrders.map((wo) =>
                wo.id === workOrderId
                  ? {
                      ...wo,
                      shortageHandled: true,
                      shortageSolution: 'skip',
                      shortagePartId: partId,
                      status: 'skipped' as WorkOrderStatus,
                      reworked: true,
                      reworkReason: '跳过工序导致质量问题',
                      actualMinutes: null,
                    }
                  : wo
              ),
              reworkCount: state.reworkCount + 1,
              completedCount: state.completedCount + 1,
            });
            releaseStation();
            break;
        }

        get().closeShortageModal();
      },

      addScore: (points) => set({ score: get().score + points }),
      deductScore: (points) => set({ score: Math.max(0, get().score - points) }),

      finishLevel: () => {
        const state = get();
        if (!state.currentLevelId || !state.levelStartTime) return null;

        const level = state.levels.find((l) => l.id === state.currentLevelId);

        const totalDiagnoses = state.diagnoses.filter(
          (d) => d.vehicleId && state.vehicles.some((v) => v.id === d.vehicleId)
        ).length;

        const completedWorkOrders = state.workOrders.filter(
          (wo) => wo.status === 'completed' || wo.status === 'reworked' || wo.status === 'skipped'
        );
        const reworkedOrders = completedWorkOrders.filter((wo) => wo.reworked);

        const completionRate =
          totalDiagnoses > 0 ? completedWorkOrders.length / totalDiagnoses : 0;

        const repairRate =
          completedWorkOrders.length > 0
            ? reworkedOrders.length / completedWorkOrders.length
            : 0;

        const timeUsedSeconds = state.levelStartTime
          ? Math.floor((Date.now() - state.levelStartTime) / 1000)
          : 0;

        const timeBonus = Math.max(0, state.timeRemaining * 2);
        const finalScore = state.score + timeBonus;

        let stars = 0;
        if (completionRate >= 0.95 && repairRate <= 0.1) {
          stars = 3;
        } else if (completionRate >= 0.8 && repairRate <= 0.25) {
          stars = 2;
        } else if (completionRate >= 0.6 && repairRate <= 0.4) {
          stars = 1;
        }

        const uniqueVehicles = new Set(
          completedWorkOrders.map((wo) => wo.vehicleId)
        ).size;

        const shortageWaitCount = state.workOrders.filter(
          (wo) => wo.shortageHandled && wo.shortageSolution === 'wait'
        ).length;
        const shortageAlternativeCount = state.workOrders.filter(
          (wo) => wo.shortageHandled && wo.shortageSolution === 'alternative'
        ).length;
        const shortageSkipCount = state.workOrders.filter(
          (wo) => wo.shortageHandled && wo.shortageSolution === 'skip'
        ).length;
        const skipCount = state.workOrders.filter((wo) => wo.status === 'skipped').length;

        const record: GameRecord = {
          id: generateId(),
          levelId: state.currentLevelId,
          score: finalScore,
          stars,
          repairRate,
          completionRate,
          timestamp: Date.now(),
          timeUsedSeconds,
          totalVehicles: state.vehicles.length,
          completedVehicles: uniqueVehicles,
          reworkCount: state.reworkCount,
          skipCount,
          shortageWaitCount,
          shortageAlternativeCount,
          shortageSkipCount,
        };

        get().addGameRecord(record);
        get().updateLevelBest(state.currentLevelId, stars, finalScore);

        if (stars >= 1 && level) {
          const currentLevelIndex = state.levels.findIndex(
            (l) => l.id === state.currentLevelId
          );
          if (currentLevelIndex >= 0 && currentLevelIndex < state.levels.length - 1) {
            const nextLevel = state.levels[currentLevelIndex + 1];
            if (!nextLevel.unlocked) {
              get().unlockLevel(nextLevel.id);
            }
          }
        }

        set({
          isPaused: true,
        });

        return record;
      },

      resetGameState: () =>
        set({
          currentLevelId: null,
          timeRemaining: 0,
          isPaused: false,
          levelStartTime: null,
          score: 0,
          reworkCount: 0,
          completedCount: 0,
          totalWorkOrders: 0,
          selectedVehicleId: null,
          selectedDiagnosisId: null,
          selectedStationId: null,
          activePanel: null,
          shortageModal: { ...initialShortageModal },
          vehicles: [],
          diagnoses: [],
          stations: [],
          workOrders: [],
          isLoading: false,
          loadingProgress: 0,
        }),

      resetAllProgress: () =>
        set({
          isLoading: false,
          loadingProgress: 0,
          currentLevelId: null,
          levels: [],
          timeRemaining: 0,
          isPaused: false,
          levelStartTime: null,
          score: 0,
          reworkCount: 0,
          completedCount: 0,
          totalWorkOrders: 0,
          selectedVehicleId: null,
          selectedDiagnosisId: null,
          selectedStationId: null,
          activePanel: null,
          shortageModal: { ...initialShortageModal },
          vehicles: [],
          diagnoses: [],
          stations: [],
          parts: [],
          workOrders: [],
          gameRecords: [],
        }),

      loadLevelData: (level, vehicles, diagnoses, stations, parts) => {
        const existingLevels = get().levels;
        const levelExists = existingLevels.some((l) => l.id === level.id);

        set({
          levels: levelExists ? existingLevels : [...existingLevels, level],
          vehicles,
          diagnoses,
          stations,
          parts,
          workOrders: [],
          totalWorkOrders: 0,
        });
      },

      unlockLevel: (levelId) =>
        set({
          levels: get().levels.map((l) =>
            l.id === levelId ? { ...l, unlocked: true } : l
          ),
        }),

      updateLevelBest: (levelId, stars, score) =>
        set({
          levels: get().levels.map((l) =>
            l.id === levelId
              ? {
                  ...l,
                  bestStars: Math.max(l.bestStars, stars),
                  bestScore: Math.max(l.bestScore, score),
                }
              : l
          ),
        }),

      addGameRecord: (record) =>
        set({
          gameRecords: [...get().gameRecords, record],
        }),

      updatePartStock: (partId, delta) =>
        set({
          parts: get().parts.map((p) =>
            p.id === partId
              ? { ...p, stockCount: Math.max(0, p.stockCount + delta) }
              : p
          ),
        }),

      setStationBusy: (stationId, busy, workOrderId) =>
        set({
          stations: get().stations.map((s) =>
            s.id === stationId
              ? {
                  ...s,
                  busy,
                  currentWorkOrderId: busy ? workOrderId : undefined,
                }
              : s
          ),
        }),
    }),
    {
      name: 'auto-repair-game-storage',
      partialize: (state) => ({
        levels: state.levels,
        gameRecords: state.gameRecords,
      }),
    }
  )
);
