import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ArrowRight, CheckCircle2, XCircle, 
  Clock, Tag, AlertCircle, Lightbulb, Trophy
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export default function QuestionPanel() {
  const {
    getCurrentChapter,
    getCurrentAssignment,
    getCurrentQuestion,
    currentQuestionIndex,
    selectedAnswers,
    showResult,
    isCorrect,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    prevQuestion,
    selectAssignment
  } = useGameStore();

  const [timeElapsed, setTimeElapsed] = useState(0);
  const chapter = getCurrentChapter();
  const assignment = getCurrentAssignment();
  const question = getCurrentQuestion();

  useEffect(() => {
    if (!showResult && question) {
      setTimeElapsed(0);
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentQuestionIndex, showResult, question]);

  if (!chapter || !assignment || !question) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl">请从左侧选择一个作业任务开始</p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const typeLabels: Record<string, string> = {
    single: '单选题',
    multiple: '多选题',
    schedule: '排程题'
  };

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    hard: 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  const isLastQuestion = currentQuestionIndex === assignment.questions.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col p-8 overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => selectAssignment('')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回作业列表
        </button>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-5 h-5" />
            <span className="font-mono text-lg">{formatTime(timeElapsed)}</span>
          </div>

          <div className="px-4 py-2 rounded-full glass">
            <span className="text-gray-400">进度: </span>
            <span className="text-white font-bold">
              {currentQuestionIndex + 1} / {assignment.questions.length}
            </span>
          </div>
        </div>
      </div>

      <div className="h-2 bg-gray-700 rounded-full mb-8 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((currentQuestionIndex + 1) / assignment.questions.length) * 100}%` }}
          className="h-full rounded-full"
          style={{ backgroundColor: chapter.color }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex-1"
        >
          <div className="flex flex-wrap gap-3 mb-6">
            <span className={`px-3 py-1 rounded-full text-sm border ${difficultyColors[question.difficulty]}`}>
              {question.difficulty === 'easy' ? '简单' : question.difficulty === 'medium' ? '中等' : '困难'}
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {typeLabels[question.type]}
            </span>
            {question.tags.map((tag, i) => (
              <span key={i} className="px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            <span className="px-3 py-1 rounded-full text-sm bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              {question.points} 分
            </span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4 leading-relaxed">
            {question.title}
          </h2>
          <p className="text-gray-400 text-lg mb-8">{question.description}</p>

          {question.type === 'multiple' && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              这是一道多选题，请选择所有正确答案
            </div>
          )}

          <div className="grid gap-4 mb-8">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswers.includes(index);
              const isCorrectAnswer = Array.isArray(question.correctAnswer)
                ? question.correctAnswer.includes(index)
                : question.correctAnswer === index;

              let optionStyle = 'border-gray-600 bg-gray-800/50 hover:border-gray-500';
              if (showResult) {
                if (isCorrectAnswer) {
                  optionStyle = 'border-green-500 bg-green-500/20';
                } else if (isSelected && !isCorrectAnswer) {
                  optionStyle = 'border-red-500 bg-red-500/20';
                }
              } else if (isSelected) {
                optionStyle = 'border-primary bg-primary/20';
              }

              return (
                <motion.button
                  key={index}
                  whileHover={!showResult ? { scale: 1.01 } : {}}
                  whileTap={!showResult ? { scale: 0.99 } : {}}
                  onClick={() => selectAnswer(index)}
                  disabled={showResult}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${optionStyle} ${
                    showResult ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      showResult
                        ? isCorrectAnswer
                          ? 'border-green-500 bg-green-500/20'
                          : isSelected
                          ? 'border-red-500 bg-red-500/20'
                          : 'border-gray-600'
                        : isSelected
                        ? 'border-primary bg-primary'
                        : 'border-gray-500'
                    }`}>
                      {showResult ? (
                        isCorrectAnswer ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : isSelected ? (
                          <XCircle className="w-5 h-5 text-red-400" />
                        ) : (
                          <span className="text-gray-500">{String.fromCharCode(65 + index)}</span>
                        )
                      ) : (
                        <span className={isSelected ? 'text-white' : 'text-gray-400'}>
                          {String.fromCharCode(65 + index)}
                        </span>
                      )}
                    </div>
                    <span className={`text-lg ${
                      showResult && isCorrectAnswer ? 'text-green-300' : 'text-gray-200'
                    }`}>
                      {option}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-2xl mb-8 ${
                  isCorrect
                    ? 'bg-green-500/10 border-2 border-green-500/30'
                    : 'bg-red-500/10 border-2 border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  {isCorrect ? (
                    <CheckCircle2 className="w-12 h-12 text-green-400" />
                  ) : (
                    <XCircle className="w-12 h-12 text-red-400" />
                  )}
                  <div>
                    <h3 className={`text-2xl font-bold ${
                      isCorrect ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {isCorrect ? '回答正确！' : '回答错误'}
                    </h3>
                    {isCorrect && (
                      <p className="text-yellow-400 flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        获得 {question.points} 分
                      </p>
                    )}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-black/20">
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    解析
                  </h4>
                  <p className="text-gray-300">{question.explanation}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-700">
        <button
          onClick={prevQuestion}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          上一题
        </button>

        {!showResult ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={submitAnswer}
            disabled={selectedAnswers.length === 0}
            className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ 
              backgroundColor: selectedAnswers.length > 0 ? chapter.color : '#4b5563',
              color: 'white'
            }}
          >
            提交答案
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextQuestion}
            className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all"
            style={{ backgroundColor: chapter.color }}
          >
            {isLastQuestion ? '完成作业' : '下一题'}
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
