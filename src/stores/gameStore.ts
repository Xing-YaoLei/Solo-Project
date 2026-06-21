import { create } from 'zustand';
import type {
  GameMode,
  GamePhase,
  Question,
  UserAnswer,
  Level,
  QuestionType,
} from '@/types/game';
import type { TrainingRecord, QuestionResult } from '@/types/record';
import { LEVELS, QUESTIONS, getQuestionsByIds } from '@/mock/levels';
import { RecordStorage, UserStorage, ConfigStorage } from '@/utils/storage';
import {
  evaluateAnswer,
  calculateStars,
  calculateRewardPoints,
  buildQuestionResult,
  computeDispatchDuration,
} from '@/utils/scoring';

interface GameState {
  mode: GameMode;
  currentLevelId: string | null;
  currentLevel: Level | null;
  phase: GamePhase;
  score: number;
  phaseStartTime: number;
  phaseDurations: Record<string, number>;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, UserAnswer>;
  questionResults: QuestionResult[];
  lastRecordId: string | null;
  selectedPracticeTypes: QuestionType[];
  practiceDifficulty: [number, number];

  startLevel: (levelId: string) => void;
  startPractice: (options: { types: QuestionType[]; difficulty: [number, number] }) => void;
  submitAnswer: (answer: UserAnswer['answer']) => void;
  nextPhase: () => void;
  goToQuestion: (index: number) => void;
  resetGame: () => void;
  finishGame: () => TrainingRecord | null;
  updatePhaseDuration: () => void;
}

const currentUser = UserStorage.CURRENT_USER;

const phaseOrder: GamePhase[] = ['intro', 'rule', 'evidence', 'settlement', 'compensation', 'result'];

const getNextPhaseForType = (questions: Question[], currentIndex: number): GamePhase => {
  if (currentIndex >= questions.length) return 'result';
  return questions[currentIndex].type as GamePhase;
};

export const useGameStore = create<GameState>((set, get) => ({
  mode: 'level',
  currentLevelId: null,
  currentLevel: null,
  phase: 'intro',
  score: 0,
  phaseStartTime: Date.now(),
  phaseDurations: {},
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  questionResults: [],
  lastRecordId: null,
  selectedPracticeTypes: ['rule', 'evidence', 'settlement', 'compensation'],
  practiceDifficulty: [1, 5],

  startLevel: (levelId: string) => {
    const savedLevels = ConfigStorage.getLevels<Level[] | null>(null);
    const allLevels = savedLevels && savedLevels.length > 0 ? savedLevels : LEVELS;
    const level = allLevels.find(l => l.id === levelId);
    if (!level) return;

    const questions = getQuestionsByIds(level.questionIds);

    set({
      mode: 'level',
      currentLevelId: levelId,
      currentLevel: level,
      phase: questions.length > 0 ? getNextPhaseForType(questions, 0) : 'intro',
      score: 0,
      phaseStartTime: Date.now(),
      phaseDurations: {},
      questions,
      currentQuestionIndex: 0,
      answers: {},
      questionResults: [],
      lastRecordId: null,
    });
  },

  startPractice: ({ types, difficulty }) => {
    const filteredQuestions = QUESTIONS.filter(q => {
      return types.includes(q.type) && q.difficulty >= difficulty[0] && q.difficulty <= difficulty[1];
    });

    const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5).slice(0, Math.min(6, filteredQuestions.length));

    set({
      mode: 'practice',
      currentLevelId: 'practice',
      currentLevel: {
        id: 'practice',
        name: '自由练习',
        description: '自由组合题型的练习模式',
        difficulty: 2,
        totalScore: shuffled.reduce((s, q) => s + q.score, 0),
        questionIds: shuffled.map(q => q.id),
        unlocked: true,
        stars: 0,
        bestScore: 0,
        completed: false,
        icon: '🎲',
        color: '#06b6d4',
      },
      phase: shuffled.length > 0 ? getNextPhaseForType(shuffled, 0) : 'intro',
      score: 0,
      phaseStartTime: Date.now(),
      phaseDurations: {},
      questions: shuffled,
      currentQuestionIndex: 0,
      answers: {},
      questionResults: [],
      lastRecordId: null,
      selectedPracticeTypes: types,
      practiceDifficulty: difficulty,
    });
  },

  updatePhaseDuration: () => {
    const { phase, phaseStartTime, phaseDurations } = get();
    const elapsed = (Date.now() - phaseStartTime) / 1000;
    set({
      phaseDurations: {
        ...phaseDurations,
        [phase]: (phaseDurations[phase] || 0) + elapsed,
      },
      phaseStartTime: Date.now(),
    });
  },

  submitAnswer: (answer) => {
    const state = get();
    const question = state.questions[state.currentQuestionIndex];
    if (!question) return;

    const timeSpent = (Date.now() - state.phaseStartTime) / 1000;
    const { score: earnedScore, isCorrect } = evaluateAnswer(question, answer);

    const userAnswer: UserAnswer = {
      questionId: question.id,
      answer,
      isCorrect,
      timeSpent,
      scoreEarned: earnedScore,
      submittedAt: Date.now(),
    };

    const result = buildQuestionResult(question, userAnswer);
    const newPhaseDuration = {
      ...state.phaseDurations,
      [state.phase]: (state.phaseDurations[state.phase] || 0) + timeSpent,
    };

    set({
      answers: { ...state.answers, [question.id]: userAnswer },
      questionResults: [...state.questionResults, result],
      score: state.score + earnedScore,
      phaseDurations: newPhaseDuration,
      phaseStartTime: Date.now(),
    });
  },

  nextPhase: () => {
    const state = get();
    const nextIndex = state.currentQuestionIndex + 1;

    if (nextIndex >= state.questions.length) {
      set({ phase: 'result' });
      return;
    }

    const nextQuestion = state.questions[nextIndex];
    set({
      currentQuestionIndex: nextIndex,
      phase: nextQuestion.type as GamePhase,
      phaseStartTime: Date.now(),
    });
  },

  goToQuestion: (index) => {
    const state = get();
    if (index < 0 || index >= state.questions.length) return;
    set({
      currentQuestionIndex: index,
      phase: state.questions[index].type as GamePhase,
      phaseStartTime: Date.now(),
    });
  },

  resetGame: () => {
    set({
      mode: 'level',
      currentLevelId: null,
      currentLevel: null,
      phase: 'intro',
      score: 0,
      phaseStartTime: Date.now(),
      phaseDurations: {},
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      questionResults: [],
      lastRecordId: null,
    });
  },

  finishGame: () => {
    const state = get();
    if (!state.currentLevel) return null;

    const totalScore = state.questions.reduce((s, q) => s + q.score, 0);
    const accuracy = totalScore === 0 ? 0 : state.score / totalScore;
    const correctCount = state.questionResults.filter(r => r.isCorrect).length;
    const totalDuration = computeDispatchDuration(state.phaseDurations);
    const dispatchDuration = totalDuration;
    const stars = calculateStars(accuracy);

    const expectedTime = state.questions.reduce((s, q) => s + q.timeLimit, 0);
    const rewardPoints = state.mode === 'level'
      ? calculateRewardPoints(correctCount, accuracy, totalDuration, expectedTime)
      : 0;

    const record: TrainingRecord = {
      id: `record-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      levelId: state.currentLevel.id,
      levelName: state.currentLevel.name,
      mode: state.mode,
      score: state.score,
      totalScore,
      accuracy,
      totalDuration,
      dispatchDuration,
      phaseDurations: state.phaseDurations,
      stars,
      questionResults: state.questionResults,
      createdAt: Date.now(),
      rewardPoints,
      badges: [],
    };

    if (state.mode === 'level') {
      RecordStorage.add(record);
    }

    if (state.mode === 'level' && stars >= 1) {
      const savedLevels = ConfigStorage.getLevels<Level[] | null>(null);
      const allLevels = savedLevels && savedLevels.length > 0 ? [...savedLevels] : [...LEVELS];
      const idx = allLevels.findIndex(l => l.id === state.currentLevel!.id);
      if (idx >= 0) {
        allLevels[idx] = {
          ...allLevels[idx],
          completed: true,
          stars: Math.max(allLevels[idx].stars, stars),
          bestScore: Math.max(allLevels[idx].bestScore, state.score),
        };
        const nextIdx = idx + 1;
        if (nextIdx < allLevels.length && !allLevels[nextIdx].unlocked) {
          allLevels[nextIdx] = { ...allLevels[nextIdx], unlocked: true };
        }
        ConfigStorage.saveLevels(allLevels);
      }
    }

    set({ lastRecordId: record.id, phase: 'result' });
    return record;
  },
}));
