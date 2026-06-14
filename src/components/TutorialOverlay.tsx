import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, HelpCircle } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { tutorialSteps } from '../data/gameData';

export default function TutorialOverlay() {
  const { showTutorial, tutorialStep, nextTutorialStep, skipTutorial } = useGameStore();

  if (!showTutorial) return null;

  const currentStep = tutorialSteps[tutorialStep];
  const isLastStep = tutorialStep === tutorialSteps.length - 1;
  const progress = ((tutorialStep + 1) / tutorialSteps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative z-10 max-w-lg w-full mx-4"
        >
          <div className="glass rounded-3xl p-8">
            <button
              onClick={skipTutorial}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-gray-400">
                  引导 {tutorialStep + 1} / {tutorialSteps.length}
                </div>
                <h2 className="text-2xl font-bold text-white">{currentStep.title}</h2>
              </div>
            </div>

            <div className="h-2 bg-gray-700 rounded-full mb-8 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              />
            </div>

            <motion.div
              key={tutorialStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mb-8"
            >
              <p className="text-xl text-gray-300 leading-relaxed">
                {currentStep.description}
              </p>
            </motion.div>

            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {tutorialSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === tutorialStep
                        ? 'w-8 bg-blue-500'
                        : index < tutorialStep
                        ? 'bg-green-500'
                        : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              <div className="flex-1" />

              <button
                onClick={skipTutorial}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                跳过引导
              </button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextTutorialStep}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold"
              >
                {isLastStep ? '开始游戏' : '下一步'}
                {!isLastStep && <ArrowRight className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
