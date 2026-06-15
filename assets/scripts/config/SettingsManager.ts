import { Singleton } from '../core/Singleton';
import { EventBus, GameEvents } from '../core/EventBus';
import { Settings } from '../types';

const STORAGE_KEY = 'usg_settings';

export class SettingsManager extends Singleton<SettingsManager> {
  private _settings: Settings = this.getDefaultSettings();

  get settings(): Settings {
    return { ...this._settings };
  }

  get soundEnabled(): boolean {
    return this._settings.soundEnabled;
  }

  get vibrationEnabled(): boolean {
    return this._settings.vibrationEnabled;
  }

  get animationIntensity(): number {
    return this._settings.animationIntensity;
  }

  get musicVolume(): number {
    return this._settings.musicVolume;
  }

  get sfxVolume(): number {
    return this._settings.sfxVolume;
  }

  private getDefaultSettings(): Settings {
    return {
      soundEnabled: true,
      vibrationEnabled: true,
      animationIntensity: 1,
      musicVolume: 0.5,
      sfxVolume: 0.7,
    };
  }

  load(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Settings>;
        this._settings = { ...this.getDefaultSettings(), ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  }

  save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  update<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this._settings[key] = value;
    this.save();
    EventBus.instance.emit(GameEvents.SETTINGS_CHANGED, key, value);
  }

  toggleSound(): boolean {
    const newValue = !this._settings.soundEnabled;
    this.update('soundEnabled', newValue);
    return newValue;
  }

  toggleVibration(): boolean {
    const newValue = !this._settings.vibrationEnabled;
    this.update('vibrationEnabled', newValue);
    return newValue;
  }

  setAnimationIntensity(intensity: number): void {
    const clamped = Math.max(0, Math.min(1, intensity));
    this.update('animationIntensity', clamped);
  }

  setMusicVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.update('musicVolume', clamped);
  }

  setSfxVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.update('sfxVolume', clamped);
  }

  reset(): void {
    this._settings = this.getDefaultSettings();
    this.save();
    EventBus.instance.emit(GameEvents.SETTINGS_CHANGED, null, this._settings);
  }

  playSfx(audioClip: unknown): void {
    if (!this._settings.soundEnabled || this._settings.sfxVolume <= 0) {
      return;
    }
  }

  vibrate(duration: number = 50): void {
    if (!this._settings.vibrationEnabled) {
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  }
}
