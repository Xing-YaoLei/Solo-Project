import { useEffect } from 'react'
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom'
import { ArrowLeft, HelpCircle, Gift, Calendar, Settings, LayoutGrid, Database } from 'lucide-react'
import Card from '@/components/ui/Card'
import ConfigNav, { ConfigNavKey } from '@/components/config/ConfigNav'
import { useConfigStore } from '@/stores/useConfigStore'
import { cn } from '@/lib/utils'

const NAV_TO_ROUTE: Record<ConfigNavKey, string> = {
  questions: '/config/questions',
  rewards: '/config/rewards',
  schedule: '/config/schedule',
  modes: '/config/modes',
  assets: '/config/assets',
}

const ROUTE_TO_NAV: Record<string, ConfigNavKey> = {
  '/config': 'questions',
  '/config/questions': 'questions',
  '/config/rewards': 'rewards',
  '/config/schedule': 'schedule',
  '/config/modes': 'modes',
  '/config/assets': 'assets',
}

export default function ConfigPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const questions = useConfigStore((s) => s.questions)
  const assets = useConfigStore((s) => s.assets)
  const rewards = useConfigStore((s) => s.rewards)
  const schedules = useConfigStore((s) => s.schedules)
  const modes = useConfigStore((s) => s.modes)
  const saveConfig = useConfigStore((s) => s.saveConfig)

  const activeKey: ConfigNavKey = ROUTE_TO_NAV[location.pathname] ?? 'questions'
  const isOverview = location.pathname === '/config'

  useEffect(() => {
    saveConfig()
  }, [saveConfig])

  const handleNavChange = (key: ConfigNavKey) => {
    navigate(NAV_TO_ROUTE[key])
  }

  const overviewCards = [
    {
      label: '题目数量',
      value: questions.length,
      icon: HelpCircle,
      color: 'bg-indigo-100 text-indigo-600',
      route: '/config/questions',
    },
    {
      label: '素材资源',
      value: assets.length,
      icon: LayoutGrid,
      color: 'bg-emerald-100 text-emerald-600',
      route: '/config/assets',
    },
    {
      label: '奖励规则',
      value: rewards.length,
      icon: Gift,
      color: 'bg-amber-100 text-amber-600',
      route: '/config/rewards',
    },
    {
      label: '时间安排',
      value: schedules.length,
      icon: Calendar,
      color: 'bg-blue-100 text-blue-600',
      route: '/config/schedule',
    },
    {
      label: '训练模式',
      value: modes.length,
      icon: Settings,
      color: 'bg-purple-100 text-purple-600',
      route: '/config/modes',
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
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
              <h1 className="text-lg font-bold text-neutral-800">配置中心</h1>
              <p className="text-xs text-neutral-500">管理题目、素材、奖励及训练参数</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex gap-6">
          <ConfigNav active={activeKey} onChange={handleNavChange} className="flex-shrink-0" />

          <div className="flex-1 min-w-0">
            {isOverview ? (
              <div className="space-y-6">
                <Card title="配置概览" subtitle="点击卡片进入对应配置页面">
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                    {overviewCards.map(({ label, value, icon: Icon, color, route }) => (
                      <Link
                        key={label}
                        to={route}
                        className="group rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:border-accent/50 hover:shadow-md"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', color)}>
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-neutral-800">{value}</p>
                        <p className="mt-1 text-sm text-neutral-500">{label}</p>
                      </Link>
                    ))}
                  </div>
                </Card>

                <Card title="系统状态">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="flex items-center gap-4 rounded-xl bg-neutral-50 p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                        <Database className="h-6 w-6 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-800">数据存储</p>
                        <p className="text-xs text-neutral-500">LocalStorage 正常运行</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-xl bg-neutral-50 p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Settings className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-800">配置版本</p>
                        <p className="text-xs text-neutral-500">v1.0.0 · 最近更新: 刚刚</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
