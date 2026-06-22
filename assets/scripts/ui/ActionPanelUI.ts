import { _decorator, Component, Node, Label, Button, ScrollView, Prefab, instantiate, Sprite, Color, Vec3, tween } from 'cc';
import { UIBase } from './UIBase';
import { GameManager } from '../core/GameManager';
import { ConfigManager } from '../core/ConfigManager';
import { ICaseAction } from '../core/GameInterfaces';
import { GameConstants } from '../core/GameConstants';
const { ccclass, property } = _decorator;

@ccclass('ActionPanelUI')
export class ActionPanelUI extends UIBase {

    @property(ScrollView)
    actionScrollView: ScrollView | null = null;

    @property(Prefab)
    actionItemPrefab: Prefab | null = null;

    @property(Node)
    actionContent: Node | null = null;

    @property(Label)
    stageLabel: Label | null = null;

    @property(Label)
    scoreLabel: Label | null = null;

    @property(Label)
    trustLabel: Label | null = null;

    @property(Node)
    resultPanel: Node | null = null;

    @property(Label)
    resultTitleLabel: Label | null = null;

    @property(Label)
    resultContentLabel: Label | null = null;

    @property(Label)
    resultScoreLabel: Label | null = null;

    @property(Button)
    confirmResultButton: Button | null = null;

    @property(Button)
    clueButton: Button | null = null;

    @property(Button)
    backButton: Button | null = null;

    private _actionItems: Node[] = [];
    private _lastActionResult: any = null;

    onLoad() {
        super.onLoad();

        if (this.confirmResultButton) {
            this.confirmResultButton.node.on(Button.EventType.CLICK, this.onConfirmResult, this);
        }

        if (this.clueButton) {
            this.clueButton.node.on(Button.EventType.CLICK, this.onClueClick, this);
        }

        if (this.backButton) {
            this.backButton.node.on(Button.EventType.CLICK, this.onBackClick, this);
        }
    }

    protected onShow(): void {
        this.refreshUI();
    }

    public refreshUI(): void {
        const currentStage = GameManager.instance.getCurrentStage();
        if (currentStage) {
            this.setLabelText(this.stageLabel, GameConstants.STAGE_NAMES[currentStage.stage as GameConstants.CaseStage]);
        }

        const score = GameManager.instance.getScore();
        const maxScore = GameManager.instance.getMaxScore();
        this.setLabelText(this.scoreLabel, `得分: ${score}/${maxScore}`);

        const trust = GameManager.instance.getClientTrustLevel();
        this.setLabelText(this.trustLabel, `信任度: ${trust}%`);

        this.refreshActionList();
    }

    private refreshActionList(): void {
        if (!this.actionContent || !this.actionItemPrefab) return;

        this._actionItems.forEach(item => item.destroy());
        this._actionItems = [];

        const actions = GameManager.instance.getAvailableActions();

        actions.forEach(action => {
            const itemNode = instantiate(this.actionItemPrefab!);
            this.actionContent!.addChild(itemNode);
            this._actionItems.push(itemNode);

            this.setupActionItem(itemNode, action);
        });
    }

    private setupActionItem(node: Node, action: ICaseAction): void {
        const nameLabel = node.getChildByName('NameLabel')?.getComponent(Label);
        const typeLabel = node.getChildByName('TypeLabel')?.getComponent(Label);
        const descLabel = node.getChildByName('DescLabel')?.getComponent(Label);
        const actionButton = node.getChildByName('ActionButton')?.getComponent(Button);
        const iconSprite = node.getChildByName('IconSprite')?.getComponent(Sprite);

        this.setLabelText(nameLabel, action.name);
        this.setLabelText(descLabel, action.description);

        const typeNames: Record<string, string> = {
            [GameConstants.ActionType.INTERROGATE]: '询问',
            [GameConstants.ActionType.EVIDENCE]: '举证',
            [GameConstants.ActionType.DOCUMENT]: '文书',
            [GameConstants.ActionType.CONSULT]: '咨询',
            [GameConstants.ActionType.OBJECTION]: '异议',
            [GameConstants.ActionType.SETTLEMENT]: '和解'
        };
        this.setLabelText(typeLabel, typeNames[action.type] || action.type);

        const canAfford = GameManager.instance.canAffordAction(action.id);
        if (actionButton) {
            actionButton.interactable = canAfford;
            actionButton.node.on(Button.EventType.CLICK, () => {
                this.onTakeAction(action.id);
            }, this);
        }
    }

    private onTakeAction(actionId: string): void {
        const result = GameManager.instance.takeAction(actionId);

        this._lastActionResult = result;
        this.showResult(result);
    }

    private showResult(result: any): void {
        if (!this.resultPanel) return;

        this.resultPanel.active = true;

        if (result.isCorrect) {
            this.setLabelText(this.resultTitleLabel, '✓ 决策正确');
            if (this.resultTitleLabel) {
                this.resultTitleLabel.color = new Color(0, 200, 0, 255);
            }
        } else {
            this.setLabelText(this.resultTitleLabel, '✗ 决策失误');
            if (this.resultTitleLabel) {
                this.resultTitleLabel.color = new Color(255, 50, 50, 255);
            }
        }

        this.setLabelText(this.resultContentLabel, result.message);
        
        const scoreText = result.scoreChange >= 0 ? `+${result.scoreChange}` : `${result.scoreChange}`;
        this.setLabelText(this.resultScoreLabel, `得分变化: ${scoreText}`);

        if (this.resultPanel) {
            this.resultPanel.setScale(0.8, 0.8, 0.8);
            tween(this.resultPanel)
                .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                .start();
        }
    }

    private onConfirmResult(): void {
        if (this.resultPanel) {
            this.resultPanel.active = false;
        }

        this.refreshUI();

        if (this._lastActionResult?.nextStage) {
            const currentStage = GameManager.instance.getCurrentStage();
            if (currentStage?.stage === GameConstants.CaseStage.CLOSED) {
                this.node.emit('caseClosed');
            } else {
                this.node.emit('stageAdvanced');
            }
        }
    }

    private onClueClick(): void {
        this.node.emit('showCluePanel');
    }

    private onBackClick(): void {
        this.hide();
        this.node.emit('backToHall');
    }

    public getLastActionResult(): any {
        return this._lastActionResult;
    }
}
