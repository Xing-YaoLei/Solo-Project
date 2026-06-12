import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import type { Decision } from '@/types/game';

interface DecisionPanelProps {
  decisions: Decision[];
  onDecision: (decisionId: string) => void;
  result: { isCorrect: boolean; points: number; reason?: string } | null;
  onNext: () => void;
  onClose: () => void;
}

export function DecisionPanel({ decisions, onDecision, result, onNext, onClose }: DecisionPanelProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        className="absolute right-4 top-4 w-80 bg-[#3E2723]/90 backdrop-blur-md rounded-2xl p-5 text-[#FFF8E1] shadow-2xl border border-[#5D4037]/50"
        id="decision-panel"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#FF8F00]" />
            <span className="text-sm font-semibold text-[#FFCC80]">做出决策</span>
          </div>
          {!result && (
            <button
              onClick={onClose}
              className="text-[#8D6E63] hover:text-[#FFF8E1] transition-colors text-sm"
            >
              返回分析
            </button>
          )}
        </div>

        {!result ? (
          <>
            <p className="text-sm text-[#D7CCC8] mb-4">
              仔细分析所有线索后，请选择你认为最佳的处理方案：
            </p>
            <div className="space-y-3">
              {decisions.map((decision, index) => (
                <motion.button
                  key={decision.id}
                  whileHover={{ scale: 1.02, x: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onDecision(decision.id)}
                  className="w-full p-4 bg-[#4E342E]/50 hover:bg-[#5D4037]/50 rounded-xl text-left transition-all border border-transparent hover:border-[#8D6E63] group"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#5D4037] flex items-center justify-center text-sm font-bold text-[#FFCC80] flex-shrink-0">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#FFF8E1] group-hover:text-[#FFCC80] transition-colors">
                        {decision.text}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={`p-4 rounded-xl mb-4 ${
              result.isCorrect ? 'bg-[#66BB6A]/20' : 'bg-[#EF5350]/20'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                {result.isCorrect ? (
                  <CheckCircle className="w-8 h-8 text-[#66BB6A]" />
                ) : (
                  <XCircle className="w-8 h-8 text-[#EF5350]" />
                )}
                <div>
                  <p className={`font-bold ${result.isCorrect ? 'text-[#66BB6A]' : 'text-[#EF5350]'}`}>
                    {result.isCorrect ? '决策正确！' : '决策失误'}
                  </p>
                  {result.isCorrect && result.points > 0 && (
                    <p className="text-sm text-[#FFD54F]">+{result.points} 积分</p>
                  )}
                </div>
              </div>
              {result.reason && (
                <p className="text-sm text-[#D7CCC8] mt-2">{result.reason}</p>
              )}
            </div>

            <div className="p-3 bg-[#4E342E]/50 rounded-xl mb-4">
              <p className="text-xs text-[#8D6E63] mb-1">结果分析：</p>
              <p className="text-sm text-[#FFF8E1]">
                {decisions.find((d) => d.isCorrect)?.consequence}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNext}
              className="w-full py-3 bg-[#FF8F00] hover:bg-[#FFA726] text-[#3E2723] font-bold rounded-xl transition-colors"
            >
              {result.isCorrect ? '继续下一个任务' : '返回主菜单'}
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
