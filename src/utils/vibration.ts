import { useSettingsStore } from '@/store/useSettingsStore';

export const vibrationUtils = {
  vibrate: (pattern: number | number[]) => {
    const settings = useSettingsStore.getState();
    if (!settings.vibrationEnabled) return;
    if (!navigator.vibrate) return;
    
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      console.log('Vibration not available');
    }
  },
  success: () => {
    vibrationUtils.vibrate([50, 50, 100]);
  },
  error: () => {
    vibrationUtils.vibrate([200, 100, 200]);
  },
  click: () => {
    vibrationUtils.vibrate(30);
  },
  combo: (combo: number) => {
    const pattern: number[] = [];
    for (let i = 0; i < Math.min(combo, 5); i++) {
      pattern.push(50);
      pattern.push(30);
    }
    vibrationUtils.vibrate(pattern);
  },
  gameOver: (isWin: boolean) => {
    if (isWin) {
      vibrationUtils.vibrate([100, 50, 100, 50, 200]);
    } else {
      vibrationUtils.vibrate([300, 200, 300]);
    }
  },
};
