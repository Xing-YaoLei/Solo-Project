import { AudioSource, resources } from 'cc';
import { StorageManager } from '../utils/StorageManager';

export class AudioManager {
  private static _instance: AudioManager | null = null;

  private _bgmVolume: number = 0.5;
  private _sfxVolume: number = 0.7;
  private _muted: boolean = false;

  private _bgmSource: AudioSource | null = null;
  private _bgmClip: any = null;
  private _sfxCache: Map<string, any> = new Map();
  private _inited = false;

  public static get instance(): AudioManager {
    if (!this._instance) {
      this._instance = new AudioManager();
    }
    return this._instance;
  }

  public get bgmVolume(): number {
    return this._bgmVolume;
  }

  public get sfxVolume(): number {
    return this._sfxVolume;
  }

  public get muted(): boolean {
    return this._muted;
  }

  public init(): void {
    if (this._inited) return;
    this._inited = true;

    this._bgmVolume = StorageManager.instance.load<number>('bgm_volume', 0.5);
    this._sfxVolume = StorageManager.instance.load<number>('sfx_volume', 0.7);
    this._muted = StorageManager.instance.load<boolean>('muted', false);
  }

  public setBgmVolume(volume: number): void {
    this._bgmVolume = Math.max(0, Math.min(1, volume));
    StorageManager.instance.save('bgm_volume', this._bgmVolume);
    if (this._bgmSource) {
      this._bgmSource.volume = this._muted ? 0 : this._bgmVolume;
    }
  }

  public setSfxVolume(volume: number): void {
    this._sfxVolume = Math.max(0, Math.min(1, volume));
    StorageManager.instance.save('sfx_volume', this._sfxVolume);
  }

  public toggleMute(): boolean {
    this._muted = !this._muted;
    StorageManager.instance.save('muted', this._muted);

    if (this._bgmSource) {
      this._bgmSource.volume = this._muted ? 0 : this._bgmVolume;
    }

    return this._muted;
  }

  public setBgmSource(audioSource: AudioSource): void {
    this._bgmSource = audioSource;
    if (this._bgmSource) {
      this._bgmSource.volume = this._muted ? 0 : this._bgmVolume;
      this._bgmSource.loop = true;
    }
  }

  public playBgm(clip?: any): void {
    if (!this._bgmSource) return;

    if (clip) {
      this._bgmClip = clip;
      this._bgmSource.clip = clip;
    }

    if (!this._muted && this._bgmSource.clip) {
      this._bgmSource.volume = this._bgmVolume;
      this._bgmSource.play();
    }
  }

  public stopBgm(): void {
    if (this._bgmSource) {
      this._bgmSource.stop();
    }
  }

  public pauseBgm(): void {
    if (this._bgmSource) {
      this._bgmSource.pause();
    }
  }

  public resumeBgm(): void {
    if (this._bgmSource && !this._muted) {
      this._bgmSource.play();
    }
  }

  public playSfx(clip: any): void {
    if (!clip || this._muted) return;

    if (this._bgmSource && clip.play) {
      const audio = new Audio();
      audio.volume = this._sfxVolume;
      if (clip.url) {
        audio.src = clip.url;
      }
      audio.play().catch(() => {});
    }
  }

  public playSfxByName(name: string): void {
    const clip = this._sfxCache.get(name);
    if (clip) {
      this.playSfx(clip);
    }
  }

  public preloadSfx(name: string, path: string): Promise<void> {
    return new Promise((resolve) => {
      resources.load(path, (err: Error | null, asset: any) => {
        if (!err && asset) {
          this._sfxCache.set(name, asset);
        }
        resolve();
      });
    });
  }

  public playClick(): void {
    this.playSfxByName('click');
  }

  public playConfirm(): void {
    this.playSfxByName('confirm');
  }

  public playError(): void {
    this.playSfxByName('error');
  }

  public playSuccess(): void {
    this.playSfxByName('success');
  }
}
