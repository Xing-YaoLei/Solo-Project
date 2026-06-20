import { motion, AnimatePresence } from 'motion/react'
import { Armchair, DollarSign, Eye } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { GRADE_COLORS } from '@/data/gameData'
import type { SeatAssignment } from '@/types'

const ROWS = 5
const COLS = 8

export default function SeatAssignPanel() {
  const phase = useGameStore((s) => s.phase)
  const seats = useGameStore((s) => s.seats)
  const toggleSeat = useGameStore((s) => s.toggleSeat)
  const assignAllSeats = useGameStore((s) => s.assignAllSeats)
  const clearAllSeats = useGameStore((s) => s.clearAllSeats)
  const visible = phase === 'seat-assign'

  const assigned = seats.filter((s) => s.assigned)
  const assignedCount = assigned.length
  const revenue = assigned.reduce((sum, s) => sum + s.price, 0)
  const avgView =
    assignedCount > 0
      ? Math.round(assigned.reduce((sum, s) => sum + s.viewScore, 0) / assignedCount)
      : 0

  function seatStyle(seat: SeatAssignment) {
    const gradeColor = GRADE_COLORS[seat.grade]
    if (seat.conflict) {
      return {
        backgroundColor: 'rgba(239,68,68,0.35)',
        borderColor: '#ef4444',
        animation: 'pulse-glow 1s ease-in-out infinite',
      }
    }
    if (seat.assigned) {
      return {
        backgroundColor: `${gradeColor}33`,
        borderColor: gradeColor,
      }
    }
    return {
      backgroundColor: 'transparent',
      borderColor: `${gradeColor}66`,
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="glass-panel fixed right-0 top-0 bottom-0 z-40 w-96 overflow-y-auto p-5"
        >
          <h2 className="text-lg font-display font-bold text-white mb-3">
            座位分配
          </h2>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="glass-card rounded-lg p-2 text-center">
              <Armchair size={14} className="mx-auto text-slate-400 mb-1" />
              <div className="font-mono text-sm text-white">{assignedCount}/40</div>
              <div className="text-[10px] text-slate-400">已分配</div>
            </div>
            <div className="glass-card rounded-lg p-2 text-center">
              <DollarSign size={14} className="mx-auto text-golden mb-1" />
              <div className="font-mono text-sm text-golden">¥{revenue}</div>
              <div className="text-[10px] text-slate-400">营收</div>
            </div>
            <div className="glass-card rounded-lg p-2 text-center">
              <Eye size={14} className="mx-auto text-vivid-orange mb-1" />
              <div className="font-mono text-sm text-white">{avgView}</div>
              <div className="text-[10px] text-slate-400">均视野</div>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={assignAllSeats}
              className="flex-1 text-xs font-display py-1.5 rounded-lg bg-vivid-orange/20 text-vivid-orange hover:bg-vivid-orange/30 transition"
            >
              全部分配
            </button>
            <button
              onClick={clearAllSeats}
              className="flex-1 text-xs font-display py-1.5 rounded-lg bg-white/10 text-slate-300 hover:bg-white/15 transition"
            >
              清除全部
            </button>
          </div>

          <div className="flex justify-center gap-3 mb-3 text-[10px] text-slate-400">
            {(Object.entries(GRADE_COLORS) as [string, string][]).map(([grade, color]) => (
              <span key={grade} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm border" style={{ borderColor: color }} />
                {grade}
              </span>
            ))}
          </div>

          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
            {Array.from({ length: ROWS }, (_, r) =>
              Array.from({ length: COLS }, (_, c) => {
                const seat = seats[r * COLS + c]
                if (!seat) return null
                return (
                  <button
                    key={seat.seatId}
                    onClick={() => toggleSeat(seat.seatId)}
                    className="aspect-square rounded-md border-2 text-[9px] font-mono text-white/70 hover:scale-110 transition-transform"
                    style={seatStyle(seat)}
                    title={`${seat.grade} ¥${seat.price} 视野${seat.viewScore}`}
                  >
                    {seat.grade === 'VIP' ? 'V' : seat.grade}
                  </button>
                )
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
