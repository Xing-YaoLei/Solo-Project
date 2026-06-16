import { useSettingsStore } from '@/store/useSettingsStore';

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine', volume?: number) => {
  const settings = useSettingsStore.getState();
  if (!settings.soundEnabled) return;
  
  const actualVolume = volume ?? settings.volume;
  
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(actualVolume * 0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.log('Audio not available');
  }
};

export const audioUtils = {
  playSuccess: () => {
    playTone(523.25, 0.1);
    setTimeout(() => playTone(659.25, 0.1), 100);
    setTimeout(() => playTone(783.99, 0.15), 200);
  },
  playError: () => {
    playTone(200, 0.2, 'square');
  },
  playClick: () => {
    playTone(440, 0.05);
  },
  playCombo: (combo: number) => {
    const baseFreq = 440 + (combo * 20);
    playTone(Math.min(baseFreq, 880), 0.15);
  },
  playGameOver: (isWin: boolean) => {
    if (isWin) {
      playTone(523.25, 0.15);
      setTimeout(() => playTone(659.25, 0.15), 150);
      setTimeout(() => playTone(783.99, 0.15), 300);
      setTimeout(() => playTone(1046.50, 0.3), 450);
    } else {
      playTone(392, 0.2);
      setTimeout(() => playTone(349.23, 0.2), 200);
      setTimeout(() => playTone(293.66, 0.4), 400);
    }
  },
  playCountdown: () => {
    playTone(880, 0.1);
  },
  resumeAudio: () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  },
};
