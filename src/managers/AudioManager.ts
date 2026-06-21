import { GameStateManager } from './GameStateManager';

export class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  init(): void {
    if (this.initialized) return;
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.log('Web Audio not supported');
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3): void {
    const stateManager = GameStateManager.getInstance();
    if (!stateManager.isSoundEnabled() || !this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playCorrect(): void {
    this.init();
    this.playTone(523.25, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(659.25, 0.15, 'sine', 0.2), 80);
  }

  playWrong(): void {
    this.init();
    this.playTone(200, 0.2, 'square', 0.15);
  }

  playClick(): void {
    this.init();
    this.playTone(800, 0.05, 'sine', 0.1);
  }

  playCombo(): void {
    this.init();
    this.playTone(783.99, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(987.77, 0.15, 'sine', 0.2), 60);
    setTimeout(() => this.playTone(1174.66, 0.2, 'sine', 0.2), 120);
  }

  playLevelComplete(): void {
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.2, 'triangle', 0.2), i * 100);
    });
  }

  vibrate(pattern: number | number[] = 50): void {
    const stateManager = GameStateManager.getInstance();
    if (!stateManager.isVibrationEnabled()) return;
    
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }
}
