import { _decorator, Component, Node, Label, ScrollView, Prefab, instantiate, Color } from 'cc';
import { GameTypes } from '../types/GameTypes';
import { SaveManager } from '../core/SaveManager';
import { ConfigManager } from '../core/ConfigManager';

const { ccclass, property } = _decorator;

@ccclass('LeaderboardRow')
export class LeaderboardRow extends Component {

    @property(Label)
    rankLabel: Label | null = null;

    @property(Label)
    nameLabel: Label | null = null;

    @property(Label)
    scoreLabel: Label | null = null;

    @property(Label)
    accuracyLabel: Label | null = null;

    @property(Label)
    timeLabel: Label | null = null;

    @property(Label)
    compositeLabel: Label | null = null;

    @property(Node)
    highlightBg: Node | null = null;

    public setup(entry: GameTypes.LeaderboardEntry, isCurrentPlayer: boolean): void {
        if (this.rankLabel) {
            this.rankLabel.string = `#${entry.rank}`;
            this.rankLabel.color = entry.rank <= 3
                ? new Color(255, 152, 0)
                : new Color(33, 33, 33);
        }
        if (this.nameLabel) this.nameLabel.string = entry.playerName;
        if (this.scoreLabel) this.scoreLabel.string = `${entry.score.toFixed(1)}分`;
        if (this.accuracyLabel) this.accuracyLabel.string = `准确率 ${Math.round(entry.accuracy * 100)}%`;
        if (this.timeLabel) {
            const mins = Math.floor(entry.timeSpent / 60);
            const secs = Math.floor(entry.timeSpent % 60);
            this.timeLabel.string = `${mins}:${secs.toString().padStart(2, '0')}`;
        }
        if (this.compositeLabel) this.compositeLabel.string = `综合 ${entry.compositeScore.toFixed(1)}`;
        if (this.highlightBg) {
            this.highlightBg.active = isCurrentPlayer;
        }
    }
}

@ccclass('LeaderboardPanel')
export class LeaderboardPanel extends Component {

    @property(ScrollView)
    leaderboardScrollView: ScrollView | null = null;

    @property(Node)
    leaderboardContainer: Node | null = null;

    @property(Prefab)
    rowPrefab: Prefab | null = null;

    @property(Node)
    levelFilterNode: Node | null = null;

    @property(Label)
    currentRankLabel: Label | null = null;

    @property(Label)
    currentScoreLabel: Label | null = null;

    private currentFilterLevelId: string | null = null;

    start(): void {
        this.refresh();
    }

    public setLevelFilter(levelId: string | null): void {
        this.currentFilterLevelId = levelId;
        this.refresh();
    }

    public refresh(): void {
        const profile = SaveManager.instance.getPlayerProfile();
        const entries = SaveManager.instance.getLeaderboard(this.currentFilterLevelId || undefined, 50);

        if (this.levelFilterNode) {
            const filterLabel = this.levelFilterNode.getComponentInChildren(Label);
            if (filterLabel) {
                if (this.currentFilterLevelId) {
                    const level = ConfigManager.instance.getLevelById(this.currentFilterLevelId);
                    filterLabel.string = level ? `关卡: ${level.name}` : '全部关卡';
                } else {
                    filterLabel.string = '全部关卡';
                }
            }
        }

        if (this.leaderboardContainer) {
            this.leaderboardContainer.removeAllChildren();
        }
        if (!this.rowPrefab || !this.leaderboardContainer) return;

        let currentPlayerEntry: GameTypes.LeaderboardEntry | null = null;

        entries.forEach(entry => {
            const node = instantiate(this.rowPrefab!);
            const row = node.getComponent(LeaderboardRow) || node.addComponent(LeaderboardRow);
            const isCurrent = entry.playerId === profile.playerId;
            row.setup(entry, isCurrent);
            this.leaderboardContainer!.addChild(node);

            if (isCurrent) {
                currentPlayerEntry = entry;
            }
        });

        if (currentPlayerEntry) {
            if (this.currentRankLabel) {
                this.currentRankLabel.string = `我的排名: 第${currentPlayerEntry.rank}名`;
            }
            if (this.currentScoreLabel) {
                this.currentScoreLabel.string = `综合分: ${currentPlayerEntry.compositeScore.toFixed(1)}`;
            }
        } else {
            if (this.currentRankLabel) {
                this.currentRankLabel.string = '暂无排名，快去完成训练吧！';
            }
            if (this.currentScoreLabel) {
                this.currentScoreLabel.string = '';
            }
        }
    }
}
