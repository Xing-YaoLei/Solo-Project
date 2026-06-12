import { motion } from 'framer-motion';
import { FileText, Eye, AlertTriangle } from 'lucide-react';
import type { Clue } from '@/types/game';

interface CluePanelProps {
  clues: Clue[];
  viewedClues: string[];
  selectedClueId: string | null;
  onClueClick: (clueId: string) => void;
  onClose: () => void;
}

const typeIcons: Record<string, string> = {
  transaction: '💰',
  refund: '↩️',
  benefit: '🎁',
  profile: '👤',
};

const typeLabels: Record<string, string> = {
  transaction: '交易记录',
  refund: '退款记录',
  benefit: '权益信息',
  profile: '会员画像',
};

export function CluePanel({ clues, viewedClues, selectedClueId, onClueClick, onClose }: CluePanelProps) {
  const selectedClue = clues.find((c) => c.id === selectedClueId);

  return (
    <motion.div
      initial={{ y: 400, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 400, opacity: 0 }}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[900px] max-w-[95vw] bg-[#3E2723]/90 backdrop-blur-md rounded-2xl p-5 text-[#FFF8E1] shadow-2xl border border-[#5D4037]/50"
      id="clue-panel"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#FF8F00]" />
          <span className="text-sm font-semibold text-[#FFCC80]">线索分析</span>
          <span className="text-xs text-[#8D6E63]">
            ({viewedClues.length}/{clues.length} 已查看)
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[#8D6E63] hover:text-[#FFF8E1] transition-colors"
        >
          收起
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {clues.map((clue) => {
          const isViewed = viewedClues.includes(clue.id);
          const isSelected = selectedClueId === clue.id;
          
          return (
            <motion.button
              key={clue.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onClueClick(clue.id)}
              className={`p-3 rounded-xl text-left transition-all ${
                isSelected
                  ? 'bg-[#FF8F00]/30 border-2 border-[#FF8F00]'
                  : isViewed
                  ? 'bg-[#5D4037]/30 border border-[#5D4037]/50 opacity-70'
                  : 'bg-[#4E342E]/50 border border-[#5D4037]/50 hover:border-[#8D6E63]'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{typeIcons[clue.type]}</span>
                <div className="flex-1">
                  <p className="text-xs text-[#8D6E63]">{typeLabels[clue.type]}</p>
                </div>
                {clue.importance >= 4 && (
                  <AlertTriangle className="w-4 h-4 text-[#FF5722]" />
                )}
                {isViewed && <Eye className="w-4 h-4 text-[#66BB6A]" />}
              </div>
              <p className="text-sm font-semibold text-[#FFF8E1] mb-1">{clue.title}</p>
              <p className="text-xs text-[#A1887F] line-clamp-2">{clue.content}</p>
            </motion.button>
          );
        })}
      </div>

      {selectedClue && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-4 pt-4 border-t border-[#5D4037]/50"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FFCC80]/20 flex items-center justify-center text-3xl">
              {typeIcons[selectedClue.type]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#5D4037] text-[#FFCC80]">
                  {typeLabels[selectedClue.type]}
                </span>
                {selectedClue.importance >= 4 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#FF5722]/20 text-[#FF8A65]">
                    重要
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-[#FFF8E1] mb-2">{selectedClue.title}</h3>
              <p className="text-[#D7CCC8] leading-relaxed">{selectedClue.content}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
