'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Package, Clock, ChevronRight, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  cn,
  formatDuration,
  formatRelativeTime,
  getDamageLevelLabel,
  getTaskTypeLabel,
  getPriorityColor,
  getPriorityLabel,
} from '@/lib/utils'
import { useRouter } from 'next/navigation'
import type { Task } from '@/types'

interface AlertListProps {
  loading?: boolean
}

export function AlertList({ loading = false }: AlertListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [totalPending, setTotalPending] = useState(0)
  const [highPriority, setHighPriority] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/tasks?status=pending&status=processing&pageSize=5')
        if (response.ok) {
          const data = await response.json()
          setTasks(data.data || [])
          setTotalPending(data.summary?.pendingCount || 0)
          setHighPriority(data.summary?.highPriorityCount || 0)
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error)
        const mockTasks: Task[] = Array.from({ length: 5 }, (_, i) => ({
          id: `task-${i}`,
          orderId: `order-${i}`,
          type: i % 2 === 0 ? 'dispatch_timeout' : 'item_damage',
          priority: i < 2 ? 'high' : 'medium',
          status: i < 3 ? 'pending' : 'processing',
          title: i % 2 === 0 ? '派单超时 - 超出25分钟' : '物品损坏 - 中度',
          description: '需要审核处理',
          dispatchDuration: i % 2 === 0 ? 3300 : undefined,
          damageLevel: i % 2 === 1 ? 'moderate' : undefined,
          createdAt: new Date(Date.now() - i * 3600000),
        }))
        setTasks(mockTasks)
        setTotalPending(12)
        setHighPriority(3)
      }
    }
    fetchTasks()
  }, [])

  const handleTaskClick = (taskId: string) => {
    router.push(`/tasks/${taskId}`)
  }

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            异常告警
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          异常告警
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {totalPending} 待处理
          </Badge>
          <Badge variant="destructive" className="gap-1">
            {highPriority} 高优先级
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence>
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'p-3 rounded-lg border cursor-pointer transition-all group',
                task.status === 'pending'
                  ? 'border-border/50 bg-card/30 hover:bg-card/50 hover:border-border'
                  : 'border-blue-500/30 bg-blue-500/10'
              )}
              onClick={() => handleTaskClick(task.id)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center',
                    task.type === 'dispatch_timeout'
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-red-500/20 text-red-400'
                  )}
                >
                  {task.type === 'dispatch_timeout' ? (
                    <Clock className="h-5 w-5" />
                  ) : (
                    <Package className="h-5 w-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <Badge
                      variant={task.status === 'pending' ? 'warning' : 'default'}
                      className="text-xs shrink-0"
                    >
                      {task.status === 'pending' ? '待处理' : '处理中'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge className={cn('text-xs', getPriorityColor(task.priority))}>
                      {getPriorityLabel(task.priority)}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {task.type === 'dispatch_timeout' && task.dispatchDuration && (
                        <>
                          <Clock className="h-3 w-3" />
                          {formatDuration(task.dispatchDuration)}
                        </>
                      )}
                      {task.type === 'item_damage' && task.damageLevel && (
                        <>
                          <Package className="h-3 w-3" />
                          {getDamageLevelLabel(task.damageLevel)}
                        </>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(task.createdAt)}
                    </span>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={() => router.push('/tasks')}
        >
          查看全部任务
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  )
}
