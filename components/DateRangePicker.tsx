'use client'

import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { useDashboardStore } from '@/store/useDashboardStore'
import { format, subDays, subWeeks, subMonths } from 'date-fns'

const QUICK_OPTIONS = [
  { label: '今天', getValue: () => ({ start: format(new Date(), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  { label: '昨天', getValue: () => ({ start: format(subDays(new Date(), 1), 'yyyy-MM-dd'), end: format(subDays(new Date(), 1), 'yyyy-MM-dd') }) },
  { label: '近7天', getValue: () => ({ start: format(subDays(new Date(), 7), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  { label: '近30天', getValue: () => ({ start: format(subDays(new Date(), 30), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  { label: '本周', getValue: () => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return { start: format(d, 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') } } },
  { label: '本月', getValue: () => { const d = new Date(); d.setDate(1); return { start: format(d, 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') } } },
]

export function DateRangePicker() {
  const { startDate, endDate, setDateRange } = useDashboardStore()
  const [open, setOpen] = useState(false)
  const [tempStart, setTempStart] = useState(startDate)
  const [tempEnd, setTempEnd] = useState(endDate)

  const handleQuickSelect = (option: typeof QUICK_OPTIONS[0]) => {
    const { start, end } = option.getValue()
    setTempStart(start)
    setTempEnd(end)
  }

  const handleApply = () => {
    setDateRange(tempStart, tempEnd)
    setOpen(false)
  }

  const getDisplayLabel = () => {
    if (startDate === endDate) {
      return startDate
    }
    return `${startDate} ~ ${endDate}`
  }

  return (
    <>
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => {
          setTempStart(startDate)
          setTempEnd(endDate)
          setOpen(true)
        }}
      >
        <Calendar className="h-4 w-4" />
        {getDisplayLabel()}
        <ChevronDown className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>选择时间范围</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {QUICK_OPTIONS.map((option) => (
                <Button
                  key={option.label}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuickSelect(option)}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">开始日期</label>
                <Input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">结束日期</label>
                <Input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={handleApply}>应用</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
