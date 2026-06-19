import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, ListOrdered, BarChart3, BookOpen, Wrench, Sparkles } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { levels as defaultLevels } from '@/data/levels';
import type { Level } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.3,
    },
  },
};

const titleVariants = {
  hidden: { opacity: 0, y: -60, scale: 0.85 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 14,
      mass: 0.9,
    },
  },
};

const subtitleVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.5,
      duration: 0.7,
      ease: 'easeOut',
    },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, x: -80, scale: 0.8 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 16,
    },
  },
  hover: {
    scale: 1.04,
    x: 8,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 18,
    },
  },
  tap: {
    scale: 0.96,
    transition: { duration: 0.1 },
  },
};

const menuItems = [
  {
    key: 'start',
    label: '开始游戏',
    sublabel: '快速进入最近关卡',
    icon: Play,
    to: '/levels',
    gradient: 'from-orange-500 to-amber-500',
    border: 'border-orange-400/40',
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-400',
  },
  {
    key: 'levels',
    label: '关卡选择',
    sublabel: '5个难度级别等你挑战',
    icon: ListOrdered,
    to: '/levels',
    gradient: 'from-sky-500 to-cyan-500',
    border: 'border-sky-400/40',
    iconBg: 'bg-sky-500/20',
    iconColor: 'text-sky-400',
  },
  {
    key: 'stats',
    label: '统计中心',
    sublabel: '查看你的维修战绩',
    icon: BarChart3,
    to: '/stats',
    gradient: 'from-emerald-500 to-teal-500',
    border: 'border-emerald-400/40',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  {
    key: 'guide',
    label: '操作说明',
    sublabel: '新手必读的调度指南',
    icon: BookOpen,
    to: '/guide',
    gradient: 'from-violet-500 to-purple-500',
    border: 'border-violet-400/40',
    iconBg: 'bg-violet-500/20',
    iconColor: 'text-violet-400',
  },
];

export default function MainMenu() {
  const navigate = useNavigate();
  const { levels, gameRecords } = useGameStore();

  useEffect(() => {
    if (levels.length === 0) {
      defaultLevels.forEach((l: Level) => {
        useGameStore.getState().loadLevelData(l, [], [], [], []);
      });
    }
  }, [levels.length]);

  const totalStars = levels.reduce((sum: number, l: Level) => sum + l.bestStars, 0);
  const totalGames = gameRecords.length;
  const unlockedCount = levels.filter((l: Level) => l.unlocked).length;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0F172A]">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(249,115,22,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.4) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="pointer-events-none absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-orange-500/20 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-sky-500/15 blur-[160px]" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-slate-500/10 blur-[120px]" />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0F172A]/95" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex w-full max-w-2xl flex-col items-center"
        >
          <motion.div
            variants={titleVariants}
            className="mb-4 flex items-center gap-4"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 blur-xl opacity-50" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-2xl shadow-orange-500/40 ring-1 ring-orange-300/30">
                <Wrench className="h-9 w-9 text-white drop-shadow" strokeWidth={2.2} />
              </div>
            </div>
          </motion.div>

          <motion.h1
            variants={titleVariants}
            className="relative mb-3 text-center text-5xl font-black tracking-tight text-white sm:text-6xl"
          >
            <span className="bg-gradient-to-r from-white via-orange-100 to-orange-300 bg-clip-text text-transparent">
              汽车维修工位调度大师
            </span>
            <div className="absolute -bottom-2 left-1/2 h-[3px] w-3/4 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
          </motion.h1>

          <motion.p
            variants={subtitleVariants}
            className="mb-2 max-w-xl text-center text-base text-slate-400 sm:text-lg"
          >
            精准调度每一个工位，完美修复每一辆座驾
          </motion.p>

          <motion.div
            variants={subtitleVariants}
            className="mb-10 flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-800/40 px-4 py-2 backdrop-blur"
          >
            <Sparkles className="h-4 w-4 text-orange-400" />
            <span className="text-sm text-slate-300">
              已解锁 <span className="font-bold text-orange-400">{unlockedCount}</span>/{levels.length} 关
              <span className="mx-2 text-slate-600">|</span>
              累计 <span className="font-bold text-amber-400">{totalStars}</span> ⭐
              <span className="mx-2 text-slate-600">|</span>
              游戏 <span className="font-bold text-sky-400">{totalGames}</span> 场
            </span>
          </motion.div>

          <div className="grid w-full gap-4 sm:grid-cols-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.key}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => navigate(item.to)}
                  className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border ${item.border} bg-slate-800/60 p-5 text-left backdrop-blur-xl transition-all hover:bg-slate-800/80`}
                >
                  <div
                    className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${item.gradient}`}
                  />

                  <div
                    className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${item.iconBg} ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon
                      className={`h-7 w-7 ${item.iconColor} transition-transform duration-300 group-hover:rotate-6`}
                      strokeWidth={2}
                    />
                  </div>

                  <div className="flex flex-1 flex-col">
                    <span className="text-lg font-bold text-white transition-colors group-hover:text-orange-200">
                      {item.label}
                    </span>
                    <span className="text-xs text-slate-400 sm:text-sm">
                      {item.sublabel}
                    </span>
                  </div>

                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${item.gradient} opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2`}
                  >
                    <Play className="h-4 w-4 text-white" fill="currentColor" />
                  </div>
                </motion.button>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="mt-10 flex items-center gap-3 text-xs text-slate-500"
          >
            <div className="h-px w-12 bg-slate-700" />
            <span>v1.0.0 · 工业调度模拟系统</span>
            <div className="h-px w-12 bg-slate-700" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
