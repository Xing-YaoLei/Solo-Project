import { _decorator, Component, Node, Label, ProgressBar, ScrollView, instantiate, Prefab, UITransform, Color } from 'cc';
import { SceneManager } from '../core/SceneManager';
import { ScoringService } from '../services/ScoringService';
import type { TaskResult } from '../data/GameState';
import { GameMode } from '../data/enums/GameMode';
import type { LevelCompletionData } from '../services/GameFlowController';
import type { TaskConfig } from '../data/LevelConfig';
import { TaskAction } from '../data/enums/TaskAction';
import { WrongItemCard } from '../components/WrongItemCard';

const { ccclass, property } = _decorator;

@ccclass('ResultScene')
export class ResultScene extends Component {
    @property(Label)
    scoreLabel: Label | null = null;

    @property(Label)
    gradeLabel: Label | null = null;

    @property(Label)
    timeLabel: Label | null = null;

    @property(Label)
    accuracyLabel: Label | null = null;

    @property(ProgressBar)
    accuracyProgress: ProgressBar | null = null;

    @property(Label)
    correctCountLabel: Label | null = null;

    @property(Label)
    resultTitleLabel: Label | null = null;

    @property(Label)
    levelNameLabel: Label | null = null;

    @property(ScrollView)
    wrongItemsScrollView: ScrollView | null = null;

    @property(Prefab)
    wrongItemCardPrefab: Prefab | null = null;

    @property(Node)
    wrongItemsSection: Node | null = null;

    @property(Node)
    retryButton: Node | null = null;

    @property(Node)
    backButton: Node | null = null;

    @property(Node)
    nextLevelButton: Node | null = null;

    @property(Node)
    passedBadge: Node | null = null;

    @property(Node)
    failedBadge: Node | null = null;

    private completionData: LevelCompletionData | null = null;
    private taskMap: Map<string, TaskConfig> = new Map();
    private isPassed: boolean = false;

    onLoad() {
        const params = SceneManager.instance.getParams();
        this.completionData = params as LevelCompletionData;

        if (this.completionData) {
            this.completionData.tasks.forEach(t => {
                this.taskMap.set(t.id, t);
            });
        }
    }

    start() {
        if (!this.completionData) return;

        this.calculateAndDisplayResults();
        this.setupButtons();
        this.displayWrongItems();
    }

    private calculateAndDisplayResults(): void {
        if (!this.completionData) return;

        const { results, score, totalScore, timeSpent, mode, levelName, passingScore } = this.completionData;
        const scoring = ScoringService.instance;

        const accuracy = scoring.getAccuracy(results);
        const correctCount = scoring.getCorrectCount(results);
        const grade = scoring.getGrade(score, totalScore, passingScore);
        this.isPassed = scoring.isPassed(score, passingScore, results.length, results);

        if (this.scoreLabel) {
            this.scoreLabel.string = `${score}/${totalScore}`;
        }
        if (this.gradeLabel) {
            this.gradeLabel.string = grade;
            this.gradeLabel.color = this.getGradeColor(grade);
        }
        if (this.timeLabel) {
            this.timeLabel.string = this.formatTime(timeSpent);
        }
        if (this.accuracyLabel) {
            this.accuracyLabel.string = `${accuracy}%`;
        }
        if (this.accuracyProgress) {
            this.accuracyProgress.progress = accuracy / 100;
        }
        if (this.correctCountLabel) {
            this.correctCountLabel.string = `${correctCount}/${results.length}题`;
        }
        if (this.resultTitleLabel) {
            this.resultTitleLabel.string = this.isPassed ? '🎉 训练完成！' : '💪 继续加油！';
        }
        if (this.levelNameLabel) {
            this.levelNameLabel.string = levelName;
        }
        if (this.passedBadge) {
            this.passedBadge.active = this.isPassed;
        }
        if (this.failedBadge) {
            this.failedBadge.active = !this.isPassed;
        }
        if (this.nextLevelButton) {
            this.nextLevelButton.active = this.isPassed && mode === GameMode.FORMAL_TRAINING;
        }
    }

    private displayWrongItems(): void {
        if (!this.completionData || !this.wrongItemsScrollView || !this.wrongItemCardPrefab) return;

        const wrongResults = ScoringService.instance.getWrongResults(this.completionData.results);

        if (wrongResults.length === 0) {
            if (this.wrongItemsSection) {
                this.wrongItemsSection.active = false;
            }
            return;
        }

        const content = this.wrongItemsScrollView.content;
        if (!content) return;

        content.removeAllChildren();

        wrongResults.forEach((result, index) => {
            const taskConfig = this.taskMap.get(result.taskId);
            const taskDescription = taskConfig ? taskConfig.description : result.taskId;
            const taskNumber = this.completionData!.results.findIndex(r => r.taskId === result.taskId) + 1;

            const cardNode = instantiate(this.wrongItemCardPrefab);
            const card = cardNode.getComponent('WrongItemCard') as WrongItemCard;
            if (card) {
                card.setData(result, taskDescription, taskNumber);
            }
            cardNode.setPosition(0, -index * 220, 0);
            content.addChild(cardNode);
        });

        const contentTransform = content.getComponent(UITransform);
        if (contentTransform) {
            contentTransform.height = wrongResults.length * 220 + 20;
        }
    }

    private getGradeColor(grade: string): Color {
        switch (grade) {
            case 'S': return new Color().fromHEX('#FFD700');
            case 'A': return new Color().fromHEX('#4CAF50');
            case 'B': return new Color().fromHEX('#2196F3');
            case 'C': return new Color().fromHEX('#FF9800');
            case 'D': return new Color().fromHEX('#F44336');
            default: return new Color().fromHEX('#999999');
        }
    }

    private formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}分${secs}秒`;
    }

    private setupButtons(): void {
        if (this.retryButton) {
            this.retryButton.on(Node.EventType.TOUCH_END, () => {
                this.onRetryClick();
            }, this);
        }
        if (this.backButton) {
            this.backButton.on(Node.EventType.TOUCH_END, () => {
                this.onBackClick();
            }, this);
        }
        if (this.nextLevelButton) {
            this.nextLevelButton.on(Node.EventType.TOUCH_END, () => {
                this.onNextLevelClick();
            }, this);
        }
    }

    private async onRetryClick(): Promise<void> {
        if (!this.completionData) return;

        await SceneManager.instance.loadScene('Game', {
            levelId: this.completionData.levelId,
            mode: this.completionData.mode
        });
    }

    private async onBackClick(): Promise<void> {
        await SceneManager.instance.goBack();
    }

    private async onNextLevelClick(): Promise<void> {
        await SceneManager.instance.goBack();
    }

    onDestroy() {
        if (this.retryButton) {
            this.retryButton.off(Node.EventType.TOUCH_END);
        }
        if (this.backButton) {
            this.backButton.off(Node.EventType.TOUCH_END);
        }
        if (this.nextLevelButton) {
            this.nextLevelButton.off(Node.EventType.TOUCH_END);
        }
    }
}
