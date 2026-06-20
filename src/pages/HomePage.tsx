import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Dumbbell, ChevronRight, Box, Keyboard, Hand, Gamepad2, Sparkles } from 'lucide-react';
import { useProgressStore } from '../store/progressStore';
import { LEVELS } from '../data/levels';
import type { PlayMode } from '../types';

export function HomePage() {
  const navigate = useNavigate();
  const { getCompletedLevels, getProgress } = useProgressStore();
  const completedIds = getCompletedLevels();
  const totalCompleted = completedIds.length;
  const totalLevels = LEVELS.length;
  const bestScore = LEVELS.reduce((max, l) => Math.max(max, getProgress(l.id).bestScore), 0);

  const handleSelectMode = (mode: PlayMode) => {
    useProgressStore.getState().setSelectedMode(mode);
    navigate('/levels');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/80 to-indigo-950/40" />
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0) 60%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.6, 0.9, 0.6],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-amber-400/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 min-h-screen flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-16"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, repeatDelay: 2 }}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/30"
            >
              <Box className="w-6 h-6 text-slate-900" strokeWidth={2.5} />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">SeatMaster</h1>
              <p className="text-xs text-slate-500">场馆票务调度训练系统</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs text-slate-400">
            <div className="text-center">
              <div className="text-xl font-bold text-white font-mono">{totalCompleted}/{totalLevels}</div>
              <div>已通关</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center">
              <div className="text-xl font-bold text-amber-400 font-mono">{bestScore.toLocaleString()}</div>
              <div>最高分</div>
            </div>
          </div>
        </motion.div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-center mb-16 max-w-3xl"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3D沉浸式训练 · 真实场景模拟</span>
            </motion.div>

            <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
                座位分配调度
              </span>
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                解谜训练
              </span>
            </h2>

            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              在逼真的3D场馆场景中，合理分配座位资源、处理锁座冲突、应对退票争议，
              <br className="hidden md:block" />
              成为顶尖的<span className="text-amber-400 font-medium">场馆运营经理</span>。
            </p>
          </motion.div>

          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
            <motion.button
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleSelectMode('FORMAL')}
              className="group relative text-left p-6 rounded-3xl overflow-hidden border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-slate-900/90 to-slate-900/70 hover:border-amber-500/60 transition-all"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/30">
                    <GraduationCap className="w-7 h-7 text-slate-900" strokeWidth={2.3} />
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                    推荐
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">正式训练</h3>
                <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                  完整评分机制，记录最佳成绩，解锁进阶关卡。
                  挑战最优上座率和收益目标。
                </p>
                <div className="flex items-center gap-2 text-amber-400 font-medium text-sm">
                  <span>开始训练</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleSelectMode('PRACTICE')}
              className="group relative text-left p-6 rounded-3xl overflow-hidden border-2 border-slate-700/60 bg-gradient-to-br from-slate-800/80 via-slate-900/90 to-slate-900/70 hover:border-slate-600 hover:border-emerald-500/30 transition-all"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600/60 group-hover:from-emerald-600/30 group-hover:to-emerald-700/30 transition-all">
                    <Dumbbell className="w-7 h-7 text-slate-300 group-hover:text-emerald-400 transition-colors" strokeWidth={2} />
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-slate-700/40 border border-slate-600/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    无压力
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">自由练习</h3>
                <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                  自由选择任意关卡练习，不计入成绩排名。
                  可随时重选、重置，熟悉规则和操作。
                </p>
                <div className="flex items-center gap-2 text-slate-300 group-hover:text-emerald-400 font-medium text-sm transition-colors">
                  <span>开始练习</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="w-full max-w-4xl"
          >
            <div className="text-center mb-6">
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-1">操作指引</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700/50">
                    <Keyboard className="w-4.5 h-4.5 text-sky-400" />
                  </div>
                  <span className="text-sm font-bold text-white">键盘操作</span>
                </div>
                <div className="space-y-1 text-xs text-slate-400">
                  <div>鼠标拖动: 旋转视角</div>
                  <div>滚轮: 缩放远近</div>
                  <div>1-4 数字键: 切换阶段</div>
                  <div>空格: 确认操作</div>
                  <div>R: 重置视角</div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700/50">
                    <Hand className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                  <span className="text-sm font-bold text-white">触屏操作</span>
                </div>
                <div className="space-y-1 text-xs text-slate-400">
                  <div>单指滑动: 旋转视角</div>
                  <div>双指捏合: 缩放远近</div>
                  <div>点击座位: 选中/取消</div>
                  <div>双击: 重置视角</div>
                  <div>长按: 查看座位详情</div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700/50">
                    <Gamepad2 className="w-4.5 h-4.5 text-amber-400" />
                  </div>
                  <span className="text-sm font-bold text-white">游戏流程</span>
                </div>
                <div className="space-y-1 text-xs text-slate-400">
                  <div>① 观察票种分区规则</div>
                  <div>② 处理锁座分配记录</div>
                  <div>③ 核销入场并处理争议</div>
                  <div>④ 复盘分析上座率变化</div>
                  <div>可回退决策，反复演练</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs text-slate-600 pt-8"
        >
          © SeatMaster 训练系统 · 为场馆运营人员打造
        </motion.div>
      </div>
    </div>
  );
}
