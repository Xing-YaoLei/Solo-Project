import { create } from 'zustand';
import type {
  GameState,
  Task,
  Clue,
  Decision,
  DecisionLog,
  GameRecord,
  ReplayEvent,
  ErrorCategory,
} from '@/types/game';
import { storage } from '@/utils/storage';
import { calculateScore, generateId } from '@/utils/scoring';
import { createReplay, saveReplay } from '@/utils/replay';
import { tasks as mockTasks, clues as mockClues, decisions as mockDecisions } from '@/data/mockTasks';

interface GameStore extends GameState {
  tasks: Task[];
  clues: Clue[];
  decisions: Decision[];
  currentTask: Task | null;
  currentTaskClues: Clue[];
  currentTaskDecisions: Decision[];
  comboCount: number;
  taskReplayEvents: Record<string, ReplayEvent[]>;
  taskRecordIds: Record<string, string>;
  decisionStartTime: number | null;
  currentRecordId: string | null;

  loadLevel: (levelId: string, taskIds: string[]) => void;
  startTask: (taskId: string) => void;
  viewClue: (clueId: string) => void;
  startDecision: () => void;
  makeDecision: (decisionId: string) => { isCorrect: boolean; points: number };
  nextTask: () => boolean;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: (isWin: boolean) => void;
  tickTime: (delta: number) => void;
  resetGame: () => void;
  loadGameState: () => void;
  saveGameState: () => void;
}

const getInitialState = (): GameState => ({
  currentLevelId: null,
  currentTaskId: null,
  score: 0,
  timeRemaining: 0,
  isPaused: false,
  isGameOver: false,
  decisionHistory: [],
  viewedClues: [],
  hesitationStartTimes: {},
});

export const useGameStore = create<GameStore>((set, get) => ({
  ...getInitialState(),
  tasks: [],
  clues: [],
  decisions: [],
  currentTask: null,
  currentTaskClues: [],
  currentTaskDecisions: [],
  comboCount: 0,
  taskReplayEvents: {},
  taskRecordIds: {},
  decisionStartTime: null,
  currentRecordId: null,

  loadLevel: (levelId: string, taskIds: string[]) => {
    const levelTasks = mockTasks.filter((t) => taskIds.includes(t.id));
    const levelClueIds = levelTasks.flatMap((t) => t.clueIds);
    const levelDecisionIds = levelTasks.flatMap((t) => t.decisionIds);

    const levelClues = mockClues.filter((c) => levelClueIds.includes(c.id));
    const levelDecisions = mockDecisions.filter((d) => levelDecisionIds.includes(d.id));

    const taskRecordIds: Record<string, string> = {};
    const taskReplayEvents: Record<string, ReplayEvent[]> = {};
    levelTasks.forEach((task) => {
      taskRecordIds[task.id] = generateId();
      taskReplayEvents[task.id] = [];
    });

    const recordId = generateId();

    set({
      currentLevelId: levelId,
      tasks: levelTasks,
      clues: levelClues,
      decisions: levelDecisions,
      score: 0,
      comboCount: 0,
      taskReplayEvents,
      taskRecordIds,
      decisionHistory: [],
      viewedClues: [],
      hesitationStartTimes: {},
      currentRecordId: recordId,
    });
  },

  startTask: (taskId: string) => {
    const { tasks, clues, decisions, taskReplayEvents } = get();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const taskClues = clues.filter((c) => task.clueIds.includes(c.id));
    const taskDecisions = decisions.filter((d) => task.decisionIds.includes(d.id));

    const event: ReplayEvent = {
      timestamp: Date.now(),
      type: 'task_start',
      data: { taskId, taskTitle: task.title },
    };

    const currentTaskEvents = taskReplayEvents[taskId] || [];

    set({
      currentTaskId: taskId,
      currentTask: task,
      currentTaskClues: taskClues,
      currentTaskDecisions: taskDecisions,
      timeRemaining: task.timeLimit,
      viewedClues: [],
      hesitationStartTimes: {},
      decisionStartTime: null,
      isPaused: false,
      isGameOver: false,
      taskReplayEvents: {
        ...taskReplayEvents,
        [taskId]: [...currentTaskEvents, event],
      },
    });
  },

  viewClue: (clueId: string) => {
    const { viewedClues, hesitationStartTimes, taskReplayEvents, currentTaskId } = get();
    const now = Date.now();

    const event: ReplayEvent = {
      timestamp: now,
      type: 'clue_view',
      data: { clueId },
    };

    if (!viewedClues.includes(clueId) && currentTaskId) {
      const currentTaskEvents = taskReplayEvents[currentTaskId] || [];
      set({
        viewedClues: [...viewedClues, clueId],
        hesitationStartTimes: {
          ...hesitationStartTimes,
          [clueId]: now,
        },
        taskReplayEvents: {
          ...taskReplayEvents,
          [currentTaskId]: [...currentTaskEvents, event],
        },
      });
    }
  },

  startDecision: () => {
    const { taskReplayEvents, currentTaskId } = get();
    const now = Date.now();

    const event: ReplayEvent = {
      timestamp: now,
      type: 'decision_start',
      data: {},
    };

    if (currentTaskId) {
      const currentTaskEvents = taskReplayEvents[currentTaskId] || [];
      set({
        decisionStartTime: now,
        taskReplayEvents: {
          ...taskReplayEvents,
          [currentTaskId]: [...currentTaskEvents, event],
        },
      });
    }
  },

  makeDecision: (decisionId: string) => {
    const state = get();
    const {
      currentTask,
      currentTaskDecisions,
      decisionStartTime,
      hesitationStartTimes,
      score,
      comboCount,
      timeRemaining,
      decisionHistory,
      taskReplayEvents,
      taskRecordIds,
      currentTaskId,
    } = state;

    if (!currentTask || !decisionStartTime || !currentTaskId) {
      return { isCorrect: false, points: 0 };
    }

    const taskRecordId = taskRecordIds[currentTaskId];
    if (!taskRecordId) {
      return { isCorrect: false, points: 0 };
    }

    const decision = currentTaskDecisions.find((d) => d.id === decisionId);
    if (!decision) return { isCorrect: false, points: 0 };

    const now = Date.now();
    const hesitationTime = now - decisionStartTime;

    const clueHesitation = Object.entries(hesitationStartTimes).reduce((total, [, startTime]) => {
      return total + (now - startTime);
    }, 0);
    const totalHesitation = hesitationTime + clueHesitation;

    const event: ReplayEvent = {
      timestamp: now,
      type: 'decision_made',
      data: { decisionId, isCorrect: decision.isCorrect },
    };

    const isCorrect = decision.isCorrect;
    const newComboCount = isCorrect ? comboCount + 1 : 0;
    const points = calculateScore(
      currentTask.points,
      timeRemaining,
      currentTask.timeLimit,
      totalHesitation,
      newComboCount,
      isCorrect
    );

    const errorReason = isCorrect ? '' : getErrorReason(currentTask.errorCategory as ErrorCategory);

    const log: DecisionLog = {
      id: generateId(),
      recordId: taskRecordId,
      taskId: currentTask.id,
      decisionId,
      isCorrect,
      hesitationTime: totalHesitation,
      madeAt: new Date(now).toISOString(),
      errorReason,
    };

    const newHistory = [...decisionHistory, log];
    const currentTaskEvents = taskReplayEvents[currentTaskId] || [];
    const updatedTaskEvents = [...currentTaskEvents, event];

    if (!isCorrect) {
      const taskEndEvent: ReplayEvent = {
        timestamp: now + 100,
        type: 'task_end',
        data: { success: false, errorReason },
      };

      const fullEvents = [...updatedTaskEvents, taskEndEvent];
      const taskDecisionLogs = [log];
      const replay = createReplay(taskRecordId, currentTask.memberId, fullEvents, taskDecisionLogs);
      saveReplay(replay);

      const taskRecord = createTaskGameRecord(state, log, currentTask, points, false);
      saveGameRecord(taskRecord);
    } else {
      const taskRecord = createTaskGameRecord(state, log, currentTask, points, true);
      saveGameRecord(taskRecord);
    }

    set({
      score: score + points,
      comboCount: newComboCount,
      decisionHistory: newHistory,
      taskReplayEvents: {
        ...taskReplayEvents,
        [currentTaskId]: updatedTaskEvents,
      },
      decisionStartTime: null,
    });

    return { isCorrect, points };
  },

  nextTask: () => {
    const state = get();
    const { tasks, currentTaskId } = state;
    const currentIndex = tasks.findIndex((t) => t.id === currentTaskId);

    if (currentIndex < tasks.length - 1) {
      const nextTaskData = tasks[currentIndex + 1];
      state.startTask(nextTaskData.id);
      return true;
    } else {
      set({ isGameOver: true });
      return false;
    }
  },

  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),

  endGame: (isWin: boolean) => {
    set({ isGameOver: true });
  },

  tickTime: (delta: number) => {
    const { isPaused, isGameOver, timeRemaining } = get();
    if (isPaused || isGameOver) return;
    
    const newTime = Math.max(0, timeRemaining - delta);
    set({ timeRemaining: newTime });
    
    if (newTime <= 0) {
      get().endGame(false);
    }
  },

  resetGame: () => {
    set({
      ...getInitialState(),
      tasks: [],
      clues: [],
      decisions: [],
      currentTask: null,
      currentTaskClues: [],
      currentTaskDecisions: [],
      comboCount: 0,
      taskReplayEvents: {},
      taskRecordIds: {},
      decisionStartTime: null,
      currentRecordId: null,
    });
  },

  loadGameState: () => {
    const saved = storage.loadSave<GameState | null>(null);
    if (saved) {
      set(saved);
    }
  },

  saveGameState: () => {
    const state = get();
    const gameState: GameState = {
      currentLevelId: state.currentLevelId,
      currentTaskId: state.currentTaskId,
      score: state.score,
      timeRemaining: state.timeRemaining,
      isPaused: state.isPaused,
      isGameOver: state.isGameOver,
      decisionHistory: state.decisionHistory,
      viewedClues: state.viewedClues,
      hesitationStartTimes: state.hesitationStartTimes,
    };
    storage.saveSave(gameState);
  },
}));

function getErrorReason(category: ErrorCategory): string {
  const reasons: Record<ErrorCategory, string> = {
    missed_benefit_expiry: '未能及时提醒会员权益即将过期，导致会员流失',
    wrong_refund_handling: '退款处理方式不当，引发会员不满',
    poor_recharge_timing: '续充推荐时机不佳，会员没有接受',
    ignored_member_pattern: '忽略了会员的消费行为规律',
    insufficient_clue_analysis: '没有充分分析所有可用线索',
  };
  return reasons[category] || '决策失误';
}

function createGameRecord(
  state: GameStore,
  decisionHistory: DecisionLog[],
  isWin: boolean
): GameRecord {
  const correctCount = decisionHistory.filter((d) => d.isCorrect).length;
  const wrongCount = decisionHistory.filter((d) => !d.isCorrect).length;
  const avgTime = decisionHistory.length > 0
    ? decisionHistory.reduce((sum, d) => sum + d.hesitationTime, 0) / decisionHistory.length
    : 0;

  const errorCategories: Record<string, number> = {};
  const memberIds = new Set<string>();
  decisionHistory.forEach((d) => {
    if (!d.isCorrect) {
      const category = state.tasks.find((t) => t.id === d.taskId)?.errorCategory || 'unknown';
      errorCategories[category] = (errorCategories[category] || 0) + 1;
    }
    const task = state.tasks.find((t) => t.id === d.taskId);
    if (task) {
      memberIds.add(task.memberId);
    }
  });

  return {
    id: state.currentRecordId!,
    playerId: 'player-1',
    levelId: state.currentLevelId!,
    memberId: Array.from(memberIds)[0] || '',
    score: state.score + (isWin ? 200 : 0),
    correctCount,
    wrongCount,
    avgDecisionTime: avgTime,
    playedAt: new Date().toISOString(),
    errorCategories,
  };
}

function createTaskGameRecord(
  state: GameStore,
  decisionLog: DecisionLog,
  task: Task,
  points: number,
  isCorrect: boolean
): GameRecord {
  const errorCategories: Record<string, number> = {};
  if (!isCorrect) {
    errorCategories[task.errorCategory as string] = 1;
  }

  return {
    id: state.taskRecordIds[task.id]!,
    playerId: 'player-1',
    levelId: state.currentLevelId!,
    memberId: task.memberId,
    score: points,
    correctCount: isCorrect ? 1 : 0,
    wrongCount: isCorrect ? 0 : 1,
    avgDecisionTime: decisionLog.hesitationTime,
    playedAt: new Date().toISOString(),
    errorCategories,
  };
}

function saveGameRecord(record: GameRecord): void {
  const records = storage.loadRecords<GameRecord[]>([]);
  records.push(record);
  storage.saveRecords(records);
}
