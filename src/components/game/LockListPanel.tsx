import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertTriangle, CheckCircle, User, Clock, X, ChevronRight, MapPin } from 'lucide-react';
import type { LockRecord, Seat } from '../../types';

interface LockListPanelProps {
  records: LockRecord[];
  seats: Seat[];
  activeRecordId: string | null;
  selectedSeatIds: string[];
  onSelectRecord: (id: string) => void;
  onClearSelection: () => void;
  onAssign: () => { success: boolean; scoreDelta: number; message?: string };
  onUnassign: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  VIP: { label: 'VIP', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
  PREMIUM: { label: '高级', color: 'text-purple-400 bg-purple-500/20 border-purple-500/30' },
  STANDARD: { label: '标准', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
  ECONOMY: { label: '经济', color: 'text-slate-300 bg-slate-500/20 border-slate-500/30' },
};

export function LockListPanel({
  records,
  seats,
  activeRecordId,
  selectedSeatIds,
  onSelectRecord,
  onClearSelection,
  onAssign,
  onUnassign,
  isOpen,
  onToggle,
}: LockListPanelProps) {
  const activeRecord = records.find((r) => r.id === activeRecordId);
  const processedCount = records.filter((r) => r.processed).length;
  const activeSelectedSeats = activeRecord
    ? seats.filter((s) => activeRecord.assignedSeats.includes(s.id))
    : [];

  const handleAssign = () => {
    const result = onAssign();
    if (!result.success && result.message) {
      console.warn(result.message);
    }
  };

  return (
    <>
      <motion.button
        onClick={onToggle}
        className={`
          absolute top-20 right-4 z-15 p-2 rounded-lg backdrop-blur-xl
          bg-slate-900/70 border border-slate-700/50 text-slate-300
          hover:bg-slate-800/80 hover:text-amber-400 transition-all
          ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
        whileHover={{ x: -2 }}
      >
        <Lock className="w-5 h-5" />
      </motion.button>

      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : 360 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute top-0 right-0 h-full w-80 z-20 pointer-events-auto"
      >
        <div className="h-full backdrop-blur-2xl bg-slate-900/85 border-l border-slate-700/50 flex flex-col">
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-white tracking-wide">锁座记录</h3>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-1 rounded">
                {processedCount}/{records.length}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
                animate={{ width: `${(processedCount / records.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeRecord && (
              <motion.div
                key="active"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-b border-slate-700/50 p-4 bg-amber-500/5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-0.5 rounded text-xs font-bold border ${TYPE_LABELS[activeRecord.ticketType].color}`}>
                      {TYPE_LABELS[activeRecord.ticketType].label}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{activeRecord.orderId}</span>
                  </div>
                  <button
                    onClick={onClearSelection}
                    className="p-1 rounded hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{activeRecord.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>需要 <b className="text-amber-400 font-mono">{activeRecord.seatCount}</b> 个座位</span>
                    <span className="text-slate-500">|</span>
                    <span>已选 <b className={`font-mono ${selectedSeatIds.length === activeRecord.seatCount ? 'text-emerald-400' : 'text-rose-400'}`}>{selectedSeatIds.length}</b></span>
                  </div>
                  {activeRecord.note && (
                    <div className="text-xs text-amber-300/80 bg-amber-500/10 rounded p-2 border border-amber-500/20">
                      📝 {activeRecord.note}
                    </div>
                  )}
                </div>

                {selectedSeatIds.length > 0 && (
                  <div className="mb-3 p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                    <div className="text-[10px] text-slate-500 mb-1">点击座位以选择/取消</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedSeatIds.map((sid) => {
                        const seat = seats.find((s) => s.id === sid);
                        return (
                          <span key={sid} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {seat?.row}{seat?.number}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAssign}
                  disabled={selectedSeatIds.length === 0}
                  className={`
                    w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                    ${selectedSeatIds.length === 0
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 hover:shadow-lg hover:shadow-amber-500/30 active:scale-98'
                    }
                  `}
                >
                  <span>确认分配</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {records.map((record) => {
              const isActive = record.id === activeRecordId;
              const typeInfo = TYPE_LABELS[record.ticketType];
              const recordSeats = seats.filter((s) => record.assignedSeats.includes(s.id));
              const totalValue = recordSeats.reduce((sum, s) => sum + s.price, 0);

              return (
                <motion.button
                  key={record.id}
                  onClick={() => !record.processed && onSelectRecord(record.id)}
                  whileHover={!record.processed && !isActive ? { scale: 1.01, x: -2 } : {}}
                  className={`
                    w-full text-left rounded-xl p-3 border transition-all
                    ${isActive
                      ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
                      : record.processed
                      ? 'bg-slate-800/30 border-slate-700/30 opacity-70'
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                    }
                    ${!record.processed ? 'cursor-pointer' : 'cursor-default'}
                  `}
                  disabled={record.processed && !isActive}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${typeInfo.color}`}>
                        {typeInfo.label}
                      </div>
                      <span className="text-xs font-mono text-slate-400">{record.orderId.slice(-6)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {record.isConflict && (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      {record.processed && (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-white">{record.customerName}</span>
                    <span className="text-xs text-slate-400">×{record.seatCount}</span>
                  </div>

                  {record.processed && recordSeats.length > 0 && (
                    <div className="mb-2">
                      <div className="flex flex-wrap gap-1">
                        {recordSeats.slice(0, 6).map((s) => (
                          <span key={s.id} className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-700/60 text-slate-300">
                            {s.row}{s.number}
                          </span>
                        ))}
                        {recordSeats.length > 6 && (
                          <span className="text-[10px] text-slate-500">+{recordSeats.length - 6}</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/30">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(record.timestamp * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {totalValue > 0 && (
                      <span className="text-xs font-mono font-bold text-amber-400">¥{totalValue.toLocaleString()}</span>
                    )}
                  </div>

                  {record.processed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnassign(record.id);
                      }}
                      className="mt-2 w-full text-[10px] py-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      撤销分配
                    </button>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
