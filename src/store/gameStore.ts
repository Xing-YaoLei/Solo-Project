import { create } from 'zustand';
import {
  GameState,
  GameMode,
  Difficulty,
  MaterialType,
  DeliveryBatch,
  GameEvent,
  PlayerAction,
  StuckPoint
} from '../types';
import {
  createInitialInventory,
  createDeliveryBatch,
  generateDailyUsages,
  generateRandomEvent,
  calculateInventory,
  calculateScore,
  checkAchievements,
  calculateStatistics
} from '../utils/gameUtils';
import { getConfigByDifficulty } from '../config/gameConfig';
import { getLevelById } from '../config/levels';

interface GameActions {
  initGame: (levelId: string, mode: GameMode) => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  nextDay: () => void;
  scheduleDelivery: (supplierId: string, materialType: MaterialType, quantity: number, daysAhead: number) => void;
  acceptDelivery: (deliveryId: string) => void;
  resolveEvent: (eventId: string) => void;
  useItem: (itemId: string) => void;
  recordAction: (action: string, details: Record<string, unknown>, thinkingTime?: number) => void;
  recordStuckPoint: (reason: string, duration: number) => void;
  completeSettlement: () => void;
  goToReview: () => void;
  resetGame: () => void;
  backToMenu: () => void;
  setDifficulty: (difficulty: Difficulty) => void;
  updateSupplierPosition: (supplierId: string, x: number, y: number) => void;
}

const initialState: Omit<GameState, 'mode' | 'difficulty'> = {
  phase: 'menu',
  levelId: null,
  currentDay: 0,
  currentTime: 0,
  isPaused: false,
  score: 0,
  totalScore: 1000,
  inventory: [],
  suppliers: [],
  deliveries: [],
  usageRecords: [],
  events: [],
  activeEvents: [],
  playerActions: [],
  achievements: [],
  itemCooldowns: {},
  statistics: {
    startTime: Date.now(),
    turnoverDays: {} as Record<MaterialType, number>,
    averageTurnoverDays: 0,
    totalShortages: 0,
    totalOverstock: 0,
    perfectDeliveries: 0,
    decisionsMade: 0,
    hintsUsed: 0
  },
  stuckPoints: [],
  lastActionTime: Date.now()
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  mode: 'training',
  difficulty: 'medium',
  ...initialState,

  initGame: (levelId: string, mode: GameMode) => {
    const level = getLevelById(levelId);
    if (!level) return;

    set({
      mode,
      levelId,
      difficulty: level.difficulty,
      phase: 'menu',
      currentDay: 0,
      currentTime: 0,
      isPaused: false,
      score: 1000,
      totalScore: 1000 + level.targetDays * 50,
      inventory: createInitialInventory(level),
      suppliers: level.suppliers.map(s => ({ ...s })),
      deliveries: [],
      usageRecords: [],
      events: [],
      activeEvents: [],
      playerActions: [],
      achievements: [],
      itemCooldowns: {},
      statistics: {
        startTime: Date.now(),
        turnoverDays: {} as Record<MaterialType, number>,
        averageTurnoverDays: 0,
        totalShortages: 0,
        totalOverstock: 0,
        perfectDeliveries: 0,
        decisionsMade: 0,
        hintsUsed: 0
      },
      stuckPoints: []
    });
  },

  startGame: () => {
    set({ phase: 'playing', currentDay: 1 });
    get().recordAction('game_start', {});
  },

  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),

  nextDay: () => {
    const state = get();
    const level = getLevelById(state.levelId || (state.mode === 'training' ? 'training_1' : 'free_1'));
    if (!level) return;

    const config = getConfigByDifficulty(state.difficulty);
    const nextDay = state.currentDay + 1;

    get().recordAction('day_advance', { day: nextDay, score: state.score });

    const dailyUsageCount = 3 + Math.floor(Math.random() * 3);
    const newUsages = generateDailyUsages(nextDay, dailyUsageCount, level.dailyDemandMultiplier);

    const arrivingDeliveries = state.deliveries
      .filter(d => d.status === 'pending' && d.scheduledDay <= nextDay)
      .map(d => {
        const supplier = state.suppliers.find(s => s.id === d.supplierId);
        const isShortage = Math.random() > (supplier?.reliability || 0.9);
        const shortageAmount = isShortage ? Math.floor(d.quantity * (0.1 + Math.random() * 0.3)) : 0;

        return {
          ...d,
          actualDay: nextDay,
          status: isShortage ? 'shortage' : 'arrived',
          shortageAmount: shortageAmount || undefined
        } as DeliveryBatch;
      });

    const otherDeliveries = state.deliveries.filter(
      d => d.status !== 'pending' || d.scheduledDay > nextDay
    );

    const allDeliveries = [...otherDeliveries, ...arrivingDeliveries];

    const updatedInventory = calculateInventory(state.inventory, newUsages, arrivingDeliveries);

    const newEvents: GameEvent[] = [];
    if (Math.random() < config.eventFrequency) {
      const event = generateRandomEvent(nextDay, allDeliveries);
      if (event) newEvents.push(event);
    }

    const activeEvents = [
      ...state.activeEvents.filter(e => !e.resolved),
      ...newEvents
    ];

    const allEvents = [...state.events, ...newEvents];

    const newScore = calculateScore(updatedInventory, activeEvents, config);

    const newItemCooldowns: Record<string, number> = {};
    Object.entries(state.itemCooldowns).forEach(([id, cd]) => {
      if (cd > 0) newItemCooldowns[id] = cd - 1;
    });

    const updatedStatistics = calculateStatistics({ ...state, inventory: updatedInventory }, nextDay);
    const newAchievements = checkAchievements(
      { ...state, inventory: updatedInventory, events: allEvents },
      updatedStatistics
    );

    set({
      currentDay: nextDay,
      usageRecords: [...state.usageRecords, ...newUsages],
      deliveries: allDeliveries,
      inventory: updatedInventory,
      events: allEvents,
      activeEvents,
      score: newScore,
      itemCooldowns: newItemCooldowns,
      achievements: newAchievements,
      statistics: updatedStatistics
    });

    if (nextDay >= level.targetDays) {
      set({ phase: 'settlement' });
      get().recordAction('game_complete', { finalDay: nextDay });
    }
  },

  scheduleDelivery: (supplierId: string, materialType: MaterialType, quantity: number, daysAhead: number) => {
    const state = get();
    const supplier = state.suppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    const scheduledDay = state.currentDay + daysAhead;
    const delivery = createDeliveryBatch(supplierId, materialType, quantity, scheduledDay);

    set(state => ({
      deliveries: [...state.deliveries, delivery]
    }));

    get().recordAction('schedule_delivery', {
      supplierId,
      materialType,
      quantity,
      scheduledDay,
      deliveryId: delivery.id
    });
  },

  acceptDelivery: (deliveryId: string) => {
    set(state => ({
      deliveries: state.deliveries.map(d =>
        d.id === deliveryId ? { ...d, status: 'accepted' } : d
      )
    }));
    get().recordAction('accept_delivery', { deliveryId });
  },

  resolveEvent: (eventId: string) => {
    set(state => ({
      events: state.events.map(e => e.id === eventId ? { ...e, resolved: true } : e),
      activeEvents: state.activeEvents.filter(e => e.id !== eventId)
    }));
    get().recordAction('resolve_event', { eventId });
  },

  useItem: (itemId: string) => {
    const state = get();
    const config = getConfigByDifficulty(state.difficulty);
    const item = config.items.find(i => i.id === itemId);
    if (!item) return;

    const cooldown = state.itemCooldowns[itemId] || 0;
    if (cooldown > 0) return;

    set(state => ({
      itemCooldowns: {
        ...state.itemCooldowns,
        [itemId]: item.cooldown
      }
    }));

    get().recordAction('use_item', { itemId, itemName: item.name });
  },

  recordAction: (action: string, details: Record<string, unknown>, thinkingTime?: number) => {
    const now = Date.now();
    const state = get();
    const config = getConfigByDifficulty(state.difficulty);
    const analytics = config.analytics;

    const calculatedThinkingTime = analytics.enabled && analytics.trackThinkingTime
      ? (thinkingTime ?? (now - state.lastActionTime))
      : undefined;

    const shouldTrackStuck = analytics.enabled && analytics.trackThinkingTime;
    const decisionActions = ['day_advance', 'schedule_delivery', 'accept_delivery', 'resolve_event', 'use_item'];
    if (shouldTrackStuck && decisionActions.includes(action) && calculatedThinkingTime && calculatedThinkingTime > 8000) {
      const targetDay = action === 'day_advance' && typeof details.day === 'number' ? details.day : state.currentDay;
      const levelForCheck = getLevelById(state.levelId || '');
      const isLastDay = action === 'day_advance' && typeof details.day === 'number' && levelForCheck ? details.day >= levelForCheck.targetDays : false;

      const stuckReason = action === 'day_advance'
        ? `推进至第${targetDay}天前犹豫${Math.round(calculatedThinkingTime / 1000)}秒，可能在纠结配送时机或等待到货${isLastDay ? '（收官决策）' : ''}`
        : action === 'schedule_delivery'
        ? `安排配送前思考${Math.round(calculatedThinkingTime / 1000)}秒，可能在权衡供应商和数量`
        : action === 'accept_delivery'
        ? `签收配送前犹豫${Math.round(calculatedThinkingTime / 1000)}秒，可能在核实到货情况`
        : action === 'resolve_event'
        ? `处理突发事件前思考${Math.round(calculatedThinkingTime / 1000)}秒，可能在评估影响`
        : `使用道具前犹豫${Math.round(calculatedThinkingTime / 1000)}秒`;

      const stuckPoint: StuckPoint = {
        timestamp: now,
        day: targetDay as number,
        reason: stuckReason,
        duration: calculatedThinkingTime
      };

      set(s => ({
        stuckPoints: [...s.stuckPoints, stuckPoint]
      }));
    }

    if (analytics.enabled && analytics.trackActions) {
      const playerAction: PlayerAction = {
        timestamp: now,
        action,
        details,
        thinkingTime: calculatedThinkingTime
      };

      set(s => ({
        playerActions: [...s.playerActions, playerAction],
        statistics: {
          ...s.statistics,
          decisionsMade: s.statistics.decisionsMade + 1
        }
      }));
    }

    set({ lastActionTime: now });
  },

  recordStuckPoint: (reason: string, duration: number) => {
    const state = get();
    const analytics = getConfigByDifficulty(state.difficulty).analytics;
    if (!analytics.enabled || !analytics.trackThinkingTime) return;

    const stuckPoint: StuckPoint = {
      timestamp: Date.now(),
      day: state.currentDay,
      reason,
      duration
    };

    set(s => ({
      stuckPoints: [...s.stuckPoints, stuckPoint]
    }));
  },

  completeSettlement: () => {
    set({ phase: 'review' });
    get().recordAction('settlement_complete', {});
  },

  goToReview: () => {
    set({ phase: 'review' });
  },

  resetGame: () => {
    const state = get();
    if (state.levelId) {
      get().initGame(state.levelId, state.mode);
    }
  },

  backToMenu: () => {
    set({ phase: 'menu' });
  },

  setDifficulty: (difficulty: Difficulty) => {
    set({ difficulty });
  },

  updateSupplierPosition: (supplierId: string, x: number, y: number) => {
    set(state => ({
      suppliers: state.suppliers.map(s =>
        s.id === supplierId
          ? { ...s, position: { x, y } }
          : s
      )
    }));
  }
}));

export const useGameMode = () => useGameStore(state => state.mode);
export const useGamePhase = () => useGameStore(state => state.phase);
export const useCurrentDay = () => useGameStore(state => state.currentDay);
export const useInventory = () => useGameStore(state => state.inventory);
export const useSuppliers = () => useGameStore(state => state.suppliers);
export const useDeliveries = () => useGameStore(state => state.deliveries);
export const useUsageRecords = () => useGameStore(state => state.usageRecords);
export const useActiveEvents = () => useGameStore(state => state.activeEvents);
export const useScore = () => useGameStore(state => state.score);
export const useAchievements = () => useGameStore(state => state.achievements);
