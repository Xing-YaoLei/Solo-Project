import { create } from 'zustand';
import type {
  GameState,
  DifficultyId,
  ParkingSpot,
  AccessRecord,
  Bill,
  PatrolPoint,
  EmergencyEvent,
  GamePhase,
  VehicleType,
} from '@/types';
import { DIFFICULTY_CONFIGS, GAME_CONFIG } from '@/config/difficulty';
import { generateId, generatePlateNumber, randomChoice, randomInt } from '@/utils/math';
import { calculateParkingFee } from '@/utils/time';
import { ITEMS } from '@/config/items';
import { useAnalyticsStore } from './analyticsStore';

interface GameActions {
  initGame: (difficulty: DifficultyId) => void;
  updateGameTime: (delta: number) => void;
  setPhase: (phase: GamePhase) => void;
  assignRecordToSpot: (recordId: string, spotId: string) => void;
  processAccessRecord: (recordId: string) => void;
  payBill: (billId: string) => void;
  visitPatrolPoint: (pointId: string) => void;
  triggerEmergency: () => void;
  resolveEmergency: (emergencyId: string) => void;
  updatePlayerPosition: (position: [number, number, number]) => void;
  updateCameraRotation: (rotation: [number, number, number]) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  failGame: (reason: string) => void;
  endGame: (success: boolean) => { score: number; accuracy: number; efficiency: number; emergencyHandling: number };
  resetGame: () => void;
  setScore: (score: number) => void;
  addScore: (points: number) => void;
  useItem: (itemId: string) => boolean;
  getItemCooldown: (itemId: string) => number;
  getAvailableItems: () => string[];
  activeHint: string | null;
  applyDiscountToBill: (billId: string) => boolean;
}

const createInitialSpots = (): ParkingSpot[] => {
  return GAME_CONFIG.spotPositions.map((pos, index) => ({
    id: `spot-${index}`,
    number: index + 1,
    status: 'empty',
    currentFee: 0,
    position: pos,
  }));
};

const createInitialAccessRecords = (count: number): AccessRecord[] => {
  const vehicleTypes: VehicleType[] = ['car', 'truck', 'motorcycle'];
  return Array.from({ length: count }, (_, i) => ({
    id: `record-${i}`,
    vehiclePlate: generatePlateNumber(),
    vehicleType: randomChoice(vehicleTypes),
    entryTime: Date.now() - randomInt(60000, 1800000),
    isProcessed: false,
  }));
};

const createInitialPatrolPoints = (count: number): PatrolPoint[] => {
  const pointNames = ['北门岗亭', '东门岗亭', '南门岗亭', '西门岗亭', 'A栋大堂', 'B栋大堂', 'C栋大堂', '监控中心'];
  const taskTypes = [
    { type: 'check' as const, description: '检查设备运行状态' },
    { type: 'verify' as const, description: '核对停车记录' },
    { type: 'repair' as const, description: '处理设备小故障' },
  ];
  
  return GAME_CONFIG.patrolPointPositions.slice(0, count).map((pos, index) => ({
    id: `patrol-${index}`,
    order: index + 1,
    name: pointNames[index % pointNames.length],
    position: pos,
    isVisited: false,
    task: randomChoice(taskTypes),
  }));
};

const createInitialState = (difficulty: DifficultyId): GameState => {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const spots = createInitialSpots();
  const accessRecords = createInitialAccessRecords(config.billingComplexity * 3);
  const patrolPoints = createInitialPatrolPoints(config.patrolPointCount);
  
  const itemCooldowns: Record<string, number> = {};
  const itemUsedAt: Record<string, number> = {};
  ITEMS.forEach(item => {
    itemCooldowns[item.id] = config.itemCooldowns?.[item.id] ?? item.cooldown;
    itemUsedAt[item.id] = -Infinity;
  });
  
  return {
    sessionId: generateId(),
    difficulty,
    phase: 'access_control',
    gameTime: 0,
    realStartTime: Date.now(),
    score: 0,
    accuracy: 100,
    efficiency: 100,
    emergencyHandling: 100,
    spots,
    accessRecords,
    bills: [],
    patrolPoints,
    currentPatrolIndex: 0,
    emergencies: [],
    activeEmergency: null,
    playerPosition: [0, 2, 0],
    cameraRotation: [0, 0, 0],
    isPaused: false,
    isFailed: false,
    itemCooldowns,
    itemUsedAt,
    settlementReady: false,
    activeHint: null,
  };
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...createInitialState('normal'),

  initGame: (difficulty: DifficultyId) => {
    set(createInitialState(difficulty));
  },

  updateGameTime: (delta: number) => {
    const state = get();
    if (state.isPaused || state.isFailed) return;
    
    const config = DIFFICULTY_CONFIGS[state.difficulty];
    const gameDelta = delta * config.timeMultiplier;
    
    set(state => {
      const updatedSpots = state.spots.map(spot => {
        if (spot.status === 'occupied' && spot.entryTime) {
          const durationMinutes = (state.gameTime + gameDelta - spot.entryTime) / 60;
          const vehicleType = state.accessRecords.find(
            r => r.assignedSpotId === spot.id
          )?.vehicleType || 'car';
          const fee = calculateParkingFee(
            durationMinutes,
            GAME_CONFIG.baseParkingRate,
            vehicleType,
            GAME_CONFIG.discountThresholdMinutes,
            GAME_CONFIG.discountPercentage
          );
          return { ...spot, currentFee: fee.totalFee };
        }
        return spot;
      });
      
      return {
        gameTime: state.gameTime + gameDelta,
        spots: updatedSpots,
      };
    });
  },

  setPhase: (phase: GamePhase) => {
    set({ phase });
  },

  assignRecordToSpot: (recordId: string, spotId: string) => {
    const preState = get();
    const preAssigned = preState.accessRecords.find(r => r.id === recordId)?.assignedSpotId;
    
    set(state => {
      const record = state.accessRecords.find(r => r.id === recordId);
      const spot = state.spots.find(s => s.id === spotId);
      
      if (!record || !spot || spot.status !== 'empty') {
        return state;
      }
      
      const entryTime = state.gameTime;
      const newBill: Bill = {
        id: `bill-${generateId()}`,
        spotId: spot.id,
        vehiclePlate: record.vehiclePlate,
        durationMinutes: 0,
        baseFee: 0,
        discount: 0,
        totalFee: 0,
        isPaid: false,
        hasException: Math.random() < 0.2,
        exceptionReason: Math.random() < 0.2 ? '车牌识别有误' : undefined,
      };
      
      return {
        accessRecords: state.accessRecords.map(r =>
          r.id === recordId ? { ...r, assignedSpotId: spotId } : r
        ),
        spots: state.spots.map(s =>
          s.id === spotId
            ? {
                ...s,
                status: 'occupied',
                vehiclePlate: record.vehiclePlate,
                entryTime,
              }
            : s
        ),
        bills: [...state.bills, newBill],
      };
    });
    
    const newState = get();
    const assigned = newState.accessRecords.find(r => r.id === recordId)?.assignedSpotId;
    if (!preAssigned && assigned === spotId) {
      useAnalyticsStore.getState().trackEvent('access_assign', {
        recordId,
        spotId,
        vehiclePlate: newState.accessRecords.find(r => r.id === recordId)?.vehiclePlate,
      });
    }
  },

  processAccessRecord: (recordId: string) => {
    const preState = get();
    const preRecord = preState.accessRecords.find(r => r.id === recordId);
    
    set(state => ({
      accessRecords: state.accessRecords.map(r =>
        r.id === recordId ? { ...r, isProcessed: true } : r
      ),
    }));
    
    const state = get();
    const allProcessed = state.accessRecords.every(r => r.isProcessed);
    if (allProcessed && state.phase === 'access_control') {
      get().addScore(100);
      useAnalyticsStore.getState().trackEvent('task_complete', { task: 'access_control' });
      get().setPhase('billing');
    }
  },

  payBill: (billId: string) => {
    const preState = get();
    const preBill = preState.bills.find(b => b.id === billId);
    
    set(state => {
      const bill = state.bills.find(b => b.id === billId);
      if (!bill || bill.isPaid) return state;
      
      const spot = state.spots.find(s => s.id === bill.spotId);
      if (!spot) return state;
      
      const record = state.accessRecords.find(
        r => r.vehiclePlate === bill.vehiclePlate
      );
      
      const durationMinutes = spot.entryTime
        ? (state.gameTime - spot.entryTime) / 60
        : 0;
      const vehicleType = record?.vehicleType || 'car';
      const fee = calculateParkingFee(
        durationMinutes,
        GAME_CONFIG.baseParkingRate,
        vehicleType,
        GAME_CONFIG.discountThresholdMinutes,
        GAME_CONFIG.discountPercentage
      );
      
      const appliedDiscount = bill.appliedDiscount || 0;
      const finalDiscount = fee.discount + appliedDiscount;
      const finalTotalFee = Math.max(0, fee.totalFee - appliedDiscount);
      
      return {
        bills: state.bills.map(b =>
          b.id === billId
            ? {
                ...b,
                durationMinutes,
                baseFee: fee.baseFee,
                discount: finalDiscount,
                totalFee: finalTotalFee,
                isPaid: true,
              }
            : b
        ),
        spots: state.spots.map(s =>
          s.id === bill.spotId
            ? {
                ...s,
                status: 'empty',
                vehiclePlate: undefined,
                entryTime: undefined,
                exitTime: state.gameTime,
                currentFee: 0,
              }
            : s
        ),
      };
    });
    
    const newState = get();
    const paidBill = newState.bills.find(b => b.id === billId);
    if (!preBill?.isPaid && paidBill?.isPaid) {
      useAnalyticsStore.getState().trackEvent('payment', {
        billId,
        spotId: paidBill.spotId,
        vehiclePlate: paidBill.vehiclePlate,
        totalFee: paidBill.totalFee,
        hasException: paidBill.hasException,
      });
    }
    
    const state = get();
    const allPaid = state.bills.every(b => b.isPaid);
    if (allPaid && state.phase === 'billing') {
      get().addScore(150);
      useAnalyticsStore.getState().trackEvent('task_complete', { task: 'billing' });
      get().setPhase('patrol');
    }
  },

  visitPatrolPoint: (pointId: string) => {
    const preState = get();
    const prePoint = preState.patrolPoints.find(p => p.id === pointId);
    
    set(state => {
      const point = state.patrolPoints.find(p => p.id === pointId);
      if (!point || point.isVisited) return state;
      
      const currentUnvisited = state.patrolPoints
        .filter(p => !p.isVisited)
        .sort((a, b) => a.order - b.order);
      
      if (currentUnvisited[0]?.id !== pointId) {
        return {
          accuracy: Math.max(0, state.accuracy - 5),
        };
      }
      
      return {
        patrolPoints: state.patrolPoints.map(p =>
          p.id === pointId
            ? { ...p, isVisited: true, visitedAt: state.gameTime }
            : p
        ),
        currentPatrolIndex: state.currentPatrolIndex + 1,
      };
    });
    
    const newState = get();
    const newPoint = newState.patrolPoints.find(p => p.id === pointId);
    if (!prePoint?.isVisited && newPoint?.isVisited) {
      useAnalyticsStore.getState().trackEvent('patrol_visit', {
        pointId,
        name: newPoint.name,
        order: newPoint.order,
      });
    }
    
    const state = get();
    const allVisited = state.patrolPoints.every(p => p.isVisited);
    if (allVisited && state.phase === 'patrol') {
      get().addScore(200);
      useAnalyticsStore.getState().trackEvent('task_complete', { task: 'patrol' });
      get().setPhase('settlement');
      set({ settlementReady: true });
    }
  },

  triggerEmergency: () => {
    const state = get();
    if (state.activeEmergency) return;
    
    const emergencyTypes = [
      { type: 'device_failure' as const, description: '门禁设备故障，需要立即修复' },
      { type: 'payment_issue' as const, description: '支付系统异常，需要手动处理' },
      { type: 'vehicle_block' as const, description: '车辆堵塞通道，需要疏通' },
    ];
    
    const typeData = randomChoice(emergencyTypes);
    const positions = GAME_CONFIG.patrolPointPositions;
    const position = randomChoice(positions);
    const locationNames = ['北门', '东门', '南门', '西门', 'A栋', 'B栋', 'C栋'];
    
    const emergency: EmergencyEvent = {
      id: `emergency-${generateId()}`,
      type: typeData.type,
      location: randomChoice(locationNames),
      position,
      triggeredAt: state.gameTime,
      isResolved: false,
      timeLimit: DIFFICULTY_CONFIGS[state.difficulty].emergencyTimeLimit,
      description: typeData.description,
    };
    
    set(state => ({
      emergencies: [...state.emergencies, emergency],
      activeEmergency: emergency,
      phase: 'emergency',
    }));
  },

  resolveEmergency: (emergencyId: string) => {
    set(state => {
      const emergency = state.emergencies.find(e => e.id === emergencyId);
      if (!emergency || emergency.isResolved) return state;
      
      const timeTaken = state.gameTime - emergency.triggeredAt;
      const isOnTime = timeTaken < emergency.timeLimit;
      
      return {
        emergencies: state.emergencies.map(e =>
          e.id === emergencyId
            ? { ...e, isResolved: true, resolvedAt: state.gameTime }
            : e
        ),
        activeEmergency: null,
        phase: state.phase === 'emergency' ? 'patrol' : state.phase,
        emergencyHandling: isOnTime 
          ? state.emergencyHandling 
          : Math.max(0, state.emergencyHandling - 10),
        score: isOnTime ? state.score + 50 : state.score,
      };
    });
  },

  updatePlayerPosition: (position: [number, number, number]) => {
    set({ playerPosition: position });
  },

  updateCameraRotation: (rotation: [number, number, number]) => {
    set({ cameraRotation: rotation });
  },

  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),

  failGame: (reason: string) => {
    set({ isFailed: true, failureReason: reason, phase: 'ended' });
  },

  endGame: (success: boolean) => {
    const state = get();
    const totalRealTime = (Date.now() - state.realStartTime) / 1000;
    const totalGameTime = state.gameTime;
    
    let finalScore = state.score;
    let accuracy = state.accuracy;
    let efficiency = state.efficiency;
    let emergencyHandling = state.emergencyHandling;
    
    if (success) {
      const timeBonus = Math.max(0, 1000 - totalRealTime);
      finalScore += Math.floor(timeBonus);
      
      const totalTasks = state.accessRecords.length + state.bills.length + state.patrolPoints.length;
      const completedTasks = state.accessRecords.filter(r => r.isProcessed).length +
        state.bills.filter(b => b.isPaid).length +
        state.patrolPoints.filter(p => p.isVisited).length;
      accuracy = Math.round((completedTasks / totalTasks) * 100);
      
      efficiency = Math.round(Math.max(0, 100 - (totalRealTime / 30)));
      
      const resolvedEmergencies = state.emergencies.filter(e => e.isResolved).length;
      const totalEmergencies = state.emergencies.length;
      emergencyHandling = totalEmergencies > 0
        ? Math.round((resolvedEmergencies / totalEmergencies) * 100)
        : 100;
      
      finalScore = Math.round(finalScore * (accuracy / 100) * (efficiency / 100));
    }
    
    set(state => ({
      score: finalScore,
      accuracy,
      efficiency,
      emergencyHandling,
      phase: 'ended',
      isFailed: !success,
      failureReason: success ? undefined : state.failureReason,
    }));
    
    return { score: finalScore, accuracy, efficiency, emergencyHandling };
  },

  resetGame: () => {
    set(createInitialState('normal'));
  },

  setScore: (score: number) => set({ score }),
  addScore: (points: number) => set(state => ({ score: state.score + points })),

  useItem: (itemId: string): boolean => {
    const state = get();
    const cooldown = state.itemCooldowns[itemId];
    const lastUsed = state.itemUsedAt[itemId];
    const now = state.gameTime;
    
    if (!cooldown || now - lastUsed < cooldown) {
      return false;
    }

    const item = ITEMS.find(i => i.id === itemId);
    if (!item) return false;

    let success = true;

    switch (item.effect) {
      case 'show_hint': {
        let hint = '';
        if (state.phase === 'access_control') {
          const unprocessed = state.accessRecords.find(r => !r.isProcessed && !r.assignedSpotId);
          const emptySpot = state.spots.find(s => s.status === 'empty');
          hint = unprocessed && emptySpot
            ? `将 ${unprocessed.vehiclePlate} 分配到 ${emptySpot.number} 号车位`
            : '所有门禁记录已处理';
        } else if (state.phase === 'billing') {
          const unpaid = state.bills.find(b => !b.isPaid);
          hint = unpaid
            ? `车位 ${unpaid.spotId.replace('spot-', '')} 有未支付账单 ¥${unpaid.totalFee}`
            : '所有账单已支付';
        } else if (state.phase === 'patrol') {
          const next = state.patrolPoints.filter(p => !p.isVisited).sort((a, b) => a.order - b.order)[0];
          hint = next ? `下一个巡检点: ${next.name}` : '巡检已完成';
        } else if (state.phase === 'emergency') {
          hint = state.activeEmergency
            ? `前往 ${state.activeEmergency.location} 处理 ${state.activeEmergency.description}`
            : '无活跃突发事件';
        } else if (state.phase === 'settlement') {
          hint = '点击确认结算完成游戏';
        }
        set({ activeHint: hint });
        setTimeout(() => set({ activeHint: null }), 5000);
        break;
      }
      case 'skip_task': {
        if (state.phase === 'access_control') {
          const unprocessed = state.accessRecords.find(r => !r.isProcessed);
          if (unprocessed) {
            const stateNow = get();
            let recordId = unprocessed.id;
            let assignedSpotId = unprocessed.assignedSpotId;
            
            if (!assignedSpotId) {
              const emptySpot = stateNow.spots.find(s => s.status === 'empty');
              if (emptySpot) {
                assignedSpotId = emptySpot.id;
                get().assignRecordToSpot(recordId, emptySpot.id);
              }
            }
            
            set(state => ({
              accessRecords: state.accessRecords.map(r =>
                r.id === recordId ? { ...r, isProcessed: true } : r
              ),
            }));
            
            const allProcessed = get().accessRecords.every(r => r.isProcessed);
            if (allProcessed) {
              get().addScore(50);
              get().setPhase('billing');
            }
          }
        } else if (state.phase === 'billing') {
          const unpaid = state.bills.find(b => !b.isPaid);
          if (unpaid) {
            get().payBill(unpaid.id);
          } else {
            const allPaid = get().bills.length === 0 || get().bills.every(b => b.isPaid);
            if (allPaid) {
              get().addScore(100);
              get().setPhase('patrol');
            }
          }
        } else if (state.phase === 'patrol') {
          const next = state.patrolPoints.filter(p => !p.isVisited).sort((a, b) => a.order - b.order)[0];
          if (next) {
            get().visitPatrolPoint(next.id);
          }
        }
        set(state => ({ accuracy: Math.max(0, state.accuracy - 10) }));
        break;
      }
      case 'freeze_time':
        set({ isPaused: true });
        setTimeout(() => {
          const s = get();
          if (s.phase !== 'ended') set({ isPaused: false });
        }, 10000);
        break;
      case 'repair_device':
        if (state.activeEmergency) {
          get().resolveEmergency(state.activeEmergency.id);
        } else {
          success = false;
        }
        break;
      case 'add_discount': {
        const targetBill = state.bills.find(b => 
          !b.isPaid && (!b.appliedDiscount || b.appliedDiscount <= 0)
        );
        if (!targetBill) {
          success = false;
          break;
        }
        
        const spot = state.spots.find(s => s.id === targetBill.spotId);
        const record = state.accessRecords.find(r => r.vehiclePlate === targetBill.vehiclePlate);
        const vehicleType = record?.vehicleType || 'car';
        const durationMinutes = spot && spot.entryTime
          ? (state.gameTime - spot.entryTime) / 60
          : 0;
        const fee = calculateParkingFee(
          durationMinutes,
          GAME_CONFIG.baseParkingRate,
          vehicleType,
          GAME_CONFIG.discountThresholdMinutes,
          GAME_CONFIG.discountPercentage
        );
        const extraDiscount = fee.baseFee * 0.2;
        
        set(state => ({
          bills: state.bills.map(b =>
            b.id === targetBill.id
              ? {
                  ...b,
                  appliedDiscount: extraDiscount,
                  totalFee: Math.max(0, fee.totalFee - extraDiscount),
                }
              : b
          ),
        }));
        
        useAnalyticsStore.getState().trackEvent('item_use', {
          itemId,
          itemName: item.name,
          effect: item.effect,
          targetBillId: targetBill.id,
          discountAmount: extraDiscount,
        });
        break;
      }
    }

    if (!success) {
      return false;
    }

    set(state => ({
      itemUsedAt: { ...state.itemUsedAt, [itemId]: now },
    }));

    if (item.effect !== 'add_discount') {
      useAnalyticsStore.getState().trackEvent('item_use', {
        itemId,
        itemName: item.name,
        effect: item.effect,
      });
    }

    return true;
  },

  applyDiscountToBill: (billId: string): boolean => {
    const state = get();
    const bill = state.bills.find(b => b.id === billId);
    if (!bill || bill.isPaid) return false;
    if (bill.appliedDiscount && bill.appliedDiscount > 0) return false;

    const discountItem = ITEMS.find(i => i.effect === 'add_discount');
    if (!discountItem) return false;

    const lastUsed = state.itemUsedAt[discountItem.id];
    const cooldown = state.itemCooldowns[discountItem.id];
    if (state.gameTime - lastUsed < cooldown) return false;

    const spot = state.spots.find(s => s.id === bill.spotId);
    const record = state.accessRecords.find(r => r.vehiclePlate === bill.vehiclePlate);
    const vehicleType = record?.vehicleType || 'car';
    const durationMinutes = spot && spot.entryTime
      ? (state.gameTime - spot.entryTime) / 60
      : 0;
    const fee = calculateParkingFee(
      durationMinutes,
      GAME_CONFIG.baseParkingRate,
      vehicleType,
      GAME_CONFIG.discountThresholdMinutes,
      GAME_CONFIG.discountPercentage
    );
    const extraDiscount = fee.baseFee * 0.2;

    set(state => ({
      itemUsedAt: { ...state.itemUsedAt, [discountItem.id]: state.gameTime },
      bills: state.bills.map(b =>
        b.id === billId
          ? {
              ...b,
              appliedDiscount: extraDiscount,
              totalFee: Math.max(0, fee.totalFee - extraDiscount),
            }
          : b
      ),
    }));

    useAnalyticsStore.getState().trackEvent('item_use', {
      itemId: discountItem.id,
      itemName: discountItem.name,
      effect: discountItem.effect,
      targetBillId: billId,
      discountAmount: extraDiscount,
    });

    return true;
  },

  getItemCooldown: (itemId: string): number => {
    const state = get();
    const cooldown = state.itemCooldowns[itemId] || 0;
    const lastUsed = state.itemUsedAt[itemId] || -Infinity;
    const now = state.gameTime;
    const remaining = cooldown - (now - lastUsed);
    return Math.max(0, remaining);
  },

  getAvailableItems: (): string[] => {
    const state = get();
    return ITEMS.filter(item => {
      const remaining = state.itemCooldowns[item.id] || 0;
      const lastUsed = state.itemUsedAt[item.id] || -Infinity;
      return state.gameTime - lastUsed >= remaining;
    }).map(i => i.id);
  },
}));
