import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowUpCircle, ArrowDownCircle, MinusCircle, X } from 'lucide-react';
import type { RefundDispute, RefundOption } from '../../types';

interface DisputeModalProps {
  dispute: RefundDispute | null;
  onResolve: (optionId: string) => void;
  onClose?: () => void;
}

function getOptionIcon(scoreDelta: number) {
  if (scoreDelta > 10) return <ArrowUpCircle className="w-5 h-5 text-emerald-400" />;
  if (scoreDelta >= 0) return <MinusCircle className="w-5 h-5 text-amber-400" />;
  return <ArrowDownCircle className="w-5 h-5 text-rose-400" />;
}

function OptionCard({ option, onClick, index }: { option: RefundOption; onClick: () => void; index: number }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.1 }}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl bg-slate-800/70 border border-slate-700/60 hover:border-amber-500/50 hover:bg-slate-800 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">{getOptionIcon(option.scoreDelta)}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
              {option.label}
            </h4>
            <span
              className={`text-sm font-mono font-bold ${
                option.scoreDelta > 0 ? 'text-emerald-400' : option.scoreDelta === 0 ? 'text-slate-400' : 'text-rose-400'
              }`}
            >
              {option.scoreDelta > 0 ? '+' : ''}{option.scoreDelta}分
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{option.description}</p>
          {option.occupancyImpact !== 0 && (
            <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
              上座率影响：
              <span className={option.occupancyImpact < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                {option.occupancyImpact > 0 ? '+' : ''}{option.occupancyImpact}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

export function DisputeModal({ dispute, onResolve, onClose }: DisputeModalProps) {
  return (
    <AnimatePresence>
      {dispute && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900/95 to-amber-950/30 shadow-2xl shadow-amber-500/10 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center"
                    >
                      <AlertTriangle className="w-6 h-6 text-amber-400" />
                    </motion.div>
                    <div>
                      <h2 className="text-lg font-bold text-white">退票争议处理</h2>
                      <p className="text-xs text-slate-400">订单号: <span className="font-mono">{dispute.orderId}</span></p>
                    </div>
                  </div>
                  {onClose && (
                    <button
                      onClick={onClose}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
                  <p className="text-sm text-rose-200 leading-relaxed">
                    <span className="font-bold text-rose-300">争议原因：</span>
                    {dispute.reason}
                  </p>
                  {dispute.affectedSeats.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-rose-500/20">
                      <span className="text-[11px] text-rose-400/70">涉及座位：</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {dispute.affectedSeats.slice(0, 8).map((sid) => (
                          <span key={sid} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {sid}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  选择处理方案
                </h3>

                <div className="space-y-2.5">
                  {dispute.options.map((option, idx) => (
                    <OptionCard
                      key={option.id}
                      option={option}
                      index={idx}
                      onClick={() => onResolve(option.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
