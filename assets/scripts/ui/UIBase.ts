import { _decorator, Component, Node, Label, Button, Sprite, UITransform, Vec3, tween } from 'cc';
import { EventManager, GameEvents } from '../utils/EventManager';
import { InputManager, InputAction } from '../managers/InputManager';

const { ccclass, property } = _decorator;

@ccclass('UIBase')
export class UIBase extends Component {
    protected _eventHandlers: Map<string, (...args: any[]) => void> = new Map();
    protected _inputHandlers: Map<string, (source: string) => void> = new Map();

    onLoad(): void {
        this.onInit();
    }

    start(): void {
        this.onStart();
    }

    onDestroy(): void {
        this.removeAllListeners();
        this.removeAllInputListeners();
        this.onCleanup();
    }

    protected onInit(): void {
    }

    protected onStart(): void {
    }

    protected onCleanup(): void {
    }

    public show(): void {
        this.node.active = true;
        this.onShow();
    }

    public hide(): void {
        this.node.active = false;
        this.onHide();
    }

    protected onShow(): void {
    }

    protected onHide(): void {
    }

    protected on(event: string, handler: (...args: any[]) => void): void {
        EventManager.instance.on(event, handler, this);
        this._eventHandlers.set(event, handler);
    }

    protected off(event: string): void {
        EventManager.instance.off(event, this);
        this._eventHandlers.delete(event);
    }

    protected removeAllListeners(): void {
        for (const [event] of this._eventHandlers) {
            EventManager.instance.off(event, this);
        }
        this._eventHandlers.clear();
    }

    protected emit(event: string, ...args: any[]): void {
        EventManager.instance.emit(event, ...args);
    }

    protected registerInput(action: InputAction, handler: (source: string) => void): void {
        this._inputHandlers.set(action, handler);
        if (this._inputHandlers.size === 1) {
            this.on(GameEvents.INPUT_ACTION, this.handleInput.bind(this));
        }
    }

    protected removeInput(action: InputAction): void {
        this._inputHandlers.delete(action);
        if (this._inputHandlers.size === 0) {
            this.off(GameEvents.INPUT_ACTION);
        }
    }

    protected removeAllInputListeners(): void {
        this._inputHandlers.clear();
        this.off(GameEvents.INPUT_ACTION);
    }

    private handleInput(action: InputAction, source: string): void {
        if (!this.node.active) return;
        const handler = this._inputHandlers.get(action);
        if (handler) {
            handler(source);
        }
    }

    protected findNode(path: string): Node | null {
        return this.node.getChildByPath(path);
    }

    protected getLabel(path: string): Label | null {
        const node = this.findNode(path);
        return node ? node.getComponent(Label) : null;
    }

    protected getButton(path: string): Button | null {
        const node = this.findNode(path);
        return node ? node.getComponent(Button) : null;
    }

    protected getSprite(path: string): Sprite | null {
        const node = this.findNode(path);
        return node ? node.getComponent(Sprite) : null;
    }

    protected setLabelText(path: string, text: string): void {
        const label = this.getLabel(path);
        if (label) {
            label.string = text;
        }
    }

    protected playShowAnimation(): void {
        this.node.setScale(0.8, 0.8, 0.8);
        this.node.opacity = 0;
        tween(this.node)
            .to(0.2, { scale: new Vec3(1, 1, 1), opacity: 255 })
            .start();
    }

    protected playHideAnimation(callback?: () => void): void {
        tween(this.node)
            .to(0.15, { scale: new Vec3(0.9, 0.9, 0.9), opacity: 0 })
            .call(() => {
                if (callback) callback();
            })
            .start();
    }

    protected bindButtonClick(buttonNode: Node | null, handler: () => void): void {
        if (!buttonNode) return;
        buttonNode.on(Node.EventType.TOUCH_END, (event: any) => {
            event.stopPropagation();
            handler();
        }, this);
    }
}
