import { Clock, Trophy, Users, FileText, ClipboardCheck, CheckSquare, Keyboard } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import { formatTime, getPhaseName, getPhaseColor } from '../../utils/helpers';
import { getLevelById } from '../../data/levels';

export default function HUD() {
  const { score, timeRemaining, currentPhase, reviewedStudents, currentLevelId, scoredStudents, completedStudents } = useGameStore();
  const level = currentLevelId ? getLevelById(currentLevelId) : null;
  
  const appliedStudentsCount = level?.students.filter((s) => s.hasApplied).length || 0;

  const phaseColor = getPhaseColor(currentPhase);
  const isLowTime = timeRemaining < 30;

  return (
    <div className="absolute top-0 left-0 right-0 z-10 p-4 pointer-events-none">
      <div className="flex justify-between items-start max-w-6xl mx-auto">
        <div className="bg-stone-900/80 backdrop-blur-md rounded-xl p-4 border border-stone-700/50 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-stone-400 text-xs uppercase tracking-wider">得分</p>
              <p className="text-2xl font-bold text-amber-400 font-serif">{score}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isLowTime ? 'bg-red-500/30 animate-pulse' : 'bg-sky-500/20'}`}>
              <Clock className={`w-5 h-5 ${isLowTime ? 'text-red-400' : 'text-sky-400'}`} />
            </div>
            <div>
              <p className="text-stone-400 text-xs uppercase tracking-wider">剩余时间</p>
              <p className={`text-xl font-bold font-mono ${isLowTime ? 'text-red-400' : 'text-stone-100'}`}>
                {formatTime(timeRemaining)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-stone-900/80 backdrop-blur-md rounded-xl p-4 border border-stone-700/50 shadow-xl">
          <div className="text-center mb-2">
            <p className="text-stone-400 text-xs uppercase tracking-wider">当前阶段</p>
            <p 
              className="text-xl font-bold font-serif"
              style={{ color: phaseColor }}
            >
              {getPhaseName(currentPhase)}
            </p>
          </div>
          <div className="flex gap-1 justify-center">
            {['observe', 'transcript', 'application', 'complete'].map((phase, index) => {
              const phases = ['observe', 'transcript', 'application', 'complete'];
              const currentIndex = phases.indexOf(currentPhase);
              const isActive = index <= currentIndex;
              return (
                <div
                  key={phase}
                  className={`w-8 h-1.5 rounded-full transition-all duration-500 ${
                    isActive ? '' : 'bg-stone-700'
                  }`}
                  style={{ backgroundColor: isActive ? getPhaseColor(phase as any) : undefined }}
                />
              );
            })}
          </div>
        </div>

        <div className="bg-stone-900/80 backdrop-blur-md rounded-xl p-4 border border-stone-700/50 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-stone-400 text-xs uppercase tracking-wider">已查看学生</p>
              <p className="text-xl font-bold text-stone-100 font-mono">
                {reviewedStudents.length} / {level?.students.length || 0}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-sky-500/20">
              <ClipboardCheck className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <p className="text-stone-400 text-xs uppercase tracking-wider">已评分</p>
              <p className="text-xl font-bold text-stone-100 font-mono">
                {scoredStudents.length} / {level?.students.length || 0}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/20">
              <CheckSquare className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-stone-400 text-xs uppercase tracking-wider">已完成审核</p>
              <p className="text-xl font-bold text-stone-100 font-mono">
                {completedStudents.length} / {appliedStudentsCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-4">
            <button
              onClick={() => useGameStore.getState().prevPhase()}
              className="px-6 py-3 bg-stone-800/90 hover:bg-stone-700/90 text-stone-200 rounded-lg border border-stone-600/50 backdrop-blur-md transition-all hover:scale-105 active:scale-95 font-medium"
            >
              ← 上一阶段
              <span className="ml-2 text-xs text-stone-400">[Q]</span>
            </button>
            <button
              onClick={() => useGameStore.getState().nextPhase()}
              className="px-6 py-3 bg-amber-600/90 hover:bg-amber-500/90 text-white rounded-lg border border-amber-500/50 backdrop-blur-md transition-all hover:scale-105 active:scale-95 font-medium shadow-lg shadow-amber-500/20"
            >
              下一阶段 →
              <span className="ml-2 text-xs text-amber-200">[E]</span>
            </button>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-stone-500 bg-stone-900/60 px-4 py-2 rounded-full backdrop-blur-sm">
            <span className="flex items-center gap-1">
              <Keyboard className="w-3.5 h-3.5" />
              快捷键:
            </span>
            <span><kbd className="px-1.5 py-0.5 bg-stone-700/50 rounded text-stone-300">Space</kbd> 暂停</span>
            <span><kbd className="px-1.5 py-0.5 bg-stone-700/50 rounded text-stone-300">Tab</kbd> 切换学生</span>
            <span><kbd className="px-1.5 py-0.5 bg-stone-700/50 rounded text-stone-300">Enter</kbd> 确认</span>
            <span><kbd className="px-1.5 py-0.5 bg-stone-700/50 rounded text-stone-300">R</kbd> 补全材料</span>
            <span><kbd className="px-1.5 py-0.5 bg-stone-700/50 rounded text-stone-300">F</kbd> 完成评分</span>
          </div>
        </div>
      </div>
    </div>
  );
}
