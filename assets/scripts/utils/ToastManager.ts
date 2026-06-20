import { _decorator, Component, Label, Node, Color, tween, Vec3, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ToastManager')
export class ToastManager extends Component {
    private static _instance: ToastManager | null = null;

    public static get instance(): ToastManager {
        return ToastManager._instance!;
    }

    @property(Node)
    toastContainer: Node | null = null;

    @property(Label)
    toastLabel: Node | null = null;

    private toastQueue: { message: string; type: string }[] = [];
    private isShowing: boolean = false;

    onLoad() {
        if (ToastManager._instance && ToastManager._instance !== this) {
            this.node.destroy();
            return;
        }
        ToastManager._instance = this;

        if (this.toastContainer) {
            this.toastContainer.active = false;
        }
    }

    onDestroy() {
        if (ToastManager._instance === this) {
            ToastManager._instance = null;
        }
    }

    public showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 1.5): void {
        this.toastQueue.push({ message, type });
        if (!this.isShowing) {
            this.showNextToast(duration);
        }
    }

    private showNextToast(duration: number): void {
        if (this.toastQueue.length === 0) {
            this.isShowing = false;
            return;
        }

        this.isShowing = true;
        const toast = this.toastQueue.shift()!;

        if (!this.toastContainer || !this.toastLabel) {
            this.isShowing = false;
            return;
        }

        const labelComp = this.toastLabel.getComponent(Label);
        if (labelComp) {
            labelComp.string = toast.message;
        }

        let color = Color.WHITE;
        switch (toast.type) {
            case 'success':
                color = new Color(76, 175, 80);
                break;
            case 'error':
                color = new Color(244, 67, 54);
                break;
            default:
                color = new Color(33, 150, 243);
                break;
        }
        if (labelComp) {
            labelComp.color = color;
        }

        this.toastContainer.active = true;
        const opacity = this.toastContainer.getComponent(UIOpacity) || this.toastContainer.addComponent(UIOpacity);
        opacity.opacity = 0;

        tween(opacity)
            .to(0.2, { opacity: 255 })
            .delay(duration)
            .to(0.3, { opacity: 0 })
            .call(() => {
                if (this.toastContainer) {
                    this.toastContainer.active = false;
                }
                this.showNextToast(duration);
            })
            .start();
    }

    public showSuccess(message: string): void {
        this.showToast(message, 'success');
    }

    public showError(message: string): void {
        this.showToast(message, 'error');
    }

    public showInfo(message: string): void {
        this.showToast(message, 'info');
    }
}
