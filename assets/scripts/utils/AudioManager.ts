import { _decorator, Component, AudioSource, AudioClip, Node } from "cc";
import { GameManager } from "../managers/GameManager";

const { ccclass, property } = _decorator;

@ccclass("AudioManager")
export class AudioManager extends Component {
    private static _instance: AudioManager | null = null;

    private audioSource: AudioSource | null = null;
    private sfxClips: Map<string, AudioClip> = new Map();
    private musicClip: AudioClip | null = null;

    public static get instance(): AudioManager | null {
        return AudioManager._instance;
    }

    onLoad(): void {
        if (AudioManager._instance && AudioManager._instance !== this) {
            this.destroy();
            return;
        }
        AudioManager._instance = this;

        this.audioSource = this.node.getComponent(AudioSource) || this.node.addComponent(AudioSource);
        this.audioSource.playOnAwake = false;
    }

    onDestroy(): void {
        if (AudioManager._instance === this) {
            AudioManager._instance = null;
        }
    }

    public playBgm(clip: AudioClip): void {
        if (!this.audioSource) return;
        const gm = GameManager.instance;
        if (gm && !gm.getSettings().soundEnabled) return;

        this.musicClip = clip;
        this.audioSource.clip = clip;
        this.audioSource.loop = true;
        this.audioSource.volume = 0.3;
        this.audioSource.play();
    }

    public stopBgm(): void {
        if (this.audioSource) {
            this.audioSource.stop();
        }
    }

    public playSfx(name: string): void {
        if (!this.audioSource) return;
        const gm = GameManager.instance;
        if (gm && !gm.getSettings().soundEnabled) return;

        const clip = this.sfxClips.get(name);
        if (clip) {
            this.audioSource.playOneShot(clip, 0.6);
        }
    }

    public registerSfx(name: string, clip: AudioClip): void {
        this.sfxClips.set(name, clip);
    }

    public setVolume(volume: number): void {
        if (this.audioSource) {
            this.audioSource.volume = Math.max(0, Math.min(1, volume));
        }
    }
}
