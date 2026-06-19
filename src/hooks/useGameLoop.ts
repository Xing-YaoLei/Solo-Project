import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { calculateReworkRisk } from '@/utils/rework';
import { useNavigate } from 'react-router-dom';
import type { WorkOrder, Diagnosis } from '@/types';

const TICK_INTERVAL_MS = 100;
const GAME_TIME_SCALE = 30;
const SHORTAGE_TRIGGER_CHANCE = 0.08;

function useGameLoop() {
  const navigate = useNavigate();
  const hasFinishedRef = useRef(false);
  const workOrderProgressRef = useRef<Map<string, number>>(new Map());
  const shortageCheckedRef = useRef<Set<string>>(new Set());

  const {
    isPaused,
    timeRemaining,
    currentLevelId,
    workOrders,
    diagnoses,
    parts,
    stations,
    shortageModal,
    tickTime,
    startWorkOrder,
    completeWorkOrder,
    finishLevel,
    openShortageModal,
    selectStation,
  } = useGameStore();

  const checkLevelEnd = useCallback(() => {
    if (!currentLevelId || hasFinishedRef.current) return;

    const levelDiagnoses = diagnoses.filter((d) =>
      stations.some((s) => s.levelId === currentLevelId)
        ? true
        : d.vehicleId && useGameStore.getState().vehicles.some((v) => v.id === d.vehicleId)
    );
    const totalDiagnoses = levelDiagnoses.length;

    const completedOrReworked = workOrders.filter(
      (wo) => wo.status === 'completed' || wo.status === 'reworked' || wo.status === 'skipped'
    ).length;

    const allDone = totalDiagnoses > 0 && completedOrReworked >= totalDiagnoses;
    const timeUp = timeRemaining <= 0;

    if (allDone || timeUp) {
      hasFinishedRef.current = true;
      const record = finishLevel();
      if (record) {
        setTimeout(() => {
          navigate(`/review/${currentLevelId}`);
        }, 300);
      }
    }
  }, [currentLevelId, diagnoses, stations, workOrders, timeRemaining, finishLevel, navigate]);

  const processInProgressOrders = useCallback(() => {
    if (isPaused || shortageModal.open) return;

    const state = useGameStore.getState();
    const tickProgressMinutes = (TICK_INTERVAL_MS / 1000) * (GAME_TIME_SCALE / 60) * 10;

    state.workOrders.forEach((wo: WorkOrder) => {
      if (wo.status === 'assigned' && wo.stationId && !wo.startTime) {
        const station = state.stations.find((s) => s.id === wo.stationId);
        if (station && !station.busy) {
          startWorkOrder(wo.id);
          workOrderProgressRef.current.set(wo.id, 0);

          if (!shortageCheckedRef.current.has(wo.id)) {
            shortageCheckedRef.current.add(wo.id);
            const diagnosis = state.diagnoses.find((d: Diagnosis) => d.id === wo.diagnosisId);
            if (diagnosis && diagnosis.requiredParts.length > 0) {
              const partId = diagnosis.requiredParts[0];
              const part = state.parts.find((p) => p.id === partId);
              const stock = part?.stockCount ?? 0;

              const shouldTriggerShortage = stock <= 0 || Math.random() < SHORTAGE_TRIGGER_CHANCE;
              if (shouldTriggerShortage && stock <= 0) {
                openShortageModal(partId, wo.id, part?.name);
              } else if (part && stock > 0 && Math.random() < SHORTAGE_TRIGGER_CHANCE * 0.3) {
                openShortageModal(partId, wo.id, part.name);
              }
            }
          }
        }
      }

      if (wo.status === 'in_progress' && wo.startTime) {
        const currentProgress = workOrderProgressRef.current.get(wo.id) ?? 0;
        const newProgress = currentProgress + tickProgressMinutes;
        workOrderProgressRef.current.set(wo.id, newProgress);

        const diagnosis = state.diagnoses.find((d: Diagnosis) => d.id === wo.diagnosisId);
        if (diagnosis) {
          const station = state.stations.find((s) => s.id === wo.stationId);
          const efficiency = station?.efficiencyMultiplier ?? 1;
          const requiredMinutes = diagnosis.estimatedMinutes / efficiency;

          if (newProgress >= requiredMinutes) {
            workOrderProgressRef.current.delete(wo.id);

            const skillMatched = station
              ? diagnosis.requiredSkills.some((skill) => station.skills.includes(skill)) ||
                (diagnosis.requiredSkill && station.skills.includes(diagnosis.requiredSkill))
              : false;

            const reworkResult = calculateReworkRisk({
              diagnosis,
              skillMatched,
              usedAlternative: wo.shortageSolution === 'alternative',
              skippedSteps: wo.shortageSolution === 'skip',
            });

            completeWorkOrder(wo.id, reworkResult.willRework, reworkResult.reworkReason);
          }
        }
      }
    });
  }, [isPaused, shortageModal.open, startWorkOrder, openShortageModal, completeWorkOrder]);

  useEffect(() => {
    if (!currentLevelId) return;

    hasFinishedRef.current = false;
    workOrderProgressRef.current.clear();
    shortageCheckedRef.current.clear();

    const intervalId = setInterval(() => {
      const state = useGameStore.getState();
      if (!state.isPaused && !state.shortageModal.open) {
        tickTime();
      }
      processInProgressOrders();
      checkLevelEnd();
    }, TICK_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [currentLevelId, tickTime, processInProgressOrders, checkLevelEnd]);

  useEffect(() => {
    if (currentLevelId) {
      hasFinishedRef.current = false;
    }
  }, [currentLevelId]);

  return null;
}

export default useGameLoop;
