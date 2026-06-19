import { create } from 'zustand'
import type { ActionLog } from '@/types/replay'
import type { TrainingRecord, QuestionResult } from '@/types/training'
import { addRecord as storageAddRecord } from '@/utils/storage'
import { addReplay as storageAddReplay } from '@/utils/storage'
import { calculateOnTimeRate } from '@/utils/scoring'
import { mockQuestions } from '@/utils/mockData'

interface Answer {
  questionId: string
  answer: unknown
  timestamp: number
  isCorrect: boolean
  timeSpent: number
  recommendedTime: number
}

interface TrainingState {
  levelId: string | null
  currentQuestionIndex: number
  answers: Answer[]
  score: number
  isPlaying: boolean
  startTime: number | null
  questionStartTime: number | null
  elapsedTime: number
  actionLog: ActionLog[]
  lastRecordId: string | null
  startTraining: (levelId: string) => void
  submitAnswer: (questionId: string, answer: unknown, isCorrect?: boolean) => void
  nextQuestion: () => void
  finishTraining: () => { recordId: string; isSuccess: boolean }
  clearLastRecord: () => void
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
            levelId,
            currentQuestionIndex: 0,
            answers: [],
            score: 0,
            isPlaying: true,
            startTime: Date.now(),
            questionStartTime: Date.now(),
            elapsedTime: 0,
            actionLog: [],
            lastRecordId: null,
          }),
          'startTraining',
          { levelId }
        )
      },
      submitAnswer: (questionId: string, answer: unknown, isCorrect?: boolean) => {
        const questionStartTime = get().questionStartTime ?? Date.now()
        const timeSpent = Date.now() - questionStartTime
        const question = mockQuestions.find((q) => q.id === questionId)
        const recommendedTime = (question?.recommendedTime ?? 60) * 1000
        
        let actualIsCorrect = isCorrect
        if (actualIsCorrect === undefined && typeof answer === 'object' && answer !== null && 'isCorrect' in answer) {
          actualIsCorrect = (answer as { isCorrect: boolean }).isCorrect
        }
        
        wrappedSet(
          (state) => ({
            answers: [
              ...state.answers,
              {
                questionId,
                answer,
                timestamp: Date.now(),
                isCorrect: actualIsCorrect ?? false,
                timeSpent,
                recommendedTime,
              },
            ],
            score: actualIsCorrect ? state.score + (question?.score ?? 25) : state.score,
          }),
          'submitAnswer',
          { questionId, answer, isCorrect: actualIsCorrect }
        )
      },
      nextQuestion: () => {
        wrappedSet(
          (state) => ({
            currentQuestionIndex: state.currentQuestionIndex + 1,
            questionStartTime: Date.now(),
            elapsedTime: state.startTime ? Date.now() - state.startTime : 0,
          }),
          'nextQuestion',
          { nextIndex: get().currentQuestionIndex + 1 }
        )
      },
      finishTraining: () => {
        const state = get()
        const levelId = state.levelId ?? 'unknown'
        const endTime = Date.now()
        
        const questionResults: QuestionResult[] = state.answers.map((a) => ({
          id: `qr-${a.questionId}`,
          recordId: '',
          questionId: a.questionId,
          type: mockQuestions.find((q) => q.id === a.questionId)?.type ?? 'evidence',
          isCorrect: a.isCorrect,
          timeSpent: a.timeSpent,
          recommendedTime: a.recommendedTime,
          hesitationPoints: Math.floor(a.timeSpent / 2000),
          userAnswer: JSON.stringify(a.answer),
        }))
        
        const onTimeRate = calculateOnTimeRate(questionResults)
        const maxPossibleScore = state.answers.length * 25
        const isSuccess = state.score >= maxPossibleScore * 0.6 && onTimeRate >= 60
        
        const recordId = `rec-${Date.now()}`
        
        const record: TrainingRecord = {
          id: recordId,
          userId: 'student-001',
          levelId,
          score: state.score,
          onTimeRate,
          status: isSuccess ? 'completed' : 'failed',
          startTime: state.startTime ? new Date(state.startTime).toISOString() : new Date().toISOString(),
          endTime: new Date(endTime).toISOString(),
          results: questionResults,
        }
        
        questionResults.forEach((qr) => {
          qr.recordId = recordId
        })
        record.results = questionResults
        
        storageAddRecord(record)
        
        if (!isSuccess) {
          const replay = {
            id: `rep-${Date.now()}`,
            recordId,
            levelId,
            actionLog: state.actionLog,
            hesitationThreshold: 2000,
            createdAt: new Date().toISOString(),
          }
          storageAddReplay(replay, 3)
        }
        
        wrappedSet(
          () => ({
            isPlaying: false,
            elapsedTime: state.startTime ? endTime - state.startTime : 0,
            lastRecordId: recordId,
          }),
          'finishTraining',
          { finalScore: state.score, onTimeRate, status: isSuccess ? 'completed' : 'failed' }
        )
        
        return { recordId, isSuccess }
      },
      clearLastRecord: () => {
        wrappedSet(() => ({ lastRecordId: null }), 'clearLastRecord', {})
      },
    }
  }

export const useTrainingStore = create<TrainingState>()(
  logActionMiddleware((set) => ({
    levelId: null,
    currentQuestionIndex: 0,
    answers: [],
    score: 0,
    isPlaying: false,
    startTime: null,
    questionStartTime: null,
    elapsedTime: 0,
    actionLog: [],
    lastRecordId: null,
    startTraining: () => set(() => ({})),
    submitAnswer: () => set(() => ({})),
    nextQuestion: () => set(() => ({})),
    finishTraining: () => ({ recordId: '', isSuccess: false }),
    clearLastRecord: () => set(() => ({})),
  }))
)
