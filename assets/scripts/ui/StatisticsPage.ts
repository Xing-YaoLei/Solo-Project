import { _decorator, Component, Node, Label, Color, Button } from "cc";
import { ScoreManager, ScoreRecord } from "../game/ScoreManager";

const { ccclass, property } = _decorator;

@ccclass("StatisticsPage")
export class StatisticsPage extends Component {
    @property(Label)
    overallArrivalRateLabel: Label | null = null;

    @property(Label)
    totalPlayCountLabel: Label | null = null;

    @property(Label)
    totalPassCountLabel: Label | null = null;

    @property(Label)
    passRateLabel: Label | null = null;

    @property(Label)
    avgConflictLabel: Label | null = null;

    @property(Label)
    arrivalAccuracyLabel: Label | null = null;

    @property(Node)
    levelStatsContainer: Node | null = null;

    @property(Node)
    arrivalTrendContainer: Node | null = null;

    @property(Button)
    backButton: Button | null = null;

    private _onBack: (() => void)[] = [];

    onBack(callback: () => void): void {
        this._onBack.push(callback);
    }

    show(scoreManager: ScoreManager): void {
        this.node.active = true;

        const arrivalRate = scoreManager.getOverallArrivalRate();
        if (this.overallArrivalRateLabel) {
            this.overallArrivalRateLabel.string = `整体到场率: ${(arrivalRate * 100).toFixed(1)}%`;
            this.overallArrivalRateLabel.color = arrivalRate >= 0.7 ? Color.GREEN : arrivalRate >= 0.5 ? Color.YELLOW : Color.RED;
        }

        if (this.totalPlayCountLabel) {
            this.totalPlayCountLabel.string = `总游玩次数: ${scoreManager.getTotalPlayCount()}`;
        }

        if (this.totalPassCountLabel) {
            this.totalPassCountLabel.string = `通过次数: ${scoreManager.getTotalPassCount()}`;
        }

        const passRate = scoreManager.getPassRate();
        if (this.passRateLabel) {
            this.passRateLabel.string = `通过率: ${(passRate * 100).toFixed(1)}%`;
            this.passRateLabel.color = passRate >= 0.6 ? Color.GREEN : Color.RED;
        }

        this._renderAvgConflict(scoreManager);
        this._renderArrivalAccuracy(scoreManager);
        this._renderLevelStats(scoreManager);
        this._renderArrivalTrend(scoreManager);

        if (this.backButton) {
            this.backButton.node.on(Node.EventType.TOUCH_END, () => {
                for (const cb of this._onBack) cb();
            });
        }
    }

    hide(): void {
        this.node.active = false;
    }

    private _renderAvgConflict(scoreManager: ScoreManager): void {
        if (!this.avgConflictLabel) return;
        const history = scoreManager.history;
        if (history.length === 0) {
            this.avgConflictLabel.string = "平均冲突次数: N/A";
            return;
        }
        const avgConflict = history.reduce((sum, r) => sum + r.conflictCount, 0) / history.length;
        this.avgConflictLabel.string = `平均冲突次数: ${avgConflict.toFixed(1)}`;
    }

    private _renderArrivalAccuracy(scoreManager: ScoreManager): void {
        if (!this.arrivalAccuracyLabel) return;
        const history = scoreManager.history;
        if (history.length === 0) {
            this.arrivalAccuracyLabel.string = "到场判断准确率: N/A";
            return;
        }
        const totalChecks = history.reduce((sum, r) => sum + r.totalArrivalChecks, 0);
        const correctChecks = history.reduce((sum, r) => sum + r.correctArrivalChecks, 0);
        const accuracy = totalChecks > 0 ? correctChecks / totalChecks : 0;
        this.arrivalAccuracyLabel.string = `到场判断准确率: ${(accuracy * 100).toFixed(1)}%`;
        this.arrivalAccuracyLabel.color = accuracy >= 0.8 ? Color.GREEN : accuracy >= 0.6 ? Color.YELLOW : Color.RED;
    }

    private _renderLevelStats(scoreManager: ScoreManager): void {
        if (!this.levelStatsContainer) return;
        this.levelStatsContainer.removeAllChildren();

        const levelMap = new Map<string, ScoreRecord[]>();
        for (const record of scoreManager.history) {
            if (!levelMap.has(record.levelId)) {
                levelMap.set(record.levelId, []);
            }
            levelMap.get(record.levelId)!.push(record);
        }

        for (const [levelId, records] of levelMap) {
            const node = new Node(`level_stat_${levelId}`);
            const label = node.addComponent(Label);

            const avgArrival = records.reduce((s, r) => s + r.arrivalRate, 0) / records.length;
            const passCount = records.filter(r => r.passed).length;

            label.string = `${levelId}: 游玩${records.length}次 | 通过${passCount}次 | 平均到场率${(avgArrival * 100).toFixed(1)}%`;
            label.color = avgArrival >= 0.7 ? Color.GREEN : Color.YELLOW;

            this.levelStatsContainer.addChild(node);
        }
    }

    private _renderArrivalTrend(scoreManager: ScoreManager): void {
        if (!this.arrivalTrendContainer) return;
        this.arrivalTrendContainer.removeAllChildren();

        const history = scoreManager.history;
        if (history.length === 0) return;

        const recentRecords = history.slice(-10);
        for (const record of recentRecords) {
            const node = new Node("trend_point");
            const label = node.addComponent(Label);
            const ratePercent = (record.arrivalRate * 100).toFixed(0);
            label.string = `${record.levelId}: ${ratePercent}% ${record.passed ? "✓" : "✗"}`;
            label.color = record.passed ? Color.GREEN : Color.RED;
            this.arrivalTrendContainer.addChild(node);
        }
    }
}
