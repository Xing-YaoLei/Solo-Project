import { useRef, useEffect, useState } from 'react'
import { Play, Pause, Gauge } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReplayStore } from '@/stores/useReplayStore'
import type { HesitationPoint } from '@/types/replay'

interface TimelineProps {
  className?: string
}

const SPEEDS = [0.5, 1, 1.5, 2]

export default function Timeline({ className }: TimelineProps) {
  const playbackState = useReplayStore((s) => s.playbackState)
  const hesitationPoints = useReplayStore((s) => s.hesitationPoints)
  const playReplay = useReplayStore((s) => s.playReplay)
  const pauseReplay = useReplayStore((s) => s.pauseReplay)
  const seekReplay = useReplayStore((s) => s.seekReplay)

  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  const { isPlaying, currentTime, duration, speed } = playbackState

  useEffect(() => {
    if (isPlaying && duration > 0) {
      const step = () => {
        const state = useReplayStore.getState().playbackState
        if (state.currentTime < state.duration) {
          useReplayStore.setState({
            playbackState: {
              ...state,
              currentTime: Math.min(state.currentTime + 16 * state.speed, state.duration),
            },
          })
          animationRef.current = requestAnimationFrame(step)
        } else {
          pauseReplay()
        }
      }
      animationRef.current = requestAnimationFrame(step)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, duration, pauseReplay])

  const handleTogglePlay = () => {
    if (isPlaying) {
      pauseReplay()
    } else {
      const state = useReplayStore.getState()
      if (state.currentReplay) {
        if (currentTime >= duration) {
          seekReplay(0)
        }
        useReplayStore.setState({
          playbackState: {
            ...useReplayStore.getState().playbackState,
            isPlaying: true,
          },
        })
      }
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration === 0) return
    const rect = progressRef.current.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const time = Math.max(0, Math.min(duration, percent * duration))
    seekReplay(time)
  }

  const handleSpeedChange = (newSpeed: number) => {
    const state = useReplayStore.getState().playbackState
    useReplayStore.setState({
      playbackState: { ...state, speed: newSpeed },
    })
    setShowSpeedMenu(false)
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  const getHesitationPosition = (hp: HesitationPoint) => {
    if (duration === 0) return 0
    const state = useReplayStore.getState()
    const firstTimestamp = state.currentReplay?.actionLog[0]?.timestamp ?? 0
    return ((hp.timestamp - firstTimestamp) / duration) * 100
  }

  return (
    <div className={cn('w-full rounded-xl bg-white p-4 shadow-sm', className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-700"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <span className="text-sm text-gray-500">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
          >
            <Gauge className="h-4 w-4" />
            {speed}x
          </button>
          {showSpeedMenu && (
            <div className="absolute right-0 top-full z-10 mt-1 w-20 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm transition hover:bg-gray-50',
                    speed === s && 'bg-indigo-50 text-indigo-600',
                    speed !== s && 'text-gray-700'
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        ref={progressRef}
        onClick={handleProgressClick}
        className="relative h-6 cursor-pointer"
      >
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {hesitationPoints.map((hp) => (
          <button
            key={hp.id}
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-400 ring-2 ring-white transition hover:scale-150"
            style={{ left: `${getHesitationPosition(hp)}%` }}
            title={`犹豫 ${(hp.duration / 1000).toFixed(1)} 秒`}
            onClick={(e) => {
              e.stopPropagation()
              seekReplay(hp.timestamp - (useReplayStore.getState().currentReplay?.actionLog[0]?.timestamp ?? 0))
            }}
          />
        ))}

        <div
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-indigo-600 bg-white shadow-md transition-all"
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <span>开始</span>
        {hesitationPoints.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-orange-400" />
            {hesitationPoints.length} 处犹豫点
          </span>
        )}
        <span>结束</span>
      </div>
    </div>
  )
}
