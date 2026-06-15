import { User, GraduationCap, MapPin, CheckCircle, Circle } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import { getLevelById, getStudentById } from '../../data/levels';

interface StudentPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StudentPanel({ isOpen, onClose }: StudentPanelProps) {
  const { selectedStudentId, currentLevelId, reviewedStudents, selectStudent } = useGameStore();
  const level = currentLevelId ? getLevelById(currentLevelId) : null;
  const selectedStudent = selectedStudentId && level ? getStudentById(level, selectedStudentId) : null;

  if (!level) return null;

  return (
    <div
      className={`absolute top-24 left-4 z-20 transition-all duration-300 ${
        isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-stone-900/90 backdrop-blur-lg rounded-2xl border border-stone-700/50 shadow-2xl w-80 overflow-hidden">
        <div className="p-4 border-b border-stone-700/50 bg-gradient-to-r from-emerald-900/30 to-transparent">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-100 font-serif flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
              学生名单
            </h2>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-200 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-stone-400 text-sm mt-1">阶段一：观察学生信息</p>
        </div>

        <div className="p-3 max-h-96 overflow-y-auto space-y-2">
          {level.students.map((student) => {
            const isReviewed = reviewedStudents.includes(student.id);
            const isSelected = selectedStudentId === student.id;

            return (
              <div
                key={student.id}
                onClick={() => selectStudent(student.id)}
                className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-emerald-600/30 border-emerald-500/50 border'
                    : 'bg-stone-800/50 hover:bg-stone-700/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{student.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-stone-100 truncate">{student.name}</p>
                      {isReviewed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-stone-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-stone-400 text-xs">{student.studentId}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-stone-500" />
                      <span className="text-stone-500 text-xs">{student.major}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        student.hasApplied
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-stone-600/30 text-stone-400'
                      }`}
                    >
                      {student.hasApplied ? '已申请' : '未申请'}
                    </div>
                    <p className="text-stone-500 text-xs mt-1">{student.grade}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedStudent && (
          <div className="p-4 border-t border-stone-700/50 bg-stone-800/30">
            <h3 className="text-sm font-semibold text-stone-300 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              学生详情
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-stone-500 text-xs">姓名</p>
                <p className="text-stone-200">{selectedStudent.name}</p>
              </div>
              <div>
                <p className="text-stone-500 text-xs">学号</p>
                <p className="text-stone-200 font-mono">{selectedStudent.studentId}</p>
              </div>
              <div>
                <p className="text-stone-500 text-xs">专业</p>
                <p className="text-stone-200">{selectedStudent.major}</p>
              </div>
              <div>
                <p className="text-stone-500 text-xs">年级</p>
                <p className="text-stone-200">{selectedStudent.grade}</p>
              </div>
              <div>
                <p className="text-stone-500 text-xs">座位号</p>
                <p className="text-stone-200">#{selectedStudent.seatNumber}</p>
              </div>
              <div>
                <p className="text-stone-500 text-xs">申请状态</p>
                <p className={selectedStudent.hasApplied ? 'text-emerald-400' : 'text-stone-400'}>
                  {selectedStudent.hasApplied ? '已提交申请' : '未提交'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
