import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Clock, Star, ChevronRight, Lock } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export default function AssignmentPanel() {
  const { getCurrentChapter, currentAssignmentId, selectAssignment } = useGameStore();
  const chapter = getCurrentChapter();

  if (!chapter) return null;

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    hard: 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  const typeLabels: Record<string, string> = {
    single: '单选题',
    multiple: '多选题',
    schedule: '排程题'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-80 h-full glass-dark rounded-r-2xl p-6 flex flex-col gap-6 overflow-y-auto"
    >
      <div>
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ backgroundColor: `${chapter.color}30` }}
        >
          <BookOpen className="w-6 h-6" style={{ color: chapter.color }} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{chapter.title}</h2>
        <p className="text-gray-400 text-sm">{chapter.description}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">学习进度</div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${chapter.progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full"
              style={{ backgroundColor: chapter.color }}
            />
          </div>
        </div>
        <span className="text-lg font-bold" style={{ color: chapter.color }}>
          {chapter.progress}%
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          作业任务
        </h3>

        {chapter.assignments.map((assignment, index) => (
          <motion.div
            key={assignment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => !assignment.completed && selectAssignment(assignment.id)}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
              currentAssignmentId === assignment.id
                ? 'border-primary bg-primary/10'
                : assignment.completed
                ? 'border-green-500/30 bg-green-500/5'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-white">{assignment.title}</h4>
                  {assignment.completed && (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  )}
                </div>
                <p className="text-gray-400 text-sm mt-1">{assignment.description}</p>
              </div>
              {!assignment.completed && (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
              {assignment.completed && (
                <Lock className="w-5 h-5 text-green-500" />
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {assignment.questions.map((q, i) => (
                <span
                  key={i}
                  className={`px-2 py-1 text-xs rounded border ${difficultyColors[q.difficulty]}`}
                >
                  {typeLabels[q.type]}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{assignment.questions.length} 题</span>
              </div>
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="w-4 h-4" />
                <span>{assignment.totalPoints} 分</span>
              </div>
              {assignment.completed && (
                <div className="text-green-400">
                  得分: {assignment.score}/{assignment.totalPoints}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
