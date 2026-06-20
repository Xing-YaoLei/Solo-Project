import { useState } from 'react'
import type { SeatingChart, SeatChartItem, SeatStatus } from '../types'
import { cn } from '../lib/utils'

interface SeatingChartProps {
  chart?: SeatingChart
  currentSeatId?: string
}

const SEAT_COLORS: Record<SeatStatus, string> = {
  available: 'bg-green-400 hover:bg-green-500',
  reserved: 'bg-yellow-400 hover:bg-yellow-500',
  occupied: 'bg-blue-400 hover:bg-blue-500',
  disabled: 'bg-gray-300 cursor-not-allowed',
}

const SEAT_LABELS: Record<SeatStatus, string> = {
  available: '可选',
  reserved: '已预留',
  occupied: '已售',
  disabled: '不可用',
}

export default function SeatingChart({ chart, currentSeatId }: SeatingChartProps) {
  const [selectedSeat, setSelectedSeat] = useState<SeatChartItem | null>(null)

  if (!chart || !chart.chart || Object.keys(chart.chart).length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-gray-400">暂无座位图数据</p>
      </div>
    )
  }

  const sections = chart.chart

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">座位图</h3>
        <div className="flex items-center gap-3">
          {(['available', 'reserved', 'occupied', 'disabled'] as SeatStatus[]).map(
            (status) => (
              <div key={status} className="flex items-center gap-1">
                <span
                  className={`inline-block w-3 h-3 rounded-sm ${SEAT_COLORS[status]}`}
                />
                <span className="text-xs text-gray-500">{SEAT_LABELS[status]}</span>
              </div>
            ),
          )}
        </div>
      </div>

      <div className="overflow-auto max-h-[500px]">
        <div className="space-y-4">
          {Object.entries(sections).map(([sectionName, rows]) => (
            <div key={sectionName}>
              <h4 className="text-xs font-medium text-gray-600 mb-2 px-1">
                {sectionName}
              </h4>
              <div className="space-y-1">
                {Object.entries(rows).map(([rowLabel, seats]) => (
                  <div key={rowLabel} className="flex items-center gap-1">
                    <span className="text-xs text-gray-400 w-8 text-right flex-shrink-0">
                      {rowLabel}
                    </span>
                    <div className="flex gap-0.5">
                      {seats.map((seat) => {
                        const isCurrent = seat.id === currentSeatId
                        const isSelected = selectedSeat?.id === seat.id
                        return (
                          <button
                            key={seat.id}
                            onClick={() => setSelectedSeat(seat)}
                            disabled={seat.status === 'disabled'}
                            className={cn(
                              'w-6 h-6 rounded text-xs font-medium flex items-center justify-center transition-all',
                              SEAT_COLORS[seat.status],
                              isCurrent && 'ring-2 ring-offset-1 ring-blue-600',
                              isSelected && 'ring-2 ring-offset-1 ring-indigo-500',
                            )}
                            title={`${sectionName} ${rowLabel}排 ${seat.number}号 - ${SEAT_LABELS[seat.status]}`}
                          >
                            {seat.number}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedSeat && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-100">
          <h4 className="text-xs font-medium text-gray-600 mb-1">座位详情</h4>
          <p className="text-sm text-gray-900">
            {selectedSeat.seat_label} · 状态：{SEAT_LABELS[selectedSeat.status]}
          </p>
          {selectedSeat.order_id && (
            <p className="text-xs text-gray-500 mt-1">
              关联订单：{selectedSeat.order_id}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
