import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';
import MainMenu from '@/pages/MainMenu';
import LevelSelect from '@/pages/LevelSelect';
import StatsCenter from '@/pages/StatsCenter';
import Guide from '@/pages/Guide';
import ReviewPage from '@/pages/ReviewPage';

const GameScene = lazy(() => import('@/pages/GameScene'));

function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0F172A]">
      <div className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(249,115,22,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.4) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="pointer-events-none absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-orange-500/20 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-sky-500/15 blur-[160px]" />

      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 2,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
          className="relative mb-6"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 blur-xl opacity-50 animate-pulse-slow" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-2xl shadow-orange-500/40 ring-1 ring-orange-300/30">
            <Wrench className="h-9 w-9 text-white drop-shadow" strokeWidth={2.2} />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 text-2xl font-black tracking-tight"
        >
          <span className="bg-gradient-to-r from-white via-orange-100 to-orange-300 bg-clip-text text-transparent">
            汽车维修工位调度大师
          </span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6 flex items-center gap-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
              className="h-2 w-2 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"
            />
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-slate-400"
        >
          正在加载维修车间…
        </motion.p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<GlobalLoading />}>
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/levels" element={<LevelSelect />} />
          <Route path="/game/:levelId" element={<GameScene />} />
          <Route path="/review/:levelId" element={<ReviewPage />} />
          <Route path="/stats" element={<StatsCenter />} />
          <Route path="/guide" element={<Guide />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
