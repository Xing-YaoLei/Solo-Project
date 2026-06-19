import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Trophy, XCircle, AlertTriangle } from 'lucide-react'
import Room from '@/components/three/Room'
import SceneLights from '@/components/three/SceneLights'
import PostEffects from '@/components/three/PostEffects'
import Card from '@/components/ui/Card'
import Timeline from '@/components/replay/Timeline'
import HesitationMarker from '@/components/replay/HesitationMarker'
import { useReplayStore } from '@/stores/useReplayStore'
import { mockReplays } from '@/utils/mockData'
import { cn } from '@/lib/utils'
import type { ReplayData } from '@/types/replay'

export default function ReplayPage() {
  const { recordId = 'recent' } = useParams<{ recordId: string }>()
  const navigate = useNavigate()

  const replays = useReplayStore((s) => s.replays)
  const currentReplay = useReplayStore((s) => s.currentReplay)
  const hesitationPoints = useReplayStore((s) => s.hesitationPoints)
  const playbackState = useReplayStore((s) => s.playbackState)
  const loadReplays = useReplayStore((s) => s.loadReplays)
  const playReplay = useReplayStore((s) => s.playReplay)

  const [availableReplays, setAvailableReplays] = useState<ReplayData[]>([])

  useEffect(() => {
    loadReplays('level-1')
    const stored = localStorage.getItem('bnb_replays')
    const allReplays: ReplayData[] = stored ? JSON.parse(stored) : mockReplays
    setAvailableReplays(allReplays.slice(0, 3))
    if (allReplays.length > 0) {
      const targetReplay = recordId !== 'recent'
        ? allReplays.find((r) => r.recordId === recordId) ?? allReplays[0]
        : allReplays[0]
      if (targetReplay && !currentReplay) {
        useReplayStore.setState({ replays: allReplays })
        playReplay(targetReplay.recordId)
      }
    }
  }, [recordId, loadReplays, playReplay, currentReplay])

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleSelectReplay = (replay: ReplayData) => {
    playReplay(replay.recordId)
    navigate(`/replay/${replay.recordId}`)
  }

  return (
    <div className="flex h-screen flex-col bg-neutral-50">
      <header className="z-40 flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/records')}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-100"
          >
            <ArrowLeft className="h-4 w-4" />
            返回记录
          </button>
          <div className="h-6 w-px bg-neutral-200" />
          <div>
            <h1 className="text-sm font-semibold text-neutral-800">失败回放分析</h1>
            <p className="text-xs text-neutral-500">回顾训练过程，找出犹豫点和错误原因</p>
          </div>
        </div>
        {currentReplay && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 rounded-lg bg-danger/10 px-3 py-1.5 text-danger">
              <XCircle className="h-4 w-4" />
              <span className="text-sm font-medium">未通过</span>
            </div>
            <div className="text-xs text-neutral-500">
              {formatDate(currentReplay.createdAt)}
            </div>
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-72 flex-col border-r border-neutral-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-neutral-800">最近失败记录</h3>
          <div className="space-y-2 overflow-y-auto">
            {availableReplays.length === 0 ? (
              <div className="rounded-xl bg-neutral-50 p-6 text-center">
                <XCircle className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
                <p className="text-sm text-neutral-500">暂无失败记录</p>
              </div>
            ) : (
              availableReplays.map((replay) => {
                const isActive = currentReplay?.recordId === replay.recordId
                return (
                  <button
                    key={replay.id}
                    onClick={() => handleSelectReplay(replay)}
                    className={cn(
                      'w-full rounded-xl border p-3 text-left transition-all',
                      isActive
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        isActive ? 'bg-primary/10 text-primary' : 'bg-neutral-100 text-neutral-500'
                      )}>
                        <Trophy className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-sm font-medium truncate', isActive ? 'text-primary' : 'text-neutral-800')}>
                          {replay.recordId}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {formatDate(replay.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger">
                        <AlertTriangle className="h-3 w-3" />
                        {replay.actionLog.length} 个操作
                      </span>
                      <span className="text-xs text-neutral-400">
                        阈值 {(replay.hesitationThreshold / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col">
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
              </Physics>
              <PostEffects />
              <OrbitControls
                enablePan={false}
                minDistance={5}
                maxDistance={15}
                minPolarAngle={Math.PI / 6}
                maxPolarAngle={Math.PI / 2.2}
                target={[0, 1, 0]}
              />
            </Canvas>
            <div className="absolute left-4 top-4 flex items-center gap-2">
              <div className="rounded-lg bg-white/90 px-3 py-2 backdrop-blur-sm">
                <p className="text-xs text-neutral-500">回放进度</p>
                <p className="text-sm font-medium text-neutral-800">
                  {Math.round((playbackState.currentTime / Math.max(playbackState.duration, 1)) * 100)}%
                </p>
              </div>
              {hesitationPoints.length > 0 && (
                <div className="rounded-lg bg-warning/10 px-3 py-2 backdrop-blur-sm">
                  <p className="text-xs text-warning">检测到犹豫点</p>
                  <p className="text-sm font-medium text-warning">
                    {hesitationPoints.length} 处
                  </p>
                </div>
              )}
            </div>
            {hesitationPoints.length > 0 && (
              <div className="absolute right-4 top-4 w-64 space-y-2 max-h-[70vh] overflow-y-auto">
                {hesitationPoints.slice(0, 5).map((point) => (
                  <HesitationMarker key={point.id} point={point} />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-neutral-200 bg-white p-4">
            <Timeline />
          </div>
        </div>
      </div>
    </div>
  )
}
