import { _decorator, Component, Node, Vec3, tween } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
const { ccclass, property } = _decorator;

export interface ShakeConfig {
    duration: number;
    strength: number;
    frequency?: number;
}

@ccclass('ScreenShake')
export class ScreenShake extends Component {
    @property(Node)
    public targetNode: Node | null = null;

    @property
    public defaultStrength: number = 5;

    @property
    public defaultDuration: number = 0.3;

    private _originalPos: Vec3 = new Vec3();
    private _isShaking: boolean = false;

    onLoad() {
        EventManager.getInstance().on(GameEvents.SCREEN_SHAKE, this.onShake.bind(this));
    }

    start() {
        if (this.targetNode) {
            this._originalPos.set(this.targetNode.position);
        }
    }

    onDestroy() {
        EventManager.getInstance().off(GameEvents.SCREEN_SHAKE, this.onShake.bind(this));
    }

    private onShake(config: ShakeConfig): void {
        this.shake(
            config.duration || this.defaultDuration,
            config.strength || this.defaultStrength,
            config.frequency || 20
        );
    }

    public shake(duration: number, strength: number, frequency: number = 20): void {
        if (!this.targetNode) return;
        if (this._isShaking) return;

        this._isShaking = true;
        this._originalPos.set(this.targetNode.position);

        const totalFrames = Math.ceil(duration * 60);
        const interval = duration / totalFrames;
        let frame = 0;

        const shakeFrame = () => {
            if (frame >= totalFrames) {
                this.targetNode!.setPosition(this._originalPos);
                this._isShaking = false;
                return;
            }

            const progress = frame / totalFrames;
            const decay = 1 - progress;
            const currentStrength = strength * decay;

            const offsetX = (Math.random() * 2 - 1) * currentStrength;
            const offsetY = (Math.random() * 2 - 1) * currentStrength;

            this.targetNode!.setPosition(
                this._originalPos.x + offsetX,
                this._originalPos.y + offsetY,
                this._originalPos.z
            );

            frame++;
            this.scheduleOnce(shakeFrame, interval);
        };

        shakeFrame();
    }

    public stop(): void {
        this._isShaking = false;
        if (this.targetNode) {
            this.targetNode.setPosition(this._originalPos);
        }
    }

    public isShaking(): boolean {
        return this._isShaking;
    }
}
