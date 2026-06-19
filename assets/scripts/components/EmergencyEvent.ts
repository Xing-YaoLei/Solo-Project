import { _decorator, Component, Node, tween, UIOpacity } from 'cc';
import { EventConfig, ConfigManager } from '../config/ILevelConfig';
import { PlayerState } from '../core/GameState';
import { EventPopupUI } from './EventPopupUI';

const { ccclass, property } = _decorator;

const EVENT_TIMEOUT_SECONDS = 30;
const TIMEOUT_PENALTY_RATIO = 1.5;

@ccclass('EmergencyEvent')
export class EmergencyEvent extends Component {

    @property({ type: String })
    eventId: string = '';

    private _config: EventConfig | null = null;
    private _isActive: boolean = false;
    private _resolutionChosen: boolean = false;
    private _triggeredAt: number = 0;
    private _popupNode: Node | null = null;
    private _playerState: PlayerState | null = null;

    bindEvent(eventId: string): void {
        this.eventId = eventId;
        const configMgr = ConfigManager.getInstance();
        this._config = configMgr.getEventConfig(eventId);
    }

    setPlayerState(playerState: PlayerState): void {
        this._playerState = playerState;
    }

    trigger(): void {
        if (!this._config) return;
        if (this._isActive) return;

        this._isActive = true;
        this._resolutionChosen = false;
        this._triggeredAt = Date.now();

        this._createPopup();

        this.node.emit('event-triggered', {
            eventId: this.eventId,
            config: this._config,
        });
    }

    onResolutionSelected(resolutionId: string): void {
        if (!this._config || !this._isActive) return;

        const option = this._config.resolutionOptions.find(r => r.id === resolutionId);
        if (!option) return;

        if (this._playerState) {
            this._playerState.timerRemaining = Math.max(
                0,
                this._playerState.timerRemaining - option.timePenalty,
            );
            this._playerState.score -= option.cost;
        }

        this._closePopup();
        this._resolutionChosen = true;
        this._isActive = false;

        this.node.emit('event-resolution-selected', {
            eventId: this.eventId,
            resolutionId,
            cost: option.cost,
            timePenalty: option.timePenalty,
        });
    }

    checkTriggerCondition(elapsedSeconds: number): boolean {
        if (!this._config) return false;
        if (this._isActive) return false;

        const cond = this._config.triggerCondition;
        if (elapsedSeconds < cond.minElapsed) return false;
        if (Math.random() >= cond.probability) return false;

        return true;
    }

    isActive(): boolean {
        return this._isActive;
    }

    dismiss(): void {
        if (!this._isActive) return;

        if (this._playerState && this._config) {
            this._playerState.score -= Math.round(this._config.impactScore * TIMEOUT_PENALTY_RATIO);
        }

        this._closePopup();
        this._isActive = false;

        this.node.emit('event-dismissed', {
            eventId: this.eventId,
            reason: 'timeout',
        });
    }

    update(dt: number): void {
        if (!this._isActive || this._resolutionChosen) return;

        const elapsed = (Date.now() - this._triggeredAt) / 1000;
        if (elapsed >= EVENT_TIMEOUT_SECONDS) {
            this.dismiss();
        }
    }

    private _createPopup(): void {
        if (!this._config) return;

        const popup = new Node('EventPopup');
        this.node.addChild(popup);

        popup.addComponent('cc.UITransform' as any);
        const opacity = popup.addComponent(UIOpacity);
        opacity.opacity = 0;
        tween(opacity)
            .to(0.3, { opacity: 255 })
            .start();

        const popupUI = popup.addComponent(EventPopupUI) as EventPopupUI;
        popupUI.setup(this._config);

        for (const option of this._config.resolutionOptions) {
            popupUI.addResolutionButton(option, (id: string) => {
                this.onResolutionSelected(id);
            });
        }

        this._popupNode = popup;
    }

    private _closePopup(): void {
        if (!this._popupNode || !this._popupNode.isValid) {
            this._popupNode = null;
            return;
        }

        const opacity = this._popupNode.getComponent(UIOpacity);
        if (opacity) {
            tween(opacity)
                .to(0.2, { opacity: 0 }, {
                    onComplete: () => {
                        if (this._popupNode && this._popupNode.isValid) {
                            this._popupNode.destroy();
                        }
                        this._popupNode = null;
                    },
                })
                .start();
        } else {
            this._popupNode.destroy();
            this._popupNode = null;
        }
    }
}
