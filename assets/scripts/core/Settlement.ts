import { _decorator, Component, Label, Node, tween } from 'cc';
import { VehicleProfile } from './VehicleProfile';

const { ccclass, property } = _decorator;

@ccclass('SettlementComponent')
export class SettlementComponent extends Component {

    @property({ type: Label, tooltip: '分数显示标签' })
    scoreLabel: Label | null = null;

    @property({ type: Label, tooltip: '准确率显示标签' })
    accuracyLabel: Label | null = null;

    @property({ type: Label, tooltip: '成本显示标签' })
    costLabel: Label | null = null;

    @property({ type: Label, tooltip: '返修次数显示标签' })
    reworkLabel: Label | null = null;

    @property({ type: Label, tooltip: '用时显示标签' })
    timeLabel: Label | null = null;

    @property({ type: Node, tooltip: '继续按钮节点' })
    continueBtn: Node | null = null;

    @property({ type: Node, tooltip: '重试按钮节点' })
    retryBtn: Node | null = null;

    private _displayScore: number = 0;

    onLoad(): void {
        if (this.continueBtn) {
            this.continueBtn.on(Node.EventType.TOUCH_END, this.onContinuePressed, this);
        }
        if (this.retryBtn) {
            this.retryBtn.on(Node.EventType.TOUCH_END, this.onRetryPressed, this);
        }
    }

    onDestroy(): void {
        if (this.continueBtn) {
            this.continueBtn.off(Node.EventType.TOUCH_END, this.onContinuePressed, this);
        }
        if (this.retryBtn) {
            this.retryBtn.off(Node.EventType.TOUCH_END, this.onRetryPressed, this);
        }
    }

    showSettlement(profile: VehicleProfile, score: number, timeUsed: number): void {
        const accuracy = profile.getReworkRate() !== undefined
            ? 1 - profile.getReworkRate()
            : 0;

        if (this.scoreLabel) {
            this._animateScore(score);
        }
        if (this.accuracyLabel) {
            this.accuracyLabel.string = `${Math.round(accuracy * 100)}% ${this._calculateGrade(accuracy)}`;
        }
        if (this.costLabel) {
            this.costLabel.string = `¥${profile.totalCost.toFixed(0)}`;
        }
        if (this.reworkLabel) {
            this.reworkLabel.string = `${profile.reworkCount}次`;
        }
        if (this.timeLabel) {
            const seconds = Math.floor(timeUsed % 60);
            this.timeLabel.string = `${Math.floor(timeUsed / 60)}:${seconds < 10 ? '0' + seconds : seconds}`;
        }
    }

    _calculateGrade(accuracy: number): string {
        if (accuracy >= 0.95) return 'S';
        if (accuracy >= 0.85) return 'A';
        if (accuracy >= 0.70) return 'B';
        if (accuracy >= 0.50) return 'C';
        return 'D';
    }

    onContinuePressed(): void {
        this.node.emit('settlement-continue');
    }

    onRetryPressed(): void {
        this.node.emit('settlement-retry');
    }

    _animateScore(targetScore: number): void {
        this._displayScore = 0;
        if (this.scoreLabel) {
            this.scoreLabel.string = '0';
        }

        const proxy = { value: 0 };
        tween(proxy)
            .to(1.5, { value: targetScore }, {
                onUpdate: () => {
                    this._displayScore = Math.round(proxy.value);
                    if (this.scoreLabel) {
                        this.scoreLabel.string = String(this._displayScore);
                    }
                },
            })
            .start();
    }
}
