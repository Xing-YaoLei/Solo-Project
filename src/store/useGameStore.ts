import { create } from 'zustand';
import type {
  GameState,
  GamePhase,
  ContractDecision,
  PlayerMeterReading,
  WorkOrderResult,
  WorkOrder,
  HistoryEntry,
} from '../types';
import { levelManager } from '../data/levelManager';
import {
  calculateInspectionScore,
  calculateContractScore,
  calculateMeterScore,
} from '../utils/scoring';

const initialInspectionState = {
  observed: false,
  playerRoute: [] as number[],
  score: 0,
};

const initialContractsState = {
  currentIndex: 0,
  decisions: [] as (ContractDecision | null)[],
  score: 0,
};

const initialMetersState = {
  readings: [] as (PlayerMeterReading | null)[],
  score: 0,
};

const initialWorkOrdersState = {
  activeOrders: [] as WorkOrder[],
  completedOrders: [] as WorkOrderResult[],
  timeoutCount: 0,
};

const initialHistory = {
  decisions: [] as HistoryEntry[],
  totalTime: 0,
  finalScore: 0,
  timestamp: 0,
};

const initialState: GameState = {
  currentLevelId: null,
  currentPhase: 'menu',
  score: 0,
  startTime: 0,
  phaseStartTime: 0,
  totalTime: 0,
  inspection: initialInspectionState,
  contracts: initialContractsState,
  meters: initialMetersState,
  workOrders: initialWorkOrdersState,
  history: initialHistory,
};

interface GameActions {
  startGame: (levelId: string) => void;
  setPhase: (phase: GamePhase) => void;
  addScore: (points: number) => void;
  setScore: (score: number) => void;
  
  setInspectionRoute: (route: number[]) => void;
  setInspectionObserved: (observed: boolean) => void;
  addPatrolPointToRoute: (pointIndex: number) => void;
  clearPlayerRoute: () => void;
  setInspectionScore: (score: number) => void;
  
  setContractDecision: (index: number, decision: ContractDecision) => void;
  setCurrentContractIndex: (index: number) => void;
  setContractsScore: (score: number) => void;
  
  setMeterReading: (meterId: string, reading: PlayerMeterReading) => void;
  setMetersScore: (score: number) => void;
  
  addActiveWorkOrder: (order: WorkOrder) => void;
  removeActiveWorkOrder: (orderId: string) => void;
  completeWorkOrder: (result: WorkOrderResult) => void;
  incrementTimeoutCount: () => void;
  
  addHistoryEntry: (entry: HistoryEntry) => void;
  finalizeHistory: (totalTime: number, finalScore: number) => void;
  
  calculateFinalScore: () => void;
  
  resetGame: () => void;
  resetPhase: () => void;
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  startGame: (levelId: string) => {
    const level = levelManager.getLevelById(levelId);
    const now = Date.now();
    
    const tenantCount = level?.contracts.tenants.length || 0;
    const meterCount = (level?.meters.waterMeters.length || 0) + (level?.meters.electricMeters.length || 0);
    
    set({
      currentLevelId: levelId,
      currentPhase: 'loading',
      startTime: now,
      phaseStartTime: now,
      score: 0,
      totalTime: 0,
      inspection: { ...initialInspectionState },
      contracts: { 
        ...initialContractsState, 
        decisions: new Array(tenantCount).fill(null),
      },
      meters: { 
        ...initialMetersState, 
        readings: new Array(meterCount).fill(null),
      },
      workOrders: { ...initialWorkOrdersState },
      history: { ...initialHistory, timestamp: now },
    });
  },

  setPhase: (phase: GamePhase) => {
    set({
      currentPhase: phase,
      phaseStartTime: Date.now(),
    });
  },

  addScore: (points: number) => {
    set((state) => ({ score: Math.max(0, state.score + points) }));
  },

  setScore: (score: number) => {
    set({ score });
  },

  setInspectionRoute: (route: number[]) => {
    set((state) => ({
      inspection: { ...state.inspection, playerRoute: route },
    }));
  },

  setInspectionObserved: (observed: boolean) => {
    set((state) => ({
      inspection: { ...state.inspection, observed },
    }));
  },

  addPatrolPointToRoute: (pointIndex: number) => {
    set((state) => ({
      inspection: {
        ...state.inspection,
        playerRoute: [...state.inspection.playerRoute, pointIndex],
      },
    }));
  },

  clearPlayerRoute: () => {
    set((state) => ({
      inspection: { ...state.inspection, playerRoute: [] },
    }));
  },

  setInspectionScore: (score: number) => {
    set((state) => ({
      inspection: { ...state.inspection, score },
    }));
  },

  setContractDecision: (index: number, decision: ContractDecision) => {
    set((state) => {
      const newDecisions = [...state.contracts.decisions];
      newDecisions[index] = decision;
      return {
        contracts: {
          ...state.contracts,
          decisions: newDecisions,
        },
      };
    });
  },

  setCurrentContractIndex: (index: number) => {
    set((state) => ({
      contracts: { ...state.contracts, currentIndex: index },
    }));
  },

  setContractsScore: (score: number) => {
    set((state) => ({
      contracts: { ...state.contracts, score },
    }));
  },

  setMeterReading: (meterId: string, reading: PlayerMeterReading) => {
    set((state) => {
      const level = levelManager.getLevelById(state.currentLevelId || '');
      if (!level) return state;
      
      const allMeters = [...level.meters.waterMeters, ...level.meters.electricMeters];
      const meterIndex = allMeters.findIndex((m) => m.id === meterId);
      
      if (meterIndex === -1) return state;
      
      const newReadings = [...state.meters.readings];
      newReadings[meterIndex] = reading;
      
      return {
        meters: {
          ...state.meters,
          readings: newReadings,
        },
      };
    });
  },

  setMetersScore: (score: number) => {
    set((state) => ({
      meters: { ...state.meters, score },
    }));
  },

  addActiveWorkOrder: (order: WorkOrder) => {
    set((state) => ({
      workOrders: {
        ...state.workOrders,
        activeOrders: [...state.workOrders.activeOrders, order],
      },
    }));
  },

  removeActiveWorkOrder: (orderId: string) => {
    set((state) => ({
      workOrders: {
        ...state.workOrders,
        activeOrders: state.workOrders.activeOrders.filter(
          (o) => o.id !== orderId
        ),
      },
    }));
  },

  completeWorkOrder: (result: WorkOrderResult) => {
    set((state) => ({
      workOrders: {
        ...state.workOrders,
        completedOrders: [...state.workOrders.completedOrders, result],
      },
    }));
  },

  incrementTimeoutCount: () => {
    set((state) => ({
      workOrders: {
        ...state.workOrders,
        timeoutCount: state.workOrders.timeoutCount + 1,
      },
    }));
  },

  addHistoryEntry: (entry: HistoryEntry) => {
    set((state) => ({
      history: {
        ...state.history,
        decisions: [...state.history.decisions, entry],
      },
    }));
  },

  finalizeHistory: (totalTime: number, finalScore: number) => {
    set((state) => ({
      history: {
        ...state.history,
        totalTime,
        finalScore,
      },
    }));
  },

  calculateFinalScore: () => {
    const state = get();
    const level = levelManager.getLevelById(state.currentLevelId || '');
    
    if (!level) return;

    const totalTime = Math.floor((Date.now() - state.startTime) / 1000);
    
    const inspectionScore = calculateInspectionScore(
      state.inspection.playerRoute,
      level.inspection.patrolRoute,
      level.scoring.inspectionWeight
    );
    
    const contractScore = calculateContractScore(
      state.contracts.decisions,
      level.contracts.tenants,
      level.contracts.correctAnswers,
      level.scoring.contractWeight
    );
    
    const allMeters = [...level.meters.waterMeters, ...level.meters.electricMeters];
    const meterReadingsMap: Record<string, number> = {};
    state.meters.readings.forEach((r) => {
      if (r) meterReadingsMap[r.meterId] = r.value;
    });
    
    const meterScore = calculateMeterScore(
      meterReadingsMap,
      allMeters,
      level.meters.tolerance,
      level.scoring.meterWeight
    );
    
    const totalScore = inspectionScore + contractScore + meterScore + state.score;
    
    set({
      score: Math.round(totalScore),
      totalTime,
      inspection: { ...state.inspection, score: inspectionScore },
      contracts: { ...state.contracts, score: contractScore },
      meters: { ...state.meters, score: meterScore },
    });
    
    get().finalizeHistory(totalTime, Math.round(totalScore));
  },

  resetGame: () => {
    set({ ...initialState });
  },

  resetPhase: () => {
    const state = get();
    switch (state.currentPhase) {
      case 'inspection':
        set({ inspection: { ...initialInspectionState } });
        break;
      case 'contract':
        set((state) => ({
          contracts: { 
            ...initialContractsState, 
            decisions: new Array(state.contracts.decisions.length).fill(null),
          },
        }));
        break;
      case 'meter':
        set((state) => ({
          meters: { 
            ...initialMetersState, 
            readings: new Array(state.meters.readings.length).fill(null),
          },
        }));
        break;
    }
    set({ phaseStartTime: Date.now() });
  },
}));

export default useGameStore;
