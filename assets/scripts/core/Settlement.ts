import { _decorator, Component, Label, tween } from 'cc';
import { VehicleProfile } from './VehicleProfile';

const { ccclass, property } = _decorator;

@ccclass('SettlementComponent')
export class SettlementComponent extends Component {

    @property({ type: Label })
    scoreLabel: Label | null = null;

    @property({ type: Label })
    accuracyLabel: Label | null = null;

    @property({ type: Label })
    costLabel: Label | null = null;

    @property({ type: Label })
    reworkLabel: Label | null = null;

    @property({ type: Label })
    timeLabel: Label | null = null;

    private _displayScore: number = 0;

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
