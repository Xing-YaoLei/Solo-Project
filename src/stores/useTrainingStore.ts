import { create } from 'zustand'
import type { ActionLog } from '@/types/replay'

interface Answer {
  questionId: string
  answer: unknown
  timestamp: number
}

interface TrainingState {
  currentQuestionIndex: number
  answers: Answer[]
  score: number
  isPlaying: boolean
  startTime: number | null
  elapsedTime: number
  actionLog: ActionLog[]
  startTraining: (levelId: string) => void
  submitAnswer: (questionId: string, answer: unknown) => void
  nextQuestion: () => void
  finishTraining: () => void
}

type TrainingAction = keyof Omit<TrainingState, 'actionLog' | 'startTime' | 'elapsedTime' | 'currentQuestionIndex' | 'answers' | 'score' | 'isPlaying'>

const logActionMiddleware = (config: (set: (fn: (state: TrainingState) => Partial<TrainingState>) => void, get: () => TrainingState, api: unknown) => TrainingState) =>
  (set: (fn: (state: TrainingState) => Partial<TrainingState>) => void, get: () => TrainingState, api: unknown) => {
    const wrappedSet = (fn: (state: TrainingState) => Partial<TrainingState>, actionType?: TrainingAction, payload?: unknown) => {
      set((state) => {
        const partial = fn(state)
        if (actionType) {
          return {
            ...partial,
            actionLog: [
              ...state.actionLog,
              {
                timestamp: Date.now(),
                actionType,
                payload: payload ?? partial,
              },
            ],
          }
        }
        return partial
      })
    }

    const state = config(
      (fn) => wrappedSet(fn),
      get,
      api
    ) as TrainingState

    return {
      ...state,
      startTraining: (levelId: string) => {
        wrappedSet(
          () => ({
            currentQuestionIndex: 0,
            answers: [],
            score: 0,
            isPlaying: true,
            startTime: Date.now(),
            elapsedTime: 0,
            actionLog: [],
          }),
          'startTraining',
          { levelId }
        )
      },
      submitAnswer: (questionId: string, answer: unknown) => {
        wrappedSet(
          (state) => ({
            answers: [
              ...state.answers,
              {
                questionId,
                answer,
                timestamp: Date.now(),
              },
            ],
          }),
          'submitAnswer',
          { questionId, answer }
        )
      },
      nextQuestion: () => {
        wrappedSet(
          (state) => ({
            currentQuestionIndex: state.currentQuestionIndex + 1,
            elapsedTime: state.startTime ? Date.now() - state.startTime : 0,
          }),
          'nextQuestion',
          { nextIndex: get().currentQuestionIndex + 1 }
        )
      },
      finishTraining: () => {
        wrappedSet(
          (state) => ({
            isPlaying: false,
            elapsedTime: state.startTime ? Date.now() - state.startTime : 0,
          }),
          'finishTraining',
          { finalScore: get().score }
        )
      },
    }
  }

export const useTrainingStore = create<TrainingState>()(
  logActionMiddleware((set) => ({
    currentQuestionIndex: 0,
    answers: [],
    score: 0,
    isPlaying: false,
    startTime: null,
    elapsedTime: 0,
    actionLog: [],
    startTraining: () => set(() => ({})),
    submitAnswer: () => set(() => ({})),
    nextQuestion: () => set(() => ({})),
    finishTraining: () => set(() => ({})),
  }))
)
