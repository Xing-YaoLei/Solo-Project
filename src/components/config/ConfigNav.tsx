import { HelpCircle, Gift, Calendar, Settings, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ConfigNavKey = 'questions' | 'rewards' | 'schedule' | 'modes' | 'assets'

interface ConfigNavProps {
  active: ConfigNavKey
  onChange: (key: ConfigNavKey) => void
  className?: string
}

const NAV_ITEMS: { key: ConfigNavKey; label: string; icon: typeof HelpCircle; badge?: string }[] = [
  { key: 'questions', label: '题目管理', icon: HelpCircle },
  { key: 'rewards', label: '奖励配置', icon: Gift },
  { key: 'schedule', label: '时间安排', icon: Calendar },
  { key: 'modes', label: '模式参数', icon: Settings },
  { key: 'assets', label: '资源管理', icon: LayoutGrid },
]

export default function ConfigNav({ active, onChange, className }: ConfigNavProps) {
  return (
    <nav className={cn('w-56 rounded-xl bg-white p-2 shadow-sm', className)}>
      <div className="mb-2 px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          配置中心
        </h2>
      </div>

      <div className="space-y-1">
        {NAV_ITEMS.map(({ key, label, icon: Icon, badge }) => {
          const isActive = active === key
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all',
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isActive ? 'text-indigo-600' : 'text-gray-400'
                )}
              />
              <span className="flex-1">{label}</span>
              {badge && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs',
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4 px-3">
        <p className="text-xs text-gray-400">
          修改配置后请点击保存，更改将立即生效。
        </p>
      </div>
    </nav>
  )
}
