import { create } from 'zustand';
import {
  Product,
  Settlement,
  Batch,
  ReplayFrame,
  GamePhase,
  Difficulty,
  WarningState,
  ProductError,
  GameRecord,
} from '@/types';
import {
  generateGameData,
  matchProductToSettlement,
  shouldTriggerWarning,
  calculateScore,
  calculateOnTimeRate,
} from '@/utils/mockData';
import { STORAGE_KEYS, MAX_REPLAY_RECORDS, getDifficultyConfig } from '@/utils/constants';

interface GameState {
  phase: GamePhase;
  difficulty: Difficulty;
  score: number;
  timeRemaining: number;
  totalTime: number;
  correctCount: number;
  wrongCount: number;
  onTimeRate: number;
  batches: Batch[];
  products: Product[];
  settlements: Settlement[];
  processedProductIds: string[];
  selectedProductId: string | null;
  warning: WarningState;
  replayData: ReplayFrame[];
  productErrors: ProductError[];
  startTime: number;

  startGame: (difficulty: Difficulty) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  resetGame: () => void;

  selectProduct: (productId: string | null) => void;
  submitProduct: (productId: string, settlementId: string) => boolean;
  markDefective: (productId: string) => void;

  setTimeRemaining: (time: number) => void;
  updateWarning: () => void;

  recordAction: (frame: Omit<ReplayFrame, 'time'>) => void;
  saveRecord: () => string;
  getCurrentRecord: () => GameRecord | null;
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'menu',
  difficulty: 'normal',
  score: 0,
  timeRemaining: 90,
  totalTime: 90,
  correctCount: 0,
  wrongCount: 0,
  onTimeRate: 100,
  batches: [],
  products: [],
  settlements: [],
  processedProductIds: [],
  selectedProductId: null,
  warning: {
    active: false,
    productIds: [],
    intensity: 0,
    message: '',
  },
  replayData: [],
  productErrors: [],
  startTime: 0,

  startGame: (difficulty: Difficulty) => {
    const config = getDifficultyConfig(difficulty);
    const { batches, products, settlements } = generateGameData(difficulty);

    set({
      phase: 'playing',
      difficulty,
      score: 0,
      timeRemaining: config.totalTime,
      totalTime: config.totalTime,
      correctCount: 0,
      wrongCount: 0,
      batches,
      products,
      settlements,
      processedProductIds: [],
      selectedProductId: null,
      warning: {
        active: false,
        productIds: [],
        intensity: 0,
        message: '',
      },
      replayData: [],
      productErrors: [],
      startTime: Date.now(),
    });
  },

  pauseGame: () => {
    set({ phase: 'paused' });
  },

  resumeGame: () => {
    set({ phase: 'playing' });
  },

  endGame: () => {
    const { products, processedProductIds, settlements } = get();
    let finalCorrectCount = 0;
    let finalWrongCount = 0;
    const additionalErrors: ProductError[] = [];
    const additionalFrames: Omit<ReplayFrame, 'time'>[] = [];

    products.forEach((product) => {
      if (processedProductIds.includes(product.id)) {
        return;
      }

      if (!product.isDefective) {
        const settlement = settlements.find((s) =>
          s.productIds.includes(product.id)
        );
        finalWrongCount += 1;
        additionalErrors.push({
          productId: product.id,
          productName: product.name,
          errorType: 'unprocessed_normal',
          expectedSettlement: settlement?.id || 'unknown',
          actualSettlement: undefined,
        });
        additionalFrames.push({
          action: 'error',
          productId: product.id,
          settlementId: settlement?.id,
          isCorrect: false,
          position_x: product.position.x,
          position_y: product.position.y,
          position_z: product.position.z,
          errorType: 'unprocessed_normal',
        });
      } else {
        finalWrongCount += 1;
        additionalErrors.push({
          productId: product.id,
          productName: product.name,
          errorType: 'unprocessed_defect',
          expectedSettlement: 'mark_as_defective',
          actualSettlement: undefined,
        });
        additionalFrames.push({
          action: 'error',
          productId: product.id,
          isCorrect: false,
          position_x: product.position.x,
          position_y: product.position.y,
          position_z: product.position.z,
          errorType: 'unprocessed_defect',
        });
      }
    });

    additionalFrames.forEach((frame) => {
      get().recordAction(frame);
    });

    const stateBefore = get();
    const totalCorrect = stateBefore.correctCount + finalCorrectCount;
    const totalWrong = stateBefore.wrongCount + finalWrongCount;
    const totalProducts = products.length;
    const validCorrect = Math.min(totalCorrect, totalProducts);
    const onTimeRate = calculateOnTimeRate(validCorrect, totalProducts);

    set((state) => ({
      phase: 'finished',
      correctCount: totalCorrect,
      wrongCount: totalWrong,
      productErrors: [...state.productErrors, ...additionalErrors],
      score: calculateScore(
        validCorrect,
        state.timeRemaining,
        state.difficulty
      ),
      onTimeRate,
    }));
  },

  resetGame: () => {
    set({
      phase: 'menu',
      score: 0,
      timeRemaining: 90,
      totalTime: 90,
      correctCount: 0,
      wrongCount: 0,
      onTimeRate: 100,
      batches: [],
      products: [],
      settlements: [],
      processedProductIds: [],
      selectedProductId: null,
      warning: {
        active: false,
        productIds: [],
        intensity: 0,
        message: '',
      },
      replayData: [],
      productErrors: [],
    });
  },

  selectProduct: (productId: string | null) => {
    set({ selectedProductId: productId });

    if (productId) {
      const product = get().products.find((p) => p.id === productId);
      if (product) {
        get().recordAction({
          action: 'pick',
          productId,
          isCorrect: true,
          position_x: product.position.x,
          position_y: product.position.y,
          position_z: product.position.z,
        });
      }
    }
  },

  submitProduct: (productId: string, settlementId: string): boolean => {
    const { products, settlements, batches, processedProductIds } = get();
    const product = products.find((p) => p.id === productId);
    const settlement = settlements.find((s) => s.id === settlementId);

    if (!product || !settlement) return false;
    if (processedProductIds.includes(productId)) return false;

    const result = matchProductToSettlement(product, settlement, batches);

    get().recordAction({
      action: 'submit',
      productId,
      settlementId,
      isCorrect: result.isMatch,
      position_x: product.position.x,
      position_y: product.position.y,
      position_z: product.position.z,
      errorType: result.errorType,
    });

    if (result.isMatch) {
      set((state) => ({
        correctCount: state.correctCount + 1,
        processedProductIds: [...state.processedProductIds, productId],
        products: state.products.map((p) =>
          p.id === productId ? { ...p, isProcessed: true } : p
        ),
      }));
    } else {
      set((state) => ({
        wrongCount: state.wrongCount + 1,
        processedProductIds: [...state.processedProductIds, productId],
        products: state.products.map((p) =>
          p.id === productId ? { ...p, isProcessed: true } : p
        ),
        productErrors: [
          ...state.productErrors,
          {
            productId,
            productName: product.name,
            errorType: result.errorType || 'unknown',
            expectedSettlement: settlement.id,
            actualSettlement: settlementId,
          },
        ],
      }));
    }

    return result.isMatch;
  },

  markDefective: (productId: string) => {
    const { products, processedProductIds } = get();
    const product = products.find((p) => p.id === productId);

    if (!product || processedProductIds.includes(productId)) return;

    get().recordAction({
      action: 'error',
      productId,
      isCorrect: true,
      position_x: product.position.x,
      position_y: product.position.y,
      position_z: product.position.z,
      errorType: product.defectType,
    });

    set((state) => ({
      processedProductIds: [...state.processedProductIds, productId],
      products: state.products.map((p) =>
        p.id === productId ? { ...p, isProcessed: true } : p
      ),
      correctCount: state.correctCount + 1,
    }));
  },

  setTimeRemaining: (time: number) => {
    set({ timeRemaining: time });
    get().updateWarning();
  },

  updateWarning: () => {
    const { timeRemaining, products, processedProductIds, difficulty } = get();
    const config = getDifficultyConfig(difficulty);

    const unprocessedProducts = products.filter(
      (p) => !processedProductIds.includes(p.id)
    );

    const defectiveProducts = products.filter((p) => p.isDefective);
    const unprocessedDefective = defectiveProducts.filter(
      (p) => !processedProductIds.includes(p.id)
    );

    const shortageProducts = defectiveProducts.filter(
      (p) => p.defectType === 'shortage' && !processedProductIds.includes(p.id)
    );

    let warningProductIds: string[] = [];
    let warningIntensity = 0;

    if (timeRemaining <= config.warningTimeThreshold) {
      warningProductIds = unprocessedDefective.map((p) => p.id);
      warningIntensity =
        unprocessedDefective.length > 0
          ? Math.max(
              0.3,
              Math.min(
                1,
                1 - timeRemaining / config.warningTimeThreshold
              )
            )
          : 0;
    }

    if (
      timeRemaining <= config.warningTimeThreshold * 0.6 &&
      unprocessedProducts.length > 0
    ) {
      const normalUnprocessed = products.filter(
        (p) =>
          !p.isDefective &&
          !processedProductIds.includes(p.id) &&
          !warningProductIds.includes(p.id)
      );
      warningProductIds = [...warningProductIds, ...normalUnprocessed.map((p) => p.id)];
      warningIntensity = Math.max(
        warningIntensity,
        Math.max(
          0.5,
          Math.min(
            1,
            1 - timeRemaining / (config.warningTimeThreshold * 0.6)
          )
        )
      );
    }

    const shortageCount = shortageProducts.length;

    set({
      warning: {
        active: warningProductIds.length > 0,
        productIds: warningProductIds,
        intensity: warningIntensity,
        message:
          warningProductIds.length > 0
            ? shortageCount > 0
              ? `⚠️ 到货短少 ${shortageCount} 件待处理 + ${warningProductIds.length} 件未完成`
              : `还有 ${warningProductIds.length} 件商品未处理`
            : '',
      },
      products: products.map((p) => ({
        ...p,
        isWarning: warningProductIds.includes(p.id),
      })),
    });

    if (warningProductIds.length > 0) {
      warningProductIds.forEach((pid) => {
        const alreadyRecorded = get().replayData.some(
          (f) =>
            f.action === 'warning' &&
            f.productId === pid &&
            Math.abs(get().totalTime - get().timeRemaining - f.time) < 2
        );
        if (!alreadyRecorded) {
          get().recordAction({
            action: 'warning',
            productId: pid,
            isCorrect: false,
            position_x: 0,
            position_y: 0,
            position_z: 0,
          });
        }
      });
    }
  },

  recordAction: (frame: Omit<ReplayFrame, 'time'>) => {
    const { totalTime, timeRemaining } = get();
    const time = totalTime - timeRemaining;

    set((state) => ({
      replayData: [
        ...state.replayData,
        {
          ...frame,
          time,
        },
      ],
    }));
  },

  saveRecord: (): string => {
    const record = get().getCurrentRecord();
    if (!record) return '';

    const records = getSavedRecords();
    records.unshift(record);

    const recentFailedRecords = records
      .filter((r) => r.wrongCount > 0)
      .slice(0, MAX_REPLAY_RECORDS);

    const otherRecords = records.filter((r) => r.wrongCount === 0).slice(0, 7);

    const allRecords = [...recentFailedRecords, ...otherRecords].slice(0, 10);

    localStorage.setItem(
      STORAGE_KEYS.gameRecords,
      JSON.stringify(allRecords)
    );

    const replayRecords = getReplayRecords();
    if (record.wrongCount > 0) {
      replayRecords.unshift(record);
      const trimmed = replayRecords.slice(0, MAX_REPLAY_RECORDS);
      localStorage.setItem(
        STORAGE_KEYS.replayRecords,
        JSON.stringify(trimmed)
      );
    }

    return record.id;
  },

  getCurrentRecord: (): GameRecord | null => {
    const {
      difficulty,
      score,
      correctCount,
      wrongCount,
      replayData,
      productErrors,
      totalTime,
      timeRemaining,
      products,
    } = get();

    const totalProducts = products.length;
    const validCorrect = Math.min(correctCount, totalProducts);
    const onTimeRate = calculateOnTimeRate(validCorrect, totalProducts);

    return {
      id: `record_${Date.now()}`,
      score,
      correctCount: validCorrect,
      wrongCount,
      onTimeRate,
      errors: productErrors.map((e) => e.errorType),
      timestamp: Date.now(),
      difficulty,
      replayData,
      productErrors,
      totalTime,
      timeUsed: totalTime - timeRemaining,
    };
  },
}));

export const getSavedRecords = (): GameRecord[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.gameRecords);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const getReplayRecords = (): GameRecord[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.replayRecords);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};
