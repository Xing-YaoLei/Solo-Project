import type { GameSettings } from '@/types/game';

class AudioManager {
  private audioContext: AudioContext | null = null;
  private settings: GameSettings;

  constructor(settings: GameSettings) {
    this.settings = settings;
  }

  updateSettings(settings: GameSettings) {
    this.settings = settings;
  }

  private getContext(): AudioContext | null {
    if (!this.settings.soundEnabled) return null;
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        return null;
      }
    }
    return this.audioContext;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    const ctx = this.getContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    const actualVolume = volume * this.settings.soundVolume;
    gainNode.gain.setValueAtTime(actualVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  playCorrect() {
    this.playTone(880, 0.12, 'sine', 0.25);
    setTimeout(() => this.playTone(1100, 0.15, 'sine', 0.2), 80);
  }

  playWrong() {
    this.playTone(200, 0.2, 'square', 0.15);
  }

  playCombo(comboCount: number) {
    const baseFreq = 440 + Math.min(comboCount, 10) * 50;
    this.playTone(baseFreq, 0.08, 'triangle', 0.2);
    setTimeout(() => this.playTone(baseFreq * 1.25, 0.1, 'triangle', 0.18), 50);
    setTimeout(() => this.playTone(baseFreq * 1.5, 0.12, 'triangle', 0.16), 100);
  }

  playSelect() {
    this.playTone(660, 0.06, 'sine', 0.15);
  }

  playPlace() {
    this.playTone(520, 0.08, 'sine', 0.18);
  }

  playCountdown() {
    this.playTone(440, 0.1, 'sine', 0.2);
  }

  playStart() {
    this.playTone(523, 0.1, 'sine', 0.25);
    setTimeout(() => this.playTone(659, 0.1, 'sine', 0.25), 100);
    setTimeout(() => this.playTone(784, 0.2, 'sine', 0.25), 200);
  }

  playWin() {
    const notes = [523, 587, 659, 698, 784, 880, 988, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.2), i * 80);
    });
  }

  playLose() {
    const notes = [400, 350, 300, 250, 200];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sawtooth', 0.15), i * 120);
    });
  }

  playTick() {
    this.playTone(800, 0.03, 'square', 0.1);
  }

  vibrate(pattern: number | number[]) {
    if (!this.settings.vibrationEnabled) return;
    if (navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // ignore
      }
    }
  }

  vibrateCorrect() {
    this.vibrate([10, 30, 10]);
  }

  vibrateWrong() {
    this.vibrate(50);
  }

  vibrateCombo() {
    this.vibrate([10, 20, 10, 20, 10]);
  }
}

export default AudioManager;
