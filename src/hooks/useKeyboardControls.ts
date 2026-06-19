import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useNavigate } from 'react-router-dom';

interface UseKeyboardControlsOptions {
  onCameraPan?: (deltaX: number, deltaY: number) => void;
}

function useKeyboardControls(options: UseKeyboardControlsOptions = {}) {
  const navigate = useNavigate();
  const {
    stations,
    selectStation,
    isPaused,
    pauseGame,
    resumeGame,
    shortageModal,
    closeShortageModal,
    setActivePanel,
    currentLevelId,
    resetGameState,
  } = useGameStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return;
      }

      if (shortageModal.open) {
        if (e.code === 'Escape') {
          e.preventDefault();
          closeShortageModal();
        }
        return;
      }

      switch (e.code) {
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5': {
          e.preventDefault();
          const index = parseInt(e.code.replace('Digit', ''), 10) - 1;
          const station = stations[index];
          if (station) {
            selectStation(station.id);
          }
          break;
        }

        case 'Space': {
          e.preventDefault();
          if (isPaused) {
            resumeGame();
          } else {
            pauseGame();
          }
          break;
        }

        case 'Escape': {
          e.preventDefault();
          if (currentLevelId) {
            resetGameState();
            navigate('/levels');
          }
          break;
        }

        case 'KeyW':
        case 'ArrowUp': {
          if (options.onCameraPan) {
            e.preventDefault();
            options.onCameraPan(0, -1);
          }
          break;
        }

        case 'KeyS':
        case 'ArrowDown': {
          if (options.onCameraPan) {
            e.preventDefault();
            options.onCameraPan(0, 1);
          }
          break;
        }

        case 'KeyA':
        case 'ArrowLeft': {
          if (options.onCameraPan) {
            e.preventDefault();
            options.onCameraPan(-1, 0);
          }
          break;
        }

        case 'KeyD':
        case 'ArrowRight': {
          if (options.onCameraPan) {
            e.preventDefault();
            options.onCameraPan(1, 0);
          }
          break;
        }

        case 'KeyI': {
          e.preventDefault();
          setActivePanel('inventory');
          break;
        }

        case 'KeyQ': {
          e.preventDefault();
          setActivePanel(null);
          break;
        }

        default:
          break;
      }
    },
    [
      stations,
      selectStation,
      isPaused,
      pauseGame,
      resumeGame,
      shortageModal.open,
      closeShortageModal,
      setActivePanel,
      currentLevelId,
      resetGameState,
      navigate,
      options,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return null;
}

export default useKeyboardControls;
