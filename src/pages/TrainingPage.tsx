import { useEffect, useState, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Trophy, ChevronLeft, ChevronRight, Send, Home } from 'lucide-react'
import Room from '@/components/three/Room'
import SceneLights from '@/components/three/SceneLights'
import PostEffects from '@/components/three/PostEffects'
import Cleaner from '@/components/three/Cleaner'
import EvidencePoint from '@/components/three/EvidencePoint'
import Calendar3D from '@/components/three/Calendar3D'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Tab from '@/components/ui/Tab'
import EvidencePanel from '@/components/training/EvidencePanel'
import TagSelector from '@/components/training/TagSelector'
import CalendarSorter from '@/components/training/CalendarSorter'
import TaskBoard from '@/components/training/TaskBoard'
import FeedbackModal from '@/components/training/FeedbackModal'
import { useTrainingStore } from '@/stores/useTrainingStore'
import { useLevelStore } from '@/stores/useLevelStore'
import { useConfigStore } from '@/stores/useConfigStore'
import { mockLevels } from '@/utils/mockData'
import { cn } from '@/lib/utils'
import type { QuestionType, Question, Evidence, TagOption, CalendarTask, CleaningTask } from '@/types/training'

const QUESTION_TABS = [
  { key: 'evidence', label: '证据识别' },
  { key: 'tag', label: '点评标签' },
  { key: 'calendar', label: '日历排序' },
  { key: 'task', label: '任务处理' },
]

export default function TrainingPage() {
  const { levelId = 'level-1' } = useParams<{ levelId: string }>()
  const navigate = useNavigate()

  const levels = useLevelStore((s) => s.levels)
  const setLevels = useLevelStore((s) => s.setLevels)
  const currentQuestionIndex = useTrainingStore((s) => s.currentQuestionIndex)
  const score = useTrainingStore((s) => s.score)
  const isPlaying = useTrainingStore((s) => s.isPlaying)
  const answers = useTrainingStore((s) => s.answers)
  const startTraining = useTrainingStore((s) => s.startTraining)
  const submitAnswer = useTrainingStore((s) => s.submitAnswer)
  const finishTraining = useTrainingStore((s) => s.finishTraining)
  const nextQuestion = useTrainingStore((s) => s.nextQuestion)
  const hasAnswer = useTrainingStore((s) => s.hasAnswer)
  const getAnswerByQuestionId = useTrainingStore((s) => s.getAnswerByQuestionId)
  const configQuestions = useConfigStore((s) => s.questions)
  const loadConfig = useConfigStore((s) => s.loadConfig)

  const questions = useMemo(
    () => configQuestions.filter((q) => q.levelId === levelId),
    [configQuestions, levelId]
  )

  const [activeTab, setActiveTab] = useState<QuestionType>('evidence')
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [feedbackReason, setFeedbackReason] = useState('')
  const [earnedScore, setEarnedScore] = useState(0)
  const [remainingTime, setRemainingTime] = useState(300)

  const cleaners = [
    { id: 'cleaner-1', name: '李阿姨', level: 2 },
    { id: 'cleaner-2', name: '王阿姨', level: 3 },
    { id: 'cleaner-3', name: '张阿姨', level: 1 },
  ]

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  useEffect(() => {
    if (levels.length === 0) {
      setLevels(mockLevels.map((l) => ({
        id: l.id,
        name: l.name,
        difficulty: l.difficulty,
        isOpen: l.isOpen,
        openTime: l.openTime,
        closeTime: l.closeTime,
      })))
    }
    if (!isPlaying) {
      startTraining(levelId)
    }
  }, [levelId, levels, setLevels, isPlaying, startTraining])

  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      setActiveTab(questions[currentQuestionIndex].type)
      setRemainingTime(questions[currentQuestionIndex].recommendedTime)
    }
  }, [questions, currentQuestionIndex])

  useEffect(() => {
    if (!isPlaying || remainingTime <= 0) return
    const timer = setInterval(() => {
      setRemainingTime((t) => Math.max(0, t - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [isPlaying, remainingTime])

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex >= questions.length - 1
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const currentAnswer = currentQuestion ? getAnswerByQuestionId(currentQuestion.id) : undefined
  const currentQuestionSubmitted = currentQuestion ? hasAnswer(currentQuestion.id) : false

  const allQuestionsSubmitted = questions.length > 0 && questions.every((q) => hasAnswer(q.id))

  const handleSubmit = () => {
    if (currentAnswer) {
      setIsCorrect(currentAnswer.isCorrect)
      setFeedbackReason(currentQuestion?.correctReason ?? '')
      setEarnedScore(currentAnswer.isCorrect ? currentQuestion?.score ?? 0 : 0)
      setShowFeedback(true)
    }
  }

  const handleFeedbackContinue = () => {
    setShowFeedback(false)
    if (isLastQuestion) {
      const result = finishTraining()
      if (!result.allSubmitted) {
        alert('请完成所有题目后再提交训练！')
        return
      }
      navigate(`/records?recordId=${result.recordId}&isSuccess=${result.isSuccess}`)
    } else {
      nextQuestion()
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      useTrainingStore.setState((s) => ({
        currentQuestionIndex: s.currentQuestionIndex - 1,
        questionStartTime: Date.now(),
      }))
    }
  }

  const handleNextQuestion = () => {
    if (!isLastQuestion) {
      nextQuestion()
    }
  }

  const currentLevel = levels.find((l) => l.id === levelId)

  return (
    <div className="flex h-screen flex-col bg-neutral-50">
      <header className="z-40 flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-100"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </button>
          <div className="h-6 w-px bg-neutral-200" />
          <div>
            <h1 className="text-sm font-semibold text-neutral-800">{currentLevel?.name ?? '训练关卡'}</h1>
            <p className="text-xs text-neutral-500">题目 {currentQuestionIndex + 1} / {questions.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="h-2 w-48 overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5', remainingTime <= 30 ? 'bg-danger/10 text-danger' : 'bg-neutral-100 text-neutral-700')}>
            <Clock className="h-4 w-4" />
            <span className="font-mono text-sm font-medium">{formatTime(remainingTime)}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-accent-dark">
            <Trophy className="h-4 w-4" />
            <span className="text-sm font-medium">{score} 分</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="relative flex-1">
          <Canvas
            shadows
            camera={{ position: [8, 6, 8], fov: 50 }}
            gl={{ antialias: true, alpha: false }}
          >
            <color attach="background" args={['#F5F1EA']} />
            <fog attach="fog" args={['#F5F1EA', 15, 35]} />
            <SceneLights />
            <Physics gravity={[0, -9.81, 0]}>
              <Room />
              <Cleaner position={[-2, 0, 2]} />
              {activeTab === 'evidence' && currentQuestion?.evidences?.map((ev, idx) => (
                <EvidencePoint
                  key={ev.id}
                  id={ev.id}
                  position={[ev.position.x, ev.position.y, ev.position.z]}
                  isCorrect={ev.isCorrect}
                  pulseSpeed={2 + idx * 0.3}
                />
              ))}
              {activeTab === 'calendar' && (
                <Calendar3D
                  position={[2, 0, 0]}
                  tasks={(currentQuestion?.calendarTasks ?? []).map((t, i) => ({
                    date: new Date(t.checkOut).toISOString().split('T')[0],
                    status: i === 0 ? 'delayed' : i === 1 ? 'inProgress' : 'none',
                    taskName: t.roomId,
                  }))}
                />
              )}
            </Physics>
            <PostEffects />
            <OrbitControls
              enablePan={false}
              minDistance={4}
              maxDistance={14}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 2.2}
              target={[0, 1, 0]}
            />
          </Canvas>
          <div className="absolute left-4 top-4 rounded-lg bg-white/90 px-3 py-2 backdrop-blur-sm">
            <p className="text-xs text-neutral-500">当前题目类型</p>
            <p className="text-sm font-medium text-neutral-800">
              {QUESTION_TABS.find((t) => t.key === activeTab)?.label}
            </p>
          </div>
        </div>

        <div className="flex w-[420px] flex-col border-l border-neutral-200 bg-white">
          <div className="flex-1 overflow-y-auto p-5">
            {currentQuestion && (
              <>
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-neutral-800">{currentQuestion.description}</h3>
                  <p className="mt-1 text-xs text-neutral-500">本题满分 {currentQuestion.score} 分，建议用时 {currentQuestion.recommendedTime} 秒</p>
                </div>

                <Tab
                  tabs={QUESTION_TABS}
                  activeKey={activeTab}
                  onChange={(k) => setActiveTab(k as QuestionType)}
                  className="mb-4"
                />

                <Card className="p-4">
                  {activeTab === 'evidence' && (
                    <EvidencePanel
                      question={currentQuestion}
                      evidences={currentQuestion.evidences ?? []}
                    />
                  )}
                  {activeTab === 'tag' && (
                    <TagSelector
                      question={currentQuestion}
                      reviewText={currentQuestion.reviewText ?? ''}
                      tagOptions={currentQuestion.tagOptions ?? []}
                    />
                  )}
                  {activeTab === 'calendar' && (
                    <CalendarSorter
                      question={currentQuestion}
                      tasks={currentQuestion.calendarTasks ?? []}
                    />
                  )}
                  {activeTab === 'task' && (
                    <TaskBoard
                      question={currentQuestion}
                      tasks={currentQuestion.cleaningTasks ?? []}
                      cleaners={cleaners}
                    />
                  )}
                </Card>
              </>
            )}
          </div>

          <div className="border-t border-neutral-200 p-4">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex-1"
              >
                <ChevronLeft className="h-4 w-4" />
                上一题
              </Button>
              {!isLastQuestion ? (
                <Button variant="secondary" onClick={handleNextQuestion} className="flex-1">
                  下一题
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!allQuestionsSubmitted}
                  className="flex-1"
                >
                  <Send className="h-4 w-4" />
                  {allQuestionsSubmitted ? '完成训练' : '请先完成所有题目'}
                </Button>
              )}
            </div>
            <button
              onClick={() => navigate('/')}
              className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs text-neutral-500 transition hover:text-neutral-700"
            >
              <Home className="h-3.5 w-3.5" />
              放弃训练返回首页
            </button>
          </div>
        </div>
      </div>

      <FeedbackModal
        isOpen={showFeedback}
        isCorrect={isCorrect}
        reason={feedbackReason}
        score={earnedScore}
        onContinue={handleFeedbackContinue}
        isLastQuestion={isLastQuestion}
      />
    </div>
  )
}
