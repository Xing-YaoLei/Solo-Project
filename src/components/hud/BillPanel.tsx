import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Tag, Percent, AlertCircle, Ticket } from 'lucide-react';
import { useBilling } from '@/hooks/useBilling';
import { useGameStore } from '@/store/gameStore';
import { formatCurrency, formatTime } from '@/utils/math';

interface BillPanelProps {
  billId: string;
  onClose: () => void;
}

export const BillPanel = ({ billId, onClose }: BillPanelProps) => {
  const { getBillSummary, processPayment, phase } = useBilling();
  const applyDiscountToBill = useGameStore(state => state.applyDiscountToBill);
  const getItemCooldown = useGameStore(state => state.getItemCooldown);
  
  const summary = getBillSummary(billId);
  
  if (!summary) {
    return null;
  }

  const handlePayment = () => {
    const success = processPayment(summary.id);
    if (success) {
      setTimeout(() => {
        onClose();
      }, 500);
    }
  };

  const handleApplyDiscount = () => {
    applyDiscountToBill(summary.id);
  };

  const discountCooldown = getItemCooldown('discount');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 w-96 border border-slate-600 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">车位 #{summary.spotNumber}</h3>
              <p className="text-slate-400 text-sm">{summary.vehiclePlate}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {summary.hasException && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-2"
            >
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
              <div>
                <div className="text-red-400 font-medium text-sm">账单异常</div>
                <div className="text-red-300/80 text-xs">{summary.exceptionReason}</div>
              </div>
            </motion.div>
          )}

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock size={16} />
                <span>停车时长</span>
              </div>
              <span className="text-white font-medium">
                {formatTime(summary.currentFee.durationMinutes * 60)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Tag size={16} />
                <span>基础费用</span>
              </div>
              <span className="text-white">{summary.formattedBase}</span>
            </div>

            {summary.currentFee.discount > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-400">
                  <Percent size={16} />
                  <span>优惠折扣</span>
                </div>
                <span className="text-green-400">-{summary.formattedDiscount}</span>
              </div>
            )}

            <div className="border-t border-slate-600 pt-4 flex items-center justify-between">
              <span className="text-lg text-white font-medium">应付金额</span>
              <span className="text-2xl font-bold text-yellow-400">{summary.formattedTotal}</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {summary.isPaid ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-3 bg-green-500/20 border border-green-500/50 rounded-xl"
              >
                <span className="text-green-400 font-medium">✓ 已支付</span>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {!summary.hasException && discountCooldown <= 0 && (phase === 'billing' || phase === 'settlement') && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleApplyDiscount}
                    className="w-full py-2.5 rounded-xl font-medium text-sm bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Ticket size={16} />
                    使用优惠券 (20%折扣)
                  </motion.button>
                )}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePayment}
                  disabled={phase !== 'billing' && phase !== 'settlement'}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                    phase === 'billing' || phase === 'settlement'
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-400 hover:to-orange-400 shadow-lg shadow-orange-500/25'
                      : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  确认支付 {summary.formattedTotal}
                </motion.button>
              </div>
            )}
          </AnimatePresence>

          {(phase !== 'billing' && phase !== 'settlement' && !summary.isPaid) && (
            <p className="text-center text-slate-500 text-sm mt-2">
              请在账单管理阶段进行支付
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
