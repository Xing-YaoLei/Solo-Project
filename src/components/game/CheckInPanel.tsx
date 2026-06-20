import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, UserCheck, AlertCircle, Check, Clock, ChevronRight, X } from 'lucide-react';
import type { CheckInRecord, Seat, LockRecord } from '../../types';

interface CheckInPanelProps {
  records: CheckInRecord[];
  lockRecords: LockRecord[];
  seats: Seat[];
  activeCheckInId: string | null;
  selectedSeatIds: string[];
  onSelectCheckIn: (id: string) => void;
  onClearSelection: () => void;
  onProcess: (id: string, seatIds: string[]) => { success: boolean; scoreDelta: number; dispute?: any };
  isOpen: boolean;
  onToggle: () => void;
}

export function CheckInPanel({
  records,
  lockRecords,
  seats,
  activeCheckInId,
  selectedSeatIds,
  onSelectCheckIn,
  onClearSelection,
  onProcess,
  isOpen,
  onToggle,
}: CheckInPanelProps) {
  const [toast, setToast] = useState<string | null>(null);
  const activeRecord = records.find((r) => r.id === activeCheckInId);
  const processedCount = records.filter((r) => r.processed).length;

  const matchedLock = activeRecord
    ? lockRecords.find((l) => l.orderId === activeRecord.orderId)
    : null;

  const handleProcess = () => {
    if (!activeRecord) return;
    const seatIdsToUse = selectedSeatIds.length > 0
      ? selectedSeatIds
      : matchedLock?.assignedSeats || [];

    if (seatIdsToUse.length === 0) {
      setToast('请选择要核销的座位');
      setTimeout(() => setToast(null), 2000);
      return;
    }
    onProcess(activeRecord.id, seatIdsToUse);
    onClearSelection();
  };

  const autoSelectAssigned = () => {
    if (!matchedLock) return;
    matchedLock.assignedSeats.forEach((sid) => {
      if (!selectedSeatIds.includes(sid)) {
        const seat = seats.find((s) => s.id === sid);
        if (seat && (seat.status === 'LOCKED' || seat.status === 'SOLD')) {
          (window as any).__simulateSeatClick?.(sid);
        }
      }
    });
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
        <QrCode className="w-5 h-5" />
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
                <QrCode className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-white tracking-wide">核销记录</h3>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-1 rounded">
                {processedCount}/{records.length}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
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
                className="border-b border-slate-700/50 p-4 bg-emerald-500/5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded text-xs font-bold border bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono">
                      {activeRecord.code}
                    </div>
                  </div>
                  <button
                    onClick={onClearSelection}
                    className="p-1 rounded hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">关联订单:</span>
                    <span className="font-mono text-white">{activeRecord.orderId}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">应到: </span>
                      <b className="text-white font-mono">{activeRecord.expectedCount}</b>
                    </div>
                    <div>
                      <span className="text-slate-400">实到: </span>
                      <b className={`font-mono ${activeRecord.actualCount < activeRecord.expectedCount ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {activeRecord.actualCount}
                      </b>
                    </div>
                  </div>
                  {activeRecord.hasDispute && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 rounded-lg p-2 border border-amber-500/30">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>⚠ 可能存在退票争议</span>
                    </div>
                  )}
                  {matchedLock && matchedLock.assignedSeats.length > 0 && (
                    <button
                      onClick={autoSelectAssigned}
                      className="w-full text-xs py-1.5 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-600/50"
                    >
                      一键选择已分配的 {matchedLock.assignedSeats.length} 个座位
                    </button>
                  )}
                </div>

                {selectedSeatIds.length > 0 && (
                  <div className="mb-3 p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                    <div className="text-[10px] text-slate-500 mb-1">已选座位（点击座位选择）</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedSeatIds.map((sid) => {
                        const seat = seats.find((s) => s.id === sid);
                        return (
                          <span key={sid} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {seat?.row}{seat?.number}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleProcess}
                  className="w-full py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-emerald-400 text-white hover:shadow-lg hover:shadow-emerald-500/30 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>确认核销</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-20 left-4 right-4 px-3 py-2 rounded-lg bg-rose-500/90 text-white text-xs text-center z-30"
              >
                {toast}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {records.map((record) => {
              const isActive = record.id === activeCheckInId;
              const isMatched = lockRecords.some((l) => l.orderId === record.orderId && l.processed);
              const recordSeats = seats.filter((s) => record.checkedSeats.includes(s.id));

              return (
                <motion.button
                  key={record.id}
                  onClick={() => !record.processed && isMatched && onSelectCheckIn(record.id)}
                  whileHover={!record.processed && !isActive && isMatched ? { scale: 1.01, x: -2 } : {}}
                  className={`
                    w-full text-left rounded-xl p-3 border transition-all
                    ${isActive
                      ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
                      : record.processed
                      ? 'bg-slate-800/30 border-slate-700/30 opacity-70'
                      : !isMatched
                      ? 'bg-slate-800/30 border-slate-700/30 opacity-50'
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                    }
                    ${!record.processed && isMatched ? 'cursor-pointer' : 'cursor-default'}
                  `}
                  disabled={record.processed || !isMatched}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-700/80 text-[10px] font-mono text-emerald-300 border border-slate-600/50 font-bold">
                        {record.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {record.hasDispute && record.processed && (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      {record.processed && (
                        <Check className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono text-slate-400">{record.orderId}</span>
                    <div className="text-xs font-mono">
                      <span className="text-white">{record.actualCount}</span>
                      <span className="text-slate-500"> / {record.expectedCount}</span>
                    </div>
                  </div>

                  {record.processed && recordSeats.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {recordSeats.slice(0, 6).map((s) => (
                        <span key={s.id} className="text-[10px] font-mono px-1 py-0.5 rounded bg-emerald-600/20 text-emerald-300">
                          {s.row}{s.number}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/30">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(record.timestamp * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {!isMatched && !record.processed && (
                      <span className="text-[10px] text-slate-500">等待锁座完成</span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
