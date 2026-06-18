import { eventBus, GameEvent } from './EventBus';

export type AudioType = 'sfx' | 'music' | 'voice';

export interface AudioTrack {
  id: string;
  key: string;
  type: AudioType;
  src: string;
  volume: number;
  loop: boolean;
  preload: boolean;
}

export interface PlayOptions {
  volume?: number;
  loop?: boolean;
  rate?: number;
  seek?: number;
  onEnd?: () => void;
}

export interface FadeOptions {
  duration: number;
  targetVolume: number;
  fromVolume?: number;
}

interface PlayingSound {
  id: string;
  audio: HTMLAudioElement;
  type: AudioType;
  options: PlayOptions;
  startTime: number;
  fadeAnimation?: number;
}

export class AudioManager {
  private static instance: AudioManager | null = null;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  
  private tracks: Map<string, AudioTrack> = new Map();
  private playingSounds: Map<string, PlayingSound> = new Map();
  private currentMusic: string | null = null;
  
  private masterVolume = 1;
  private musicVolume = 0.5;
  private sfxVolume = 0.7;
  private voiceVolume = 0.8;
  
  private muted = false;
  private paused = false;
  private initialized = false;

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private constructor() {
    this.setupEventListeners();
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      this.masterGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();
      this.voiceGain = this.audioContext.createGain();
      
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.voiceGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);
      
      this.updateGainNodes();
      this.initialized = true;
      
      console.log('[AudioManager] Initialized with Web Audio API');
    } catch (error) {
      console.warn('[AudioManager] Web Audio API not available, falling back to HTMLAudioElement:', error);
    }
  }

  async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
    
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  registerTrack(track: AudioTrack): void {
    this.tracks.set(track.id, track);
    
    if (track.preload) {
      this.preload(track.id);
    }
  }

  registerTracks(tracks: AudioTrack[]): void {
    for (const track of tracks) {
      this.registerTrack(track);
    }
  }

  async preload(trackId: string): Promise<HTMLAudioElement | null> {
    const track = this.tracks.get(trackId);
    if (!track) {
      console.warn(`[AudioManager] Track not found: ${trackId}`);
      return null;
    }
    
    try {
      const audio = new Audio(track.src);
      audio.preload = 'auto';
      audio.volume = this.getEffectiveVolume(track.type, track.volume);
      
      await new Promise<void>((resolve, reject) => {
        audio.oncanplaythrough = () => resolve();
        audio.onerror = () => reject(new Error(`Failed to load audio: ${track.src}`));
      });
      
      return audio;
    } catch (error) {
      console.error(`[AudioManager] Failed to preload track ${trackId}:`, error);
      return null;
    }
  }

  async preloadAll(): Promise<void> {
    const preloadPromises = Array.from(this.tracks.keys()).map(id => this.preload(id));
    await Promise.allSettled(preloadPromises);
  }

  play(trackId: string, options: PlayOptions = {}): string | null {
    const track = this.tracks.get(trackId);
    if (!track) {
      console.warn(`[AudioManager] Track not found: ${trackId}`);
      return null;
    }
    
    if (this.muted) return null;
    
    const audio = new Audio(track.src);
    const playOptions: PlayOptions = {
      volume: options.volume ?? track.volume,
      loop: options.loop ?? track.loop,
      rate: options.rate ?? 1,
      seek: options.seek ?? 0,
      onEnd: options.onEnd,
    };
    
    audio.volume = this.getEffectiveVolume(track.type, playOptions.volume!);
    audio.loop = playOptions.loop!;
    audio.playbackRate = playOptions.rate!;
    
    if (playOptions.seek && playOptions.seek > 0) {
      audio.currentTime = playOptions.seek;
    }
    
    const soundId = this.generateSoundId(trackId);
    
    audio.addEventListener('ended', () => {
      if (!playOptions.loop) {
        this.stop(soundId);
        playOptions.onEnd?.();
      }
    });
    
    audio.addEventListener('error', (e) => {
      console.error(`[AudioManager] Error playing track ${trackId}:`, e);
      this.stop(soundId);
    });
    
    audio.play().catch(error => {
      console.error(`[AudioManager] Failed to play track ${trackId}:`, error);
    });
    
    this.playingSounds.set(soundId, {
      id: soundId,
      audio,
      type: track.type,
      options: playOptions,
      startTime: Date.now(),
    });
    
    if (track.type === 'music') {
      if (this.currentMusic && this.currentMusic !== soundId) {
        this.stop(this.currentMusic);
      }
      this.currentMusic = soundId;
    }
    
    return soundId;
  }

  playMusic(trackId: string, options: Omit<PlayOptions, 'loop'> = {}): string | null {
    return this.play(trackId, { ...options, loop: true });
  }

  playSfx(trackId: string, options: PlayOptions = {}): string | null {
    return this.play(trackId, { ...options, loop: false });
  }

  playVoice(trackId: string, options: PlayOptions = {}): string | null {
    return this.play(trackId, { ...options, loop: false });
  }

  stop(soundId: string): boolean {
    const sound = this.playingSounds.get(soundId);
    if (!sound) return false;
    
    if (sound.fadeAnimation !== undefined) {
      cancelAnimationFrame(sound.fadeAnimation);
    }
    
    sound.audio.pause();
    sound.audio.currentTime = 0;
    sound.audio.remove();
    
    this.playingSounds.delete(soundId);
    
    if (this.currentMusic === soundId) {
      this.currentMusic = null;
    }
    
    return true;
  }

  stopAll(type?: AudioType): void {
    for (const [soundId, sound] of this.playingSounds) {
      if (!type || sound.type === type) {
        this.stop(soundId);
      }
    }
  }

  stopMusic(): void {
    if (this.currentMusic) {
      this.stop(this.currentMusic);
    }
  }

  isPaused(): boolean {
    return this.paused;
  }

  pause(soundId?: string): boolean {
    if (soundId) {
      const sound = this.playingSounds.get(soundId);
      if (!sound) return false;
      sound.audio.pause();
      return true;
    }
    
    for (const sound of this.playingSounds.values()) {
      sound.audio.pause();
    }
    this.paused = true;
    return true;
  }

  resume(soundId?: string): boolean {
    if (soundId) {
      const sound = this.playingSounds.get(soundId);
      if (!sound) return false;
      sound.audio.play().catch(console.error);
      return true;
    }
    
    for (const sound of this.playingSounds.values()) {
      sound.audio.play().catch(console.error);
    }
    this.paused = false;
    return true;
  }

  async fadeIn(trackId: string, fadeOptions: FadeOptions, playOptions: PlayOptions = {}): Promise<string | null> {
    const soundId = this.play(trackId, { ...playOptions, volume: 0 });
    if (!soundId) return null;
    
    await this.fade(soundId, fadeOptions);
    return soundId;
  }

  fadeOut(soundId: string, duration: number = 1000): Promise<boolean> {
    return this.fade(soundId, { duration, targetVolume: 0 }).then(success => {
      if (success) {
        this.stop(soundId);
      }
      return success;
    });
  }

  async fadeMusic(trackId: string, duration: number = 1000): Promise<string | null> {
    if (this.currentMusic) {
      await this.fadeOut(this.currentMusic, duration);
    }
    return this.fadeIn(trackId, { duration, targetVolume: this.musicVolume });
  }

  setVolume(type: AudioType | 'master', volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    switch (type) {
      case 'master':
        this.masterVolume = clampedVolume;
        break;
      case 'music':
        this.musicVolume = clampedVolume;
        break;
      case 'sfx':
        this.sfxVolume = clampedVolume;
        break;
      case 'voice':
        this.voiceVolume = clampedVolume;
        break;
    }
    
    this.updateGainNodes();
    this.updatePlayingVolumes();
  }

  getVolume(type: AudioType | 'master'): number {
    switch (type) {
      case 'master': return this.masterVolume;
      case 'music': return this.musicVolume;
      case 'sfx': return this.sfxVolume;
      case 'voice': return this.voiceVolume;
    }
  }

  mute(): void {
    this.muted = true;
    this.updateGainNodes();
  }

  unmute(): void {
    this.muted = false;
    this.updateGainNodes();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    this.updateGainNodes();
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  getTrack(trackId: string): AudioTrack | null {
    return this.tracks.get(trackId) || null;
  }

  getAllTracks(): AudioTrack[] {
    return Array.from(this.tracks.values());
  }

  getTracksByType(type: AudioType): AudioTrack[] {
    return Array.from(this.tracks.values()).filter(t => t.type === type);
  }

  getPlayingCount(type?: AudioType): number {
    if (!type) return this.playingSounds.size;
    return Array.from(this.playingSounds.values()).filter(s => s.type === type).length;
  }

  isPlaying(soundId: string): boolean {
    const sound = this.playingSounds.get(soundId);
    return !!sound && !sound.audio.paused;
  }

  getCurrentTime(soundId: string): number | null {
    const sound = this.playingSounds.get(soundId);
    return sound ? sound.audio.currentTime : null;
  }

  getDuration(soundId: string): number | null {
    const sound = this.playingSounds.get(soundId);
    return sound && !isNaN(sound.audio.duration) ? sound.audio.duration : null;
  }

  seek(soundId: string, time: number): boolean {
    const sound = this.playingSounds.get(soundId);
    if (!sound) return false;
    
    sound.audio.currentTime = Math.max(0, Math.min(time, sound.audio.duration || 0));
    return true;
  }

  setPlaybackRate(soundId: string, rate: number): boolean {
    const sound = this.playingSounds.get(soundId);
    if (!sound) return false;
    
    sound.audio.playbackRate = Math.max(0.25, Math.min(4, rate));
    return true;
  }

  unload(trackId: string): boolean {
    return this.tracks.delete(trackId);
  }

  unloadAll(): void {
    this.stopAll();
    this.tracks.clear();
  }

  private async fade(soundId: string, options: FadeOptions): Promise<boolean> {
    const sound = this.playingSounds.get(soundId);
    if (!sound) return false;
    
    return new Promise(resolve => {
      const startTime = performance.now();
      const startVolume = options.fromVolume ?? sound.audio.volume;
      const targetVolume = options.targetVolume;
      const duration = options.duration;
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = this.easeInOutCubic(progress);
        
        const newVolume = startVolume + (targetVolume - startVolume) * easedProgress;
        sound.audio.volume = newVolume;
        
        if (progress < 1) {
          sound.fadeAnimation = requestAnimationFrame(animate);
        } else {
          sound.fadeAnimation = undefined;
          resolve(true);
        }
      };
      
      sound.fadeAnimation = requestAnimationFrame(animate);
    });
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private getEffectiveVolume(type: AudioType, trackVolume: number = 1): number {
    const typeVolumes: Record<AudioType, number> = {
      music: this.musicVolume,
      sfx: this.sfxVolume,
      voice: this.voiceVolume,
    };
    
    if (this.muted) return 0;
    
    return this.masterVolume * typeVolumes[type] * trackVolume;
  }

  private updateGainNodes(): void {
    if (!this.audioContext || !this.masterGain) return;
    
    const gainValue = this.muted ? 0 : this.masterVolume;
    this.masterGain.gain.setTargetAtTime(gainValue, this.audioContext.currentTime, 0.01);
    
    if (this.musicGain) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.audioContext.currentTime, 0.01);
    }
    if (this.sfxGain) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.audioContext.currentTime, 0.01);
    }
    if (this.voiceGain) {
      this.voiceGain.gain.setTargetAtTime(this.voiceVolume, this.audioContext.currentTime, 0.01);
    }
  }

  private updatePlayingVolumes(): void {
    for (const sound of this.playingSounds.values()) {
      sound.audio.volume = this.getEffectiveVolume(sound.type, sound.options.volume);
    }
  }

  private setupEventListeners(): void {
    eventBus.on(GameEvent.AUDIO_PLAY, (data: unknown) => {
      const { trackId, options } = data as { trackId: string; options?: PlayOptions };
      if (trackId) {
        this.play(trackId, options);
      }
    });
    
    eventBus.on(GameEvent.AUDIO_STOP, (data: unknown) => {
      const { soundId, type } = data as { soundId?: string; type?: AudioType };
      if (soundId) {
        this.stop(soundId);
      } else if (type) {
        this.stopAll(type);
      } else {
        this.stopAll();
      }
    });
    
    eventBus.on(GameEvent.SETTINGS_CHANGED, (data: unknown) => {
      const settings = data as { soundVolume?: number; musicVolume?: number };
      if (settings.soundVolume !== undefined) {
        this.setVolume('sfx', settings.soundVolume);
      }
      if (settings.musicVolume !== undefined) {
        this.setVolume('music', settings.musicVolume);
      }
    });
    
    eventBus.on(GameEvent.GAME_PAUSED, () => this.pause());
    eventBus.on(GameEvent.GAME_RESUMED, () => this.resume());
  }

  private generateSoundId(trackId: string): string {
    return `${trackId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const audioManager = AudioManager.getInstance();
