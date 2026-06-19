import { useState, useEffect } from 'react'
import { Gift, Star, Trophy, Medal, Plus, Trash2, Save, Eye, CheckCircle2 } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useConfigStore } from '@/stores/useConfigStore'
import { cn } from '@/lib/utils'
import type { RewardItem } from '@/types/config'

const TYPE_CONFIG: Record<RewardItem['type'], { label: string; icon: typeof Star; color: string }> = {
  points: { label: '积分奖励', icon: Star, color: 'bg-amber-100 text-amber-600' },
  badge: { label: '徽章奖励', icon: Medal, color: 'bg-indigo-100 text-indigo-600' },
  level: { label: '等级称号', icon: Trophy, color: 'bg-emerald-100 text-emerald-600' },
}

export default function ConfigRewardsPage() {
  const storeRewards = useConfigStore((s) => s.rewards)
  const updateRewards = useConfigStore((s) => s.updateRewards)
  const loadConfig = useConfigStore((s) => s.loadConfig)

  const [rules, setRules] = useState<RewardItem[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  useEffect(() => {
    if (storeRewards.length > 0) {
      setRules(storeRewards)
    }
  }, [storeRewards])

  const addRule = (type: 'points' | 'badge' | 'level') => {
    setRules((prev) => [
      ...prev,
      {
        id: `rule-${Date.now()}`,
        type,
        threshold: 0,
        value: '',
      },
    ])
    setSaved(false)
  }

  const updateRule = (id: string, updates: Partial<RewardItem>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)))
    setSaved(false)
  }

  const removeRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id))
    setSaved(false)
  }

  const handleSave = () => {
    updateRewards(rules)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const groupedRules = {
    points: rules.filter((r) => r.type === 'points').sort((a, b) => a.threshold - b.threshold),
    badge: rules.filter((r) => r.type === 'badge').sort((a, b) => a.threshold - b.threshold),
    level: rules.filter((r) => r.type === 'level').sort((a, b) => a.threshold - b.threshold),
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">奖励配置</h2>
            <p className="text-sm text-neutral-500">设置积分、徽章和等级称号的触发条件</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4" />
              {showPreview ? '隐藏预览' : '预览效果'}
            </Button>
            <Button onClick={handleSave} disabled={saved}>
              {saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  已保存
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  保存配置
                </>
              )}
            </Button>
          </div>
        </div>

        {showPreview && (
          <div className="mb-6 rounded-xl bg-gradient-to-r from-primary to-primary-light p-6 text-white">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                <Gift className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm opacity-80">当前用户可获得</p>
                <p className="text-2xl font-bold">2,350 积分 · 中级运营</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/10 p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <Star className="h-4 w-4" />
                  <span className="text-xs opacity-80">积分</span>
                </div>
                <p className="text-lg font-bold">2,350 / 5,000</p>
                <p className="text-xs opacity-70">距下一奖励差 2,650</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <Medal className="h-4 w-4" />
                  <span className="text-xs opacity-80">徽章</span>
                </div>
                <p className="text-lg font-bold">3 / 6</p>
                <p className="text-xs opacity-70">已获得 3 个徽章</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <Trophy className="h-4 w-4" />
                  <span className="text-xs opacity-80">等级</span>
                </div>
                <p className="text-lg font-bold">中级运营</p>
                <p className="text-xs opacity-70">下一级：高级运营</p>
              </div>
            </div>
          </div>
        )}

        {(['points', 'badge', 'level'] as const).map((type) => {
          const typeConfig = TYPE_CONFIG[type]
          const TypeIcon = typeConfig.icon
          return (
            <div key={type} className="mb-6 last:mb-0">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', typeConfig.color)}>
                    <TypeIcon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-800">{typeConfig.label}</h3>
                    <p className="text-xs text-neutral-500">{groupedRules[type].length} 条规则</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => addRule(type)}>
                  <Plus className="h-4 w-4" />
                  添加规则
                </Button>
              </div>

              <div className="space-y-2">
                {groupedRules[type].length === 0 ? (
                  <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-center">
                    <Gift className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
                    <p className="text-sm text-neutral-500">暂无规则</p>
                  </div>
                ) : (
                  groupedRules[type].map((rule, index) => (
                    <div
                      key={rule.id}
                      className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3"
                    >
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-medium text-neutral-600">
                        {index + 1}
                      </span>
                      <div className="flex flex-1 items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-neutral-500">达到</span>
                          <input
                            type="number"
                            value={rule.threshold}
                            onChange={(e) => updateRule(rule.id, { threshold: Number(e.target.value) })}
                            className="w-24 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <span className="text-sm text-neutral-500">
                            {type === 'points' ? '积分' : type === 'badge' ? '次训练' : '积分'}
                          </span>
                        </div>
                        <span className="text-sm text-neutral-400">→</span>
                        <input
                          type="text"
                          value={rule.value}
                          onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                          placeholder="奖励名称"
                          className="flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <button
                        onClick={() => removeRule(rule.id)}
                        className="rounded-lg p-2 text-neutral-400 transition hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </Card>
    </div>
  )
}
