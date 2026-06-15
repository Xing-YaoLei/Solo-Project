import { ClipboardCheck, FileCheck, FileX, AlertTriangle, CheckCircle, PlusCircle } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import { getLevelById, getStudentById, getMaterialsByStudentId } from '../../data/levels';
import { getMaterialTypeName } from '../../utils/helpers';

interface MaterialPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MaterialPanel({ isOpen, onClose }: MaterialPanelProps) {
  const {
    selectedStudentId,
    currentLevelId,
    checkMaterials,
    showMissingModal,
    resolveMissingMaterial,
    completeStudentReview,
    completedStudents,
  } = useGameStore();
  const level = currentLevelId ? getLevelById(currentLevelId) : null;
  const selectedStudent = selectedStudentId && level ? getStudentById(level, selectedStudentId) : null;
  const studentMaterials = selectedStudentId && level ? getMaterialsByStudentId(level, selectedStudentId) : null;

  const handleCheck = () => {
    if (selectedStudentId) {
      const complete = checkMaterials(selectedStudentId);
      if (!complete) {
        showMissingModal(selectedStudentId);
      }
    }
  };

  const handleResolveMaterial = (materialId: string) => {
    if (selectedStudentId) {
      resolveMissingMaterial(selectedStudentId, materialId);
    }
  };

  const handleCompleteReview = () => {
    if (selectedStudentId) {
      completeStudentReview(selectedStudentId);
    }
  };

  if (!level) return null;

  const requiredCount = studentMaterials?.materials.filter((m) => m.required).length || 0;
  const submittedCount = studentMaterials?.materials.filter((m) => m.required && m.submitted).length || 0;
  const allComplete = requiredCount > 0 && submittedCount === requiredCount;
  const isCompleted = selectedStudentId ? completedStudents.includes(selectedStudentId) : false;
  const canComplete = allComplete && !isCompleted && selectedStudent?.hasApplied;

  return (
    <div
      className={`absolute top-24 right-4 z-20 transition-all duration-300 ${
        isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-stone-900/90 backdrop-blur-lg rounded-2xl border border-stone-700/50 shadow-2xl w-80 overflow-hidden">
        <div className="p-4 border-b border-stone-700/50 bg-gradient-to-r from-amber-900/30 to-transparent">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-100 font-serif flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-amber-400" />
              申请材料
            </h2>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-200 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-stone-400 text-sm mt-1">阶段三：审核申请材料</p>
        </div>

        <div className="p-3 max-h-96 overflow-y-auto">
          {!selectedStudent ? (
            <div className="text-center py-8 text-stone-500">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>请选择一位学生查看材料</p>
            </div>
          ) : !studentMaterials ? (
            <div className="text-center py-8 text-stone-500">
              <p>暂无该学生的申请材料</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-stone-800/50 rounded-xl">
                <div className="text-3xl">{selectedStudent.avatar}</div>
                <div>
                  <p className="font-semibold text-stone-100">{selectedStudent.name}</p>
                  <p className="text-stone-400 text-sm">{selectedStudent.studentId}</p>
                </div>
                <div className="ml-auto">
                  {isCompleted ? (
                    <span className="px-2 py-1 bg-violet-500/20 text-violet-400 text-xs rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      已完成
                    </span>
                  ) : allComplete ? (
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full flex items-center gap-1">
                      <FileCheck className="w-3 h-3" />
                      材料齐全
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      材料缺失
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-stone-800/30 p-3 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-stone-400 text-sm">材料进度</span>
                  <span className="text-stone-200 text-sm font-mono">
                    {submittedCount} / {requiredCount} (必填)
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      allComplete ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${requiredCount > 0 ? (submittedCount / requiredCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-stone-400 text-sm font-medium">材料清单</p>
                {studentMaterials.materials.map((material) => (
                  <div
                    key={material.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      material.submitted
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : material.required
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-stone-800/30 border-stone-700/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {material.submitted ? (
                        <FileCheck className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <FileX className={`w-5 h-5 ${material.required ? 'text-red-400' : 'text-stone-500'}`} />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${material.submitted ? 'text-stone-200' : material.required ? 'text-red-300' : 'text-stone-400'}`}>
                          {getMaterialTypeName(material.type)}
                        </p>
                        <p className="text-xs text-stone-500">
                          {material.name}
                          {material.required && <span className="text-red-400 ml-1">*必填</span>}
                          {!material.required && <span className="text-stone-500 ml-1">(选填)</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          material.submitted
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : material.required
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-stone-600/30 text-stone-400'
                        }`}
                      >
                        {material.submitted ? '已提交' : '未提交'}
                      </span>
                      {!material.submitted && material.required && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResolveMaterial(material.id);
                          }}
                          className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-all hover:scale-105"
                          title="补全材料"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {!selectedStudent?.hasApplied ? (
                <div className="p-4 bg-stone-700/30 rounded-xl text-center">
                  <p className="text-stone-400">该学生未提交复核申请</p>
                  <p className="text-stone-500 text-sm mt-1">无需审核材料</p>
                </div>
              ) : isCompleted ? (
                <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-xl text-center">
                  <CheckCircle className="w-8 h-8 text-violet-400 mx-auto mb-2" />
                  <p className="text-violet-300 font-medium">该学生审核已完成</p>
                  <p className="text-stone-500 text-sm mt-1">+20 分已获得</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleCheck}
                    className={`w-full py-3 rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      allComplete
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg shadow-amber-500/20'
                    }`}
                  >
                    {allComplete ? '✓ 审核通过' : '检查材料完整性'}
                  </button>
                  
                  {canComplete && (
                    <button
                      onClick={handleCompleteReview}
                      className="w-full py-3 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      完成评分 (+20 分)
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
