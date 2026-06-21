import { _decorator, Component, Node, Label, Sprite, Color, Graphics, Vec3, UITransform } from 'cc';
import { Rider, TrajectoryPoint } from '../types/GameTypes';

const { ccclass, property } = _decorator;

@ccclass('RiderWarningSystem')
export class RiderWarningSystem extends Component {
    @property(Node)
    warningIndicatorPrefab: Node | null = null;

    @property(Node)
    warningContainer: Node | null = null;

    @property(Label)
    warningMessageLabel: Label | null = null;

    @property(Sprite)
    warningFlash: Sprite | null = null;

    private warningIndicators: Map<string, Node> = new Map();
    private activeWarnings: Array<{
        riderId: string;
        level: number;
        message: string;
        timestamp: number;
    }> = [];
    private flashTimer: number = 0;
    private isFlashing: boolean = false;

    update(deltaTime: number) {
        if (this.isFlashing) {
            this.flashTimer += deltaTime;
            if (this.flashTimer >= 0.5) {
                this.flashTimer = 0;
                this.isFlashing = false;
                if (this.warningFlash) {
                    this.warningFlash.node.active = false;
                }
            }
        }

        this.cleanupOldWarnings();
    }

    showRejectionWarning(rider: Rider, warningLevel: number, estimatedTime: number) {
        const warnings = [
            '',
            `${rider.name} 接单意愿较低`,
            `${rider.name} 很可能拒单！`,
            `${rider.name} 即将拒单，立即处理！`,
        ];

        const colors = [
            new Color(255, 255, 255),
            new Color(255, 200, 0),
            new Color(255, 100, 0),
            new Color(255, 0, 0),
        ];

        if (warningLevel > 0 && warningLevel <= 3) {
            this.showWarning(
                rider.id,
                warningLevel,
                warnings[warningLevel],
                colors[warningLevel]
            );

            if (warningLevel >= 2) {
                this.triggerFlash(colors[warningLevel]);
            }

            this.updateWarningIndicator(rider, warningLevel);
        }
    }

    private showWarning(riderId: string, level: number, message: string, color: Color) {
        if (this.warningMessageLabel) {
            this.warningMessageLabel.string = message;
            this.warningMessageLabel.color = color;
            this.warningMessageLabel.node.active = true;
        }

        this.activeWarnings.push({
            riderId,
            level,
            message,
            timestamp: Date.now(),
        });

        this.scheduleOnce(() => {
            if (this.warningMessageLabel) {
                this.warningMessageLabel.node.active = false;
            }
        }, 3);
    }

    private triggerFlash(color: Color) {
        if (!this.warningFlash) return;

        this.warningFlash.color = color;
        this.warningFlash.node.active = true;
        this.isFlashing = true;
        this.flashTimer = 0;
    }

    private updateWarningIndicator(rider: Rider, warningLevel: number) {
        if (!this.warningContainer || !this.warningIndicatorPrefab) return;

        let indicator = this.warningIndicators.get(rider.id);
        if (!indicator) {
            indicator = this.warningIndicatorPrefab.clone();
            this.warningContainer.addChild(indicator);
            this.warningIndicators.set(rider.id, indicator);
        }

        const positionNode = indicator.getChildByName('Position');
        const levelLabel = indicator.getComponentInChildren(Label);

        if (positionNode) {
            positionNode.setPosition(rider.position.x, rider.position.y, 0);
        }

        if (levelLabel) {
            levelLabel.string = `⚠${'!'.repeat(warningLevel)}`;
            const colors = [
                new Color(255, 255, 255, 0),
                new Color(255, 200, 0, 255),
                new Color(255, 100, 0, 255),
                new Color(255, 0, 0, 255),
            ];
            levelLabel.color = colors[warningLevel] || colors[0];
        }

        indicator.active = warningLevel > 0;

        this.scheduleOnce(() => {
            if (indicator && this.warningIndicators.get(rider.id) === indicator) {
                indicator.active = false;
            }
        }, 5);
    }

    clearWarning(riderId: string) {
        const indicator = this.warningIndicators.get(riderId);
        if (indicator) {
            indicator.active = false;
        }

        this.activeWarnings = this.activeWarnings.filter(w => w.riderId !== riderId);
    }

    private cleanupOldWarnings() {
        const now = Date.now();
        this.activeWarnings = this.activeWarnings.filter(w => now - w.timestamp < 5000);
    }

    clearAllWarnings() {
        this.warningIndicators.forEach(indicator => {
            indicator.active = false;
        });
        this.activeWarnings = [];
        if (this.warningMessageLabel) {
            this.warningMessageLabel.node.active = false;
        }
        if (this.warningFlash) {
            this.warningFlash.node.active = false;
        }
    }

    getActiveWarnings(): Array<{ riderId: string; level: number; message: string }> {
        return this.activeWarnings.map(w => ({
            riderId: w.riderId,
            level: w.level,
            message: w.message,
        }));
    }
}
