import { _decorator, Component, sys } from "cc";

const { ccclass } = _decorator;

@ccclass("VibrationManager")
export class VibrationManager extends Component {
    private static _instance: VibrationManager | null = null;
    private enabled: boolean = true;

    public static get instance(): VibrationManager | null {
        return VibrationManager._instance;
    }

    onLoad(): void {
        if (VibrationManager._instance && VibrationManager._instance !== this) {
            this.destroy();
            return;
        }
        VibrationManager._instance = this;
    }

    onDestroy(): void {
        if (VibrationManager._instance === this) {
            VibrationManager._instance = null;
        }
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    public light(): void {
        if (!this.enabled) return;
        this.vibrate(15);
    }

    public medium(): void {
        if (!this.enabled) return;
        this.vibrate(30);
    }

    public heavy(): void {
        if (!this.enabled) return;
        this.vibrate(50);
    }

    private vibrate(duration: number): void {
        if (sys.os === sys.OS.IOS || sys.os === sys.OS.ANDROID) {
            if (typeof window !== "undefined" && (window as any).navigator?.vibrate) {
                (window as any).navigator.vibrate(duration);
            }
        }
    }
}
