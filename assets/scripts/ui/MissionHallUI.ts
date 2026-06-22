import { _decorator, Component, Node, Label, Button, Prefab, instantiate, ScrollView, Sprite, Color } from 'cc';
import { UIBase } from './UIBase';
import { GameManager } from '../core/GameManager';
import { ConfigManager } from '../core/ConfigManager';
import { SaveManager } from '../core/SaveManager';
import { ICase, ILevelConfig } from '../core/GameInterfaces';
import { GameConstants } from '../core/GameConstants';
const { ccclass, property } = _decorator;

@ccclass('MissionHallUI')
export class MissionHallUI extends UIBase {

    @property(ScrollView)
    caseScrollView: ScrollView | null = null;

    @property(Prefab)
    caseItemPrefab: Prefab | null = null;

    @property(Label)
    levelLabel: Label | null = null;

    @property(Label)
    scoreLabel: Label | null = null;

    @property(Label)
    completedLabel: Label | null = null;

    @property(Node)
    caseContent: Node | null = null;

    @property(Button)
    clientArchiveButton: Button | null = null;

    @property(Button)
    leaderboardButton: Button | null = null;

    @property(Button)
    trainingRecordButton: Button | null = null;

    private _caseItems: Node[] = [];

    onLoad() {
        super.onLoad();

        if (this.clientArchiveButton) {
            this.clientArchiveButton.node.on(Button.EventType.CLICK, this.onClientArchiveClick, this);
        }
        if (this.leaderboardButton) {
            this.leaderboardButton.node.on(Button.EventType.CLICK, this.onLeaderboardClick, this);
        }
        if (this.trainingRecordButton) {
            this.trainingRecordButton.node.on(Button.EventType.CLICK, this.onTrainingRecordClick, this);
        }
    }

    protected onShow(): void {
        this.refreshUI();
    }

    public refreshUI(): void {
        const save = SaveManager.instance.getSave();
        
        this.setLabelText(this.levelLabel, `当前关卡: ${save.currentLevelId || '无'}`);
        this.setLabelText(this.scoreLabel, `总分: ${save.totalScore}`);
        this.setLabelText(this.completedLabel, `已完成: ${save.completedCaseIds.length} 个案件`);

        this.refreshCaseList();
    }

    private refreshCaseList(): void {
        if (!this.caseContent || !this.caseItemPrefab) return;

        this._caseItems.forEach(item => item.destroy());
        this._caseItems = [];

        const allCases = ConfigManager.instance.getAllCases();
        const save = SaveManager.instance.getSave();

        const availableCases = allCases.filter(c => this.isCaseAvailable(c, save));

        availableCases.forEach(caseData => {
            const itemNode = instantiate(this.caseItemPrefab!);
            this.caseContent!.addChild(itemNode);
            this._caseItems.push(itemNode);

            this.setupCaseItem(itemNode, caseData);
        });
    }

    private isCaseAvailable(caseData: ICase, save: any): boolean {
        if (caseData.requiredUnlockedCaseIds.length > 0) {
            for (const reqId of caseData.requiredUnlockedCaseIds) {
                if (!save.completedCaseIds.includes(reqId)) {
                    return false;
                }
            }
        }
        return true;
    }

    private setupCaseItem(node: Node, caseData: ICase): void {
        const titleLabel = node.getChildByName('TitleLabel')?.getComponent(Label);
        const typeLabel = node.getChildByName('TypeLabel')?.getComponent(Label);
        const difficultyLabel = node.getChildByName('DifficultyLabel')?.getComponent(Label);
        const descLabel = node.getChildByName('DescLabel')?.getComponent(Label);
        const startButton = node.getChildByName('StartButton')?.getComponent(Button);
        const completedIcon = node.getChildByName('CompletedIcon');
        const bestScoreLabel = node.getChildByName('BestScoreLabel')?.getComponent(Label);

        this.setLabelText(titleLabel, caseData.title);
        this.setLabelText(typeLabel, caseData.type);
        this.setLabelText(descLabel, caseData.description.substring(0, 50) + '...');

        const difficultyNames: Record<string, string> = {
            [GameConstants.Difficulty.EASY]: '简单',
            [GameConstants.Difficulty.NORMAL]: '普通',
            [GameConstants.Difficulty.HARD]: '困难',
            [GameConstants.Difficulty.EXPERT]: '专家'
        };
        const difficultyColors: Record<string, Color> = {
            [GameConstants.Difficulty.EASY]: new Color(0, 200, 0, 255),
            [GameConstants.Difficulty.NORMAL]: new Color(0, 150, 255, 255),
            [GameConstants.Difficulty.HARD]: new Color(255, 150, 0, 255),
            [GameConstants.Difficulty.EXPERT]: new Color(255, 50, 50, 255)
        };

        this.setLabelText(difficultyLabel, difficultyNames[caseData.difficulty] || caseData.difficulty);
        if (difficultyLabel) {
            difficultyLabel.color = difficultyColors[caseData.difficulty] || Color.WHITE;
        }

        const isCompleted = SaveManager.instance.isCaseCompleted(caseData.id);
        if (completedIcon) {
            completedIcon.active = isCompleted;
        }

        const bestRecord = SaveManager.instance.getBestRecord(caseData.id);
        if (bestRecord && bestScoreLabel) {
            bestScoreLabel.string = `最高分: ${bestRecord.score}`;
        }

        if (startButton) {
            startButton.node.on(Button.EventType.CLICK, () => {
                this.onStartCase(caseData.id);
            }, this);
        }
    }

    private onStartCase(caseId: string): void {
        const success = GameManager.instance.startCase(caseId);
        if (success) {
            this.hide();
            this.node.emit('caseStarted', caseId);
        }
    }

    private onClientArchiveClick(): void {
        this.node.emit('showClientArchive');
    }

    private onLeaderboardClick(): void {
        this.node.emit('showLeaderboard');
    }

    private onTrainingRecordClick(): void {
        this.node.emit('showTrainingRecord');
    }
}
