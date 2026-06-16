import { create } from 'zustand';
import type { GameState, Level, GameTask, ActionType, GameResult, GameError } from '../types/game';
import { validateAction } from '../utils/validation';
import { generateGameResult } from '../utils/scoring';
import { getTaskById, getRandomTasks } from '../data/tasks';
import { saveLevelProgress, markTutorialCompleted } from '../utils/storage';

interface GameStore {
  currentScene: string;
  gameState: GameState | null;
  gameResult: GameResult | null;
  currentLevel: Level | null;
  tutorialStep: number;
  showTutorial: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  feedback: {
    show: boolean;
    isCorrect: boolean;
    points: number;
    message: string;
  } | null;
  setCurrentScene: (scene: string) => void;
  startGame: (level: Level, isTutorial?: boolean) => void;
  processAction: (action: ActionType) => { isCorrect: boolean; points: number };
  nextTask: () => void;
  endGame: () => GameResult;
  recordError: (error: GameError) => void;
  updateScore: (points: number) => void;
  updateElapsedTime: (delta: number) => void;
  setPaused: (paused: boolean) => void;
  showFeedback: (isCorrect: boolean, points: number, message: string) => void;
  hideFeedback: () => void;
  advanceTutorial: () => void;
  setShowTutorial: (show: boolean) => void;
  toggleSound: () => void;
  toggleMusic: () => void;
  resetGame: () => void;
}

const initialGameState: GameState = {
  currentLevel: null,
  currentTaskIndex: 0,
  tasks: [],
  score: 0,
  combo: 0,
  maxCombo: 0,
  startTime: 0,
  elapsedTime: 0,
  currentTaskStartTime: 0,
  errors: [],
  correctCount: 0,
  totalCount: 0,
  isPaused: false,
  isTutorial: false,
  tutorialStep: 0,
};

export const useGameStore = create<GameStore>((set, get) => ({
  currentScene: 'BootScene',
  gameState: null,
  gameResult: null,
  currentLevel: null,
  tutorialStep: 0,
  showTutorial: false,
  soundEnabled: true,
  musicEnabled: true,
  feedback: null,

  setCurrentScene: (scene: string) => {
    set({ currentScene: scene });
  },

  startGame: (level: Level, isTutorial = false) => {
    let tasks: GameTask[] = [];

    if (level.mode === 'practice') {
      tasks = getRandomTasks(5, level.difficulty);
    } else {
      tasks = level.tasks
        .map(taskId => getTaskById(taskId))
        .filter((task): task is GameTask => task !== undefined);
    }

    const now = Date.now();
    const newGameState: GameState = {
      ...initialGameState,
      currentLevel: level,
      tasks,
      startTime: now,
      currentTaskStartTime: now,
      isTutorial,
    };

    set({
      currentLevel: level,
      gameState: newGameState,
      gameResult: null,
      tutorialStep: 0,
      showTutorial: isTutorial,
    });
  },

  processAction: (action: ActionType) => {
    const state = get().gameState;
    if (!state || state.isPaused) {
      return { isCorrect: false, points: 0 };
    }

    const currentTask = state.tasks[state.currentTaskIndex];
    if (!currentTask) {
      return { isCorrect: false, points: 0 };
    }

    const responseTime = (Date.now() - state.currentTaskStartTime) / 1000;
    const result = validateAction(currentTask, action, responseTime, state.combo);

    const newCombo = result.isCorrect ? state.combo + 1 : 0;
    const newMaxCombo = Math.max(state.maxCombo, newCombo);

    const error: GameError | null = !result.isCorrect
      ? {
          taskId: currentTask.id,
          patientName: currentTask.patient.name,
          selectedAction: action,
          correctAction: result.correctAction,
          reason: result.reason,
          timestamp: Date.now(),
          responseTime,
        }
      : null;

    const newErrors = error ? [...state.errors, error] : state.errors;

    set({
      gameState: {
        ...state,
        score: Math.max(0, state.score + result.points),
        combo: newCombo,
        maxCombo: newMaxCombo,
        correctCount: result.isCorrect ? state.correctCount + 1 : state.correctCount,
        totalCount: state.totalCount + 1,
        errors: newErrors,
      },
    });

    if (error) {
      get().recordError(error);
    }

    return { isCorrect: result.isCorrect, points: result.points };
  },

  nextTask: () => {
    const state = get().gameState;
    if (!state) return;

    const nextIndex = state.currentTaskIndex + 1;
    if (nextIndex >= state.tasks.length) {
      get().endGame();
      return;
    }

    set({
      gameState: {
        ...state,
        currentTaskIndex: nextIndex,
        currentTaskStartTime: Date.now(),
      },
    });
  },

  endGame: () => {
    const state = get().gameState;
    if (!state) {
      return {} as GameResult;
    }

    const result = generateGameResult(state, state.tasks);

    if (state.currentLevel && state.currentLevel.mode !== 'practice') {
      saveLevelProgress(state.currentLevel.id, {
        stars: result.stars,
        bestScore: result.score,
        completed: result.passed,
      });

      if (result.passed) {
        // Unlock next level logic would go here
      }
    }

    if (state.isTutorial) {
      markTutorialCompleted();
    }

    set({
      gameResult: result,
      showTutorial: false,
    });

    return result;
  },

  recordError: (error: GameError) => {
    const state = get().gameState;
    if (!state) return;

    set({
      gameState: {
        ...state,
        errors: [...state.errors, error],
      },
    });
  },

  updateScore: (points: number) => {
    const state = get().gameState;
    if (!state) return;

    set({
      gameState: {
        ...state,
        score: Math.max(0, state.score + points),
      },
    });
  },

  updateElapsedTime: (delta: number) => {
    const state = get().gameState;
    if (!state || state.isPaused) return;

    set({
      gameState: {
        ...state,
        elapsedTime: state.elapsedTime + delta,
      },
    });
  },

  setPaused: (paused: boolean) => {
    const state = get().gameState;
    if (!state) return;

    set({
      gameState: {
        ...state,
        isPaused: paused,
      },
    });
  },

  showFeedback: (isCorrect: boolean, points: number, message: string) => {
    set({
      feedback: {
        show: true,
        isCorrect,
        points,
        message,
      },
    });
  },

  hideFeedback: () => {
    set({ feedback: null });
  },

  advanceTutorial: () => {
    const state = get().gameState;
    if (!state) return;

    const nextStep = state.tutorialStep + 1;
    set({
      gameState: {
        ...state,
        tutorialStep: nextStep,
      },
      tutorialStep: nextStep,
    });
  },

  setShowTutorial: (show: boolean) => {
    set({ showTutorial: show });
  },

  toggleSound: () => {
    set(state => ({ soundEnabled: !state.soundEnabled }));
  },

  toggleMusic: () => {
    set(state => ({ musicEnabled: !state.musicEnabled }));
  },

  resetGame: () => {
    set({
      gameState: null,
      gameResult: null,
      currentLevel: null,
      tutorialStep: 0,
      showTutorial: false,
      feedback: null,
    });
  },
}));
