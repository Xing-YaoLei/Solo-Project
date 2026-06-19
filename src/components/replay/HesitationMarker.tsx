import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReplayStore } from '@/stores/useReplayStore'
import type { HesitationPoint } from '@/types/replay'

interface HesitationMarkerProps {
  point: HesitationPoint
  position?: { x: number; y: number }
  className?: string
}

export default function HesitationMarker({ point, position, className }: HesitationMarkerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const seekReplay = useReplayStore((s) => s.seekReplay)
  const currentTime = useReplayStore((s) => s.playbackState.currentTime)

  const state = useReplayStore.getState()
  const firstTimestamp = state.currentReplay?.actionLog[0]?.timestamp ?? 0
  const pointTime = point.timestamp - firstTimestamp
  const isActive = Math.abs(currentTime - pointTime) < 3000

  const durationSeconds = (point.duration / 1000).toFixed(1)

  const handleJumpToPoint = () => {
    seekReplay(Math.max(0, pointTime - 1000))
  }

  return (
    <div
      className={cn(
        'absolute z-20',
        position && `left-[${position.x}px] top-[${position.y}px]`,
        className
      )}
      style={position ? { left: position.x, top: position.y } : undefined}
    >
      <div
        className={cn(
          'rounded-lg shadow-lg transition-all duration-300',
          isActive ? 'ring-2 ring-orange-400 ring-offset-2' : '',
          isExpanded ? 'w-64' : 'w-auto'
        )}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors',
            isActive ? 'bg-orange-500 text-white' : 'bg-white text-gray-800 hover:bg-orange-50'
          )}
        >
          <div
            className={cn(
              'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full',
              isActive ? 'bg-white/20' : 'bg-orange-100'
            )}
          >
            <Clock
              className={cn(
                'h-4 w-4',
                isActive ? 'text-white' : 'text-orange-500'
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-sm font-medium',
                isActive ? 'text-white' : 'text-gray-900'
              )}
            >
              犹豫 {durationSeconds} 秒
            </p>
            {!isExpanded && (
              <p
                className={cn(
                  'text-xs truncate',
                  isActive ? 'text-white/80' : 'text-gray-500'
                )}
              >
                点击查看提示
              </p>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp
              className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-white' : 'text-gray-400')}
            />
          ) : (
            <ChevronDown
              className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-white' : 'text-gray-400')}
            />
          )}
        </button>

        {isExpanded && (
          <div className="rounded-b-lg border-t border-gray-100 bg-white p-3">
            <div className="mb-3 flex items-start gap-2">
              <Lightbulb className="h-4 w-4 flex-shrink-0 text-amber-500" />
              <div>
                <p className="text-xs font-medium text-gray-500">提示</p>
                <p className="mt-0.5 text-sm text-gray-700">{point.hint}</p>
              </div>
            </div>

            <div className="mb-3 rounded-lg bg-gray-50 p-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">犹豫时长</span>
                <span className="font-medium text-gray-700">{durationSeconds} 秒</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-gray-500">出现时间</span>
                <span className="font-medium text-gray-700">
                  {Math.floor(pointTime / 60000)}:
                  {Math.floor((pointTime % 60000) / 1000)
                    .toString()
                    .padStart(2, '0')}
                </span>
              </div>
            </div>

            <button
              onClick={handleJumpToPoint}
              className="w-full rounded-lg bg-orange-500 py-2 text-xs font-medium text-white transition hover:bg-orange-600"
            >
              跳转到此处回放
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
