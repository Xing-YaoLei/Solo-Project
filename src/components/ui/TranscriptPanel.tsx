import { FileText, Award, TrendingUp, CheckCircle } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import { getLevelById, getStudentById, getTranscriptByStudentId } from '../../data/levels';

interface TranscriptPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TranscriptPanel({ isOpen, onClose }: TranscriptPanelProps) {
  const { selectedStudentId, currentLevelId, scoredStudents, submitScore } = useGameStore();
  const level = currentLevelId ? getLevelById(currentLevelId) : null;
  const selectedStudent = selectedStudentId && level ? getStudentById(level, selectedStudentId) : null;
  const transcript = selectedStudentId && level ? getTranscriptByStudentId(level, selectedStudentId) : null;
  const isScored = selectedStudentId ? scoredStudents.includes(selectedStudentId) : false;

  const handleScore = () => {
    if (selectedStudentId && transcript && !isScored) {
      const gpaScore = Math.round(transcript.gpa * 20);
      submitScore(selectedStudentId, gpaScore);
    }
  };

  if (!level) return null;

  return (
    <div
      className={`absolute top-24 right-4 z-20 transition-all duration-300 ${
        isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-stone-900/90 backdrop-blur-lg rounded-2xl border border-stone-700/50 shadow-2xl w-80 overflow-hidden">
        <div className="p-4 border-b border-stone-700/50 bg-gradient-to-r from-sky-900/30 to-transparent">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-100 font-serif flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-400" />
              成绩单
            </h2>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-200 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-stone-400 text-sm mt-1">阶段二：处理学生成绩</p>
        </div>

        <div className="p-3 max-h-96 overflow-y-auto">
          {!selectedStudent ? (
            <div className="text-center py-8 text-stone-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>请选择一位学生查看成绩单</p>
            </div>
          ) : !transcript ? (
            <div className="text-center py-8 text-stone-500">
              <p>暂无该学生的成绩单</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-stone-800/50 rounded-xl">
                <div className="text-3xl">{selectedStudent.avatar}</div>
                <div>
                  <p className="font-semibold text-stone-100">{selectedStudent.name}</p>
                  <p className="text-stone-400 text-sm">{selectedStudent.studentId}</p>
                </div>
                {isScored && (
                  <div className="ml-auto">
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      已评分
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 p-3 rounded-xl border border-amber-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-stone-400 text-xs">GPA</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-400 font-serif">{transcript.gpa}</p>
                </div>
                <div className="bg-gradient-to-br from-sky-500/20 to-sky-600/10 p-3 rounded-xl border border-sky-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-sky-400" />
                    <span className="text-stone-400 text-xs">排名</span>
                  </div>
                  <p className="text-2xl font-bold text-sky-400 font-serif">#{transcript.rank}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-stone-400 text-sm font-medium">课程成绩</p>
                <div className="space-y-2">
                  {transcript.courses.map((course) => (
                    <div
                      key={course.courseId}
                      className="flex items-center justify-between p-2 bg-stone-800/30 rounded-lg"
                    >
                      <div>
                        <p className="text-stone-200 text-sm">{course.courseName}</p>
                        <p className="text-stone-500 text-xs">{course.credits} 学分</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            course.score >= 90
                              ? 'text-emerald-400'
                              : course.score >= 80
                              ? 'text-sky-400'
                              : course.score >= 60
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}
                        >
                          {course.score}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {!isScored && (
                <button
                  onClick={handleScore}
                  className="w-full py-3 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-sky-500/20"
                >
                  确认评分 (+{Math.round(transcript.gpa * 20)} 分)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
