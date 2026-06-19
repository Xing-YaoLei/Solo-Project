import { useState } from 'react'
import { Calendar, Clock, Plus, Trash2, Save, Lock, Unlock } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useConfigStore } from '@/stores/useConfigStore'
import { mockSchedule, mockLevels } from '@/utils/mockData'
import { cn } from '@/lib/utils'

const DAYS_OF_WEEK = [
  { key: 'Monday', label: '周一' },
  { key: 'Tuesday', label: '周二' },
  { key: 'Wednesday', label: '周三' },
  { key: 'Thursday', label: '周四' },
  { key: 'Friday', label: '周五' },
  { key: 'Saturday', label: '周六' },
  { key: 'Sunday', label: '周日' },
]

interface TimeSlot {
  id: string
  dayOfWeek: string
  startTime: string
  endTime: string
  maxAttempts: number
}

export default function ConfigSchedulePage() {
  const schedules = useConfigStore((s) => s.schedules)
  const saveConfig = useConfigStore((s) => s.saveConfig)

  const [slots, setSlots] = useState<TimeSlot[]>(mockSchedule)
  const [dailyLimit, setDailyLimit] = useState(5)

  const updateSlot = (id: string, updates: Partial<TimeSlot>) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const addSlot = (dayOfWeek: string) => {
    setSlots((prev) => [
      ...prev,
      {
        id: `slot-new-${prev.length}`,
        dayOfWeek,
        startTime: '09:00',
        endTime: '18:00',
        maxAttempts: 5,
      },
    ])
  }

  const removeSlot = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id))
  }

  const handleSave = () => {
    saveConfig()
  }

  const slotsByDay = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day.key] = slots.filter((s) => s.dayOfWeek === day.key)
    return acc
  }, {} as Record<string, TimeSlot[]>)

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">开放时间配置</h2>
            <p className="text-sm text-neutral-500">设置各关卡的开放时间段和每日训练次数限制</p>
          </div>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4" />
            保存配置
          </Button>
        </div>

        <div className="mb-6 rounded-xl bg-neutral-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-800">每日训练次数限制</p>
                <p className="text-xs text-neutral-500">每个用户每天最多可尝试的训练次数</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDailyLimit(Math.max(1, dailyLimit - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition hover:bg-neutral-100"
              >
                -
              </button>
              <input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Math.max(1, Number(e.target.value)))}
                className="w-16 rounded-lg border border-neutral-200 py-1.5 text-center text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={() => setDailyLimit(dailyLimit + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition hover:bg-neutral-100"
              >
                +
              </button>
              <span className="text-sm text-neutral-500">次/天</span>
            </div>
          </div>
        </div>

        <div className="mb-4 space-y-3">
          <h3 className="text-sm font-semibold text-neutral-800">关卡开放状态</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {mockLevels.map((level) => (
              <div
                key={level.id}
                className={cn(
                  'flex items-center justify-between rounded-xl border p-3',
                  level.isOpen ? 'border-success/30 bg-success/5' : 'border-neutral-200 bg-white'
                )}
              >
                <div>
                  <p className="text-sm font-medium text-neutral-800">{level.name}</p>
                  <p className="text-xs text-neutral-500">
                    {level.isOpen
                      ? `开放至 ${new Date(level.closeTime).toLocaleDateString('zh-CN')}`
                      : `${new Date(level.openTime).toLocaleDateString('zh-CN')} 开放`}
                  </p>
                </div>
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    level.isOpen ? 'bg-success/10 text-success' : 'bg-neutral-100 text-neutral-400'
                  )}
                >
                  {level.isOpen ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title="每周开放时段">
        <div className="overflow-hidden rounded-xl border border-neutral-200">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="w-28 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  星期
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  开放时段
                </th>
                <th className="w-32 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  最大次数
                </th>
                <th className="w-20 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {DAYS_OF_WEEK.map((day) => {
                const daySlots = slotsByDay[day.key]
                return (
                  <>
                    {daySlots.length === 0 ? (
                      <tr key={day.key}>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-neutral-800">{day.label}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-400">未设置开放时段</td>
                        <td className="px-4 py-3">-</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => addSlot(day.key)}
                            className="text-xs text-primary hover:underline"
                          >
                            添加
                          </button>
                        </td>
                      </tr>
                    ) : (
                      daySlots.map((slot, index) => (
                        <tr key={slot.id} className="transition-colors hover:bg-neutral-50">
                          <td className="px-4 py-3">
                            {index === 0 && (
                              <span className="text-sm font-medium text-neutral-800">{day.label}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) => updateSlot(slot.id, { startTime: e.target.value })}
                                className="rounded-lg border border-neutral-200 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                              <span className="text-neutral-400">至</span>
                              <input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) => updateSlot(slot.id, { endTime: e.target.value })}
                                className="rounded-lg border border-neutral-200 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={slot.maxAttempts}
                              onChange={(e) => updateSlot(slot.id, { maxAttempts: Number(e.target.value) })}
                              className="w-20 rounded-lg border border-neutral-200 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {index === daySlots.length - 1 && (
                                <button
                                  onClick={() => addSlot(day.key)}
                                  className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-primary"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => removeSlot(slot.id)}
                                className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-danger/10 hover:text-danger"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
