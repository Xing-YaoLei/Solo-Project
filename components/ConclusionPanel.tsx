'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageSquare, Send, User, Calendar, Paperclip, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn, formatDate, formatRelativeTime, getChartStageLabel } from '@/lib/utils'
import { useDashboardStore } from '@/store/useDashboardStore'
import type { Conclusion, ChartType } from '@/types'

interface ConclusionPanelProps {
  className?: string
}

export function ConclusionPanel({ className }: ConclusionPanelProps) {
  const {
    showConclusionPanel,
    toggleConclusionPanel,
    selectedChartPoint,
    selectedChartType,
    conclusions,
    addConclusion,
  } = useDashboardStore()

  const [newConclusion, setNewConclusion] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [pointConclusions, setPointConclusions] = useState<Conclusion[]>([])

  useEffect(() => {
    if (selectedChartPoint && selectedChartType) {
      setLoading(true)
      const filtered = conclusions.filter(
        c => c.chartPointId === selectedChartPoint && c.chartType === selectedChartType
      )
      setPointConclusions(filtered)
      setLoading(false)
    } else {
      setPointConclusions([])
    }
  }, [selectedChartPoint, selectedChartType, conclusions])

  const handleSubmit = async () => {
    if (!newConclusion.trim() || !selectedChartPoint || !selectedChartType) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/conclusions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: 'mock-order-id',
          chartPointId: selectedChartPoint,
          chartType: selectedChartType as ChartType,
          content: newConclusion,
          authorId: 'current-user-id',
          authorName: '当前用户',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        addConclusion(data.conclusion)
        setNewConclusion('')
      }
    } catch (error) {
      console.error('Failed to submit conclusion:', error)
      const mockConclusion: Conclusion = {
        id: Math.random().toString(36).substring(2, 15),
        orderId: 'mock-order-id',
        chartPointId: selectedChartPoint,
        chartType: selectedChartType as ChartType,
        content: newConclusion,
        authorId: 'current-user-id',
        authorName: '当前用户',
        createdAt: new Date(),
        attachments: [],
      }
      addConclusion(mockConclusion)
      setNewConclusion('')
    } finally {
      setSubmitting(false)
    }
  }

  const getPointLabel = () => {
    if (!selectedChartPoint) return ''
    if (selectedChartPoint.startsWith('funnel-')) {
      const parts = selectedChartPoint.split('-')
      const stage = parts[1]
      const route = parts[2] === 'all' ? '全部路线' : `路线 ${parts[2]}`
      return `${getChartStageLabel(stage)} - ${route}`
    }
    if (selectedChartPoint.startsWith('dispatch-')) {
      const parts = selectedChartPoint.split('-')
      const date = parts.slice(1, -1).join('-')
      const route = parts[parts.length - 1] === 'all' ? '全部路线' : `路线 ${parts[parts.length - 1]}`
      return `${date} - ${route}`
    }
    return selectedChartPoint
  }

  return (
    <AnimatePresence>
      {showConclusionPanel && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'fixed right-0 top-0 h-full w-full md:w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col',
            className
          )}
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="font-display font-semibold">处理结论</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleConclusionPanel(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {selectedChartPoint && (
            <div className="p-4 border-b border-border bg-background/50">
              <Badge variant="secondary" className="mb-2">
                {selectedChartType === 'funnel' ? '漏斗图' : '派单趋势图'}
              </Badge>
              <p className="text-sm font-medium">{getPointLabel()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {pointConclusions.length} 条处理结论
              </p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            ) : pointConclusions.length > 0 ? (
              <div className="space-y-4">
                {pointConclusions.map((conclusion, index) => (
                  <motion.div
                    key={conclusion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl bg-background/60 border border-border/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{conclusion.authorName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatRelativeTime(conclusion.createdAt)}
                          </p>
                        </div>
                      </div>
                      {conclusion.attachments && conclusion.attachments.length > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          <Paperclip className="h-3 w-3" />
                          {conclusion.attachments.length}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {conclusion.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(conclusion.createdAt)}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : selectedChartPoint ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">暂无处理结论</p>
                <p className="text-xs text-muted-foreground mt-1">
                  点击下方输入框添加第一条结论
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Plus className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">选择图表数据点</p>
                <p className="text-xs text-muted-foreground mt-1">
                  点击漏斗图或趋势图上的数据点查看并添加处理结论
                </p>
              </div>
            )}
          </div>

          {selectedChartPoint && (
            <div className="p-4 border-t border-border">
              <div className="space-y-2">
                <Textarea
                  placeholder="输入处理结论，分析问题原因并提出改进建议..."
                  value={newConclusion}
                  onChange={(e) => setNewConclusion(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                    <Paperclip className="h-4 w-4" />
                    添加附件
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!newConclusion.trim() || submitting}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? '提交中...' : '提交结论'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
