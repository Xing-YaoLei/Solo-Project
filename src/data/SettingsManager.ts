import { Settings, DEFAULT_SETTINGS } from '../config/GameConfig';

export class SettingsManager {
  private static instance: SettingsManager;
  private settings: Settings;
  private listeners: ((settings: Settings) => void)[] = [];

  private constructor() {
    this.settings = this.loadSettings();
  }

  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  private loadSettings(): Settings {
    try {
      const saved = localStorage.getItem('elderly_care_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('elderly_care_settings', JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  public getSettings(): Settings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<Settings>): void {
    this.settings = { ...this.settings, ...partial };
    this.saveSettings();
    this.notifyListeners();
  }

  public onUpdate(listener: (settings: Settings) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l(this.settings));
  }

  public isSoundEnabled(): boolean {
    return this.settings.soundEnabled;
  }

  public isVibrationEnabled(): boolean {
    return this.settings.vibrationEnabled;
  }

  public getAnimationMultiplier(): number {
    switch (this.settings.animationIntensity) {
      case 'off': return 0;
      case 'low': return 0.4;
      case 'medium': return 1;
      case 'high': return 1.6;
      default: return 1;
    }
  }

  public vibrate(pattern: number | number[] = 100): void {
    if (this.settings.vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }
}
