import { _decorator, Component, Node, sys } from 'cc';
import { GameManager, GameEvent } from './GameManager';
const { ccclass } = _decorator;

export enum VibrationType {
    LIGHT = 'light',
    MEDIUM = 'medium',
    HEAVY = 'heavy',
    SUCCESS = 'success',
    ERROR = 'error',
    WARNING = 'warning'
}

export enum AnimationIntensity {
    OFF = 'off',
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
}

@ccclass('FeedbackManager')
export class FeedbackManager extends Component {
    private static _instance: FeedbackManager | null = null;

    public static get instance(): FeedbackManager {
        if (!this._instance) {
            const node = new Node('FeedbackManager');
            this._instance = node.addComponent(FeedbackManager);
        }
        return this._instance;
    }

    private settings: any = null;

    onLoad() {
        this.settings = GameManager.instance.settings;
        GameManager.instance.on(GameEvent.SETTINGS_CHANGED, this.onSettingsChanged, this);
    }

    onDestroy() {
        GameManager.instance.off(GameEvent.SETTINGS_CHANGED, this.onSettingsChanged, this);
    }

    vibrate(type: VibrationType): void {
        if (!this.settings.vibrationEnabled) return;

        let duration = 10;
        switch (type) {
            case VibrationType.LIGHT:
                duration = 10;
                break;
            case VibrationType.MEDIUM:
                duration = 30;
                break;
            case VibrationType.HEAVY:
                duration = 80;
                break;
            case VibrationType.SUCCESS:
                this.vibratePattern([20, 30, 20]);
                return;
            case VibrationType.ERROR:
                this.vibratePattern([100, 50, 100]);
                return;
            case VibrationType.WARNING:
                this.vibratePattern([50, 30, 50, 30, 50]);
                return;
        }

        if (typeof sys !== 'undefined' && sys.os === sys.OS.ANDROID || sys.os === sys.OS.IOS) {
            try {
                if (navigator && (navigator as any).vibrate) {
                    (navigator as any).vibrate(duration);
                }
            } catch (e) {
            }
        }
    }

    private vibratePattern(pattern: number[]): void {
        if (!this.settings.vibrationEnabled) return;

        try {
            if (navigator && (navigator as any).vibrate) {
                (navigator as any).vibrate(pattern);
            }
        } catch (e) {
        }
    }

    getAnimationDuration(base: number): number {
        switch (this.settings.animationIntensity) {
            case 'off':
                return 0;
            case 'low':
                return base * 0.5;
            case 'medium':
                return base;
            case 'high':
                return base * 1.3;
            default:
                return base;
        }
    }

    getAnimationScale(base: number): number {
        switch (this.settings.animationIntensity) {
            case 'off':
                return 1;
            case 'low':
                return 1 + (base - 1) * 0.3;
            case 'medium':
                return base;
            case 'high':
                return base + (base - 1) * 0.5;
            default:
                return base;
        }
    }

    shouldAnimate(): boolean {
        return this.settings.animationIntensity !== 'off';
    }

    onSettingsChanged(settings: any): void {
        this.settings = settings;
    }
}
