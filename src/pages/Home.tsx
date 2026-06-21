import { Link } from '@tanstack/react-router'
import { Wallet, ListTodo, MessageSquare, Receipt, ArrowRight, Clock } from 'lucide-react'
import KPICard from '@/components/KPICard'

const QUICK_ACTIONS = [
  { label: '待处理申诉', count: 12, unit: '件', to: '/appeals', icon: MessageSquare, color: 'text-accent-600 bg-accent-50' },
  { label: '待审批规则', count: 3, unit: '件', to: '/subsidy-rules', icon: Wallet, color: 'text-primary-600 bg-primary-50' },
  { label: '待结算批次', count: 5, unit: '件', to: '/settlements', icon: Receipt, color: 'text-emerald-600 bg-emerald-50' },
  { label: '紧急待办', count: 4, unit: '件', to: '/todo-pool', icon: ListTodo, color: 'text-red-600 bg-red-50' },
]

const RECENT_ACTIVITY = [
  { id: '1', text: '张三 提交了规则「北京短途补贴」的审批申请', time: '5分钟前' },
  { id: '2', text: '系统自动生成了 2024-06 结算批次（上海）', time: '23分钟前' },
  { id: '3', text: '李四 处理了申诉 #AP-20240618-003', time: '1小时前' },
  { id: '4', text: '规则「广州跨区补贴 v2」已生效', time: '2小时前' },
  { id: '5', text: '王五 驳回了规则「深圳中途补贴调整」', time: '3小时前' },
]

export default function Home() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-800 dark:text-slate-100">工作台</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="本月补贴总额" value="¥128,450" icon={Wallet} trend="up" trendValue="12.5%" color="primary" />
        <KPICard title="待办工单" value="23" icon={ListTodo} trend="down" trendValue="8.3%" color="accent" />
        <KPICard title="申诉率" value="3.2%" icon={MessageSquare} trend="down" trendValue="1.1%" color="blue" />
        <KPICard title="结算进度" value="78%" icon={Receipt} trend="up" trendValue="15%" color="emerald" />
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-700 dark:text-slate-200">快捷入口</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.to}
                to={action.to}
                className="group flex items-center justify-between rounded-lg border border-surface-border bg-white p-4 transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{action.label}</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {action.count}<span className="ml-0.5 text-sm font-normal text-slate-400">{action.unit}</span>
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-primary-600" />
              </Link>
            )
          })}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-700 dark:text-slate-200">最近动态</h2>
        <div className="rounded-lg border border-surface-border bg-white dark:border-slate-700 dark:bg-slate-800">
          <ul className="divide-y divide-surface-border dark:divide-slate-700">
            {RECENT_ACTIVITY.map((item) => (
              <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                <Clock size={14} className="mt-1 shrink-0 text-slate-300" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{item.text}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{item.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
