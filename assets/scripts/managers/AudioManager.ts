import { StorageManager } from '../utils/StorageManager';

export class AudioManager {
  private static _instance: AudioManager | null = null;

  private _bgmVolume: number = 0.5;
  private _sfxVolume: number = 0.7;
  private _muted: boolean = false;

  private _bgmAudio: any = null;
  private _sfxCache: Map<string, any> = new Map();

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
    this._bgmVolume = StorageManager.instance.load<number>('bgm_volume', 0.5);
    this._sfxVolume = StorageManager.instance.load<number>('sfx_volume', 0.7);
    this._muted = StorageManager.instance.load<boolean>('muted', false);
  }

  public setBgmVolume(volume: number): void {
    this._bgmVolume = Math.max(0, Math.min(1, volume));
    StorageManager.instance.save('bgm_volume', this._bgmVolume);
    if (this._bgmAudio && this._bgmAudio.setVolume) {
      this._bgmAudio.setVolume(this._muted ? 0 : this._bgmVolume);
    }
  }

  public setSfxVolume(volume: number): void {
    this._sfxVolume = Math.max(0, Math.min(1, volume));
    StorageManager.instance.save('sfx_volume', this._sfxVolume);
  }

  public toggleMute(): boolean {
    this._muted = !this._muted;
    StorageManager.instance.save('muted', this._muted);

    if (this._bgmAudio && this._bgmAudio.setVolume) {
      this._bgmAudio.setVolume(this._muted ? 0 : this._bgmVolume);
    }

    return this._muted;
  }

  public playBgm(audioClip: any): void {
    if (!audioClip) return;

    this.stopBgm();

    if (typeof cc !== 'undefined' && cc.audioEngine) {
      const id = cc.audioEngine.playMusic(audioClip, true);
      cc.audioEngine.setMusicVolume(this._muted ? 0 : this._bgmVolume);
      this._bgmAudio = { id, stop: () => cc.audioEngine.stopMusic(), setVolume: (v: number) => cc.audioEngine.setMusicVolume(v) };
    } else if (audioClip.play) {
      audioClip.loop = true;
      audioClip.volume = this._muted ? 0 : this._bgmVolume;
      audioClip.play();
      this._bgmAudio = audioClip;
    }
  }

  public stopBgm(): void {
    if (this._bgmAudio) {
      if (this._bgmAudio.stop) {
        this._bgmAudio.stop();
      } else if (this._bgmAudio.pause) {
        this._bgmAudio.pause();
      }
      this._bgmAudio = null;
    }
  }

  public playSfx(audioClip: any): void {
    if (!audioClip || this._muted) return;

    if (typeof cc !== 'undefined' && cc.audioEngine) {
      const id = cc.audioEngine.playEffect(audioClip, false);
      cc.audioEngine.setEffectsVolume(this._sfxVolume);
    } else if (audioClip.cloneNode) {
      const clone = audioClip.cloneNode();
      clone.volume = this._sfxVolume;
      clone.play().catch(() => {});
    } else if (audioClip.play) {
      audioClip.currentTime = 0;
      audioClip.volume = this._sfxVolume;
      audioClip.play().catch(() => {});
    }
  }

  public playClick(): void {
  }

  public playConfirm(): void {
  }

  public playError(): void {
  }

  public playSuccess(): void {
  }
}
