import { _decorator, Component, Node, AudioClip, AudioSource, sys } from 'cc';
import { GameManager, GameEvent } from './GameManager';
const { ccclass, property } = _decorator;

export enum SfxType {
    CLICK = 'click',
    SUCCESS = 'success',
    ERROR = 'error',
    WARNING = 'warning',
    SEAT_SELECT = 'seat_select',
    ORDER_COMPLETE = 'order_complete',
    ORDER_FAIL = 'order_fail',
    TICKET_PRINT = 'ticket_print',
    COUNTDOWN = 'countdown',
    TIME_UP = 'time_up',
    LEVEL_PASS = 'level_pass',
    LEVEL_FAIL = 'level_fail'
}

@ccclass('AudioManager')
export class AudioManager extends Component {
    private static _instance: AudioManager | null = null;

    public static get instance(): AudioManager {
        if (!this._instance) {
            const node = new Node('AudioManager');
            this._instance = node.addComponent(AudioManager);
        }
        return this._instance;
    }

    @property(AudioSource)
    bgmSource: AudioSource | null = null;

    @property(AudioSource)
    sfxSource: AudioSource | null = null;

    private clips: Map<string, AudioClip> = new Map();
    private currentBgm: string = '';

    onLoad() {
        if (!this.bgmSource) {
            const bgmNode = new Node('BGMSource');
            this.node.addChild(bgmNode);
            this.bgmSource = bgmNode.addComponent(AudioSource);
            this.bgmSource.loop = true;
        }
        if (!this.sfxSource) {
            const sfxNode = new Node('SFXSource');
            this.node.addChild(sfxNode);
            this.sfxSource = sfxNode.addComponent(AudioSource);
            this.sfxSource.loop = false;
        }

        GameManager.instance.on(GameEvent.SETTINGS_CHANGED, this.onSettingsChanged, this);
        this.applySettings();
    }

    onDestroy() {
        GameManager.instance.off(GameEvent.SETTINGS_CHANGED, this.onSettingsChanged, this);
    }

    registerClip(key: string, clip: AudioClip): void {
        this.clips.set(key, clip);
    }

    playBgm(key: string): void {
        if (!GameManager.instance.settings.soundEnabled) return;

        if (this.currentBgm === key && this.bgmSource?.playing) return;

        const clip = this.clips.get(key);
        if (clip && this.bgmSource) {
            this.currentBgm = key;
            this.bgmSource.stop();
            this.bgmSource.clip = clip;
            this.bgmSource.play();
        }
    }

    stopBgm(): void {
        this.bgmSource?.stop();
        this.currentBgm = '';
    }

    playSfx(type: SfxType): void {
        if (!GameManager.instance.settings.soundEnabled) return;

        const clip = this.clips.get(type);
        if (clip && this.sfxSource) {
            this.sfxSource.playOneShot(clip, GameManager.instance.settings.sfxVolume);
        }
    }

    playCustomSfx(key: string): void {
        if (!GameManager.instance.settings.soundEnabled) return;

        const clip = this.clips.get(key);
        if (clip && this.sfxSource) {
            this.sfxSource.playOneShot(clip, GameManager.instance.settings.sfxVolume);
        }
    }

    playCountdownTick(): void {
        this.playSfx(SfxType.COUNTDOWN);
    }

    private onSettingsChanged(): void {
        this.applySettings();
    }

    private applySettings(): void {
        const settings = GameManager.instance.settings;
        if (this.bgmSource) {
            this.bgmSource.volume = settings.musicVolume;
            if (!settings.soundEnabled) {
                this.bgmSource.pause();
            } else if (this.currentBgm && !this.bgmSource.playing) {
                this.bgmSource.play();
            }
        }
    }
}
