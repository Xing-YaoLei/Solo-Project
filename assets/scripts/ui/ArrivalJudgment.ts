import { _decorator, Component, Node, Label, Button, Color } from "cc";
import { ArrivalStatus } from "../appointment/Customer";
import { AppointmentSystem, ArrivalCheckResult } from "../appointment/AppointmentSystem";
import { ScoreManager } from "../game/ScoreManager";
import { ReplayActionType } from "../replay/ReplayTypes";
import { ReplaySystem } from "../replay/ReplaySystem";

const { ccclass, property } = _decorator;

export interface ArrivalJudgmentEvent {
    customerId: string;
    judgedStatus: ArrivalStatus;
}

@ccclass("ArrivalJudgment")
export class ArrivalJudgment extends Component {
    @property(Label)
    customerNameLabel: Label | null = null;

    @property(Label)
    customerPhoneLabel: Label | null = null;

    @property(Label)
    serviceLabel: Label | null = null;

    @property(Label)
    preferredTimeLabel: Label | null = null;

    @property(Label)
    countdownLabel: Label | null = null;

    @property(Node)
    buttonGroup: Node | null = null;

    private _appointmentSystem: AppointmentSystem | null = null;
    private _scoreManager: ScoreManager | null = null;
    private _replaySystem: ReplaySystem | null = null;
    private _currentCustomerId: string = "";
    private _judgmentTimeLimit: number = 10;
    private _judgmentTimer: number = 0;
    private _isJudging: boolean = false;
    private _onJudgment: ((event: ArrivalJudgmentEvent) => void)[] = [];

    onJudgment(callback: (event: ArrivalJudgmentEvent) => void): void {
        this._onJudgment.push(callback);
    }

    bindSystems(appointmentSystem: AppointmentSystem, scoreManager: ScoreManager, replaySystem: ReplaySystem): void {
        this._appointmentSystem = appointmentSystem;
        this._scoreManager = scoreManager;
        this._replaySystem = replaySystem;
    }

    showJudgment(customerId: string, timeLimit: number = 10): void {
        this._currentCustomerId = customerId;
        this._judgmentTimeLimit = timeLimit;
        this._judgmentTimer = timeLimit;
        this._isJudging = true;
        this.node.active = true;

        this._updateDisplay();

        this._setupButtons();
    }

    hide(): void {
        this._isJudging = false;
        this.node.active = false;
    }

    update(dt: number): void {
        if (!this._isJudging) return;

        this._judgmentTimer -= dt;
        if (this.countdownLabel) {
            this.countdownLabel.string = `剩余 ${Math.ceil(this._judgmentTimer)} 秒`;
            if (this._judgmentTimer <= 3) {
                this.countdownLabel.color = Color.RED;
            } else {
                this.countdownLabel.color = Color.BLACK;
            }
        }

        if (this._judgmentTimer <= 0) {
            this._autoJudge();
        }
    }

    private _updateDisplay(): void {
        if (!this._appointmentSystem) return;

        const customer = this._appointmentSystem.customers.get(this._currentCustomerId);
        if (!customer) return;

        if (this.customerNameLabel) {
            this.customerNameLabel.string = customer.name;
        }
        if (this.customerPhoneLabel) {
            this.customerPhoneLabel.string = customer.phone;
        }
        if (this.serviceLabel) {
            const service = this._appointmentSystem.services.get(customer.serviceId);
            this.serviceLabel.string = service ? service.name : customer.serviceId;
        }
        if (this.preferredTimeLabel) {
            this.preferredTimeLabel.string = `预约时间: ${customer.preferredTime}`;
        }
    }

    private _setupButtons(): void {
        if (!this.buttonGroup) return;

        const statuses: ArrivalStatus[] = [
            ArrivalStatus.ARRIVED,
            ArrivalStatus.LATE,
            ArrivalStatus.NO_SHOW,
            ArrivalStatus.CANCELLED
        ];

        const statusNames: string[] = ["已到场", "迟到", "未到场", "已取消"];

        this.buttonGroup.removeAllChildren();

        for (let i = 0; i < statuses.length; i++) {
            const btn = new Node(`btn_${statuses[i]}`);
            const label = btn.addComponent(Label);
            label.string = statusNames[i];
            btn.addComponent(Button);

            const status = statuses[i];
            btn.on(Node.EventType.TOUCH_END, () => {
                this._makeJudgment(status);
            });

            this.buttonGroup.addChild(btn);
        }
    }

    private _makeJudgment(status: ArrivalStatus): void {
        if (!this._appointmentSystem || !this._scoreManager) return;

        const result = this._appointmentSystem.checkArrival(this._currentCustomerId, status);
        this._scoreManager.recordArrivalCheck(result);

        if (this._replaySystem) {
            this._replaySystem.recordAction({
                type: ReplayActionType.ARRIVAL_CHECK,
                customerId: this._currentCustomerId,
                previousStatus: result.previousStatus,
                newStatus: result.newStatus,
                isCorrect: result.isCorrect,
                timestamp: Date.now(),
                gameTime: 0
            });
        }

        if (!result.isCorrect) {
            this._showJudgmentFeedback(false, result.previousStatus, status);
        } else {
            this._showJudgmentFeedback(true, status, status);
        }

        for (const cb of this._onJudgment) {
            cb({ customerId: this._currentCustomerId, judgedStatus: status });
        }

        this._isJudging = false;
    }

    private _autoJudge(): void {
        this._makeJudgment(ArrivalStatus.PENDING);
    }

    private _showJudgmentFeedback(correct: boolean, expected: ArrivalStatus, actual: ArrivalStatus): void {
        if (correct) {
            if (this.countdownLabel) {
                this.countdownLabel.string = "✓ 判断正确";
                this.countdownLabel.color = Color.GREEN;
            }
        } else {
            if (this.countdownLabel) {
                this.countdownLabel.string = `✗ 应为: ${expected}`;
                this.countdownLabel.color = Color.RED;
            }
        }
    }
}
