import type { GameSettings } from '@/config/types';

const STORAGE_KEY = 'scenic_perf_scheduler_settings';

export class SettingsSystem {
  private _settings: GameSettings;

  constructor() {
    this._settings = this.loadFromStorage();
  }

  private loadFromStorage(): GameSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as GameSettings;
    } catch {}
    return {
      soundEnabled: true,
      animationIntensity: 'medium',
      vibrationEnabled: true,
    };
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._settings));
    } catch {}
  }

  toggleSound(): boolean {
    this._settings.soundEnabled = !this._settings.soundEnabled;
    this.saveToStorage();
    return this._settings.soundEnabled;
  }

  toggleVibration(): boolean {
    this._settings.vibrationEnabled = !this._settings.vibrationEnabled;
    this.saveToStorage();
    return this._settings.vibrationEnabled;
  }

  cycleAnimationIntensity(): GameSettings['animationIntensity'] {
    const order: GameSettings['animationIntensity'][] = ['high', 'medium', 'low', 'off'];
    const idx = order.indexOf(this._settings.animationIntensity);
    this._settings.animationIntensity = order[(idx + 1) % order.length];
    this.saveToStorage();
    return this._settings.animationIntensity;
  }

  shouldAnimate(): boolean {
    return this._settings.animationIntensity !== 'off';
  }

  getAnimDurationMultiplier(): number {
    switch (this._settings.animationIntensity) {
      case 'high': return 1.0;
      case 'medium': return 0.6;
      case 'low': return 0.3;
      case 'off': return 0;
    }
  }

  get settings() { return this._settings; }
  get soundEnabled() { return this._settings.soundEnabled; }
  get vibrationEnabled() { return this._settings.vibrationEnabled; }
  get animationIntensity() { return this._settings.animationIntensity; }
}
