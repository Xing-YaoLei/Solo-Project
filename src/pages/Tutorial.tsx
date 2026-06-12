import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  CheckCircle,
  BookOpen,
  Coffee,
  Target,
  FileText,
  Lightbulb,
  Clock,
  Play,
  BarChart3,
  Users,
} from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import tutorialConfig from '@/config/tutorials/tutorial-1.json';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  position: string;
  targetElement?: string;
}

const stepIcons: Record<string, React.ElementType> = {
  'step-1': Coffee,
  'step-2': Target,
  'step-3': FileText,
  'step-4': Lightbulb,
  'step-5': Clock,
  'step-6': Play,
  'step-7': CheckCircle,
};

const stepColors: Record<string, string> = {
  'step-1': 'from-[#FF8F00] to-[#FFB300]',
  'step-2': 'from-[#66BB6A] to-[#81C784]',
  'step-3': 'from-[#42A5F5] to-[#64B5F6]',
  'step-4': 'from-[#AB47BC] to-[#BA68C8]',
  'step-5': 'from-[#FFA726] to-[#FFB74D]',
  'step-6': 'from-[#EF5350] to-[#EF9A9A]',
  'step-7': 'from-[#66BB6A] to-[#81C784]',
};

const tips = [
  {
    icon: Target,
    title: '仔细阅读任务',
    description: '每个任务都有明确的目标和时间限制，确保你理解要解决的问题。',
  },
  {
    icon: FileText,
    title: '分析所有线索',
    description: '重要线索会有红色标记，确保查看所有线索后再做决策。',
  },
  {
    icon: Users,
    title: '了解会员',
    description: '点击会员头像可以查看完整的会员档案，包括消费记录和权益信息。',
  },
  {
    icon: Clock,
    title: '注意时间',
    description: '时间会影响得分，快速准确的决策会获得更高评价。',
  },
  {
    icon: Lightbulb,
    title: '从错误中学习',
    description: '每次失败都会保存回放，在会员档案中查看犹豫点分析。',
  },
  {
    icon: BarChart3,
    title: '查看复盘',
    description: '在复盘中心查看详细的数据分析，了解你的薄弱环节。',
  },
];

export default function Tutorial() {
  const navigate = useNavigate();
  const { setTutorialCompleted, isTutorialCompleted, loadPlayer } = usePlayerStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    loadPlayer();
  }, [loadPlayer]);

  const steps = tutorialConfig.steps as TutorialStep[];
  const step = steps[currentStep];
  const StepIcon = stepIcons[step.id] || HelpCircle;
  const colorClass = stepColors[step.id] || 'from-[#FF8F00] to-[#FFB300]';

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setTutorialCompleted(true);
      navigate('/levels');
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setTutorialCompleted(true);
    navigate('/levels');
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#3E2723] via-[#4E342E] to-[#3E2723] overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#FF8F00]/10"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full h-full flex flex-col p-6">
        <div className="flex items-center justify-between mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass-light hover:bg-[#FFF8E1]/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </motion.button>

          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gradient">游戏教程</h1>
            <BookOpen className="w-7 h-7 text-[#FF8F00]" />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSkip}
            className="text-[#8D6E63] hover:text-[#FFF8E1] transition-colors"
          >
            跳过教程
          </motion.button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-3xl">
            <div className="flex items-center justify-center gap-2 mb-8">
              {steps.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-12 bg-[#FF8F00]'
                      : index < currentStep
                      ? 'w-8 bg-[#66BB6A]'
                      : 'w-8 bg-[#5D4037]'
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="glass-card rounded-3xl p-8"
              >
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center mb-6 shadow-lg`}
                  >
                    <StepIcon className="w-12 h-12 text-[#3E2723]" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="text-sm px-3 py-1 rounded-full bg-[#5D4037] text-[#FFCC80]">
                        第 {currentStep + 1} 步 / 共 {steps.length} 步
                      </span>
                    </div>

                    <h2 className="text-3xl font-bold text-[#FFF8E1] mb-4">{step.title}</h2>
                    <p className="text-lg text-[#D7CCC8] max-w-xl leading-relaxed">
                      {step.content}
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between mt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className={currentStep === 0 ? 'text-[#5D4037]' : 'text-[#FFF8E1]'}>
                  上一步
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTips(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl glass-light hover:bg-[#FFF8E1]/20 transition-colors text-[#8D6E63] hover:text-[#FFF8E1]"
              >
                <HelpCircle className="w-5 h-5" />
                <span>游戏技巧</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className="btn-primary flex items-center gap-2"
              >
                <span>{currentStep === steps.length - 1 ? '开始游戏' : '下一步'}</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        {isTutorialCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-[#66BB6A]"
          >
            <p className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              你已完成教程
            </p>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showTips && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-2xl p-6 w-full max-w-4xl max-h-[85vh] overflow-y-auto scrollbar-thin"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#FFF8E1]">游戏技巧</h2>
                <button
                  onClick={() => setShowTips(false)}
                  className="p-2 rounded-lg hover:bg-[#FFF8E1]/10 transition-colors text-[#8D6E63] hover:text-[#FFF8E1]"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tips.map((tip, index) => (
                  <motion.div
                    key={tip.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-[#4E342E]/50 rounded-xl border border-[#5D4037]/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#FF8F00]/20 flex items-center justify-center flex-shrink-0">
                        <tip.icon className="w-5 h-5 text-[#FF8F00]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#FFF8E1] mb-1">{tip.title}</h3>
                        <p className="text-sm text-[#A1887F]">{tip.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowTips(false)}
                className="w-full mt-6 btn-primary"
              >
                我知道了
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
