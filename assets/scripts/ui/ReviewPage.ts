import { _decorator, Component, Node, Label } from 'cc';

export interface BottleneckData {
    diagId: string;
    timeSpent: number;
    retryCount: number;
    errorType: string;
}

export interface DiagnosisBreakdown {
    diagId: string;
    isCorrect: boolean;
    timeSpent: number;
    selectedQuoteId: string;
    reworkRisk: number;
}

export interface ReviewStats {
    reworkRate: number;
    totalTime: number;
    averageDiagnosisTime: number;
    playerBottlenecks: BottleneckData[];
    diagnosisBreakdown: DiagnosisBreakdown[];
}

const { ccclass, property } = _decorator;

@ccclass('ReviewPageComponent')
export class ReviewPageComponent extends Component {
    @property({ type: Label, tooltip: '返修率显示标签' })
    reworkRateLabel: Label | null = null;

    @property({ type: Label, tooltip: '总用时显示标签' })
    totalTimeLabel: Label | null = null;

    @property({ type: Label, tooltip: '平均诊断时间显示标签' })
    avgTimeLabel: Label | null = null;

    @property({ type: Node, tooltip: '玩家卡点容器节点' })
    bottleneckContainer: Node | null = null;

    @property({ type: Node, tooltip: '诊断详情拆解容器节点' })
    breakdownContainer: Node | null = null;

    @property({ type: Node, tooltip: '重玩按钮节点' })
    retryBtn: Node | null = null;

    @property({ type: Node, tooltip: '下一关按钮节点' })
    nextLevelBtn: Node | null = null;

    onLoad(): void {
        if (this.retryBtn) {
            this.retryBtn.on(Node.EventType.TOUCH_END, this.onRetryPressed, this);
        }
        if (this.nextLevelBtn) {
            this.nextLevelBtn.on(Node.EventType.TOUCH_END, this.onNextLevelPressed, this);
        }
    }

    onDestroy(): void {
        if (this.retryBtn) {
            this.retryBtn.off(Node.EventType.TOUCH_END, this.onRetryPressed, this);
        }
        if (this.nextLevelBtn) {
            this.nextLevelBtn.off(Node.EventType.TOUCH_END, this.onNextLevelPressed, this);
        }
    }

    showReview(stats: ReviewStats): void {
        if (this.reworkRateLabel) {
            this.reworkRateLabel.string = `${(stats.reworkRate * 100).toFixed(1)}%`;
        }

        if (this.totalTimeLabel) {
            this.totalTimeLabel.string = this._formatTime(stats.totalTime);
        }

        if (this.avgTimeLabel) {
            this.avgTimeLabel.string = this._formatTime(stats.averageDiagnosisTime);
        }

        if (this.bottleneckContainer) {
            this.bottleneckContainer.removeAllChildren();
            const sorted = [...stats.playerBottlenecks].sort((a, b) => {
                if (b.timeSpent !== a.timeSpent) return b.timeSpent - a.timeSpent;
                return b.retryCount - a.retryCount;
            });
            const top = sorted.slice(0, 3);
            for (const data of top) {
                const card = this._createBottleneckCard(data);
                this.bottleneckContainer.addChild(card);
            }
        }

        if (this.breakdownContainer) {
            this.breakdownContainer.removeAllChildren();
            for (const breakdown of stats.diagnosisBreakdown) {
                const row = this._createBreakdownRow(breakdown);
                this.breakdownContainer.addChild(row);
            }
        }
    }

    _createBottleneckCard(data: BottleneckData): Node {
        const node = new Node(`Bottleneck-${data.diagId}`);
        const label = node.addComponent(Label);
        label.string = `${data.diagId} | ${this._formatTime(data.timeSpent)} | x${data.retryCount} | ${data.errorType}`;
        return node;
    }

    _createBreakdownRow(breakdown: DiagnosisBreakdown): Node {
        const node = new Node(`Breakdown-${breakdown.diagId}`);
        const label = node.addComponent(Label);
        const mark = breakdown.isCorrect ? '✓' : '✗';
        label.string = `${breakdown.diagId} ${mark} | ${this._formatTime(breakdown.timeSpent)} | ${breakdown.selectedQuoteId} | risk:${(breakdown.reworkRisk * 100).toFixed(0)}%`;
        return node;
    }

    onRetryPressed(): void {
        this.node.emit('review-retry');
    }

    onNextLevelPressed(): void {
        this.node.emit('review-next');
    }

    _formatTime(seconds: number): string {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
}
