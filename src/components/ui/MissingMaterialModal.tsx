import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, ArrowRight, X, PlusCircle } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import { getLevelById, getStudentById } from '../../data/levels';
import { getMaterialTypeName } from '../../utils/helpers';

export default function MissingMaterialModal() {
  const {
    showMissingMaterialModal,
    currentMissingMaterialStudent,
    currentLevelId,
    hideMissingModal,
    getMissingMaterials,
    goToApplicationPhase,
    skipMissingMaterial,
    resolveMissingMaterial,
    checkMaterials,
  } = useGameStore();

  const level = currentLevelId ? getLevelById(currentLevelId) : null;
  const student =
    currentMissingMaterialStudent && level
      ? getStudentById(level, currentMissingMaterialStudent)
      : null;
  const missingMaterials = currentMissingMaterialStudent
    ? getMissingMaterials(currentMissingMaterialStudent)
    : [];

  useEffect(() => {
    if (!showMissingMaterialModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyR') {
        e.preventDefault();
        e.stopPropagation();
        
        if (currentMissingMaterialStudent && missingMaterials.length > 0) {
          resolveMissingMaterial(currentMissingMaterialStudent, missingMaterials[0].id);
          
          const updatedMissing = getMissingMaterials(currentMissingMaterialStudent);
          if (updatedMissing.length === 0) {
            hideMissingModal();
            goToApplicationPhase(currentMissingMaterialStudent);
          }
        }
        return;
      }

      if (e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        
        if (!currentMissingMaterialStudent) return;
        
        const currentMissing = getMissingMaterials(currentMissingMaterialStudent);
        
        if (currentMissing.length === 0) {
          hideMissingModal();
          goToApplicationPhase(currentMissingMaterialStudent);
        } else {
          skipMissingMaterial(currentMissingMaterialStudent);
        }
        return;
      }

      if (e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        hideMissingModal();
        if (currentMissingMaterialStudent) {
          goToApplicationPhase(currentMissingMaterialStudent);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [
    showMissingMaterialModal,
    currentMissingMaterialStudent,
    missingMaterials,
    getMissingMaterials,
    resolveMissingMaterial,
    hideMissingModal,
    goToApplicationPhase,
    skipMissingMaterial,
  ]);

  if (!showMissingMaterialModal) return null;

  const handleGoBack = () => {
    hideMissingModal();
    if (currentMissingMaterialStudent) {
      goToApplicationPhase(currentMissingMaterialStudent);
    }
  };

  const handleSkip = () => {
    if (currentMissingMaterialStudent) {
      const currentMissing = getMissingMaterials(currentMissingMaterialStudent);
      if (currentMissing.length > 0) {
        skipMissingMaterial(currentMissingMaterialStudent);
      } else {
        hideMissingModal();
        goToApplicationPhase(currentMissingMaterialStudent);
      }
    }
  };

  const handleQuickResolve = () => {
    if (currentMissingMaterialStudent && missingMaterials.length > 0) {
      resolveMissingMaterial(currentMissingMaterialStudent, missingMaterials[0].id);
      
      const updatedMissing = getMissingMaterials(currentMissingMaterialStudent);
      if (updatedMissing.length === 0) {
        hideMissingModal();
        goToApplicationPhase(currentMissingMaterialStudent);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-stone-900 rounded-2xl border border-stone-700 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-red-900/50 to-amber-900/30 p-6 border-b border-stone-700/50">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-stone-100 font-serif">材料缺失警告</h2>
                <button
                  onClick={hideMissingModal}
                  className="text-stone-400 hover:text-stone-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-stone-400 mt-1">
                学生 <span className="text-amber-400 font-medium">{student?.name}</span> 的申请材料不完整
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-stone-300 mb-4">以下必填材料尚未提交：</p>
          <div className="space-y-2 mb-6">
            {missingMaterials.map((material) => (
              <div
                key={material.id}
                className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl"
              >
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                <div>
                  <p className="text-stone-200 font-medium">{getMaterialTypeName(material.type)}</p>
                  <p className="text-stone-500 text-sm">{material.name}</p>
                </div>
                <span className="ml-auto text-red-400 text-sm">缺失</span>
              </div>
            ))}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <p className="text-amber-300 text-sm mb-2">
              💡 <strong>提示：</strong>补充材料后可继续完成评分。
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-stone-400 mt-2">
              <span><kbd className="px-1.5 py-0.5 bg-stone-700/50 rounded text-stone-300">R</kbd> 一键补全</span>
              <span><kbd className="px-1.5 py-0.5 bg-stone-700/50 rounded text-stone-300">Enter</kbd> 跳过扣分</span>
              <span><kbd className="px-1.5 py-0.5 bg-stone-700/50 rounded text-stone-300">Esc</kbd> 返回修正</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {missingMaterials.length > 0 && (
              <button
                onClick={handleQuickResolve}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                一键补全 "{getMaterialTypeName(missingMaterials[0].type)}" (+10分)
              </button>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleGoBack}
                className="flex-1 py-3 px-4 bg-stone-700 hover:bg-stone-600 text-stone-100 rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                返回修正
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                跳过 (-15分)
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
