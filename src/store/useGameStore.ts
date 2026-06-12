import { create } from 'zustand';
import type { GamePhase, Point, Item, GameEvent, DeviceStatus, DifficultyLevel, FaultType, EventOption } from '@/types/game';
import type { GameResult } from '@/types/tracking';
import { useConfigStore } from './useConfigStore';
import { useTrackingStore, getErrorType } from './useTrackingStore';

const STORE_NAMES = ['南京路店', '外滩店', '陆家嘴店', '新天地店', '静安寺店', '徐家汇店', '人民广场店', '中山公园店', '五角场店', '迪士尼店', '豫园店', '田子坊店', '思南公馆店', '衡山路店', '武康路店', '巨鹿路店'];
const DEVICE_TYPES = ['意式咖啡机', '美式滴滤机', '磨豆机', '奶泡机', '冷藏柜', '冷冻柜', '制冰机', '开水机', '消毒柜', '洗碗机'];

const generatePoints = (count: number, faultProb: number, cleanProb: number): Point[] => {
  const points: Point[] = [];
  const faultTypes: FaultType[] = ['leak', 'blockage', 'electrical', 'mechanical', 'heating'];

  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let status: DeviceStatus = 'normal';
    let faultType: FaultType | undefined;

    if (rand < faultProb) {
      status = 'fault';
      faultType = faultTypes[Math.floor(Math.random() * faultTypes.length)];
    } else if (rand < faultProb + cleanProb) {
      status = 'need_clean';
    }

    points.push({
      id: `point-${i}`,
      name: `设备 #${i + 1}`,
      deviceType: DEVICE_TYPES[Math.floor(Math.random() * DEVICE_TYPES.length)],
      storeName: STORE_NAMES[i % STORE_NAMES.length],
      status,
      isCompleted: false,
      photoUrl: `/assets/photos/device-${(i % 8) + 1}.jpg`,
      faultType,
      decisionSwitchCount: 0,
    });
  }

  return points;
};

const generateEventOptions = (): EventOption[] => [
  {
    id: 'remote_restart',
    label: '远程重启',
    description: '尝试远程重启设备，成功率70%',
    scoreImpact: 50,
    timeImpact: -10,
  },
  {
    id: 'onsite',
    label: '现场处理',
    description: '立即前往现场处理，耗时但稳妥',
    scoreImpact: 100,
    timeImpact: -30,
  },
  {
    id: 'ignore',
    label: '暂时忽略',
    description: '标记为待处理，后续跟进',
    scoreImpact: -20,
    timeImpact: 0,
  },
];

interface GameState {
  phase: GamePhase;
  points: Point[];
  currentPointId: string | null;
  timeRemaining: number;
  totalTime: number;
  score: number;
  items: Item[];
  activeEvent: GameEvent | null;
  result: GameResult | null;
  hintedPointId: string | null;
  pausedTimeRemaining: number;
  eventTriggeredCount: number;
  maxEvents: number;

  startGame: () => void;
  selectPoint: (pointId: string) => void;
  makeDecision: (pointId: string, decision: DeviceStatus) => void;
  useItem: (itemId: string) => void;
  triggerEvent: () => void;
  handleEventChoice: (optionId: string) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  updateTimer: (delta: number) => void;
  updateItemCooldowns: (delta: number) => void;
  endGame: () => void;
  restartGame: () => void;
  incrementDecisionSwitch: (pointId: string) => void;
  setPhase: (phase: GamePhase) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'start',
  points: [],
  currentPointId: null,
  timeRemaining: 0,
  totalTime: 0,
  score: 0,
  items: [],
  activeEvent: null,
  result: null,
  hintedPointId: null,
  pausedTimeRemaining: 0,
  eventTriggeredCount: 0,
  maxEvents: 0,

  startGame: () => {
    const config = useConfigStore.getState();
    const diffConfig = config.difficulty[config.currentDifficulty];
    const trackingStore = useTrackingStore.getState();

    trackingStore.clear();

    const points = generatePoints(
      diffConfig.pointCount,
      diffConfig.faultProbability,
      diffConfig.cleanProbability
    );

    const items: Item[] = config.items.map((item) => ({
      ...item,
      currentCooldown: 0,
    }));

    set({
      phase: 'playing',
      points,
      currentPointId: points[0]?.id || null,
      timeRemaining: diffConfig.totalTime,
      totalTime: diffConfig.totalTime,
      score: 0,
      items,
      activeEvent: null,
      result: null,
      hintedPointId: null,
      eventTriggeredCount: 0,
      maxEvents: diffConfig.eventFrequency,
    });

    trackingStore.recordOperation('game_start');
  },

  selectPoint: (pointId) => {
    const state = get();
    const point = state.points.find((p) => p.id === pointId);
    if (!point || point.isCompleted) return;

    const trackingStore = useTrackingStore.getState();
    trackingStore.recordPointView(pointId);

    set({
      currentPointId: pointId,
      points: state.points.map((p) =>
        p.id === pointId ? { ...p, viewedAt: Date.now() } : p
      ),
    });
  },

  makeDecision: (pointId, decision) => {
    const state = get();
    const point = state.points.find((p) => p.id === pointId);
    if (!point || point.isCompleted) return;

    const isCorrect = decision === point.status;
    const scoreChange = isCorrect ? 100 : -50;
    const now = Date.now();
    const decisionTime = point.viewedAt ? (now - point.viewedAt) / 1000 : 0;

    const trackingStore = useTrackingStore.getState();
    trackingStore.recordPointDecision({
      pointId,
      viewedAt: point.viewedAt || now,
      decisionMadeAt: now,
      decisionTime,
      playerDecision: decision,
      actualStatus: point.status,
      isCorrect,
      errorType: getErrorType(decision, point.status),
      decisionSwitchCount: point.decisionSwitchCount || 0,
    });

    const config = useConfigStore.getState();
    const isStuckPoint =
      decisionTime > config.tracking.stuckThreshold ||
      (point.decisionSwitchCount || 0) > 2;

    set((prev) => ({
      points: prev.points.map((p) =>
        p.id === pointId
          ? {
              ...p,
              isCompleted: true,
              playerDecision: decision,
              isCorrect,
              decisionTime,
              isStuckPoint,
            }
          : p
      ),
      score: prev.score + scoreChange,
      phase: 'playing',
      hintedPointId: null,
    }));

    trackingStore.recordOperation(`decision_${isCorrect ? 'correct' : 'wrong'}:${pointId}`);
  },

  useItem: (itemId) => {
    const state = get();
    const item = state.items.find((i) => i.id === itemId);
    if (!item || item.currentCooldown > 0) return;

    const config = useConfigStore.getState();
    const itemConfig = config.items.find((i) => i.id === itemId);
    if (!itemConfig) return;

    const trackingStore = useTrackingStore.getState();
    const currentPoint = state.points.find((p) => p.id === state.currentPointId);

    let effectApplied = false;

    if (itemId === 'clean_tool' && currentPoint?.status === 'need_clean') {
      get().makeDecision(currentPoint.id, 'need_clean');
      effectApplied = true;
    } else if (itemId === 'repair_button' && currentPoint?.status === 'fault') {
      get().makeDecision(currentPoint.id, 'fault');
      effectApplied = true;
    } else if (itemId === 'pause_item') {
      set({ pausedTimeRemaining: 10 });
      effectApplied = true;
    } else if (itemId === 'hint_item' && currentPoint && !currentPoint.isCompleted) {
      set({ hintedPointId: currentPoint.id });
      effectApplied = true;
    }

    trackingStore.recordItemUsage({
      itemId,
      usedAt: Date.now(),
      usedOnPoint: state.currentPointId || undefined,
      effectApplied,
    });

    set((prev) => ({
      items: prev.items.map((i) =>
        i.id === itemId ? { ...i, currentCooldown: itemConfig.cooldown } : i
      ),
    }));

    trackingStore.recordOperation(`item_used:${itemId}`);
  },

  triggerEvent: () => {
    const state = get();
    if (state.activeEvent || state.eventTriggeredCount >= state.maxEvents) return;

    const uncompletedPoints = state.points.filter((p) => !p.isCompleted);
    if (uncompletedPoints.length === 0) return;

    const randomPoint = uncompletedPoints[Math.floor(Math.random() * uncompletedPoints.length)];

    const event: GameEvent = {
      id: `event-${Date.now()}`,
      type: 'device_offline',
      pointId: randomPoint.id,
      triggeredAt: Date.now(),
      options: generateEventOptions(),
    };

    set({
      activeEvent: event,
      phase: 'event',
      eventTriggeredCount: state.eventTriggeredCount + 1,
    });

    useTrackingStore.getState().recordOperation(`event_triggered:${event.id}`);
  },

  handleEventChoice: (optionId) => {
    const state = get();
    if (!state.activeEvent) return;

    const option = state.activeEvent.options.find((o) => o.id === optionId);
    if (!option) return;

    const trackingStore = useTrackingStore.getState();
    trackingStore.recordEvent({
      eventId: state.activeEvent.id,
      triggeredAt: state.activeEvent.triggeredAt,
      playerChoice: optionId,
      choiceMadeAt: Date.now(),
      choiceTime: (Date.now() - state.activeEvent.triggeredAt) / 1000,
    });

    set((prev) => ({
      activeEvent: null,
      phase: 'playing',
      score: prev.score + option.scoreImpact,
      timeRemaining: Math.max(0, prev.timeRemaining + option.timeImpact),
    }));

    trackingStore.recordOperation(`event_handled:${optionId}`);
  },

  pauseGame: () => set({ phase: 'paused' }),

  resumeGame: () => set({ phase: 'playing' }),

  updateTimer: (delta) => {
    const state = get();
    if (state.phase !== 'playing') return;

    if (state.pausedTimeRemaining > 0) {
      set({ pausedTimeRemaining: Math.max(0, state.pausedTimeRemaining - delta / 1000) });
      return;
    }

    const newTime = state.timeRemaining - delta / 1000;
    if (newTime <= 0) {
      set({ timeRemaining: 0 });
      get().endGame();
    } else {
      set({ timeRemaining: newTime });
    }
  },

  updateItemCooldowns: (delta) => {
    set((state) => ({
      items: state.items.map((item) => ({
        ...item,
        currentCooldown: Math.max(0, item.currentCooldown - delta / 1000),
      })),
    }));
  },

  endGame: () => {
    const state = get();
    const trackingStore = useTrackingStore.getState();

    const completedPoints = state.points.filter((p) => p.isCompleted).length;
    const isTimeOut = state.timeRemaining <= 0;
    const timeUsed = state.totalTime - state.timeRemaining;

    const result = trackingStore.generateResult(
      state.points.length,
      completedPoints,
      state.totalTime,
      timeUsed,
      isTimeOut,
      state.score
    );

    set({ phase: 'result', result });
    trackingStore.recordOperation('game_end');
  },

  restartGame: () => {
    useTrackingStore.getState().clear();
    set({
      phase: 'start',
      points: [],
      currentPointId: null,
      timeRemaining: 0,
      totalTime: 0,
      score: 0,
      items: [],
      activeEvent: null,
      result: null,
      hintedPointId: null,
      pausedTimeRemaining: 0,
      eventTriggeredCount: 0,
      maxEvents: 0,
    });
  },

  incrementDecisionSwitch: (pointId) => {
    set((state) => ({
      points: state.points.map((p) =>
        p.id === pointId
          ? { ...p, decisionSwitchCount: (p.decisionSwitchCount || 0) + 1 }
          : p
      ),
    }));
  },

  setPhase: (phase) => set({ phase }),
}));
