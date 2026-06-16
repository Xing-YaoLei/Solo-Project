import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useGameStore from '../store/gameStore.js'
import PharmacyScene from '../components/PharmacyScene.jsx'
import TaskPanel from '../components/TaskPanel.jsx'
import ResultModal from '../components/ResultModal.jsx'
import { formatTime } from '../data/gameConfig.js'

export default function Game() {
  const { level } = useParams()
  const navigate = useNavigate()
  const tickRef = useRef(null)
  const warningRef = useRef(null)

  const {
    startGame,
    tickTime,
    gameState,
    tasks,
    currentTaskIndex,
    timeRemaining,
    isReplaying,
    resetGame,
  } = useGameStore()

  const [countdown, setCountdown] = useState(3)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameReady, setGameReady] = useState(false)

  useEffect(() => {
    startGame(parseInt(level))
  }, [level, startGame])

  useEffect(() => {
    if (gameState === 'playing' && tasks.length > 0) {
      setGameReady(true)
    }
  }, [gameState, tasks])

  useEffect(() => {
    if (gameStarted || countdown <= 0) return
    if (countdown === 0) {
      setGameStarted(true)
      return
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 800)
    return () => clearTimeout(timer)
  }, [countdown, gameStarted])

  useEffect(() => {
    if (!gameStarted || gameState !== 'playing') {
      if (tickRef.current) clearInterval(tickRef.current)
      return
    }

    tickRef.current = setInterval(() => {
      tickTime()
    }, 1000)

    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [gameStarted, gameState, tickTime])

  const currentTask = tasks[currentTaskIndex]

  const getTaskUrgency = () => {
    if (!currentTask) return 'normal'
    if (currentTask.isBlurry || currentTask.hasConflict || currentTask.isExpired) return 'danger'
    if (timeRemaining < 30 || currentTask.warningBeforeAppear) return 'warning'
    return 'normal'
  }

  return (
    <div className="page-container" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <PharmacyScene
          currentTask={currentTask}
          taskUrgency={getTaskUrgency()}
        />
      </div>

      {gameStarted && gameReady && gameState === 'playing' && !isReplaying && (
        <TaskPanel />
      )}

      {gameStarted && gameReady && gameState === 'playing' && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 50,
          display: 'flex',
          gap: 10,
        }}>
          <button
            className="btn-secondary"
            onClick={() => {
              if (confirm('确定要退出训练吗？当前进度将丢失。')) {
                resetGame()
                navigate('/')
              }
            }}
            style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
          >
            ✕ 退出
          </button>
        </div>
      )}

      {gameStarted && gameReady && gameState === 'playing' && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          display: 'flex',
          gap: 8,
        }}>
          {tasks.map((task, i) => {
            let status = 'pending'
            if (i < currentTaskIndex) status = 'done'
            else if (i === currentTaskIndex) status = 'current'

            return (
              <div
                key={task.id}
                title={`任务 ${i + 1}: ${task.type}`}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  cursor: 'default',
                  background: status === 'current'
                    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                    : status === 'done'
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: status === 'current'
                    ? '2px solid #60a5fa'
                    : status === 'done'
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: status === 'current'
                    ? '0 0 20px rgba(96, 165, 250, 0.4)'
                    : 'none',
                  transition: 'all 0.3s',
                }}
              >
                {task.type === 'prescription' ? '📋' : task.type === 'pharmacist' ? '👨‍⚕️' : '📦'}
              </div>
            )
          })}
        </div>
      )}

      {!gameStarted && countdown > 0 && (
        <div className="modal-overlay" style={{ zIndex: 200 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 120,
              fontWeight: 900,
              background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 24,
              animation: 'pulse 0.8s ease-in-out',
            }}>
              {countdown}
            </div>
            <div style={{ fontSize: 24, color: '#e0e6ed', fontWeight: 600 }}>
              准备开始 {useGameStore.getState().currentLevel?.name || '训练'}
            </div>
            <div style={{ fontSize: 16, color: '#94a3b8', marginTop: 8 }}>
              限时 {formatTime(useGameStore.getState().currentLevel?.duration || 90)} ·
              共 {useGameStore.getState().currentLevel?.taskCount || 5} 个任务
            </div>
          </div>
        </div>
      )}

      <ResultModal />
    </div>
  )
}
