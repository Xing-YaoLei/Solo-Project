import { motion, AnimatePresence } from 'framer-motion';
import { Box, CheckCircle2, Loader } from 'lucide-react';

interface LoadingScreenProps {
  progress: number;
  resources: { id: string; name: string; loaded: boolean }[];
  isLoading: boolean;
  levelName?: string;
}

export function LoadingScreen({ progress, resources, isLoading, levelName }: LoadingScreenProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950"
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/50 to-amber-950/30" />
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-amber-500/30 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.2, 0.8, 0.2],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="relative z-10 flex flex-col items-center w-full max-w-md px-6"
          >
            <motion.div
              animate={{
                rotate: [0, 5, -5, 0],
                y: [0, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="mb-6"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/30">
                <Box className="w-10 h-10 text-slate-900" strokeWidth={2.5} />
              </div>
            </motion.div>

            {levelName && (
              <motion.h2
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold text-white mb-1 tracking-wide"
              >
                {levelName}
              </motion.h2>
            )}

            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-slate-400 mb-8"
            >
              正在加载场馆资源...
            </motion.p>

            <div className="w-full mb-2">
              <div className="flex items-end justify-between mb-2">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <Loader className="w-4 h-4 text-amber-500 animate-spin" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">加载中</span>
                </motion.div>
                <motion.span
                  key={progress}
                  initial={{ scale: 1.2, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl font-bold font-mono bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent"
                >
                  {progress}%
                </motion.span>
              </div>

              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            </div>

            <div className="w-full mt-6 space-y-2">
              {resources.map((resource, idx) => (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-800/50"
                >
                  <div className="flex items-center gap-2">
                    <AnimatePresence mode="wait">
                      {resource.loaded ? (
                        <motion.div
                          key="done"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="loading"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Loader className="w-4 h-4 text-amber-500" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <span className={`text-xs ${resource.loaded ? 'text-emerald-300' : 'text-slate-400'}`}>
                      {resource.name}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono ${resource.loaded ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {resource.loaded ? 'OK' : '...'}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
