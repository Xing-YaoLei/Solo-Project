import { useState, useEffect } from 'react'
import { Rocket, Compass, FileCheck, Save, Info, Lightbulb, Timer, RefreshCw, CheckCircle2 } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useConfigStore } from '@/stores/useConfigStore'
import { cn } from '@/lib/utils'
import type { ModeParam } from '@/types/config'

type ModeType = 'campaign' | 'practice' | 'exam'

interface ModeConfig {
  key: ModeType
  name: string
  description: string
  icon: typeof Rocket
  color: string
  params: Record<string, string | boolean | number>
}

const DEFAULT_MODES: ModeConfig[] = [
  {
    key: 'campaign',
    name: '闯关模式',
    description: '按关卡顺序进行训练，完成一关解锁下一关',
    icon: Rocket,
    color: 'from-indigo-500 to-purple-600',
    params: {
      allowRetry: true,
      maxRetry: 3,
      showHint: false,
      timeLimit: 0,
    },
  },
  {
    key: 'practice',
    name: '自由练习',
    description: '自由选择题目类型进行针对性练习，无次数限制',
    icon: Compass,
    color: 'from-emerald-500 to-teal-600',
    params: {
      unlimited: true,
      showHint: true,
      showAnswer: true,
      timeLimit: 0,
    },
  },
  {
    key: 'exam',
    name: '模拟考核',
    description: '限时完成综合考核，模拟真实考试环境',
    icon: FileCheck,
    color: 'from-amber-500 to-orange-600',
    params: {
      allowRetry: false,
      maxRetry: 0,
      showHint: false,
      timeLimit: 3600,
    },
  },
]

const paramsToModeConfigs = (params: ModeParam[]): ModeConfig[] => {
  const configs: ModeConfig[] = DEFAULT_MODES.map((m) => ({ ...m, params: { ...m.params } }))
  params.forEach((p) => {
    const [modeKey, ...paramParts] = p.key.split('-')
    const paramKey = paramParts.join('-')
    const config = configs.find((c) => c.key === modeKey)
    if (config && paramKey) {
      let value: string | boolean | number = p.value
      if (value === 'true') value = true
      else if (value === 'false') value = false
      else if (!isNaN(Number(value))) value = Number(value)
      config.params[paramKey] = value
    }
  })
  return configs
}

const modeConfigsToParams = (configs: ModeConfig[]): ModeParam[] => {
  const params: ModeParam[] = []
  configs.forEach((config) => {
    Object.entries(config.params).forEach(([key, value]) => {
      params.push({
        id: `${config.key}-${key}`,
        key: `${config.key}-${key}`,
        value: String(value),
      })
    })
  })
  return params
}

export default function ConfigModesPage() {
  const storeModes = useConfigStore((s) => s.modes)
  const updateModes = useConfigStore((s) => s.updateModes)
  const loadConfig = useConfigStore((s) => s.loadConfig)

  const [modeConfigs, setModeConfigs] = useState<ModeConfig[]>(DEFAULT_MODES)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  useEffect(() => {
    if (storeModes.length > 0) {
      setModeConfigs(paramsToModeConfigs(storeModes))
    }
  }, [storeModes])

  const updateParam = (modeKey: ModeType, paramKey: string, value: string | boolean | number) => {
    setModeConfigs((prev) =>
      prev.map((m) =>
        m.key === modeKey
          ? { ...m, params: { ...m.params, [paramKey]: value } }
          : m
      )
    )
    setSaved(false)
  }

  const handleSave = () => {
    const params = modeConfigsToParams(modeConfigs)
    updateModes(params)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const formatTime = (seconds: number) => {
    if (seconds === 0) return '不限时'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return s > 0 ? `${m}分${s}秒` : `${m}分钟`
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">训练模式配置</h2>
            <p className="text-sm text-neutral-500">配置三种训练模式的参数和规则</p>
          </div>
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

        <div className="mb-4 rounded-xl bg-info/10 p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-info" />
            <div>
              <p className="text-sm font-medium text-neutral-800">模式说明</p>
              <p className="mt-1 text-sm text-neutral-600">
                闯关模式适合新手循序渐进学习；自由练习可无限制反复训练薄弱环节；模拟考核用于检验学习成果，严格按照考试标准执行。
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {modeConfigs.map((mode) => {
          const ModeIcon = mode.icon
          return (
            <Card key={mode.key} className="flex flex-col overflow-hidden p-0">
              <div className={cn('bg-gradient-to-r p-5 text-white', mode.color)}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                      <ModeIcon className="h-5.5 w-5.5" />
                    </div>
                    <h3 className="text-lg font-bold">{mode.name}</h3>
                    <p className="mt-1 text-sm opacity-80">{mode.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4 p-5">
                {Object.entries(mode.params).map(([key, value]) => {
                  const isBoolean = typeof value === 'boolean'
                  const isNumber = typeof value === 'number'
                  const label = getParamLabel(key)

                  return (
                    <div key={key}>
                      <label className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</label>
                      {isBoolean ? (
                        <button
                          onClick={() => updateParam(mode.key, key, !value)}
                          className={cn(
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                            value ? 'bg-primary' : 'bg-neutral-300'
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                              value ? 'translate-x-6' : 'translate-x-1'
                            )}
                          />
                        </button>
                      ) : isNumber ? (
                        key === 'timeLimit' ? (
                          <div className="flex items-center gap-2">
                            <Timer className="h-4 w-4 text-neutral-400" />
                            <input
                              type="number"
                              value={value as number}
                              onChange={(e) => updateParam(mode.key, key, Number(e.target.value))}
                              placeholder="0 表示不限时"
                              min={0}
                              step={60}
                              className="flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <span className="text-xs text-neutral-500">秒</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 text-neutral-400" />
                            <input
                              type="number"
                              value={value as number}
                              onChange={(e) => updateParam(mode.key, key, Number(e.target.value))}
                              min={0}
                              className="flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <span className="text-xs text-neutral-500">次</span>
                          </div>
                        )
                      ) : (
                        <input
                          type="text"
                          value={value as string}
                          onChange={(e) => updateParam(mode.key, key, e.target.value)}
                          className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="border-t border-neutral-100 bg-neutral-50 px-5 py-3">
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span>
                    {mode.key === 'campaign' && `每关最多重试 ${mode.params.maxRetry} 次`}
                    {mode.key === 'practice' && (mode.params.showAnswer ? '显示正确答案' : '隐藏答案')}
                    {mode.key === 'exam' && `限时 ${formatTime(mode.params.timeLimit as number)}`}
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function getParamLabel(key: string): string {
  const labels: Record<string, string> = {
    allowRetry: '允许重试',
    maxRetry: '最大重试次数',
    showHint: '显示提示',
    showAnswer: '显示答案',
    unlimited: '无限次练习',
    timeLimit: '时间限制（秒）',
  }
  return labels[key] ?? key
}
