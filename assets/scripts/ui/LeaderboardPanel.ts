import { _decorator, Component, Node, Label, ScrollView, UITransform, Color } from 'cc';
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
        if (!this.leaderboardContainer) return;

        let currentPlayerEntry: GameTypes.LeaderboardEntry | null = null;

        entries.forEach(entry => {
            const node = this.createLeaderboardRowNode();
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

    private createLeaderboardRowNode(): Node {
        const node = new Node('LeaderboardRow');
        const ut = node.addComponent(UITransform);
        ut.setContentSize(580, 36);
        const row = node.addComponent(LeaderboardRow);

        const rankLabelNode = new Node('RankLabel');
        node.addChild(rankLabelNode);
        const rankLabelUt = rankLabelNode.addComponent(UITransform);
        rankLabelUt.setContentSize(50, 24);
        rankLabelNode.setPosition(-260, 0, 0);
        const rankLabel = rankLabelNode.addComponent(Label);
        rankLabel.string = '';
        rankLabel.fontSize = 14;
        rankLabel.lineHeight = 16.8;
        rankLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        rankLabel.verticalAlign = Label.VerticalAlign.CENTER;
        row.rankLabel = rankLabel;

        const nameLabelNode = new Node('NameLabel');
        node.addChild(nameLabelNode);
        const nameLabelUt = nameLabelNode.addComponent(UITransform);
        nameLabelUt.setContentSize(120, 24);
        nameLabelNode.setPosition(-160, 0, 0);
        const nameLabel = nameLabelNode.addComponent(Label);
        nameLabel.string = '';
        nameLabel.fontSize = 13;
        nameLabel.lineHeight = 15.6;
        nameLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        nameLabel.verticalAlign = Label.VerticalAlign.CENTER;
        row.nameLabel = nameLabel;

        const scoreLabelNode = new Node('ScoreLabel');
        node.addChild(scoreLabelNode);
        const scoreLabelUt = scoreLabelNode.addComponent(UITransform);
        scoreLabelUt.setContentSize(80, 24);
        scoreLabelNode.setPosition(-60, 0, 0);
        const scoreLabel = scoreLabelNode.addComponent(Label);
        scoreLabel.string = '';
        scoreLabel.fontSize = 13;
        scoreLabel.lineHeight = 15.6;
        scoreLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        scoreLabel.verticalAlign = Label.VerticalAlign.CENTER;
        row.scoreLabel = scoreLabel;

        const accuracyLabelNode = new Node('AccuracyLabel');
        node.addChild(accuracyLabelNode);
        const accuracyLabelUt = accuracyLabelNode.addComponent(UITransform);
        accuracyLabelUt.setContentSize(80, 24);
        accuracyLabelNode.setPosition(40, 0, 0);
        const accuracyLabel = accuracyLabelNode.addComponent(Label);
        accuracyLabel.string = '';
        accuracyLabel.fontSize = 11;
        accuracyLabel.lineHeight = 13.2;
        accuracyLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        accuracyLabel.verticalAlign = Label.VerticalAlign.CENTER;
        accuracyLabel.color = new Color(128, 128, 128);
        row.accuracyLabel = accuracyLabel;

        const timeLabelNode = new Node('TimeLabel');
        node.addChild(timeLabelNode);
        const timeLabelUt = timeLabelNode.addComponent(UITransform);
        timeLabelUt.setContentSize(60, 24);
        timeLabelNode.setPosition(120, 0, 0);
        const timeLabel = timeLabelNode.addComponent(Label);
        timeLabel.string = '';
        timeLabel.fontSize = 11;
        timeLabel.lineHeight = 13.2;
        timeLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        timeLabel.verticalAlign = Label.VerticalAlign.CENTER;
        row.timeLabel = timeLabel;

        const compositeLabelNode = new Node('CompositeLabel');
        node.addChild(compositeLabelNode);
        const compositeLabelUt = compositeLabelNode.addComponent(UITransform);
        compositeLabelUt.setContentSize(90, 24);
        compositeLabelNode.setPosition(220, 0, 0);
        const compositeLabel = compositeLabelNode.addComponent(Label);
        compositeLabel.string = '';
        compositeLabel.fontSize = 13;
        compositeLabel.lineHeight = 15.6;
        compositeLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        compositeLabel.verticalAlign = Label.VerticalAlign.CENTER;
        row.compositeLabel = compositeLabel;

        const highlightBg = new Node('HighlightBg');
        node.addChild(highlightBg);
        const highlightBgUt = highlightBg.addComponent(UITransform);
        highlightBgUt.setContentSize(580, 36);
        highlightBg.active = false;
        row.highlightBg = highlightBg;

        return node;
    }
}
