import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Link } from 'react-router-dom'
import { History, Play, Settings, Trophy, Target, TrendingUp, Star, Lock } from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'
import Room from '@/components/three/Room'
import SceneLights from '@/components/three/SceneLights'
import PostEffects from '@/components/three/PostEffects'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useLevelStore } from '@/stores/useLevelStore'
import { useUserStore } from '@/stores/useUserStore'
import { useRecordsStore } from '@/stores/useRecordsStore'
import { mockLevels, mockUser } from '@/utils/mockData'
import type { Level as MockLevel } from '@/utils/mockData'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const levels = useLevelStore((s) => s.levels)
  const setLevels = useLevelStore((s) => s.setLevels)
  const user = useUserStore((s) => s.user)
  const login = useUserStore((s) => s.login)
  const stats = useRecordsStore((s) => s.stats)
  const fetchRecords = useRecordsStore((s) => s.fetchRecords)

  const displayLevels: MockLevel[] = levels.length > 0
    ? levels.map((l) => {
        const mock = mockLevels.find((m) => m.id === l.id)
        return {
          id: l.id,
          name: l.name,
          difficulty: l.difficulty as 1 | 2 | 3,
          isOpen: l.isOpen,
          openTime: l.openTime.toISOString(),
          closeTime: l.closeTime.toISOString(),
          description: mock?.description ?? '',
          reward: mock?.reward ?? 0,
        }
      })
    : mockLevels

  useEffect(() => {
    if (levels.length === 0) {
      setLevels(mockLevels.map((l) => ({
        id: l.id,
        name: l.name,
        difficulty: l.difficulty,
        isOpen: l.isOpen,
        openTime: new Date(l.openTime),
        closeTime: new Date(l.closeTime),
      })))
    }
    if (!user) {
      login(mockUser)
    }
    fetchRecords()
  }, [levels, setLevels, user, login, fetchRecords])

  const ringChartOption = useMemo(() => ({
    tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
    series: [{
      type: 'pie',
      radius: ['55%', '75%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      labelLine: { show: false },
      data: [
        { value: stats?.averageOnTimeRate ?? 78, name: '准时率', itemStyle: { color: '#4CAF82' } },
        { value: 100 - (stats?.averageOnTimeRate ?? 78), name: '', itemStyle: { color: '#E8E2D7' } },
      ],
    }],
  }), [stats])

  const getDifficultyStars = (difficulty: number) => {
    return Array.from({ length: 3 }, (_, i) => (
      <Star
        key={i}
        className={cn('h-3.5 w-3.5', i < difficulty ? 'text-accent fill-accent' : 'text-neutral-300')}
      />
    ))
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary">民宿运营训练系统</h1>
              <p className="text-xs text-neutral-500">B&amp;B Operations Training</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <Link
              to="/records"
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              <History className="h-4 w-4" />
              <span>训练记录</span>
            </Link>
            <Link
              to="/replay/recent"
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              <Play className="h-4 w-4" />
              <span>失败回放</span>
            </Link>
            <Link
              to="/config"
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              <Settings className="h-4 w-4" />
              <span>配置中心</span>
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-800">{user?.name ?? '访客'}</p>
              <div className="flex items-center gap-1 text-xs text-accent">
                <Trophy className="h-3 w-3" />
                <span>{user?.totalScore ?? 0} 分</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Card className="h-[560px] overflow-hidden p-0">
              <div className="relative h-full">
                <div className="absolute left-4 top-4 z-10 rounded-lg bg-white/90 px-3 py-2 backdrop-blur-sm">
                  <p className="text-xs text-neutral-500">3D 场景预览</p>
                  <p className="text-sm font-medium text-neutral-800">民宿标准间</p>
                </div>
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
              </div>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <Card title="数据仪表盘" subtitle="训练表现概览">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative flex flex-col items-center justify-center rounded-xl bg-neutral-50 p-4">
                  <ReactECharts
                    option={ringChartOption}
                    style={{ height: 120, width: 120 }}
                    opts={{ renderer: 'canvas' }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-primary">{stats?.averageOnTimeRate ?? 78}%</span>
                    <span className="text-xs text-neutral-500">准时率</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl bg-neutral-50 p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Target className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">训练次数</p>
                        <p className="text-lg font-bold text-neutral-800">{stats?.totalAttempts ?? 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-neutral-50 p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                        <TrendingUp className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">排名</p>
                        <p className="text-lg font-bold text-neutral-800">#{Math.ceil((stats?.averageScore ?? 0) / 10)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-gradient-to-r from-primary to-primary-light p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">总得分</p>
                    <p className="text-2xl font-bold">{user?.totalScore ?? 0}</p>
                  </div>
                  <Trophy className="h-10 w-10 opacity-50" />
                </div>
              </div>
            </Card>

            <Card title="训练关卡" subtitle="选择关卡开始训练">
              <div className="space-y-3">
                {displayLevels.map((level) => (
                  <Link
                    key={level.id}
                    to={level.isOpen ? `/training/${level.id}` : '#'}
                    className={cn(
                      'block rounded-xl border transition-all',
                      level.isOpen
                        ? 'border-neutral-200 bg-white p-4 hover:border-accent/50 hover:shadow-md'
                        : 'border-neutral-100 bg-neutral-50 p-4 opacity-60 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-neutral-800">{level.name}</h4>
                          <div className="flex gap-0.5">{getDifficultyStars(level.difficulty)}</div>
                        </div>
                        <p className="mt-1 text-sm text-neutral-500">{level.description}</p>
                      </div>
                      {level.isOpen ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                          <Play className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-neutral-400">
                          <Lock className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-neutral-400">奖励 {level.reward} 分</span>
                      {!level.isOpen && (
                        <span className="text-neutral-400">
                          开放时间: {new Date(level.openTime).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-4">
                <Button className="w-full" size="lg">
                  <Play className="h-5 w-5" />
                  开始训练
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
