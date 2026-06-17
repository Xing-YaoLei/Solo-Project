import Phaser from 'phaser';
import { SettingsManager } from './SettingsManager';

export class SoundManager {
  private static instance: SoundManager;

  private constructor() {}

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public setScene(_scene: Phaser.Scene): void {
    // Reserved for future use
  }

  public playSuccess(): void {
    if (!SettingsManager.getInstance().isSoundEnabled()) return;
    SettingsManager.getInstance().vibrate(50);
    this.playBeep(880, 0.1, 'sine', 0.3);
  }

  public playError(): void {
    if (!SettingsManager.getInstance().isSoundEnabled()) return;
    SettingsManager.getInstance().vibrate([100, 50, 100]);
    this.playBeep(220, 0.2, 'square', 0.2);
  }

  public playClick(): void {
    if (!SettingsManager.getInstance().isSoundEnabled()) return;
    this.playBeep(600, 0.05, 'sine', 0.15);
  }

  public playLevelComplete(): void {
    if (!SettingsManager.getInstance().isSoundEnabled()) return;
    SettingsManager.getInstance().vibrate([100, 100, 100, 100, 200]);
    this.playSequence([523, 659, 784, 1047], 0.15, 'sine', 0.3);
  }

  public playGameOver(): void {
    if (!SettingsManager.getInstance().isSoundEnabled()) return;
    SettingsManager.getInstance().vibrate([200, 100, 200, 100, 300]);
    this.playSequence([392, 349, 330, 262], 0.2, 'sine', 0.3);
  }

  public playTick(): void {
    if (!SettingsManager.getInstance().isSoundEnabled()) return;
    this.playBeep(1000, 0.03, 'sine', 0.1);
  }

  private playBeep(frequency: number, duration: number, type: OscillatorType, volume: number): void {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = frequency;
      osc.type = type;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
      
      osc.onended = () => ctx.close();
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }

  private playSequence(frequencies: number[], noteDuration: number, type: OscillatorType, volume: number): void {
    frequencies.forEach((freq, i) => {
      setTimeout(() => this.playBeep(freq, noteDuration, type, volume), i * noteDuration * 1000);
    });
  }
}
