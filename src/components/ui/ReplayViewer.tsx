import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Play, AlertCircle, Clock, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { GRADE_COLORS } from '@/data/gameData'
import type { ReplayRecord, SeatAssignment } from '@/types'

const ROWS = 5
const COLS = 8

function ReplaySeatGrid({ seats }: { seats: SeatAssignment[] }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-center gap-2 mb-3 text-[9px] text-slate-400">
        {(Object.entries(GRADE_COLORS) as [string, string][]).map(([grade, color]) => (
          <span key={grade} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color, opacity: 0.5 }} />
            {grade}
          </span>
        ))}
      </div>

      <div
        className="grid gap-1 mx-auto"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, maxWidth: 320 }}
      >
        {Array.from({ length: ROWS }, (_, r) =>
          Array.from({ length: COLS }, (_, c) => {
            const seat = seats[r * COLS + c]
            if (!seat) return null
            const gradeColor = GRADE_COLORS[seat.grade]

            return (
              <div
                key={seat.seatId}
                className="aspect-square rounded-md border text-[9px] font-mono flex items-center justify-center"
                style={{
                  backgroundColor: seat.assigned ? `${gradeColor}55` : 'transparent',
                  borderColor: seat.assigned ? gradeColor : `${gradeColor}44`,
                  color: seat.assigned ? gradeColor : 'rgba(255,255,255,0.3)',
                  boxShadow: seat.assigned ? `0 0 8px ${gradeColor}33` : 'none',
                }}
              >
                {seat.grade === 'VIP' ? 'V' : seat.grade}
              </div>
            )
          })
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/5">
        <div className="text-center">
          <div className="text-xs font-mono text-white">
            {seats.filter(s => s.assigned).length}
          </div>
          <div className="text-[9px] text-slate-400">已分配</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-mono text-golden">
            ¥{seats.filter(s => s.assigned).reduce((sum, s) => sum + s.price, 0)}
          </div>
          <div className="text-[9px] text-slate-400">营收</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-mono text-vivid-orange">
            {(() => {
              const assigned = seats.filter(s => s.assigned)
              return assigned.length > 0
                ? Math.round(assigned.reduce((sum, s) => sum + s.viewScore, 0) / assigned.length)
                : 0
            })()}
          </div>
          <div className="text-[9px] text-slate-400">均视野</div>
        </div>
      </div>
    </div>
  )
}

function SeatDiffView({ replay1, replay2 }: { replay1: ReplayRecord; replay2: ReplayRecord }) {
  const diffSeats = replay1.seatSnapshot.map((s1, i) => {
    const s2 = replay2.seatSnapshot[i]!
    const changed = s1!.assigned !== s2.assigned
    return { ...s1!, changed, newAssigned: s2.assigned }
  })

  return (
    <div
      className="grid gap-1 mx-auto"
      style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, maxWidth: 320 }}
    >
      {Array.from({ length: ROWS }, (_, r) =>
        Array.from({ length: COLS }, (_, c) => {
          const seat = diffSeats[r * COLS + c]
          if (!seat) return null
          const gradeColor = GRADE_COLORS[seat.grade]

          let bg = 'transparent'
          let border = `${gradeColor}44`
          let label = seat.grade === 'VIP' ? 'V' : seat.grade
          let textColor = 'rgba(255,255,255,0.3)'

          if (seat.changed) {
            if (seat.newAssigned) {
              bg = '#22c55e44'
              border = '#22c55e'
              textColor = '#22c55e'
              label = '+'
            } else {
              bg = '#ef444444'
              border = '#ef4444'
              textColor = '#ef4444'
              label = '-'
            }
          } else if (seat.assigned) {
            bg = `${gradeColor}33`
            border = gradeColor
            textColor = gradeColor
          }

          return (
            <div
              key={`diff-${r}-${c}`}
              className="aspect-square rounded-md border text-[9px] font-mono flex items-center justify-center transition-all"
              style={{
                backgroundColor: bg,
                borderColor: border,
                color: textColor,
                boxShadow: seat.changed ? `0 0 10px ${border}` : 'none',
              }}
            >
              {label}
            </div>
          )
        })
      )}
    </div>
  )
}

export default function ReplayViewer() {
  const showReplay = useGameStore((s) => s.showReplay)
  const setShowReplay = useGameStore((s) => s.setShowReplay)
  const replays = useGameStore((s) => s.replays)

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [compareMode, setCompareMode] = useState(false)
  const [compareIndex, setCompareIndex] = useState(-1)

  const selectedReplay = replays[selectedIndex]
  const compareReplay = compareMode && compareIndex >= 0 ? replays[compareIndex] : null

  const formatTime = (ts: number) => {
    const date = new Date(ts)
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  const changeCount =
    selectedReplay && compareReplay
      ? selectedReplay.seatSnapshot.filter((s, i) => s.assigned !== compareReplay.seatSnapshot[i]!.assigned).length
      : 0

  return (
    <AnimatePresence>
      {showReplay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowReplay(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 200 }}
            className="glass-panel rounded-2xl p-6 w-[560px] max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Play size={18} className="text-vivid-orange" />
                <h2 className="text-lg font-display font-bold text-white">失败回放</h2>
                {replays.length > 0 && (
                  <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                    {replays.length}/3 条记录
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowReplay(false)}
                className="w-8 h-8 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {replays.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <Trash2 size={28} className="text-slate-500" />
                </div>
                <p className="text-sm text-slate-400 mb-1">暂无失败记录</p>
                <p className="text-[11px] text-slate-500">
                  当座位分配不达标时，系统会自动保存最近 3 次失败记录
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  {replays.map((replay, i) => (
                    <button
                      key={replay.id}
                      onClick={() => {
                        setSelectedIndex(i)
                        setCompareIndex(-1)
                      }}
                      className={`glass-card rounded-xl p-3 text-left flex-shrink-0 min-w-[160px] transition ${
                        selectedIndex === i
                          ? 'ring-2 ring-vivid-orange/50 bg-vivid-orange/5'
                          : compareIndex === i
                          ? 'ring-2 ring-emerald-500/50 bg-emerald-500/5'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[10px] font-mono text-white bg-white/10 px-1.5 py-0.5 rounded">
                          #{i + 1}
                        </span>
                        <span className="text-[9px] text-slate-400 flex items-center gap-1">
                          <Clock size={9} />
                          {formatTime(replay.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-red-400 mb-1.5">
                        <AlertCircle size={10} />
                        <span className="truncate">{replay.failureReason}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {replay.seatSnapshot.filter(s => s.assigned).length}/40 座
                      </div>
                    </button>
                  ))}
                </div>

                {replays.length >= 2 && (
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => setCompareMode(!compareMode)}
                      className={`text-xs font-display px-3 py-1.5 rounded-lg transition ${
                        compareMode
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {compareMode ? '退出对比模式' : '🔄 对比另一条记录'}
                    </button>
                    {compareMode && selectedReplay && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">选择对比记录：</span>
                        <div className="flex gap-1">
                          {replays.map((_, i) =>
                            i !== selectedIndex ? (
                              <button
                                key={i}
                                onClick={() => setCompareIndex(i)}
                                className={`w-7 h-7 rounded-md text-[10px] font-mono transition ${
                                  compareIndex === i
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                }`}
                              >
                                #{i + 1}
                              </button>
                            ) : null
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex-1 overflow-y-auto pr-1">
                  {compareMode && compareReplay && selectedReplay ? (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="glass-card rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-display font-semibold text-white">
                              记录 #{selectedIndex + 1}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {formatTime(selectedReplay.timestamp)}
                            </span>
                          </div>
                          <ReplaySeatGrid seats={selectedReplay.seatSnapshot} />
                        </div>
                        <div className="glass-card rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-display font-semibold text-emerald-400">
                              记录 #{compareIndex + 1}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {formatTime(compareReplay.timestamp)}
                            </span>
                          </div>
                          <ReplaySeatGrid seats={compareReplay.seatSnapshot} />
                        </div>
                      </div>

                      <div className="glass-card rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-display font-semibold text-white">
                            差异对比
                          </span>
                          <span className="text-[10px] font-mono text-vivid-orange">
                            {changeCount} 处变动
                          </span>
                        </div>
                        <div className="flex justify-center gap-4 mb-4 text-[10px]">
                          <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-500" />
                            <span className="text-slate-300">新增分配</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded bg-red-500/40 border border-red-500" />
                            <span className="text-slate-300">取消分配</span>
                          </span>
                        </div>
                        <SeatDiffView replay1={selectedReplay} replay2={compareReplay} />
                      </div>
                    </div>
                  ) : selectedReplay ? (
                    <div className="glass-card rounded-xl p-5">
                      <div className="flex items-start gap-3 mb-5 pb-4 border-b border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                          <AlertCircle size={18} className="text-red-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-display font-semibold text-white mb-1">
                            失败原因
                          </div>
                          <p className="text-sm text-red-300">{selectedReplay.failureReason}</p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {formatTime(selectedReplay.timestamp)}
                            </span>
                            <span>回合 ID: {selectedReplay.roundId.slice(-8)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-display text-slate-400 mb-3">
                          🎬 座位分配回放
                        </div>
                        <ReplaySeatGrid seats={selectedReplay.seatSnapshot} />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
                  <button
                    onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                    disabled={selectedIndex === 0}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-display text-slate-400 hover:text-white hover:bg-white/5 transition disabled:opacity-30"
                  >
                    <ChevronLeft size={14} />
                    上一条
                  </button>
                  <div className="flex items-center gap-1">
                    {replays.map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition ${
                          i === selectedIndex ? 'bg-vivid-orange w-6' : 'bg-white/15'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setSelectedIndex(Math.min(replays.length - 1, selectedIndex + 1))}
                    disabled={selectedIndex >= replays.length - 1}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-display text-slate-400 hover:text-white hover:bg-white/5 transition disabled:opacity-30"
                  >
                    下一条
                    <ChevronRight size={14} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
