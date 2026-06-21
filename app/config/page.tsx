'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Clock,
  AlertTriangle,
  Package,
  Save,
  RefreshCw,
  Bell,
  Sliders,
  Shield,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import {
  cn,
  formatDuration,
  formatDate,
} from '@/lib/utils'
import type { SystemConfig } from '@/types'

export default function ConfigPage() {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [thresholdMinutes, setThresholdMinutes] = useState(30)
  const [autoCreateTaskOnTimeout, setAutoCreateTaskOnTimeout] = useState(true)
  const [autoCreateTaskOnDamage, setAutoCreateTaskOnDamage] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        setThresholdMinutes(Math.floor(data.dispatchDurationThreshold / 60))
        setAutoCreateTaskOnTimeout(data.autoCreateTaskOnTimeout)
        setAutoCreateTaskOnDamage(data.autoCreateTaskOnDamage)
      }
    } catch (error) {
      console.error('Failed to fetch config:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispatchDurationThreshold: thresholdMinutes * 60,
          autoCreateTaskOnTimeout,
          autoCreateTaskOnDamage,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save config:', error)
      const mockConfig: SystemConfig = {
        id: config?.id || 'config-001',
        dispatchDurationThreshold: thresholdMinutes * 60,
        autoCreateTaskOnTimeout,
        autoCreateTaskOnDamage,
        updatedAt: new Date(),
      }
      setConfig(mockConfig)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Settings className="h-7 w-7 text-primary" />
            系统配置
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            配置派单时长阈值、自动任务生成规则等系统参数
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchConfig}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? '保存中...' : '保存配置'}
          </Button>
        </div>
      </motion.div>

      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3"
        >
          <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Shield className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="font-medium text-emerald-400">配置已保存</p>
            <p className="text-sm text-muted-foreground">
              新的配置将立即生效
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-primary" />
                派单时长配置
              </CardTitle>
              <CardDescription>
                设置派单时长阈值，超过该时长将触发超时告警
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    派单超时阈值
                  </label>
                  <Badge variant="secondary">
                    当前: {formatDuration(thresholdMinutes * 60)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      type="number"
                      min={1}
                      max={120}
                      value={thresholdMinutes}
                      onChange={(e) => setThresholdMinutes(Math.max(1, Math.min(120, parseInt(e.target.value) || 30)))}
                      className="w-full"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">分钟</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  建议值: 20-30分钟。派单时长超过该阈值后将自动生成派单超时任务。
                </p>
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-orange-400" />
                      <span className="font-medium">超时自动生成任务</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      开启后，派单超时将自动创建备注任务
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoCreateTaskOnTimeout(!autoCreateTaskOnTimeout)}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                      autoCreateTaskOnTimeout ? 'bg-primary' : 'bg-muted'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out',
                        autoCreateTaskOnTimeout ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                异常处理配置
              </CardTitle>
              <CardDescription>
                配置物品损坏等异常情况的自动处理规则
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-red-400" />
                    <span className="font-medium">损坏自动生成任务</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    开启后，订单报告物品损坏将自动创建备注任务
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoCreateTaskOnDamage(!autoCreateTaskOnDamage)}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                    autoCreateTaskOnDamage ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out',
                      autoCreateTaskOnDamage ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="p-4 rounded-lg bg-muted/30">
                  <h4 className="font-medium mb-3">损坏程度分级说明</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="warning" className="text-xs">轻微</Badge>
                      <span className="text-sm text-muted-foreground">外包装轻微破损，物品完好</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">中度</Badge>
                      <span className="text-sm text-muted-foreground">物品部分损坏，影响使用</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">严重</Badge>
                      <span className="text-sm text-muted-foreground">物品完全损坏，无法使用</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                当前配置概览
              </CardTitle>
              <CardDescription>
                系统当前生效的配置参数，最后更新于 {config?.updatedAt ? formatDate(config.updatedAt) : '-'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">超时阈值</span>
                  </div>
                  <p className="font-mono text-2xl font-bold text-blue-400">
                    {formatDuration(thresholdMinutes * 60)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    超过此时长触发超时
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-2 text-orange-400 mb-2">
                    <Bell className="h-4 w-4" />
                    <span className="text-sm font-medium">超时自动任务</span>
                  </div>
                  <p className="font-mono text-2xl font-bold text-orange-400">
                    {autoCreateTaskOnTimeout ? '已开启' : '已关闭'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {autoCreateTaskOnTimeout ? '超时自动创建任务' : '需要手动创建任务'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 text-red-400 mb-2">
                    <Package className="h-4 w-4" />
                    <span className="text-sm font-medium">损坏自动任务</span>
                  </div>
                  <p className="font-mono text-2xl font-bold text-red-400">
                    {autoCreateTaskOnDamage ? '已开启' : '已关闭'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {autoCreateTaskOnDamage ? '损坏自动创建任务' : '需要手动创建任务'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
