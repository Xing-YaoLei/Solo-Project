import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameStore } from '@/stores/useGameStore'
import type { ResolveResult } from '@/stores/useGameStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { levels } from '@/data/levels'
import { calculateScore, calculateStars } from '@/utils/scoring'
import { calculateTurnoverDays } from '@/utils/turnover'
import { useSound } from '@/hooks/useSound'
import { useVibration } from '@/hooks/useVibration'
import { useTheme } from '@/hooks/useTheme'
import GameCanvas, { type GameCanvasHandle } from '@/components/pixi/GameCanvas'
import AnimatedNumber from '@/components/common/AnimatedNumber'
import TutorialOverlay from '@/components/tutorial/TutorialOverlay'
import type { TaskTab } from '@/types'

const tabLabels: { key: TaskTab; label: string }[] = [
  { key: 'checklist', label: '整备清单' },
  { key: 'testDrive', label: '试驾记录' },
  { key: 'quotation', label: '报价历史' },
]

export default function GamePage() {
  const { levelId: levelIdParam } = useParams<{ levelId: string }>()
  const levelId = Number(levelIdParam)
  const navigate = useNavigate()

  const {
    currentLevel,
    timeRemaining,
    isPlaying,
    isPaused,
    score,
    errorCount,
    maxConsecutive,
    consecutiveCorrect,
    checklistTasks,
    testDriveTasks,
    quotationTasks,
    activeTab,
    startGame,
    endGame,
    tickTimer,
    pauseGame,
    resumeGame,
    setActiveTab,
    resolveChecklist,
    resolveTestDrive,
    resolveQuotation,
    lastResult,
    lastResultTaskId,
    clearLastResult,
  } = useGameStore()

  const saveResult = useProgressStore((s) => s.saveResult)
  const tutorialCompleted = useSettingsStore((s) => s.tutorialCompleted)
  const setTutorialCompleted = useSettingsStore((s) => s.setTutorialCompleted)

  const { playCorrect, playWrong, playComplete, playCountdown, playClick } = useSound()
  const { correctVibrate, wrongVibrate } = useVibration()
  const { particleCount, shouldAnimate } = useTheme()

  const playCountdownRef = useRef(playCountdown)
  const playCompleteRef = useRef(playComplete)
  playCountdownRef.current = playCountdown
  playCompleteRef.current = playComplete

  const [countdown, setCountdown] = useState(3)
  const [gameStarted, setGameStarted] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [gameKey, setGameKey] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resultSavedRef = useRef(false)
  const canvasRef = useRef<GameCanvasHandle>(null)
  const [flashTaskIds, setFlashTaskIds] = useState<Record<string, ResolveResult>>({})

  const level = useMemo(() => levels.find((l) => l.id === levelId), [levelId])

  const allResolved = useMemo(() => {
    const totalTasks = checklistTasks.length + testDriveTasks.length + quotationTasks.length
    if (totalTasks === 0) return false
    return (
      checklistTasks.every((t) => t.resolved) &&
      testDriveTasks.every((t) => t.resolved) &&
      quotationTasks.every((t) => t.resolved)
    )
  }, [checklistTasks, testDriveTasks, quotationTasks])

  const totalTasks = checklistTasks.length + testDriveTasks.length + quotationTasks.length
  const resolvedTasks =
    checklistTasks.filter((t) => t.resolved).length +
    testDriveTasks.filter((t) => t.resolved).length +
    quotationTasks.filter((t) => t.resolved).length

  const handleResolve = useCallback(
    (taskId: string, result: ResolveResult) => {
      if (!result) return

      if (result === 'correct') {
        playCorrect()
        correctVibrate()
        if (shouldAnimate() && canvasRef.current) {
          canvasRef.current.createScreenParticles('#22c55e', particleCount(40))
        }
      } else {
        playWrong()
        wrongVibrate()
        if (shouldAnimate() && canvasRef.current) {
          canvasRef.current.createScreenParticles('#ef4444', particleCount(30))
        }
      }

      setFlashTaskIds((prev) => ({ ...prev, [taskId]: result }))
      setTimeout(() => {
        setFlashTaskIds((prev) => {
          const next = { ...prev }
          delete next[taskId]
          return next
        })
      }, 500)
    },
    [playCorrect, playWrong, correctVibrate, wrongVibrate, shouldAnimate, particleCount]
  )

  useEffect(() => {
    if (!lastResult || !lastResultTaskId) return
    handleResolve(lastResultTaskId, lastResult)
    clearLastResult()
  }, [lastResult, lastResultTaskId, handleResolve, clearLastResult])

  const saveGameResult = useCallback(() => {
    if (resultSavedRef.current) return
    resultSavedRef.current = true

    const lv = levels.find((l) => l.id === currentLevel)
    if (!lv) return

    const timeUsed = lv.timeLimit - timeRemaining
    const speed = (timeRemaining / lv.timeLimit) * 100
    const total = checklistTasks.length + testDriveTasks.length + quotationTasks.length
    const finalScore = calculateScore(speed, errorCount, maxConsecutive, total)
    const stars = calculateStars(finalScore)
    const inventoryTurnoverDays = calculateTurnoverDays(finalScore, errorCount, timeUsed, lv.carCount)

    saveResult(currentLevel, {
      score: finalScore,
      stars,
      errorCount,
      maxConsecutive,
      timeUsed,
      inventoryTurnoverDays,
      timestamp: Date.now(),
    })
  }, [
    currentLevel,
    timeRemaining,
    errorCount,
    maxConsecutive,
    checklistTasks.length,
    testDriveTasks.length,
    quotationTasks.length,
    saveResult,
  ])

  useEffect(() => {
    if (!level) {
      navigate('/')
      return
    }
    resultSavedRef.current = false
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setCountdown(3)
    setGameStarted(false)
    setFlashTaskIds({})
    startGame(levelId)
    setGameKey((k) => k + 1)
    if (!tutorialCompleted) {
      setShowTutorial(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId])

  useEffect(() => {
    if (showTutorial || countdown > 0) return
    const timer = setTimeout(() => {
      playCountdownRef.current()
      setCountdown((prev) => {
        if (prev <= 1) {
          setGameStarted(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [countdown, showTutorial])

  useEffect(() => {
    if (!gameStarted || isPaused) return
    intervalRef.current = setInterval(() => {
      tickTimer()
    }, 1000)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [gameStarted, isPaused, tickTimer])

  useEffect(() => {
    if (!gameStarted) return
    if (!isPlaying && !resultSavedRef.current) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      playCompleteRef.current()
      if (shouldAnimate() && canvasRef.current) {
        canvasRef.current.createScreenParticles('#ff6b35', particleCount(60))
      }
      saveGameResult()
      setTimeout(() => {
        navigate(`/result/${currentLevel}`)
      }, 800)
    }
  }, [isPlaying, gameStarted, currentLevel, navigate, saveGameResult, particleCount, shouldAnimate])

  useEffect(() => {
    if (gameStarted && allResolved && isPlaying) {
      endGame()
    }
  }, [allResolved, gameStarted, isPlaying, endGame])

  useEffect(() => {
    if (!gameStarted) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPaused) {
          resumeGame()
        } else {
          pauseGame()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameStarted, isPaused, pauseGame, resumeGame])

  if (!level) return null

  const timePercent = (timeRemaining / level.timeLimit) * 100

  const getCardStyle = (taskId: string) => {
    const flash = flashTaskIds[taskId]
    if (flash === 'correct') return 'border-[#22c55e] bg-[#22c55e10] shadow-[0_0_20px_rgba(34,197,94,0.4)]'
    if (flash === 'wrong') return 'border-[#ef4444] bg-[#ef444410] shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-shake'
    return 'border-[#3a3a5a]'
  }

  return (
    <div key={gameKey} className="h-screen bg-[#1a1a2e] text-[#f5f0e8] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <GameCanvas ref={canvasRef} />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {showTutorial && !tutorialCompleted && (
          <TutorialOverlay
            onClose={() => {
              playClick()
              setTutorialCompleted(true)
              setShowTutorial(false)
            }}
          />
        )}

        {countdown > 0 && !showTutorial && (
          <div className="fixed inset-0 bg-[#1a1a2e]/95 flex items-center justify-center z-50">
            <div className="text-8xl font-bold text-[#ff6b35] animate-pulse-glow">
              {countdown}
            </div>
          </div>
        )}

        {countdown === 0 && !gameStarted && !showTutorial && (
          <div className="fixed inset-0 bg-[#1a1a2e]/95 flex items-center justify-center z-50">
            <div className="text-6xl font-bold text-[#22c55e] animate-pulse">GO!</div>
          </div>
        )}

        {isPaused && gameStarted && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40">
            <div className="text-center">
              <div className="text-3xl font-bold mb-4">暂停</div>
              <p className="text-[#f5f0e880]">按 ESC 继续</p>
            </div>
          </div>
        )}

        <div className="px-4 py-2 bg-[#2a2a4a]/90 backdrop-blur-sm border-b border-[#3a3a5a]">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold tabular-nums w-10">
              {timeRemaining}s
            </span>
            <div className="flex-1 h-3 bg-[#3a3a5a] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${timePercent}%`,
                  backgroundColor:
                    timePercent > 30 ? '#22c55e' : timePercent > 10 ? '#eab308' : '#ef4444',
                }}
              />
            </div>
            <span className="text-xs text-[#f5f0e880] tabular-nums">
              {resolvedTasks}/{totalTasks}
            </span>
          </div>
        </div>

        <div className="flex bg-[#2a2a4a]/90 backdrop-blur-sm border-b border-[#3a3a5a]">
          {tabLabels.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                playClick()
                setActiveTab(tab.key)
              }}
              className={`flex-1 py-3 text-sm font-bold text-center relative transition-colors ${
                activeTab === tab.key ? 'text-[#ff6b35]' : 'text-[#f5f0e880]'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[#ff6b35] rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'checklist' && (
            <div className="space-y-3 max-w-2xl mx-auto">
              {checklistTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-[#2a2a4a] rounded-xl p-4 border transition-all duration-300 ${getCardStyle(task.id)} ${
                    task.resolved ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-sm">{task.carModel}</div>
                      <div className="text-[#f5f0e880] text-xs">{task.item}</div>
                    </div>
                    {task.resolved && (
                      <span className="text-xs text-[#22c55e]">已处理</span>
                    )}
                  </div>
                  {!task.resolved && (
                    <>
                      <p className="text-xs text-[#f5f0e860] mb-3">{task.detail}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => resolveChecklist(task.id, true)}
                          className="flex-1 py-2 bg-[#22c55e20] text-[#22c55e] rounded-lg text-sm font-bold border border-[#22c55e40] active:scale-95 transition-transform"
                        >
                          合格
                        </button>
                        <button
                          onClick={() => resolveChecklist(task.id, false)}
                          className="flex-1 py-2 bg-[#ef444420] text-[#ef4444] rounded-lg text-sm font-bold border border-[#ef444440] active:scale-95 transition-transform"
                        >
                          不合格
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {checklistTasks.length === 0 && (
                <p className="text-center text-[#f5f0e860] py-8">暂无整备任务</p>
              )}
            </div>
          )}

          {activeTab === 'testDrive' && (
            <div className="space-y-3 max-w-2xl mx-auto">
              {testDriveTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-[#2a2a4a] rounded-xl p-4 border transition-all duration-300 ${getCardStyle(task.id)} ${
                    task.resolved ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-sm">{task.carModel}</div>
                      <div className="text-[#f5f0e880] text-xs">{task.field}</div>
                    </div>
                    {task.resolved && (
                      <span className="text-xs text-[#22c55e]">已处理</span>
                    )}
                  </div>
                  {!task.resolved && (
                    <>
                      <p className="text-xs text-[#f5f0e860] mb-1">
                        数据: {task.displayValue}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => resolveTestDrive(task.id, true)}
                          className="flex-1 py-2 bg-[#ef444420] text-[#ef4444] rounded-lg text-sm font-bold border border-[#ef444440] active:scale-95 transition-transform"
                        >
                          数据有误
                        </button>
                        <button
                          onClick={() => resolveTestDrive(task.id, false)}
                          className="flex-1 py-2 bg-[#22c55e20] text-[#22c55e] rounded-lg text-sm font-bold border border-[#22c55e40] active:scale-95 transition-transform"
                        >
                          数据正常
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {testDriveTasks.length === 0 && (
                <p className="text-center text-[#f5f0e860] py-8">暂无试驾任务</p>
              )}
            </div>
          )}

          {activeTab === 'quotation' && (
            <div className="space-y-3 max-w-2xl mx-auto">
              {quotationTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-[#2a2a4a] rounded-xl p-4 border transition-all duration-300 ${getCardStyle(task.id)} ${
                    task.resolved ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-sm">{task.carModel}</div>
                      <div className="text-[#f5f0e880] text-xs">
                        市场参考价: ¥{task.marketPrice.toLocaleString()}
                      </div>
                    </div>
                    {task.resolved && (
                      <span className="text-xs text-[#22c55e]">已处理</span>
                    )}
                  </div>
                  {!task.resolved && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {task.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => resolveQuotation(task.id, idx)}
                          className="py-2 bg-[#3a3a5a] text-[#f5f0e8] rounded-lg text-sm font-bold active:scale-95 hover:bg-[#4a4a6a] transition-all"
                        >
                          ¥{opt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {quotationTasks.length === 0 && (
                <p className="text-center text-[#f5f0e860] py-8">暂无报价任务</p>
              )}
            </div>
          )}
        </div>

        <div className="px-4 py-3 bg-[#2a2a4a]/90 backdrop-blur-sm border-t border-[#3a3a5a] flex items-center justify-between">
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-xs text-[#f5f0e880]">得分</div>
              <div className="font-bold text-[#ff6b35]">
                <AnimatedNumber value={score} />
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-[#f5f0e880]">错误</div>
              <div className="font-bold text-[#ef4444]">
                <AnimatedNumber value={errorCount} />
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-[#f5f0e880]">连击</div>
              <div
                className={`font-bold text-[#22c55e] transition-transform ${
                  consecutiveCorrect >= 3 ? 'scale-125 animate-pulse' : ''
                }`}
              >
                <AnimatedNumber value={consecutiveCorrect} />
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-[#f5f0e880]">最高连击</div>
            <div className="font-bold">
              <AnimatedNumber value={maxConsecutive} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
