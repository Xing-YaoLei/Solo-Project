import { _decorator, Component, Node, Label, Sprite, ProgressBar, Color, ScrollView, UITransform } from 'cc';
import { GameTypes } from '../types/GameTypes';
import { ConfigTypes } from '../types/ConfigTypes';
import { GameManager } from '../core/GameManager';
import { SaveManager } from '../core/SaveManager';

const { ccclass, property } = _decorator;

@ccclass('BillingItemRow')
export class BillingItemRow extends Component {

    @property(Label)
    nameLabel: Label | null = null;

    @property(Label)
    codeLabel: Label | null = null;

    @property(Label)
    costLabel: Label | null = null;

    @property(Label)
    insuranceLabel: Label | null = null;

    @property(Label)
    statusLabel: Label | null = null;

    public setup(item: GameTypes.BillingItem): void {
        if (this.nameLabel) this.nameLabel.string = item.name;
        if (this.codeLabel) this.codeLabel.string = item.insuranceCode;
        if (this.costLabel) this.costLabel.string = `¥${item.totalCost.toFixed(2)}`;
        if (this.insuranceLabel) this.insuranceLabel.string = `¥${item.insuranceCovered.toFixed(2)}`;
        if (this.statusLabel) {
            if (item.isDenied) {
                this.statusLabel.string = `❌ 拒付`;
                this.statusLabel.color = new Color(198, 40, 40);
            } else {
                this.statusLabel.string = `✅ 通过`;
                this.statusLabel.color = new Color(46, 125, 50);
            }
        }
    }
}

@ccclass('SettlementPanel')
export class SettlementPanel extends Component {

    @property(Node)
    successSection: Node | null = null;

    @property(Node)
    failureSection: Node | null = null;

    @property(Label)
    levelNameLabel: Label | null = null;

    @property(Label)
    totalScoreLabel: Label | null = null;

    @property(Label)
    passScoreLabel: Label | null = null;

    @property(ProgressBar)
    scoreProgressBar: ProgressBar | null = null;

    @property(Node)
    starLabel: Node | null = null;

    @property(Label)
    timeSpentLabel: Label | null = null;

    @property(Node)
    correctCountLabel: Node | null = null;

    @property(Node)
    insuranceTriggeredLabel: Node | null = null;

    @property(Node)
    rewardsSection: Node | null = null;

    @property(Label)
    expRewardLabel: Label | null = null;

    @property(Label)
    coinsRewardLabel: Label | null = null;

    @property(Node)
    nursingLogTab: Node | null = null;

    @property(Node)
    billingDetailTab: Node | null = null;

    @property(Node)
    nursingLogPanel: Node | null = null;

    @property(Node)
    billingDetailPanel: Node | null = null;

    @property(ScrollView)
    billingScrollView: ScrollView | null = null;

    @property(Node)
    billingContainer: Node | null = null;

    @property(Label)
    totalCostLabel: Label | null = null;

    @property(Label)
    totalInsuranceLabel: Label | null = null;

    @property(Label)
    totalDeniedLabel: Label | null = null;

    @property(Node)
    drgWarning: Node | null = null;

    @property(Label)
    drgCostLabel: Label | null = null;

    @property(Node)
    replayButton: Node | null = null;

    @property(Node)
    nextLevelButton: Node | null = null;

    @property(Node)
    retryButton: Node | null = null;

    start(): void {
        this.nursingLogTab?.on(Node.EventType.TOUCH_END, () => this.switchTab('nursing'), this);
        this.billingDetailTab?.on(Node.EventType.TOUCH_END, () => this.switchTab('billing'), this);
        this.replayButton?.on(Node.EventType.TOUCH_END, this.onReplayClicked, this);
        this.nextLevelButton?.on(Node.EventType.TOUCH_END, this.onNextLevelClicked, this);
        this.retryButton?.on(Node.EventType.TOUCH_END, this.onRetryClicked, this);

        GameManager.instance.eventTarget.on('session_completed', this.onSessionCompleted, this);
    }

    onDestroy(): void {
        GameManager.instance.eventTarget.off('session_completed', this.onSessionCompleted, this);
    }

    private onSessionCompleted(data: { session: GameTypes.LevelSession; level: ConfigTypes.LevelConfig }): void {
        this.refresh(data.session, data.level);
    }

    public refresh(session: GameTypes.LevelSession, levelConfig: ConfigTypes.LevelConfig): void {
        if (this.levelNameLabel) {
            this.levelNameLabel.string = levelConfig.name;
        }

        if (this.totalScoreLabel) {
            this.totalScoreLabel.string = session.totalScore.toFixed(1);
            this.totalScoreLabel.color = session.passed ? new Color(46, 125, 50) : new Color(198, 40, 40);
        }

        if (this.passScoreLabel) {
            this.passScoreLabel.string = `及格线: ${session.passScore}分`;
        }

        if (this.scoreProgressBar) {
            this.scoreProgressBar.progress = Math.min(1, session.totalScore / 100);
        }

        if (this.starLabel) {
            const stars = session.passed ? (session.totalScore >= 90 ? 3 : session.totalScore >= 75 ? 2 : 1) : 0;
            const label = this.starLabel.getComponent(Label) || this.starLabel.getComponentInChildren(Label);
            if (label) label.string = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        }

        if (this.timeSpentLabel) {
            this.timeSpentLabel.string = this.formatTime(session.totalTimeSpent);
        }

        const taskResults = Object.values(session.taskProgress) as any[];
        const correctCount = taskResults.filter((p: any) => p.scoreEarned >= 0).length;
        if (this.correctCountLabel) {
            const label = this.correctCountLabel.getComponent(Label) || this.correctCountLabel.getComponentInChildren(Label);
            if (label) label.string = `正确: ${correctCount}/${taskResults.length}`;
        }

        if (this.insuranceTriggeredLabel) {
            const label = this.insuranceTriggeredLabel.getComponent(Label) || this.insuranceTriggeredLabel.getComponentInChildren(Label);
            if (session.insuranceRejectionCount > 0) {
                if (label) label.string = `🚨 医保拒付触发: ${session.insuranceRejectionCount}次`;
                this.insuranceTriggeredLabel.active = true;
            } else {
                if (label) label.string = `✅ 无医保拒付记录`;
                this.insuranceTriggeredLabel.active = true;
            }
        }

        if (session.passed) {
            this.successSection?.setActive(true);
            this.failureSection?.setActive(false);
            this.rewardsSection?.setActive(true);
            this.nextLevelButton?.setActive(true);
            this.retryButton?.setActive(false);

            if (this.expRewardLabel) {
                this.expRewardLabel.string = `+${levelConfig.rewards.exp} 经验`;
            }
            if (this.coinsRewardLabel) {
                this.coinsRewardLabel.string = `+${levelConfig.rewards.coins} 金币`;
            }
        } else {
            this.successSection?.setActive(false);
            this.failureSection?.setActive(true);
            this.rewardsSection?.setActive(false);
            this.nextLevelButton?.setActive(false);
            this.retryButton?.setActive(true);
        }

        if (session.settlement) {
            this.refreshBillingDetail(session.settlement);
        }

        const showComplexLogs = GameManager.instance.checkUnlockComplexLogs();
        this.nursingLogTab?.setActive(showComplexLogs);
        this.billingDetailTab?.setActive(showComplexLogs);
        if (!showComplexLogs) {
            this.nursingLogPanel?.setActive(false);
            this.billingDetailPanel?.setActive(false);
        } else {
            this.switchTab('nursing');
        }
    }

    private refreshBillingDetail(settlement: GameTypes.SettlementDetail): void {
        if (this.billingContainer) {
            this.billingContainer.removeAllChildren();
        }

        if (!this.billingContainer) return;

        settlement.billingItems.forEach(item => {
            const node = this.createBillingItemNode();
            const row = node.getComponent(BillingItemRow) || node.addComponent(BillingItemRow);
            row.setup(item);
            this.billingContainer!.addChild(node);
        });

        if (this.totalCostLabel) {
            this.totalCostLabel.string = `总费用: ¥${settlement.totalCost.toFixed(2)}`;
        }
        if (this.totalInsuranceLabel) {
            this.totalInsuranceLabel.string = `医保报销: ¥${settlement.insuranceCoveredTotal.toFixed(2)}`;
        }
        if (this.totalDeniedLabel) {
            this.totalDeniedLabel.string = `拒付金额: ¥${settlement.deniedAmountTotal.toFixed(2)}`;
            this.totalDeniedLabel.color = settlement.deniedAmountTotal > 0
                ? new Color(198, 40, 40)
                : new Color(97, 97, 97);
        }

        if (this.drgWarning && this.drgCostLabel) {
            if (settlement.drgStandardCost !== undefined) {
                this.drgWarning.active = true;
                const overrun = settlement.costOverrun || 0;
                if (overrun > 0) {
                    this.drgCostLabel.string = `DRG超支: ¥${overrun.toFixed(2)} (标准: ¥${settlement.drgStandardCost})`;
                    this.drgCostLabel.color = new Color(198, 40, 40);
                } else {
                    this.drgCostLabel.string = `DRG节余: ¥${(settlement.drgStandardCost - settlement.totalCost).toFixed(2)}`;
                    this.drgCostLabel.color = new Color(46, 125, 50);
                }
            } else {
                this.drgWarning.active = false;
            }
        }
    }

    private switchTab(tab: string): void {
        if (tab === 'nursing') {
            this.nursingLogPanel?.setActive(true);
            this.billingDetailPanel?.setActive(false);
        } else {
            this.nursingLogPanel?.setActive(false);
            this.billingDetailPanel?.setActive(true);
        }
    }

    private createBillingItemNode(): Node {
        const node = new Node('BillingItem');
        const ut = node.addComponent(UITransform);
        ut.setContentSize(530, 28);
        const row = node.addComponent(BillingItemRow);

        const nameLabelNode = new Node('NameLabel');
        node.addChild(nameLabelNode);
        const nameLabelUt = nameLabelNode.addComponent(UITransform);
        nameLabelUt.setContentSize(200, 24);
        nameLabelNode.setPosition(-150, 0, 0);
        const nameLabel = nameLabelNode.addComponent(Label);
        nameLabel.string = '';
        nameLabel.fontSize = 12;
        nameLabel.lineHeight = 14.4;
        nameLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        nameLabel.verticalAlign = Label.VerticalAlign.CENTER;
        row.nameLabel = nameLabel;

        const codeLabelNode = new Node('CodeLabel');
        node.addChild(codeLabelNode);
        const codeLabelUt = codeLabelNode.addComponent(UITransform);
        codeLabelUt.setContentSize(100, 24);
        codeLabelNode.setPosition(-20, 0, 0);
        const codeLabel = codeLabelNode.addComponent(Label);
        codeLabel.string = '';
        codeLabel.fontSize = 10;
        codeLabel.lineHeight = 12;
        codeLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        codeLabel.verticalAlign = Label.VerticalAlign.CENTER;
        codeLabel.color = new Color(128, 128, 128);
        row.codeLabel = codeLabel;

        const costLabelNode = new Node('CostLabel');
        node.addChild(costLabelNode);
        const costLabelUt = costLabelNode.addComponent(UITransform);
        costLabelUt.setContentSize(80, 24);
        costLabelNode.setPosition(80, 0, 0);
        const costLabel = costLabelNode.addComponent(Label);
        costLabel.string = '';
        costLabel.fontSize = 12;
        costLabel.lineHeight = 14.4;
        costLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        costLabel.verticalAlign = Label.VerticalAlign.CENTER;
        row.costLabel = costLabel;

        const insuranceLabelNode = new Node('InsuranceLabel');
        node.addChild(insuranceLabelNode);
        const insuranceLabelUt = insuranceLabelNode.addComponent(UITransform);
        insuranceLabelUt.setContentSize(80, 24);
        insuranceLabelNode.setPosition(170, 0, 0);
        const insuranceLabel = insuranceLabelNode.addComponent(Label);
        insuranceLabel.string = '';
        insuranceLabel.fontSize = 12;
        insuranceLabel.lineHeight = 14.4;
        insuranceLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        insuranceLabel.verticalAlign = Label.VerticalAlign.CENTER;
        row.insuranceLabel = insuranceLabel;

        const statusLabelNode = new Node('StatusLabel');
        node.addChild(statusLabelNode);
        const statusLabelUt = statusLabelNode.addComponent(UITransform);
        statusLabelUt.setContentSize(60, 24);
        statusLabelNode.setPosition(240, 0, 0);
        const statusLabel = statusLabelNode.addComponent(Label);
        statusLabel.string = '';
        statusLabel.fontSize = 11;
        statusLabel.lineHeight = 13.2;
        statusLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        statusLabel.verticalAlign = Label.VerticalAlign.CENTER;
        row.statusLabel = statusLabel;

        return node;
    }

    private formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}分${secs}秒`;
    }

    private onReplayClicked(): void {
        GameManager.instance.setPhase('MENU');
    }

    private onNextLevelClicked(): void {
        GameManager.instance.setPhase('LEVEL_SELECT');
    }

    private onRetryClicked(): void {
        const session = GameManager.instance.getCurrentSession();
        if (session) {
            GameManager.instance.startLevel(session.levelId);
        }
    }
}
