import { _decorator, Component, Node, Label, Button, ScrollView, Prefab, instantiate, Sprite, Color } from 'cc';
import { UIBase } from './UIBase';
import { SaveManager } from '../core/SaveManager';
import { ConfigManager } from '../core/ConfigManager';
import { TrainingAnalysis, CaseAnalysisSummary, ReviewData } from '../core/TrainingAnalysis';
import { ITrainingRecord } from '../core/GameInterfaces';
import { GameConstants } from '../core/GameConstants';
const { ccclass, property } = _decorator;

@ccclass('TrainingRecordUI')
export class TrainingRecordUI extends UIBase {

    @property(ScrollView)
    recordScrollView: ScrollView | null = null;

    @property(Prefab)
    recordItemPrefab: Prefab | null = null;

    @property(Node)
    recordContent: Node | null = null;

    @property(Label)
    totalCasesLabel: Label | null = null;

    @property(Label)
    avgScoreLabel: Label | null = null;

    @property(Label)
    passRateLabel: Label | null = null;

    @property(Label)
    totalScoreLabel: Label | null = null;

    @property(Node)
    reviewPanel: Node | null = null;

    @property(Label)
    reviewTitleLabel: Label | null = null;

    @property(Label)
    reviewScoreLabel: Label | null = null;

    @property(Label)
    reviewErrorsLabel: Label | null = null;

    @property(Label)
    reviewMissedCluesLabel: Label | null = null;

    @property(Label)
    reviewCorrectActionsLabel: Label | null = null;

    @property(Label)
    reviewWrongActionsLabel: Label | null = null;

    @property(Button)
    closeReviewButton: Button | null = null;

    @property(Button)
    retryButton: Button | null = null;

    @property(Label)
    recommendationLabel: Label | null = null;

    private _recordItems: Node[] = [];
    private _selectedRecord: ITrainingRecord | null = null;

    onLoad() {
        super.onLoad();

        if (this.closeReviewButton) {
            this.closeReviewButton.node.on(Button.EventType.CLICK, this.onCloseReview, this);
        }

        if (this.retryButton) {
            this.retryButton.node.on(Button.EventType.CLICK, this.onRetryClick, this);
        }
    }

    protected onShow(): void {
        this.refreshUI();
    }

    public refreshUI(): void {
        const stats = TrainingAnalysis.instance.getOverallStats();

        this.setLabelText(this.totalCasesLabel, `训练次数: ${stats.totalCases}`);
        this.setLabelText(this.avgScoreLabel, `平均得分: ${stats.avgScore}`);
        this.setLabelText(this.passRateLabel, `通过率: ${stats.successRate}%`);
        this.setLabelText(this.totalScoreLabel, `累计得分: ${stats.totalScore}`);

        const recommendations = TrainingAnalysis.instance.getRecommendations();
        this.setLabelText(this.recommendationLabel, `建议: ${recommendations[0] || '继续保持！'}`);

        this.refreshRecordList();
    }

    private refreshRecordList(): void {
        if (!this.recordContent || !this.recordItemPrefab) return;

        this._recordItems.forEach(item => item.destroy());
        this._recordItems = [];

        const records = SaveManager.instance.getTrainingRecords();
        const sortedRecords = [...records].sort((a, b) => b.endTime - a.endTime);

        sortedRecords.forEach(record => {
            const itemNode = instantiate(this.recordItemPrefab!);
            this.recordContent!.addChild(itemNode);
            this._recordItems.push(itemNode);

            this.setupRecordItem(itemNode, record);
        });
    }

    private setupRecordItem(node: Node, record: ITrainingRecord): void {
        const caseNameLabel = node.getChildByName('CaseNameLabel')?.getComponent(Label);
        const scoreLabel = node.getChildByName('ScoreLabel')?.getComponent(Label);
        const dateLabel = node.getChildByName('DateLabel')?.getComponent(Label);
        const resultLabel = node.getChildByName('ResultLabel')?.getComponent(Label);
        const reviewButton = node.getChildByName('ReviewButton')?.getComponent(Button);

        const caseData = ConfigManager.instance.getCase(record.caseId);
        this.setLabelText(caseNameLabel, caseData?.title || record.caseId);
        this.setLabelText(scoreLabel, `得分: ${record.score}/${record.maxScore}`);

        const date = new Date(record.endTime);
        this.setLabelText(dateLabel, `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`);

        if (record.perfect) {
            this.setLabelText(resultLabel, '完美通关');
            if (resultLabel) resultLabel.color = new Color(255, 200, 0, 255);
        } else if (record.passed) {
            this.setLabelText(resultLabel, '已通过');
            if (resultLabel) resultLabel.color = new Color(0, 200, 0, 255);
        } else {
            this.setLabelText(resultLabel, '未通过');
            if (resultLabel) resultLabel.color = new Color(255, 50, 50, 255);
        }

        if (reviewButton) {
            reviewButton.node.on(Button.EventType.CLICK, () => {
                this.showReview(record);
            }, this);
        }
    }

    private showReview(record: ITrainingRecord): void {
        this._selectedRecord = record;

        if (this.reviewPanel) {
            this.reviewPanel.active = true;
        }

        const reviewData = TrainingAnalysis.instance.getReviewData(record);
        const caseData = ConfigManager.instance.getCase(record.caseId);

        this.setLabelText(this.reviewTitleLabel, `复盘: ${caseData?.title || record.caseId}`);
        this.setLabelText(this.reviewScoreLabel, `最终得分: ${record.score}/${record.maxScore}`);
        this.setLabelText(this.reviewErrorsLabel, `错误次数: ${record.errorRecords.length}`);
        this.setLabelText(this.reviewMissedCluesLabel, `材料缺页: ${record.materialMissRecords.length}`);
        this.setLabelText(this.reviewCorrectActionsLabel, `正确决策: ${reviewData.correctActions.join('、') || '无'}`);
        this.setLabelText(this.reviewWrongActionsLabel, `失误决策: ${reviewData.wrongActions.join('、') || '无'}`);
    }

    private onCloseReview(): void {
        if (this.reviewPanel) {
            this.reviewPanel.active = false;
        }
        this._selectedRecord = null;
    }

    private onRetryClick(): void {
        if (this._selectedRecord) {
            this.hide();
            this.node.emit('retryCase', this._selectedRecord.caseId);
        }
    }

    public getSelectedRecord(): ITrainingRecord | null {
        return this._selectedRecord;
    }
}
