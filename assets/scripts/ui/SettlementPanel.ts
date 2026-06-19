import { _decorator, Component, Node, Label, Color, Sprite, Vec3, tween, UITransform, ProgressBar } from "cc";
import { ReviewStats, BottleneckRecord } from "../models/Config";
import { GameManager, GameState } from "../managers/GameManager";

const { ccclass } = _decorator;

@ccclass("SettlementPanel")
export class SettlementPanel extends Component {
    private stats: ReviewStats | null = null;
    private onNextCallback: (() => void) | null = null;
    private onRetryCallback: (() => void) | null = null;

    public init(stats: ReviewStats): void {
        this.stats = stats;
        this.updateVisual();
    }

    private updateVisual(): void {
        if (!this.stats) return;

        const revenueNode = this.node.getChildByName("revenue");
        if (revenueNode) {
            const label = revenueNode.getComponent(Label);
            if (label) {
                label.string = `总收入: ¥${this.stats.totalRevenue}`;
            }
        }

        const penaltyNode = this.node.getChildByName("penalty");
        if (penaltyNode) {
            const label = penaltyNode.getComponent(Label);
            if (label) {
                label.string = `扣罚: ¥${this.stats.totalPenalty}`;
                label.color = this.stats.totalPenalty > 0 ? Color.RED : Color.GREEN;
            }
        }

        const netNode = this.node.getChildByName("net");
        if (netNode) {
            const label = netNode.getComponent(Label);
            if (label) {
                const net = this.stats.totalRevenue - this.stats.totalPenalty;
                label.string = `净收入: ¥${net}`;
            }
        }

        const occupancyNode = this.node.getChildByName("occupancy");
        if (occupancyNode) {
            const label = occupancyNode.getComponent(Label);
            if (label) {
                label.string = `入住率: ${(this.stats.occupancyRate * 100).toFixed(1)}%`;
            }
        }

        const tasksNode = this.node.getChildByName("tasks");
        if (tasksNode) {
            const label = tasksNode.getComponent(Label);
            if (label) {
                label.string = `完成任务: ${this.stats.totalCompletedTasks} / 失败: ${this.stats.totalFailedTasks}`;
            }
        }

        const conflictNode = this.node.getChildByName("conflict");
        if (conflictNode) {
            const label = conflictNode.getComponent(Label);
            if (label) {
                label.string = `冲突解决率: ${(this.stats.conflictResolutionRate * 100).toFixed(1)}%`;
            }
        }

        const timeNode = this.node.getChildByName("time");
        if (timeNode) {
            const label = timeNode.getComponent(Label);
            if (label) {
                const mins = Math.floor(this.stats.completionTime / 60);
                const secs = Math.floor(this.stats.completionTime % 60);
                label.string = `用时: ${mins}分${secs}秒`;
            }
        }

        const starsNode = this.node.getChildByName("stars");
        if (starsNode) {
            const label = starsNode.getComponent(Label);
            if (label) {
                label.string = "★".repeat(this.stats.starRating) + "☆".repeat(3 - this.stats.starRating);
                label.fontSize = 32;
                label.color = Color.YELLOW;
            }
        }

        this.playSettlementAnimation();
    }

    private playSettlementAnimation(): void {
        const gm = GameManager.instance;
        const settings = gm?.getSettings();
        const intensity = settings?.animationIntensity ?? 1.0;

        if (intensity <= 0) return;

        this.node.setScale(0, 0, 1);

        tween(this.node)
            .to(0.5, { scale: new Vec3(1.05, 1.05, 1) }, { easing: "backOut" })
            .to(0.1, { scale: new Vec3(1.0, 1.0, 1) })
            .start();
    }

    public onReviewClicked(): void {
        const gm = GameManager.instance;
        if (gm) {
            gm.enterReview();
        }
    }

    public onNextClicked(): void {
        if (this.onNextCallback) {
            this.onNextCallback();
        }
    }

    public onRetryClicked(): void {
        if (this.onRetryCallback) {
            this.onRetryCallback();
        }
    }

    public setOnNext(cb: () => void): void {
        this.onNextCallback = cb;
    }

    public setOnRetry(cb: () => void): void {
        this.onRetryCallback = cb;
    }
}

@ccclass("ReviewPanel")
export class ReviewPanel extends Component {
    private stats: ReviewStats | null = null;
    private onBackCallback: (() => void) | null = null;

    public init(stats: ReviewStats): void {
        this.stats = stats;
        this.updateVisual();
    }

    private updateVisual(): void {
        if (!this.stats) return;

        const titleNode = this.node.getChildByName("title");
        if (titleNode) {
            const label = titleNode.getComponent(Label);
            if (label) {
                label.string = "经营复盘";
                label.fontSize = 28;
            }
        }

        const occupancyNode = this.node.getChildByName("occupancy");
        if (occupancyNode) {
            const label = occupancyNode.getComponent(Label);
            if (label) {
                label.string = `入住率: ${(this.stats.occupancyRate * 100).toFixed(1)}%`;
            }

            const barNode = occupancyNode.getChildByName("bar");
            if (barNode) {
                const pb = barNode.getComponent(ProgressBar);
                if (pb) {
                    pb.progress = this.stats.occupancyRate;
                }
            }
        }

        const timeNode = this.node.getChildByName("time");
        if (timeNode) {
            const label = timeNode.getComponent(Label);
            if (label) {
                const mins = Math.floor(this.stats.completionTime / 60);
                const secs = Math.floor(this.stats.completionTime % 60);
                label.string = `完成时间: ${mins}分${secs}秒`;
            }
        }

        const taskNode = this.node.getChildByName("taskStats");
        if (taskNode) {
            const label = taskNode.getComponent(Label);
            if (label) {
                const total = this.stats.totalCompletedTasks + this.stats.totalFailedTasks;
                const rate = total > 0 ? (this.stats.totalCompletedTasks / total * 100).toFixed(1) : "0";
                label.string = `任务完成率: ${rate}% (${this.stats.totalCompletedTasks}/${total})`;
            }
        }

        const conflictNode = this.node.getChildByName("conflictStats");
        if (conflictNode) {
            const label = conflictNode.getComponent(Label);
            if (label) {
                label.string = `冲突解决率: ${(this.stats.conflictResolutionRate * 100).toFixed(1)}%`;
            }
        }

        const revenueNode = this.node.getChildByName("revenueStats");
        if (revenueNode) {
            const label = revenueNode.getComponent(Label);
            if (label) {
                label.string = `净收入: ¥${this.stats.totalRevenue - this.stats.totalPenalty}`;
            }
        }

        this.renderBottlenecks();
    }

    private renderBottlenecks(): void {
        if (!this.stats) return;

        const container = this.node.getChildByName("bottlenecks");
        if (!container) return;

        const existing = container.children;
        for (let i = existing.length - 1; i >= 0; i--) {
            existing[i].destroy();
        }

        const bottlenecks = this.stats.playerBottlenecks;
        if (bottlenecks.length === 0) {
            const emptyNode = new Node("empty");
            emptyNode.addComponent(UITransform).setContentSize(300, 30);
            const emptyLabel = emptyNode.addComponent(Label);
            emptyLabel.fontSize = 14;
            emptyLabel.string = "暂无明显卡点，表现出色！";
            emptyLabel.color = Color.GREEN;
            emptyNode.setPosition(0, 50, 0);
            emptyNode.parent = container;
            return;
        }

        const headerNode = new Node("header");
        headerNode.addComponent(UITransform).setContentSize(300, 24);
        const headerLabel = headerNode.addComponent(Label);
        headerLabel.fontSize = 16;
        headerLabel.string = "卡点分析";
        headerLabel.color = Color.YELLOW;
        headerNode.setPosition(0, 80, 0);
        headerNode.parent = container;

        const sorted = [...bottlenecks].sort((a, b) => b.duration - a.duration);
        const topBottlenecks = sorted.slice(0, 5);

        for (let i = 0; i < topBottlenecks.length; i++) {
            const bn = topBottlenecks[i];
            const itemNode = new Node(`bn_${i}`);
            itemNode.addComponent(UITransform).setContentSize(350, 30);
            const itemLabel = itemNode.addComponent(Label);
            itemLabel.fontSize = 12;
            itemLabel.horizontalAlign = Label.HorizontalAlign.LEFT;

            const typeNames: Record<string, string> = {
                conflict_appeared: "冲突出现",
                conflict_resolved: "冲突解决",
                conflict_timeout: "冲突超时",
                order_expired: "订单过期",
                task_failed: "任务失败"
            };
            const typeName = typeNames[bn.type] || bn.type;
            itemLabel.string = `${typeName} | ${bn.duration.toFixed(1)}s | ${bn.description}`;

            if (bn.type.includes("timeout") || bn.type.includes("failed")) {
                itemLabel.color = Color.RED;
            } else {
                itemLabel.color = Color.WHITE;
            }

            itemNode.setPosition(0, 50 - i * 30, 0);
            itemNode.parent = container;
        }
    }

    public onBackClicked(): void {
        if (this.onBackCallback) {
            this.onBackCallback();
        }
    }

    public setOnBack(cb: () => void): void {
        this.onBackCallback = cb;
    }
}
