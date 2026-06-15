import { useEffect } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { getLevelById, getMaterialsByStudentId } from '../data/levels';

export function useKeyboardControls() {
  const {
    isPaused,
    isGameOver,
    pauseGame,
    resumeGame,
    nextPhase,
    prevPhase,
    selectStudent,
    selectedStudentId,
    currentLevelId,
    currentPhase,
    completeStudentReview,
    resolveMissingMaterial,
    getMissingMaterials,
    showMissingMaterialModal,
    hideMissingModal,
    skipMissingMaterial,
    currentMissingMaterialStudent,
  } = useGameStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isPaused) {
          resumeGame();
        } else {
            pauseGame();
          }
        return;
      }

      if (isPaused && e.code !== 'Space') return;

      if (e.code === 'KeyQ') {
        e.preventDefault();
        prevPhase();
      }

      if (e.code === 'KeyE') {
        e.preventDefault();
        nextPhase();
      }

      if (e.code === 'Tab') {
        e.preventDefault();
        if (!currentLevelId) return;
        const level = getLevelById(currentLevelId);
        if (!level) return;

        const students = level.students;
        const currentIndex = students.findIndex((s) => s.id === selectedStudentId);
        const nextIndex = e.shiftKey
          ? (currentIndex - 1 + students.length) % students.length
          : (currentIndex + 1) % students.length;

        selectStudent(students[nextIndex].id);
      }

      if (e.code === 'Enter') {
        e.preventDefault();
        if (showMissingMaterialModal && currentMissingMaterialStudent) {
          skipMissingMaterial(currentMissingMaterialStudent);
        } else if (selectedStudentId && currentPhase === 'application') {
          completeStudentReview(selectedStudentId);
        }
      }

      if (e.code === 'KeyR') {
        e.preventDefault();
        if (selectedStudentId && currentLevelId && currentPhase === 'application') {
          const missing = getMissingMaterials(selectedStudentId);
          if (missing.length > 0) {
            resolveMissingMaterial(selectedStudentId, missing[0].id);
          }
        }
      }

      if (e.code === 'KeyF') {
        e.preventDefault();
        if (selectedStudentId && currentPhase === 'application') {
          completeStudentReview(selectedStudentId);
        }
      }

      if (e.code === 'Escape') {
        e.preventDefault();
        if (showMissingMaterialModal) {
          hideMissingModal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isPaused,
    isGameOver,
    pauseGame,
    resumeGame,
    nextPhase,
    prevPhase,
    selectStudent,
    selectedStudentId,
    currentLevelId,
    currentPhase,
    completeStudentReview,
    resolveMissingMaterial,
    getMissingMaterials,
    showMissingMaterialModal,
    hideMissingModal,
    skipMissingMaterial,
    currentMissingMaterialStudent,
  ]);
}
