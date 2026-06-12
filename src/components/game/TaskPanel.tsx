import { motion } from 'framer-motion';
import { Clock, Target, Trophy, User } from 'lucide-react';
import type { Task } from '@/types/game';
import { getMemberById } from '@/data/mockMembers';
import { formatDuration } from '@/utils/scoring';

interface TaskPanelProps {
  task: Task;
  score: number;
  timeRemaining: number;
  comboCount: number;
  onViewMember: () => void;
}

export function TaskPanel({ task, score, timeRemaining, comboCount, onViewMember }: TaskPanelProps) {
  const member = getMemberById(task.memberId);
  const timePercent = (timeRemaining / task.timeLimit) * 100;
  const isUrgent = timePercent < 25;

  return (
    <motion.div
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -400, opacity: 0 }}
      className="absolute left-4 top-4 w-80 bg-[#3E2723]/90 backdrop-blur-md rounded-2xl p-5 text-[#FFF8E1] shadow-2xl border border-[#5D4037]/50"
      id="task-panel"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#FF8F00]" />
          <span className="text-sm font-semibold text-[#FFCC80]">当前任务</span>
        </div>
        <div className="flex items-center gap-1">
          <Trophy className="w-4 h-4 text-[#FFD54F]" />
          <span className="text-lg font-bold text-[#FFD54F]">{score}</span>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-2 text-[#FFF8E1]">{task.title}</h2>
      <p className="text-sm text-[#D7CCC8] mb-4 leading-relaxed">{task.description}</p>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="flex items-center gap-1">
            <Clock className={`w-3 h-3 ${isUrgent ? 'text-[#FF5722]' : 'text-[#A1887F]'}`} />
            <span className={isUrgent ? 'text-[#FF5722]' : 'text-[#A1887F]'}>
              剩余时间
            </span>
          </span>
          <span className={`font-mono font-bold ${isUrgent ? 'text-[#FF5722]' : 'text-[#FFF8E1]'}`}>
            {formatDuration(timeRemaining)}
          </span>
        </div>
        <div className="h-2 bg-[#4E342E] rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isUrgent ? 'bg-[#FF5722]' : 'bg-[#FF8F00]'}`}
            initial={{ width: '100%' }}
            animate={{ width: `${timePercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {comboCount > 1 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mb-4 p-2 bg-[#FF8F00]/20 rounded-lg text-center"
        >
          <span className="text-[#FF8F00] font-bold">🔥 连击 x{comboCount}</span>
        </motion.div>
      )}

      {member && (
        <button
          onClick={onViewMember}
          className="w-full flex items-center gap-3 p-3 bg-[#4E342E]/50 hover:bg-[#5D4037]/50 rounded-xl transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-[#FFCC80]/20 flex items-center justify-center text-2xl">
            {member.avatar}
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-[#FFF8E1]">{member.name}</p>
            <p className="text-xs text-[#A1887F]">
              Lv.{member.level} · 余额 ¥{member.balance.toFixed(2)}
            </p>
          </div>
          <User className="w-4 h-4 text-[#8D6E63] group-hover:text-[#FFCC80] transition-colors" />
        </button>
      )}

      <div className="mt-4 pt-4 border-t border-[#5D4037]/50">
        <div className="flex items-center justify-between text-xs text-[#8D6E63]">
          <span>任务积分</span>
          <span className="text-[#FFD54F] font-semibold">+{task.points}</span>
        </div>
      </div>
    </motion.div>
  );
}
